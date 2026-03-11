/**
 * Playwright Client for Hop BDD Framework
 * Provides simplified API over playwright-core for UI testing
 */
import { chromium, Browser, BrowserContext, Page, ChromiumBrowser } from 'playwright-core';
import * as fs from 'fs';
import * as path from 'path';

export interface PlaywrightOptions {
  headless?: boolean;
  browser?: 'chromium' | 'firefox' | 'webkit';
  viewport?: { width: number; height: number };
  timeout?: number;
}

export interface ElementLocator {
  selector: string;
  type: 'css' | 'xpath' | 'text' | 'role';
}

export class PlaywrightClient {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private options: PlaywrightOptions;
  private screenshotsDir: string = './screenshots';
  
  constructor(options: PlaywrightOptions = {}) {
    this.options = {
      headless: true,
      browser: 'chromium',
      viewport: { width: 1280, height: 720 },
      timeout: 30000,
      ...options,
    };
    
    // Ensure timeout is a number
    if (typeof this.options.timeout === 'string') {
      this.options.timeout = parseInt(this.options.timeout, 10);
    }
  }
  
  /**
   * Launch browser
   */
  async launch(): Promise<void> {
    try {
      const browserType = this.options.browser === 'firefox' ? 'firefox' : 
                         this.options.browser === 'webkit' ? 'webkit' : 'chromium';
      
      this.browser = await chromium.launch({ 
        headless: this.options.headless,
      });
      
      this.context = await this.browser.newContext({
        viewport: this.options.viewport,
      });
      
      this.page = await this.context.newPage();
      
      // Set default timeout
      if (this.page) {
        this.page.setDefaultTimeout(this.options.timeout || 30000);
      }
    } catch (error) {
      throw new Error(`Failed to launch browser: ${error instanceof Error ? error.message : error}`);
    }
  }
  
  /**
   * Navigate to URL
   */
  async navigate(url: string): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }
    
    // Ensure URL is a valid string
    const validUrl = String(url);
    await this.page.goto(validUrl, { timeout: this.options.timeout });
  }
  
  /**
   * Click element
   */
  async click(selector: string): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }
    await this.page.click(selector);
  }
  
  /**
   * Type text into element
   */
  async type(selector: string, text: string, clear: boolean = false): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }
    
    if (clear) {
      await this.page.fill(selector, '');
    }
    await this.page.type(selector, text);
  }
  
  /**
   * Fill input with text (replaces existing value)
   */
  async fill(selector: string, text: string): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }
    await this.page.fill(selector, text);
  }
  
  /**
   * Check if element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }
    return await this.page.isVisible(selector);
  }
  
  /**
   * Get element text
   */
  async getText(selector: string): Promise<string> {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }
    return await this.page.textContent(selector) || '';
  }
  
  /**
   * Assert element contains text
   */
  async containsText(selector: string, text: string): Promise<boolean> {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }
    const element = await this.page.$(selector);
    if (!element) return false;
    
    const elementText = await element.textContent();
    return elementText?.includes(text) || false;
  }
  
  /**
   * Wait for selector
   */
  async waitForSelector(selector: string, timeout?: number): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }
    await this.page.waitForSelector(selector, { timeout });
  }
  
  /**
   * Set cookie
   */
  async setCookie(name: string, value: string, domain?: string): Promise<void> {
    if (!this.context) {
      throw new Error('Browser context not created. Call launch() first.');
    }
    
    await this.context.addCookies([{
      name,
      value,
      domain: domain || '',
      path: '/',
    }]);
  }
  
  /**
   * Set multiple cookies
   */
  async setCookies(cookies: Record<string, string>): Promise<void> {
    if (!this.context) {
      throw new Error('Browser context not created. Call launch() first.');
    }
    
    const cookieArray = Object.entries(cookies).map(([name, value]) => ({
      name,
      value,
      path: '/',
    }));
    
    await this.context.addCookies(cookieArray);
  }
  
  /**
   * Get cookies
   */
  async getCookies(): Promise<Record<string, string>> {
    if (!this.context) {
      throw new Error('Browser context not created. Call launch() first.');
    }
    
    const cookies = await this.context.cookies();
    const result: Record<string, string> = {};
    
    for (const cookie of cookies) {
      result[cookie.name] = cookie.value;
    }
    
    return result;
  }
  
  /**
   * Take screenshot
   */
  async screenshot(options?: { path?: string; fullPage?: boolean }): Promise<Buffer | string> {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }
    
    const screenshotOptions: any = {
      fullPage: options?.fullPage || false,
    };
    
    if (options?.path) {
      // Ensure directory exists
      const dir = path.dirname(options.path);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      await this.page.screenshot({ ...screenshotOptions, path: options.path });
      return options.path;
    }
    
    return await this.page.screenshot(screenshotOptions);
  }
  
  /**
   * Take screenshot on failure
   */
  async screenshotOnFailure(scenarioName: string): Promise<string | null> {
    if (!this.page) return null;
    
    // Create screenshots directory if not exists
    if (!fs.existsSync(this.screenshotsDir)) {
      fs.mkdirSync(this.screenshotsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${scenarioName}-${timestamp}.png`;
    const filepath = path.join(this.screenshotsDir, filename);
    
    await this.page.screenshot({ path: filepath, fullPage: true });
    return filepath;
  }
  
  /**
   * Refresh page
   */
  async refresh(): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }
    await this.page.reload();
  }
  
  /**
   * Get current URL
   */
  async getUrl(): Promise<string> {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }
    return this.page.url();
  }
  
  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }
    return await this.page.title();
  }
  
  /**
   * Evaluate JavaScript
   */
  async evaluate<T>(fn: () => T): Promise<T> {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }
    return await this.page.evaluate(fn);
  }
  
  /**
   * Close browser
   */
  async close(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
    
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
  
  /**
   * Get the page instance for advanced operations
   */
  getPage(): Page | null {
    return this.page;
  }
  
  /**
   * Get the context instance for cookie sharing
   */
  getContext(): BrowserContext | null {
    return this.context;
  }
}
