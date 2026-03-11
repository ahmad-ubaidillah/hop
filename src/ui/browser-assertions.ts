import type { BrowserManager } from './browser-manager.ts';

export class BrowserAssertions {
  private manager: BrowserManager;

  constructor(manager: BrowserManager) {
    this.manager = manager;
  }

  async isVisible(selector: string): Promise<boolean> {
    const page = this.manager.getPage();
    if (!page) throw new Error('Browser not launched. Call launch() first.');
    return await page.isVisible(selector);
  }

  async getText(selector: string): Promise<string> {
    const page = this.manager.getPage();
    if (!page) throw new Error('Browser not launched. Call launch() first.');
    return await page.textContent(selector) || '';
  }

  async containsText(selector: string, text: string): Promise<boolean> {
    const page = this.manager.getPage();
    if (!page) throw new Error('Browser not launched. Call launch() first.');
    
    const element = await page.$(selector);
    if (!element) return false;
    
    const elementText = await element.textContent();
    return elementText?.includes(text) || false;
  }

  async waitForSelector(selector: string, timeout?: number): Promise<void> {
    const page = this.manager.getPage();
    if (!page) throw new Error('Browser not launched. Call launch() first.');
    await page.waitForSelector(selector, { timeout });
  }

  async waitForElementVisible(selector: string, timeout?: number): Promise<void> {
    const page = this.manager.getPage();
    if (!page) throw new Error('Browser not launched. Call launch() first.');
    await page.waitForSelector(selector, { state: 'visible', timeout });
  }

  async waitForElementHidden(selector: string, timeout?: number): Promise<void> {
    const page = this.manager.getPage();
    if (!page) throw new Error('Browser not launched. Call launch() first.');
    await page.waitForSelector(selector, { state: 'hidden', timeout });
  }

  async waitForElementDetached(selector: string, timeout?: number): Promise<void> {
    const page = this.manager.getPage();
    if (!page) throw new Error('Browser not launched. Call launch() first.');
    await page.waitForSelector(selector, { state: 'detached', timeout });
  }

  async waitForNavigation(timeout?: number): Promise<void> {
    const page = this.manager.getPage();
    if (!page) throw new Error('Browser not launched. Call launch() first.');
    await page.waitForLoadState('networkidle', { timeout });
  }

  async waitForUrl(urlPattern: string, timeout?: number): Promise<void> {
    const page = this.manager.getPage();
    if (!page) throw new Error('Browser not launched. Call launch() first.');
    await page.waitForURL(urlPattern, { timeout });
  }

  async waitForResponse(urlPattern: string, timeout?: number): Promise<any> {
    const page = this.manager.getPage();
    if (!page) throw new Error('Browser not launched. Call launch() first.');
    
    return await page.waitForResponse(
      response => response.url().match(urlPattern) !== null,
      { timeout }
    );
  }

  async waitForRequest(urlPattern: string, timeout?: number): Promise<any> {
    const page = this.manager.getPage();
    if (!page) throw new Error('Browser not launched. Call launch() first.');
    
    return await page.waitForRequest(
      request => request.url().match(urlPattern) !== null,
      { timeout }
    );
  }

  async getUrl(): Promise<string> {
    const page = this.manager.getPage();
    if (!page) throw new Error('Browser not launched. Call launch() first.');
    return page.url();
  }

  async getTitle(): Promise<string> {
    const page = this.manager.getPage();
    if (!page) throw new Error('Browser not launched. Call launch() first.');
    return await page.title();
  }

  async getCookies(): Promise<Record<string, string>> {
    const context = this.manager.getContext();
    if (!context) throw new Error('Browser context not created. Call launch() first.');
    
    const cookies = await context.cookies();
    const result: Record<string, string> = {};
    
    for (const cookie of cookies) {
      result[cookie.name] = cookie.value;
    }
    
    return result;
  }
}
