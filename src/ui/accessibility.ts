import type { Page } from 'playwright-core';

export interface AccessibilityResult {
  passed: boolean;
  violations: AccessibilityViolation[];
  passes: AccessibilityPass[];
}

export interface AccessibilityViolation {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  help: string;
  helpUrl: string;
  nodes: AccessibilityNode[];
}

export interface AccessibilityPass {
  id: string;
  description: string;
  help: string;
  helpUrl: string;
}

export interface AccessibilityNode {
  target: string[];
  html: string;
  failureSummary?: string;
}

export class AccessibilityChecker {
  private page: Page | null = null;
  private axeCoreUrl = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.3/axe.min.js';

  setPage(page: Page): void {
    this.page = page;
  }

  async runA11yCheck(context?: TestContext): Promise<AccessibilityResult> {
    if (!this.page) {
      throw new Error('Page not available. Open browser first.');
    }

    try {
      await this.page.addScriptTag({ url: this.axeCoreUrl });
    } catch {
      console.warn('Could not load axe-core from CDN, trying inline...');
    }

    const result = await this.page.evaluate(async () => {
      if (typeof (window as any).axe === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.3/axe.min.js';
        document.head.appendChild(script);
        
        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load axe-core'));
          setTimeout(() => reject(new Error('axe-core load timeout')), 10000);
        });
      }

      return await (window as any).axe.run(document);
    });

    return {
      passed: result.violations.length === 0,
      violations: result.violations.map((v: any) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        help: v.help,
        helpUrl: v.helpUrl,
        nodes: v.nodes.map((n: any) => ({
          target: n.target,
          html: n.html,
          failureSummary: n.failureSummary,
        })),
      })),
      passes: result.passes.map((p: any) => ({
        id: p.id,
        description: p.description,
        help: p.help,
        helpUrl: p.helpUrl,
      })),
    };
  }

  async checkElement(selector: string): Promise<AccessibilityResult> {
    if (!this.page) {
      throw new Error('Page not available');
    }

    const result = await this.page.evaluate(async (sel) => {
      if (typeof (window as any).axe === 'undefined') {
        return { error: 'axe not loaded' };
      }

      const element = document.querySelector(sel);
      if (!element) {
        return { error: 'element not found' };
      }

      return await (window as any).axe.run(element);
    }, selector);

    if (result.error) {
      throw new Error(result.error);
    }

    return {
      passed: result.violations.length === 0,
      violations: result.violations,
      passes: result.passes,
    };
  }

  printResults(result: AccessibilityResult): void {
    console.log('\n♿ Accessibility Check Results');
    console.log('═══════════════════════════════════════════════════');

    if (result.passed) {
      console.log('   ✅ No accessibility violations found!');
    } else {
      console.log(`   ❌ Found ${result.violations.length} violation(s):\n`);

      const byImpact = {
        critical: result.violations.filter(v => v.impact === 'critical'),
        serious: result.violations.filter(v => v.impact === 'serious'),
        moderate: result.violations.filter(v => v.impact === 'moderate'),
        minor: result.violations.filter(v => v.impact === 'minor'),
      };

      for (const [impact, violations] of Object.entries(byImpact)) {
        if (violations.length > 0) {
          const icon = { critical: '🔴', serious: '🟠', moderate: '🟡', minor: '🔵' }[impact];
          console.log(`   ${icon} ${impact.toUpperCase()}: ${violations.length}`);
          
          for (const v of violations.slice(0, 3)) {
            console.log(`      - ${v.description}`);
          }
          
          if (violations.length > 3) {
            console.log(`      ... and ${violations.length - 3} more`);
          }
          console.log('');
        }
      }
    }

    console.log(`   ✅ ${result.passes.length} passed checks`);
    console.log('═══════════════════════════════════════════════════\n');
  }
}

export class BrowserAPI {
  private page: Page | null = null;

  setPage(page: Page): void {
    this.page = page;
  }

  getWindow(): Promise<any> {
    if (!this.page) throw new Error('Page not available');
    return this.page.evaluate(() => window);
  }

  getDocument(): Promise<any> {
    if (!this.page) throw new Error('Page not available');
    return this.page.evaluate(() => document);
  }

  getLocation(): Promise<{ href: string; hostname: string; pathname: string; protocol: string }> {
    if (!this.page) throw new Error('Page not available');
    return this.page.evaluate(() => ({
      href: window.location.href,
      hostname: window.location.hostname,
      pathname: window.location.pathname,
      protocol: window.location.protocol,
    }));
  }

  getLocalStorage(): Promise<Record<string, string>> {
    if (!this.page) throw new Error('Page not available');
    return this.page.evaluate(() => {
      const storage: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) storage[key] = localStorage.getItem(key) || '';
      }
      return storage;
    });
  }

  getSessionStorage(): Promise<Record<string, string>> {
    if (!this.page) throw new Error('Page not available');
    return this.page.evaluate(() => {
      const storage: Record<string, string> = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) storage[key] = sessionStorage.getItem(key) || '';
      }
      return storage;
    });
  }

  getCookies(): Promise<any[]> {
    if (!this.page) throw new Error('Page not available');
    return this.page.context().cookies();
  }

  getIndexedDB(): Promise<string[]> {
    if (!this.page) throw new Error('Page not available');
    return this.page.evaluate(() => {
      return indexedDB.databases ? indexedDB.databases().then(dbs => dbs.map(d => d.name || '')) : [];
    });
  }

  getNavigator(): Promise<any> {
    if (!this.page) throw new Error('Page not available');
    return this.page.evaluate(() => ({
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      languages: navigator.languages,
      onLine: navigator.onLine,
    }));
  }

  getScreen(): Promise<{ width: number; height: number; availWidth: number; availHeight: number }> {
    if (!this.page) throw new Error('Page not available');
    return this.page.evaluate(() => ({
      width: screen.width,
      height: screen.height,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight,
    }));
  }

  getAllInfo(): Promise<any> {
    return Promise.all([
      this.getLocation(),
      this.getLocalStorage(),
      this.getSessionStorage(),
      this.getCookies(),
      this.getNavigator(),
      this.getScreen(),
    ]).then(([location, localStorage, sessionStorage, cookies, navigator, screen]) => ({
      location,
      localStorage,
      sessionStorage,
      cookies,
      navigator,
      screen,
    }));
  }
}

export function createAccessibilityChecker(): AccessibilityChecker {
  return new AccessibilityChecker();
}

export function createBrowserAPI(): BrowserAPI {
  return new BrowserAPI();
}