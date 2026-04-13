export class AccessibilityChecker {
    page = null;
    axeCoreUrl = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.3/axe.min.js';
    setPage(page) {
        this.page = page;
    }
    async runA11yCheck(context) {
        if (!this.page) {
            throw new Error('Page not available. Open browser first.');
        }
        try {
            await this.page.addScriptTag({ url: this.axeCoreUrl });
        }
        catch {
            console.warn('Could not load axe-core from CDN, trying inline...');
        }
        const result = await this.page.evaluate(async () => {
            if (typeof window.axe === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.3/axe.min.js';
                document.head.appendChild(script);
                await new Promise((resolve, reject) => {
                    script.onload = () => resolve();
                    script.onerror = () => reject(new Error('Failed to load axe-core'));
                    setTimeout(() => reject(new Error('axe-core load timeout')), 10000);
                });
            }
            return await window.axe.run(document);
        });
        return {
            passed: result.violations.length === 0,
            violations: result.violations.map((v) => ({
                id: v.id,
                impact: v.impact,
                description: v.description,
                help: v.help,
                helpUrl: v.helpUrl,
                nodes: v.nodes.map((n) => ({
                    target: n.target,
                    html: n.html,
                    failureSummary: n.failureSummary,
                })),
            })),
            passes: result.passes.map((p) => ({
                id: p.id,
                description: p.description,
                help: p.help,
                helpUrl: p.helpUrl,
            })),
        };
    }
    async checkElement(selector) {
        if (!this.page) {
            throw new Error('Page not available');
        }
        const result = await this.page.evaluate(async (sel) => {
            if (typeof window.axe === 'undefined') {
                return { error: 'axe not loaded' };
            }
            const element = document.querySelector(sel);
            if (!element) {
                return { error: 'element not found' };
            }
            return await window.axe.run(element);
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
    printResults(result) {
        console.log('\n♿ Accessibility Check Results');
        console.log('═══════════════════════════════════════════════════');
        if (result.passed) {
            console.log('   ✅ No accessibility violations found!');
        }
        else {
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
    page = null;
    setPage(page) {
        this.page = page;
    }
    getWindow() {
        if (!this.page)
            throw new Error('Page not available');
        return this.page.evaluate(() => window);
    }
    getDocument() {
        if (!this.page)
            throw new Error('Page not available');
        return this.page.evaluate(() => document);
    }
    getLocation() {
        if (!this.page)
            throw new Error('Page not available');
        return this.page.evaluate(() => ({
            href: window.location.href,
            hostname: window.location.hostname,
            pathname: window.location.pathname,
            protocol: window.location.protocol,
        }));
    }
    getLocalStorage() {
        if (!this.page)
            throw new Error('Page not available');
        return this.page.evaluate(() => {
            const storage = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key)
                    storage[key] = localStorage.getItem(key) || '';
            }
            return storage;
        });
    }
    getSessionStorage() {
        if (!this.page)
            throw new Error('Page not available');
        return this.page.evaluate(() => {
            const storage = {};
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key)
                    storage[key] = sessionStorage.getItem(key) || '';
            }
            return storage;
        });
    }
    getCookies() {
        if (!this.page)
            throw new Error('Page not available');
        return this.page.context().cookies();
    }
    getIndexedDB() {
        if (!this.page)
            throw new Error('Page not available');
        return this.page.evaluate(() => {
            return indexedDB.databases ? indexedDB.databases().then(dbs => dbs.map(d => d.name || '')) : [];
        });
    }
    getNavigator() {
        if (!this.page)
            throw new Error('Page not available');
        return this.page.evaluate(() => ({
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            languages: navigator.languages,
            onLine: navigator.onLine,
        }));
    }
    getScreen() {
        if (!this.page)
            throw new Error('Page not available');
        return this.page.evaluate(() => ({
            width: screen.width,
            height: screen.height,
            availWidth: screen.availWidth,
            availHeight: screen.availHeight,
        }));
    }
    getAllInfo() {
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
export function createAccessibilityChecker() {
    return new AccessibilityChecker();
}
export function createBrowserAPI() {
    return new BrowserAPI();
}
