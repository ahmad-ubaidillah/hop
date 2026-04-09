import type { BrowserContext, Page } from 'playwright-core';
import type { PlaywrightOptions } from './types.js';
import { BrowserManager } from './browser-manager.js';
import { BrowserInteractions } from './browser-interactions.js';
import { BrowserAssertions } from './browser-assertions.js';
import { WebFirstAssertions, createWebFirstAssertions } from './web-first-assertions.js';
import { SemanticLocators, DevicePresets, createSemanticLocators } from './semantic-locators.js';
import { createVisualRegression, VisualRegression } from './visual-regression.js';
import { createTraceViewer, TraceViewer } from './trace-viewer.js';
import { createIframeHandler, createFileHandler, IframeHandler, FileHandler } from './iframe-file-handler.js';
import { createServiceWorkerHandler, ServiceWorkerHandler } from './service-worker-handler.js';
import { createCodegen, Codegen } from './codegen.js';
import { createUIMode, UIMode } from './ui-mode.js';

export * from './types.js';

export class PlaywrightClient {
  private manager: BrowserManager;
  private interactions: BrowserInteractions;
  private assertions: BrowserAssertions;
  private webFirst: WebFirstAssertions;
  
  constructor(options: PlaywrightOptions = {}) {
    const timeout = typeof options.timeout === 'string' ? parseInt(options.timeout, 10) : (options.timeout || 30000);
    this.manager = new BrowserManager({ headless: true, browser: 'chromium', viewport: { width: 1280, height: 720 }, ...options, timeout });
    this.interactions = new BrowserInteractions(this.manager);
    this.assertions = new BrowserAssertions(this.manager);
    this.webFirst = createWebFirstAssertions(this.manager);
  }
  
  async launch(): Promise<void> { await this.manager.launch(); }
  async close(): Promise<void> { 
    const videoPath = await this.manager.getVideoPath();
    await this.manager.close();
  }
  addRequestInterceptor(h: (req: any) => void): void { this.manager.addRequestInterceptor(h); }
  addResponseInterceptor(h: (res: any) => void): void { this.manager.addResponseInterceptor(h); }
  getPage(): Page | null { return this.manager.getPage(); }
  getContext(): BrowserContext | null { return this.manager.getContext(); }
  isSaveVideoOnFailure(): boolean { return this.manager.isSaveVideoOnFailure(); }
  async getVideoPath(): Promise<string | undefined> { return this.manager.getRecordedVideoPath(); }
  
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
  async skipModal(): Promise<void> { await this.interactions.refresh(); }
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
  
  // -- Web-First Assertions (Playwright-style) --
  expect(selector: string): WebFirstAssertions { return this.webFirst; }
  
  async expectVisible(selector: string, options?: any): Promise<boolean> { return await this.webFirst.toBeVisible(selector, options); }
  async expectHidden(selector: string, options?: any): Promise<boolean> { return await this.webFirst.toBeHidden(selector, options); }
  async expectText(selector: string, text: string | RegExp, options?: any): Promise<boolean> { return await this.webFirst.toHaveText(selector, text, options); }
  async expectContainsText(selector: string, text: string, options?: any): Promise<boolean> { return await this.webFirst.toContainText(selector, text, options); }
  async expectValue(selector: string, value: string | RegExp, options?: any): Promise<boolean> { return await this.webFirst.toHaveValue(selector, value, options); }
  async expectTitle(title: string | RegExp, options?: any): Promise<boolean> { return await this.webFirst.toHaveTitle(title, options); }
  async expectURL(url: string | RegExp, options?: any): Promise<boolean> { return await this.webFirst.toHaveURL(url, options); }
  async expectCount(selector: string, count: number, options?: any): Promise<boolean> { return await this.webFirst.toHaveCount(selector, count, options); }
  async expectEnabled(selector: string, options?: any): Promise<boolean> { return await this.webFirst.toBeEnabled(selector, options); }
  async expectDisabled(selector: string, options?: any): Promise<boolean> { return await this.webFirst.toBeDisabled(selector, options); }
  async expectChecked(selector: string, options?: any): Promise<boolean> { return await this.webFirst.toBeChecked(selector, options); }
  async expectAttribute(selector: string, attr: string, value?: string | RegExp, options?: any): Promise<boolean> { return await this.webFirst.toHaveAttribute(selector, attr, value, options); }
  async expectClass(selector: string, className: string | RegExp, options?: any): Promise<boolean> { return await this.webFirst.toHaveClass(selector, className, options); }
  async expectCSS(selector: string, property: string, value: string | RegExp, options?: any): Promise<boolean> { return await this.webFirst.toHaveCSS(selector, property, value, options); }
  
  // -- Semantic Locators --
  getByRole(role: string, options?: any): any { const page = this.manager.getPage(); return page ? createSemanticLocators(page).getByRole(role, options) : null; }
  getByLabel(text: string, options?: any): any { const page = this.manager.getPage(); return page ? createSemanticLocators(page).getByLabel(text, options) : null; }
  getByPlaceholder(text: string, options?: any): any { const page = this.manager.getPage(); return page ? createSemanticLocators(page).getByPlaceholder(text, options) : null; }
  getByText(text: string, options?: any): any { const page = this.manager.getPage(); return page ? createSemanticLocators(page).getByText(text, options) : null; }
  getByTestId(testId: string): any { const page = this.manager.getPage(); return page ? createSemanticLocators(page).getByTestId(testId) : null; }
  getByAltText(text: string, options?: any): any { const page = this.manager.getPage(); return page ? createSemanticLocators(page).getByAltText(text, options) : null; }
  getByTitle(text: string, options?: any): any { const page = this.manager.getPage(); return page ? createSemanticLocators(page).getByTitle(text, options) : null; }
  
  // -- Visual Regression --
  getVisualRegression(options?: any): VisualRegression { return createVisualRegression(options); }
  async compareScreenshot(actual: Buffer, baseline: string, diffPath?: string): Promise<any> { return createVisualRegression().compareScreenshots(actual, baseline, diffPath); }
  
  // -- Trace Viewer --
  getTraceViewer(testId: string): TraceViewer { return createTraceViewer(testId, this.options.browser, this.options.viewport); }
  
  // -- Iframe & File Handling --
  getIframeHandler(): IframeHandler | null { const page = this.manager.getPage(); return page ? createIframeHandler(page) : null; }
  getFileHandler(): FileHandler | null { const page = this.manager.getPage(); return page ? createFileHandler(page) : null; }
  
  // -- Service Worker --
  getServiceWorkerHandler(): ServiceWorkerHandler | null { const page = this.manager.getPage(); return page ? createServiceWorkerHandler(page) : null; }
  
  // -- Codegen --
  startCodegen(options?: any): Codegen { return createCodegen(options); }
  
  // -- UI Mode --
  static startUIMode(options?: any): UIMode { return createUIMode(options); }
  
  // -- Device Presets --
  static getDevicePresets(): typeof DevicePresets { return DevicePresets; }
}
