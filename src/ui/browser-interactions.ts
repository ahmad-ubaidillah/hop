import type { BrowserManager } from './browser-manager.ts';
import * as fs from 'fs';
import * as path from 'path';

export class BrowserInteractions {
  private manager: BrowserManager;
  private screenshotsDir: string = './screenshots';

  constructor(manager: BrowserManager) {
    this.manager = manager;
  }

  async navigate(url: string): Promise<void> {
    const page = this.manager.getPage();
    if (!page) throw new Error('Browser not launched. Call launch() first.');
    
    await page.goto(String(url), { timeout: this.manager.getOptions().timeout });
  }

  async click(selector: string): Promise<void> {
    const page = this.manager.getPage();
    if (!page) throw new Error('Browser not launched. Call launch() first.');
    await page.click(selector);
  }

  async type(selector: string, text: string, clear: boolean = false): Promise<void> {
    const page = this.manager.getPage();
    if (!page) throw new Error('Browser not launched. Call launch() first.');
    
    if (clear) {
      await page.fill(selector, '');
    }
    await page.type(selector, text);
  }

  async fill(selector: string, text: string): Promise<void> {
    const page = this.manager.getPage();
    if (!page) throw new Error('Browser not launched. Call launch() first.');
    await page.fill(selector, text);
  }

  async setCookie(name: string, value: string, domain?: string): Promise<void> {
    const context = this.manager.getContext();
    if (!context) throw new Error('Browser context not created. Call launch() first.');
    
    await context.addCookies([{
      name,
      value,
      domain: domain || '',
      path: '/',
    }]);
  }
  
  async setCookies(cookies: Record<string, string>): Promise<void> {
    const context = this.manager.getContext();
    if (!context) throw new Error('Browser context not created. Call launch() first.');
    
    const cookieArray = Object.entries(cookies).map(([name, value]) => ({
      name,
      value,
      path: '/',
    }));
    
    await context.addCookies(cookieArray);
  }

  async refresh(): Promise<void> {
    const page = this.manager.getPage();
    if (!page) throw new Error('Browser not launched. Call launch() first.');
    await page.reload();
  }

  async evaluate<T>(fn: () => T): Promise<T> {
    const page = this.manager.getPage();
    if (!page) throw new Error('Browser not launched. Call launch() first.');
    return await page.evaluate(fn);
  }

  async mockResponse(urlPattern: string, response: any, status: number = 200): Promise<void> {
    const context = this.manager.getContext();
    if (!context) throw new Error('Browser context not created. Call launch() first.');
    
    await context.route(urlPattern, async (route) => {
      await route.fulfill({
        status,
        body: JSON.stringify(response),
        headers: { 'Content-Type': 'application/json' },
      });
    });
  }

  async abortRequests(urlPattern: string): Promise<void> {
    const context = this.manager.getContext();
    if (!context) throw new Error('Browser context not created. Call launch() first.');
    
    await context.route(urlPattern, async (route) => {
      await route.abort('failed');
    });
  }

  async screenshot(options?: { path?: string; fullPage?: boolean }): Promise<Buffer | string> {
    const page = this.manager.getPage();
    if (!page) throw new Error('Browser not launched. Call launch() first.');
    
    const screenshotOptions: any = {
      fullPage: options?.fullPage || false,
    };
    
    if (options?.path) {
      const dir = path.dirname(options.path);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      await page.screenshot({ ...screenshotOptions, path: options.path });
      return options.path;
    }
    
    return await page.screenshot(screenshotOptions);
  }

  async screenshotOnFailure(scenarioName: string): Promise<string | null> {
    const page = this.manager.getPage();
    if (!page) return null;
    
    if (!fs.existsSync(this.screenshotsDir)) {
      fs.mkdirSync(this.screenshotsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${scenarioName}-${timestamp}.png`;
    const filepath = path.join(this.screenshotsDir, filename);
    
    await page.screenshot({ path: filepath, fullPage: true });
    return filepath;
  }
}
