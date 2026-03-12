import type { BrowserContext, Page } from 'playwright-core';
import type { PlaywrightOptions } from './types.ts';
import { BrowserManager } from './browser-manager.ts';
import { BrowserInteractions } from './browser-interactions.ts';
import { BrowserAssertions } from './browser-assertions.ts';

export * from './types.ts';

export class PlaywrightClient {
  private manager: BrowserManager;
  private interactions: BrowserInteractions;
  private assertions: BrowserAssertions;
  
  constructor(options: PlaywrightOptions = {}) {
    const timeout = typeof options.timeout === 'string' ? parseInt(options.timeout, 10) : (options.timeout || 30000);
    this.manager = new BrowserManager({ headless: true, browser: 'chromium', viewport: { width: 1280, height: 720 }, ...options, timeout });
    this.interactions = new BrowserInteractions(this.manager);
    this.assertions = new BrowserAssertions(this.manager);
  }
  
  async launch(): Promise<void> { await this.manager.launch(); }
  async close(): Promise<void> { await this.manager.close(); }
  addRequestInterceptor(h: (req: any) => void): void { this.manager.addRequestInterceptor(h); }
  addResponseInterceptor(h: (res: any) => void): void { this.manager.addResponseInterceptor(h); }
  getPage(): Page | null { return this.manager.getPage(); }
  getContext(): BrowserContext | null { return this.manager.getContext(); }
  
  // -- Interactions Facade --
  async mockResponse(url: string, res: any, status = 200): Promise<void> { await this.interactions.mockResponse(url, res, status); }
  async abortRequests(url: string): Promise<void> { await this.interactions.abortRequests(url); }
  async navigate(url: string): Promise<void> { await this.interactions.navigate(url); }
  async click(selector: string): Promise<void> { await this.interactions.click(selector); }
  async type(selector: string, text: string, clear = false): Promise<void> { await this.interactions.type(selector, text, clear); }
  async fill(selector: string, text: string): Promise<void> { await this.interactions.fill(selector, text); }
  async refresh(): Promise<void> { await this.interactions.refresh(); }
  async evaluate<T>(fn: () => T): Promise<T> { return await this.interactions.evaluate(fn); }
  async setCookie(n: string, v: string, d?: string): Promise<void> { await this.interactions.setCookie(n, v, d); }
  async skipModal(): Promise<void> { await this.interactions.refresh(); } // Placeholder for actual modal logic if needed
  async screenshot(opts?: any): Promise<Buffer | string> { return await this.interactions.screenshot(opts); }
  
  // -- Assertions Facade --
  async waitForResponse(url: string, t?: number): Promise<any> { return await this.assertions.waitForResponse(url, t); }
  async waitForUrl(url: string, t?: number): Promise<void> { await this.assertions.waitForUrl(url, t); }
  async isVisible(selector: string): Promise<boolean> { return await this.assertions.isVisible(selector); }
  async getText(selector: string): Promise<string> { return await this.assertions.getText(selector); }
  async containsText(selector: string, text: string): Promise<boolean> { return await this.assertions.containsText(selector, text); }
  async getCookies(): Promise<Record<string, string>> { return await this.assertions.getCookies(); }
  async getUrl(): Promise<string> { return await this.assertions.getUrl(); }
  async getTitle(): Promise<string> { return await this.assertions.getTitle(); }
}
