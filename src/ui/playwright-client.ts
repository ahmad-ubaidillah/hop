import type { BrowserContext, Page } from 'playwright-core';
import type { PlaywrightOptions, ElementLocator, NetworkRequest } from './types.ts';
import { BrowserManager } from './browser-manager.ts';
import { BrowserInteractions } from './browser-interactions.ts';
import { BrowserAssertions } from './browser-assertions.ts';

export * from './types.ts';

export class PlaywrightClient {
  private manager: BrowserManager;
  private interactions: BrowserInteractions;
  private assertions: BrowserAssertions;
  
  constructor(options: PlaywrightOptions = {}) {
    this.manager = new BrowserManager({
      headless: true,
      browser: 'chromium',
      viewport: { width: 1280, height: 720 },
      video: false,
      screenshotOnFailure: true,
      ...options,
      // Ensure timeout is a number
      timeout: typeof options.timeout === 'string' ? parseInt(options.timeout as string, 10) : (options.timeout || 30000)
    });
    
    this.interactions = new BrowserInteractions(this.manager);
    this.assertions = new BrowserAssertions(this.manager);
  }
  
  async launch(): Promise<void> {
    await this.manager.launch();
  }
  
  async close(): Promise<void> {
    await this.manager.close();
  }
  
  addRequestInterceptor(handler: (request: any) => void): void {
    this.manager.addRequestInterceptor(handler);
  }
  
  addResponseInterceptor(handler: (response: any) => void): void {
    this.manager.addResponseInterceptor(handler);
  }
  
  getPage(): Page | null {
    return this.manager.getPage();
  }
  
  getContext(): BrowserContext | null {
    return this.manager.getContext();
  }
  
  // -- Interactions Facade --
  async mockResponse(urlPattern: string, response: any, status: number = 200): Promise<void> {
    await this.interactions.mockResponse(urlPattern, response, status);
  }
  
  async abortRequests(urlPattern: string): Promise<void> {
    await this.interactions.abortRequests(urlPattern);
  }
  
  async navigate(url: string): Promise<void> {
    await this.interactions.navigate(url);
  }
  
  async click(selector: string): Promise<void> {
    await this.interactions.click(selector);
  }
  
  async type(selector: string, text: string, clear: boolean = false): Promise<void> {
    await this.interactions.type(selector, text, clear);
  }
  
  async fill(selector: string, text: string): Promise<void> {
    await this.interactions.fill(selector, text);
  }
  
  async refresh(): Promise<void> {
    await this.interactions.refresh();
  }
  
  async evaluate<T>(fn: () => T): Promise<T> {
    return await this.interactions.evaluate(fn);
  }
  
  async setCookie(name: string, value: string, domain?: string): Promise<void> {
    await this.interactions.setCookie(name, value, domain);
  }
  
  async setCookies(cookies: Record<string, string>): Promise<void> {
    await this.interactions.setCookies(cookies);
  }
  
  async screenshot(options?: { path?: string; fullPage?: boolean }): Promise<Buffer | string> {
    return await this.interactions.screenshot(options);
  }
  
  async screenshotOnFailure(scenarioName: string): Promise<string | null> {
    return await this.interactions.screenshotOnFailure(scenarioName);
  }

  // -- Assertions Facade --
  async waitForResponse(urlPattern: string, timeout?: number): Promise<any> {
    return await this.assertions.waitForResponse(urlPattern, timeout);
  }
  
  async waitForRequest(urlPattern: string, timeout?: number): Promise<any> {
    return await this.assertions.waitForRequest(urlPattern, timeout);
  }
  
  async waitForElementVisible(selector: string, timeout?: number): Promise<void> {
    await this.assertions.waitForElementVisible(selector, timeout);
  }
  
  async waitForElementHidden(selector: string, timeout?: number): Promise<void> {
    await this.assertions.waitForElementHidden(selector, timeout);
  }
  
  async waitForElementDetached(selector: string, timeout?: number): Promise<void> {
    await this.assertions.waitForElementDetached(selector, timeout);
  }
  
  async waitForNavigation(timeout?: number): Promise<void> {
    await this.assertions.waitForNavigation(timeout);
  }
  
  async waitForUrl(urlPattern: string, timeout?: number): Promise<void> {
    await this.assertions.waitForUrl(urlPattern, timeout);
  }
  
  async isVisible(selector: string): Promise<boolean> {
    return await this.assertions.isVisible(selector);
  }
  
  async getText(selector: string): Promise<string> {
    return await this.assertions.getText(selector);
  }
  
  async containsText(selector: string, text: string): Promise<boolean> {
    return await this.assertions.containsText(selector, text);
  }
  
  async waitForSelector(selector: string, timeout?: number): Promise<void> {
    await this.assertions.waitForSelector(selector, timeout);
  }
  
  async getCookies(): Promise<Record<string, string>> {
    return await this.assertions.getCookies();
  }
  
  async getUrl(): Promise<string> {
    return await this.assertions.getUrl();
  }
  
  async getTitle(): Promise<string> {
    return await this.assertions.getTitle();
  }
}
