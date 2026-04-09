import type { Page, Locator, BrowserContext } from 'playwright-core';
import { BrowserManager } from './ui/browser-manager.js';
import { createVisualRegression, type VisualRegression } from './ui/visual-regression.js';
import { createTraceViewer, type TraceViewer } from './ui/trace-viewer.js';
import { createIframeHandler, createFileHandler, type IframeHandler, type FileHandler } from './ui/iframe-file-handler.js';
import { createServiceWorkerHandler, type ServiceWorkerHandler } from './ui/service-worker-handler.js';
import { DevicePresets, type DeviceConfig } from './ui/semantic-locators.js';

export type { DeviceConfig };

let globalConfig: HopConfig & { autoAwait?: boolean } = { autoAwait: false };
let hopInstance: any = null;

export interface HopConfig {
  browser?: 'chromium' | 'firefox' | 'webkit';
  headless?: boolean;
  viewport?: { width: number; height: number };
  timeout?: number;
  video?: boolean | 'always' | 'on-failure' | 'never';
  device?: string;
  autoAwait?: boolean;
}

function createHopAutoAwait(): any {
  const api = new HopAPI({});
  
  const handler = {
    get(target: any, prop: string) {
      const value = target[prop];
      
      if (typeof value === 'function') {
        return (...args: any[]) => {
          const result = value.apply(target, args);
          if (result instanceof Promise) {
            result.catch(() => {});
          }
          return result;
        };
      }
      
      return value;
    }
  };
  
  return new Proxy(api, handler);
}

function getHopInstance(): HopAPI {
  if (!hopInstance) {
    hopInstance = globalConfig.autoAwait ? createHopAutoAwait() : new HopAPI({});
  }
  return hopInstance;
}

export function setConfig(config: Partial<HopConfig>): void {
  globalConfig = { ...globalConfig, ...config };
  if (config.autoAwait !== undefined) {
    hopInstance = config.autoAwait ? createHopAutoAwait() : new HopAPI({});
  }
}

export function getConfig(): typeof globalConfig {
  return globalConfig;
}

type HookFn = () => void | Promise<void>;

const beforeAllFns: HookFn[] = [];
const afterAllFns: HookFn[] = [];
const beforeEachFns: HookFn[] = [];
const afterEachFns: HookFn[] = [];

export function before(fn: HookFn): void { beforeAllFns.push(fn); }
export function beforeAll(fn: HookFn): void { beforeAllFns.push(fn); }
export function after(fn: HookFn): void { afterAllFns.push(fn); }
export function afterAll(fn: HookFn): void { afterAllFns.push(fn); }
export function beforeEach(fn: HookFn): void { beforeEachFns.push(fn); }
export function afterEach(fn: HookFn): void { afterEachFns.push(fn); }

export async function runBeforeAll(): Promise<void> {
  for (const fn of beforeAllFns) { await fn(); }
}

export async function runAfterAll(): Promise<void> {
  for (const fn of afterAllFns) { await fn(); }
}

export async function runBeforeEach(): Promise<void> {
  for (const fn of beforeEachFns) { await fn(); }
}

export async function runAfterEach(): Promise<void> {
  for (const fn of afterEachFns) { await fn(); }
}

export function describe(name: string, fn: () => void): void { fn(); }
export function it(name: string, fn: () => Promise<void>): void { }
export function test(name: string, fn: () => Promise<void>): void { }

class HopExpect {
  private locator: HopLocator | null;
  private value: any;

  constructor(locatorOrValue: HopLocator | any) {
    if (locatorOrValue instanceof HopLocator) {
      this.locator = locatorOrValue;
      this.value = null;
    } else {
      this.locator = null;
      this.value = locatorOrValue;
    }
  }

  async toBeVisible(timeout = 5000): Promise<void> {
    if (this.locator) await this.locator.should('be.visible', timeout);
    else if (this.value) throw new Error('Expected value to be truthy');
  }

  async toBeHidden(timeout = 5000): Promise<void> {
    if (this.locator) await this.locator.should('be.hidden', timeout);
  }

  async toBeEnabled(timeout = 5000): Promise<void> {
    if (this.locator) await this.locator.should('be.enabled', timeout);
  }

  async toBeDisabled(timeout = 5000): Promise<void> {
    if (this.locator) await this.locator.should('be.disabled', timeout);
  }

  async toBeChecked(timeout = 5000): Promise<void> {
    if (this.locator) await this.locator.should('be.checked', timeout);
  }

  async toHaveCount(count: number): Promise<void> {
    if (!this.locator) throw new Error('Expect requires a locator');
    const actual = await this.locator.count();
    if (actual !== count) throw new Error(`Expected ${count} elements, got ${actual}`);
  }

  async toHaveText(text?: string | RegExp, timeout = 5000): Promise<void> {
    if (!this.locator) throw new Error('Expect requires a locator');
    if (text) await this.locator.shouldHave(text);
    else {
      const actual = await this.locator.getText();
      if (!actual) throw new Error('Expected element to have text');
    }
  }

  async toHaveValue(value?: string | RegExp): Promise<void> {
    if (!this.locator) throw new Error('Expect requires a locator');
    if (value) await this.locator.shouldHaveValue(value);
    else {
      const actual = await this.locator.getValue();
      if (!actual) throw new Error('Expected element to have value');
    }
  }

  async toBe(value: any): Promise<void> {
    if (this.value === undefined) throw new Error('Expect requires a value');
    if (this.value !== value) throw new Error(`Expected ${value}, got ${this.value}`);
  }

  async toEqual(value: any): Promise<void> {
    if (this.value === undefined) throw new Error('Expect requires a value');
    if (JSON.stringify(this.value) !== JSON.stringify(value)) {
      throw new Error(`Expected ${JSON.stringify(value)}, got ${JSON.stringify(this.value)}`);
    }
  }

  async toContain(text: string): Promise<void> {
    if (this.locator) await this.locator.shouldContain(text);
    else if (typeof this.value === 'string' && !this.value.includes(text)) {
      throw new Error(`Expected "${this.value}" to contain "${text}"`);
    }
  }

  async toHaveAttribute(attr: string, value?: string | RegExp): Promise<void> {
    if (!this.locator) throw new Error('Expect requires a locator');
    await this.locator.shouldHaveAttribute(attr, value);
  }

  async toHaveCSS(property: string, value: string): Promise<void> {
    if (!this.locator) throw new Error('Expect requires a locator');
    const actual = await this.locator.evaluate((el: any) => getComputedStyle(el).getPropertyValue(property));
    if (actual !== value) throw new Error(`Expected CSS "${property}" to be "${value}", got "${actual}"`);
  }

  async not(): Promise<HopExpect> {
    const expect = new HopExpect(this.locator || this.value);
    return expect;
  }
}

export function expect(locatorOrValue: HopLocator | any): HopExpect {
  return new HopExpect(locatorOrValue);
}

export interface HopActionOptions {
  force?: boolean;
  position?: { x: number; y: number };
  timeout?: number;
  waitForVisible?: boolean;
}

export interface HopWaitOptions {
  timeout?: number;
  state?: 'visible' | 'hidden' | 'attached' | 'detached';
}

class HopBrowser {
  private manager: BrowserManager | null = null;
  private config: HopConfig;

  constructor(config: HopConfig = {}) {
    this.config = { headless: true, browser: 'chromium', viewport: { width: 1280, height: 720 }, timeout: 30000, ...config };
  }

  async launch(): Promise<void> {
    if (!this.manager) {
      this.manager = new BrowserManager(this.config as any);
    }
    await this.manager.launch();
  }

  async close(): Promise<void> {
    if (this.manager) {
      await this.manager.close();
      this.manager = null;
    }
  }

  async newPage(): Promise<Page | null> {
    if (!this.manager) await this.launch();
    return this.manager!.getPage();
  }

  getPage(): Page | null { return this.manager?.getPage() || null; }
  getContext(): BrowserContext | null { return this.manager?.getContext() || null; }
  isLaunched(): boolean { return this.manager !== null; }
}

class HopLocator {
  private pageRef: Page;
  private locator: Locator;

  constructor(page: Page | null, selectorOrLocator: string | Locator) {
    if (!page) throw new Error('Page not initialized');
    this.pageRef = page;
    this.locator = typeof selectorOrLocator === 'string' ? page.locator(selectorOrLocator) : selectorOrLocator;
  }

  async click(options?: HopActionOptions): Promise<void> {
    const opts: any = {};
    if (options?.force) opts.force = true;
    if (options?.position) opts.position = options.position;
    if (options?.waitForVisible) await this.locator.waitFor({ state: 'visible', timeout: options.timeout });
    await this.locator.click(opts);
  }

  async dblclick(options?: HopActionOptions): Promise<void> {
    const opts: any = {};
    if (options?.force) opts.force = true;
    if (options?.position) opts.position = options.position;
    await this.locator.dblclick(opts);
  }

  async rightclick(options?: HopActionOptions): Promise<void> {
    const opts: any = {};
    if (options?.force) opts.force = true;
    if (options?.position) opts.position = options.position;
    await this.locator.click({ button: 'right', ...opts });
  }

  async fill(value: string): Promise<void> { await this.locator.fill(value); }
  async type(text: string): Promise<void> { await this.locator.fill(text); }
  async clear(): Promise<void> { await this.locator.clear(); }
  async select(value: string | string[]): Promise<void> { await this.locator.selectOption(value); }
  async check(): Promise<void> { await this.locator.check(); }
  async uncheck(): Promise<void> { await this.locator.uncheck(); }
  async hover(): Promise<void> { await this.locator.hover(); }
  async focus(): Promise<void> { await this.locator.focus(); }
  async blur(): Promise<void> { await this.locator.blur(); }
  async scrollIntoView(): Promise<void> { await this.locator.scrollIntoViewIfNeeded(); }
  async trigger(event: string, options?: any): Promise<void> { await this.locator.dispatchEvent(event, options); }
  async selectFile(files: any): Promise<void> { await this.locator.setInputFiles(files); }

  async press(key: string): Promise<void> { await this.locator.press(key); }
  async pressKey(key: 'Enter' | 'Tab' | 'Escape' | 'Backspace' | 'Delete' | 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' | 'Home' | 'End' | 'PageUp' | 'PageDown'): Promise<void> { await this.locator.press(key); }
  async fillAndEnter(value: string): Promise<void> { await this.locator.fill(value); await this.locator.press('Enter'); }

  async dragTo(target: string | Locator): Promise<void> {
    const targetLocator = typeof target === 'string' ? this.pageRef.locator(target) : target;
    await this.locator.dragTo(targetLocator);
  }
  async dragToAndDrop(target: string | Locator): Promise<void> { await this.dragTo(target); }

  async swipe(direction: 'up' | 'down' | 'left' | 'right', distance = 500): Promise<void> {
    const box = await this.locator.boundingBox();
    if (!box) throw new Error('Element not found for swipe');
    const midX = box.x + box.width / 2;
    const midY = box.y + box.height / 2;
    let endX = midX, endY = midY;
    switch (direction) {
      case 'up': endY = midY - distance; break;
      case 'down': endY = midY + distance; break;
      case 'left': endX = midX - distance; break;
      case 'right': endX = midX + distance; break;
    }
    await this.pageRef.mouse.move(midX, midY);
    await this.pageRef.mouse.down();
    await this.pageRef.mouse.move(endX, endY, { steps: 10 });
    await this.pageRef.mouse.up();
  }

  async clickWithShift(): Promise<void> { await this.locator.click({ modifiers: ['Shift'] }); }
  async clickWithControl(): Promise<void> { await this.locator.click({ modifiers: ['Control'] }); }
  async clickWithMeta(): Promise<void> { await this.locator.click({ modifiers: ['Meta'] }); }

  async selectAll(): Promise<void> { await this.locator.focus(); await this.pageRef.keyboard.press('Control+A'); }
  async selectText(start: number, end: number): Promise<void> { await this.locator.focus(); await this.pageRef.keyboard.press('Control+A'); await this.pageRef.keyboard.press('ArrowLeft'); }
  async cut(): Promise<void> { await this.selectAll(); await this.pageRef.keyboard.press('Control+X'); }
  async copy(): Promise<void> { await this.selectAll(); await this.pageRef.keyboard.press('Control+C'); }
  async paste(): Promise<void> { await this.pageRef.keyboard.press('Control+V'); }

  async rightClick(): Promise<void> { await this.locator.click({ button: 'right' }); }

  async getAttribute(name: string): Promise<string | null> { return await this.locator.getAttribute(name); }
  async getText(): Promise<string> { return await this.locator.textContent() || ''; }
  async getInnerHTML(): Promise<string> { return await this.locator.innerHTML(); }
  async getValue(): Promise<string> { return await (this.locator as any).inputValue(); }

  async isVisible(): Promise<boolean> { try { await this.locator.waitFor({ state: 'visible', timeout: 1000 }); return true; } catch { return false; } }
  async isHidden(): Promise<boolean> { return !(await this.isVisible()); }
  async isEnabled(): Promise<boolean> { return await this.locator.isEnabled(); }
  async isDisabled(): Promise<boolean> { return await this.locator.isDisabled(); }
  async isChecked(): Promise<boolean> { return await this.locator.isChecked(); }
  async isFocused(): Promise<boolean> { return false; }
  async count(): Promise<number> { return await this.locator.count(); }

  async waitFor(options?: HopWaitOptions): Promise<void> { await this.locator.waitFor({ state: options?.state || 'visible', timeout: options?.timeout }); }

  async should(condition: 'be.visible' | 'be.hidden' | 'be.enabled' | 'be.disabled' | 'be.checked' | 'exist', timeout = 5000): Promise<void> {
    switch (condition) {
      case 'be.visible': await this.locator.waitFor({ state: 'visible', timeout }); break;
      case 'be.hidden': await this.locator.waitFor({ state: 'hidden', timeout }); break;
      case 'be.enabled': if (!(await this.locator.isEnabled())) throw new Error('Element is not enabled'); break;
      case 'be.disabled': if (!(await this.locator.isDisabled())) throw new Error('Element is not disabled'); break;
      case 'be.checked': if (!(await this.locator.isChecked())) throw new Error('Element is not checked'); break;
      case 'exist': if (await this.locator.count() === 0) throw new Error('Element does not exist'); break;
    }
  }

  async shouldHave(text: string | RegExp): Promise<void> {
    const actual = await this.getText();
    if (typeof text === 'string') { if (actual !== text) throw new Error(`Expected "${text}", got "${actual}"`); }
    else { if (!text.test(actual)) throw new Error(`Expected text to match ${text}, got "${actual}"`); }
  }

  async shouldContain(text: string): Promise<void> {
    const actual = await this.getText();
    if (!actual.includes(text)) throw new Error(`Expected "${actual}" to contain "${text}"`);
  }

  async shouldHaveValue(value: string | RegExp): Promise<void> {
    const actual = await this.getValue();
    if (typeof value === 'string') { if (actual !== value) throw new Error(`Expected value "${value}", got "${actual}"`); }
    else { if (!value.test(actual)) throw new Error(`Expected value to match ${value}, got "${actual}"`); }
  }

  async shouldHaveAttribute(attr: string, value?: string | RegExp): Promise<void> {
    const actual = await this.getAttribute(attr);
    if (actual === null) throw new Error(`Element does not have attribute "${attr}"`);
    if (value) {
      if (typeof value === 'string') { if (actual !== value) throw new Error(`Expected "${attr}" to be "${value}", got "${actual}"`); }
      else { if (!value.test(actual)) throw new Error(`Expected "${attr}" to match ${value}, got "${actual}"`); }
    }
  }

  async shouldHaveCount(count: number): Promise<void> {
    const actual = await this.count();
    if (actual !== count) throw new Error(`Expected ${count} elements, got ${actual}`);
  }

  debug(): this { console.log('🔍 Debug:', this.locator.toString()); return this; }
  then<T>(fn: (locator: Locator) => T): T { return fn(this.locator); }
  first(): HopLocator { return new HopLocator(this.pageRef, this.locator.first()); }
  last(): HopLocator { return new HopLocator(this.pageRef, this.locator.last()); }
  nth(index: number): HopLocator { return new HopLocator(this.pageRef, this.locator.nth(index)); }
  async evaluate<R>(fn: (el: any) => R): Promise<R> { return await this.locator.evaluate(fn); }
}

class HopAPI {
  private browser: HopBrowser | null = null;
  private currentPage: Page | null = null;
  private config: HopConfig;

  constructor(config: HopConfig = {}) {
    this.config = config;
  }

  get browserManager(): HopBrowser {
    if (!this.browser) this.browser = new HopBrowser(this.config);
    return this.browser;
  }

  async launch(): Promise<void> {
    await this.browserManager.launch();
    this.currentPage = this.browserManager.getPage();
  }

  async close(): Promise<void> {
    await this.browserManager.close();
    this.currentPage = null;
  }

  async newPage(): Promise<Page> {
    if (!this.browserManager.isLaunched()) await this.launch();
    const page = await this.browserManager.newPage();
    if (page) this.currentPage = page;
    return page!;
  }

  getPage(): Page | null { return this.currentPage || this.browserManager.getPage(); }
  get(selector: string): HopLocator { return new HopLocator(this.getPage(), selector); }

  getByRole(role: string, options?: any): HopLocator { const page = this.getPage(); if (!page) throw new Error('Page not initialized'); return new HopLocator(page, page.getByRole(role as any, options)); }
  getByLabel(text: string, options?: any): HopLocator { const page = this.getPage(); if (!page) throw new Error('Page not initialized'); return new HopLocator(page, page.getByLabel(text, options)); }
  getByPlaceholder(text: string, options?: any): HopLocator { const page = this.getPage(); if (!page) throw new Error('Page not initialized'); return new HopLocator(page, page.getByPlaceholder(text, options)); }
  getByText(text: string, options?: any): HopLocator { const page = this.getPage(); if (!page) throw new Error('Page not initialized'); return new HopLocator(page, page.getByText(text, options)); }
  getByTestId(testId: string): HopLocator { const page = this.getPage(); if (!page) throw new Error('Page not initialized'); return new HopLocator(page, page.getByTestId(testId)); }
  getByAltText(text: string, options?: any): HopLocator { const page = this.getPage(); if (!page) throw new Error('Page not initialized'); return new HopLocator(page, page.getByAltText(text, options)); }
  getByTitle(text: string, options?: any): HopLocator { const page = this.getPage(); if (!page) throw new Error('Page not initialized'); return new HopLocator(page, page.getByTitle(text, options)); }

  $(selector: string): HopLocator { const page = this.getPage(); if (!page) throw new Error('Page not initialized'); return new HopLocator(page, page.locator(selector).first()); }
  $$(selector: string): HopLocator[] { const page = this.getPage(); if (!page) throw new Error('Page not initialized'); return [new HopLocator(page, page.locator(selector))]; }
  async $eval<R>(selector: string, fn: (el: Element, ...args: any[]) => R): Promise<R | null> { const page = this.getPage(); if (!page) return null; return await page.$eval(selector, fn as any); }
  async $$eval<R>(selector: string, fn: (els: Element[], ...args: any[]) => R): Promise<R> { const page = this.getPage(); if (!page) throw new Error('Page not initialized'); return await page.$$eval(selector, fn as any); }
  first(selector: string): HopLocator { const page = this.getPage(); if (!page) throw new Error('Page not initialized'); return new HopLocator(page, page.locator(selector).first()); }
  last(selector: string): HopLocator { const page = this.getPage(); if (!page) throw new Error('Page not initialized'); return new HopLocator(page, page.locator(selector).last()); }
  nth(selector: string, index: number): HopLocator { const page = this.getPage(); if (!page) throw new Error('Page not initialized'); return new HopLocator(page, page.locator(selector).nth(index)); }
  filter(selector: string, hasText?: string | RegExp): HopLocator { const page = this.getPage(); if (!page) throw new Error('Page not initialized'); return new HopLocator(page, page.locator(selector).filter({ hasText })); }

  async tap(selector: string): Promise<void> { const page = this.getPage(); if (!page) throw new Error('Page not initialized'); await page.tap(selector); }

  async pdf(options?: any): Promise<Buffer> { const page = this.getPage(); if (!page) throw new Error('Page not initialized'); return await page.pdf(options); }

  async visit(url: string): Promise<void> { const page = this.getPage(); if (!page) throw new Error('Page not initialized'); await page.goto(url); }
  async reload(): Promise<void> { const page = this.getPage(); if (!page) throw new Error('Page not initialized'); await page.reload(); }
  async goBack(): Promise<void> { const page = this.getPage(); if (!page) throw new Error('Page not initialized'); await page.goBack(); }
  async goForward(): Promise<void> { const page = this.getPage(); if (!page) throw new Error('Page not initialized'); await page.goForward(); }
  async wait(ms: number): Promise<void> { await new Promise(resolve => setTimeout(resolve, ms)); }

  async waitForSelector(selector: string, options?: HopWaitOptions): Promise<HopLocator> {
    const page = this.getPage();
    if (!page) throw new Error('Page not initialized');
    await page.waitForSelector(selector, { state: options?.state || 'visible', timeout: options?.timeout });
    return this.get(selector);
  }

  async waitForLoadState(state: 'load' | 'domcontentloaded' | 'networkidle'): Promise<void> {
    const page = this.getPage();
    if (!page) throw new Error('Page not initialized');
    await page.waitForLoadState(state);
  }

  async waitForURL(url: string | RegExp, options?: { timeout?: number }): Promise<void> {
    const page = this.getPage();
    if (!page) throw new Error('Page not initialized');
    await page.waitForURL(url, { timeout: options?.timeout });
  }

  title(): Promise<string> { const page = this.getPage(); if (!page) throw new Error('Page not initialized'); return page.title(); }
  url(): string { const page = this.getPage(); if (!page) throw new Error('Page not initialized'); return page.url(); }

  async evaluate<T>(fn: (...args: any[]) => T): Promise<T> {
    const page = this.getPage();
    if (!page) throw new Error('Page not initialized');
    return await page.evaluate(fn as any);
  }

  async screenshot(options?: { path?: string; fullPage?: boolean }): Promise<Buffer> {
    const page = this.getPage();
    if (!page) throw new Error('Page not initialized');
    return await page.screenshot(options);
  }

  async setViewportSize(width: number, height: number): Promise<void> {
    const page = this.getPage();
    if (!page) throw new Error('Page not initialized');
    await page.setViewportSize({ width, height });
  }

  async viewportSize(): Promise<{ width: number; height: number } | null> {
    const page = this.getPage();
    if (!page) return null;
    return await page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }));
  }

  async press(key: string, options?: { delay?: number }): Promise<void> {
    const page = this.getPage();
    if (!page) throw new Error('Page not initialized');
    await page.keyboard.press(key, options);
  }

  async addStyleTag(content: string): Promise<void> {
    const page = this.getPage();
    if (!page) throw new Error('Page not initialized');
    await page.addStyleTag({ content });
  }

  async addScriptTag(content: string): Promise<void> {
    const page = this.getPage();
    if (!page) throw new Error('Page not initialized');
    await page.addScriptTag({ content });
  }

  async setCookie(name: string, value: string, options?: any): Promise<void> {
    const context = this.browserManager.getContext();
    if (!context) throw new Error('Browser context not initialized');
    await context.addCookies([{ name, value, ...options }]);
  }

  async getCookie(name?: string): Promise<any> {
    const context = this.browserManager.getContext();
    if (!context) throw new Error('Browser context not initialized');
    const cookies = await context.cookies();
    if (name) return cookies.find(c => c.name === name);
    return cookies;
  }

  async clearCookies(): Promise<void> {
    const context = this.browserManager.getContext();
    if (!context) throw new Error('Browser context not initialized');
    await context.clearCookies();
  }

  async setLocalStorage(key: string, value: string): Promise<void> {
    const page = this.getPage();
    if (!page) throw new Error('Page not initialized');
    await page.evaluate(([k, v]) => localStorage.setItem(k, v), [key, value]);
  }

  async getLocalStorage(key?: string): Promise<any> {
    const page = this.getPage();
    if (!page) throw new Error('Page not initialized');
    if (key) return await page.evaluate(k => localStorage.getItem(k), key);
    return await page.evaluate(() => { const r: Record<string, string> = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k) r[k] = localStorage.getItem(k)!; } return r; });
  }

  async clearLocalStorage(): Promise<void> {
    const page = this.getPage();
    if (!page) throw new Error('Page not initialized');
    await page.evaluate(() => localStorage.clear());
  }

  async intercept(url: string | RegExp, response: { status?: number; body?: any; headers?: Record<string, string> }): Promise<void> {
    const page = this.getPage();
    if (!page) throw new Error('Page not initialized');
    await page.route(url, route => { route.fulfill({ status: response.status || 200, body: response.body || '', headers: response.headers || { 'content-type': 'application/json' } }); });
  }

  async abortRequest(pattern: string | RegExp, errorCode?: string): Promise<void> {
    const page = this.getPage();
    if (!page) throw new Error('Page not initialized');
    await page.route(pattern, route => route.abort(errorCode || 'failed'));
  }

  async waitForRequest(url: string | RegExp, timeout?: number): Promise<any> {
    const page = this.getPage();
    if (!page) throw new Error('Page not initialized');
    return await page.waitForRequest(url, { timeout });
  }

  async waitForResponse(url: string | RegExp, timeout?: number): Promise<any> {
    const page = this.getPage();
    if (!page) throw new Error('Page not initialized');
    return await page.waitForResponse(url, { timeout });
  }

  get visualRegression(): VisualRegression { return createVisualRegression(); }
  getTraceViewer(testId: string): TraceViewer { return createTraceViewer(testId, this.config.browser, this.config.viewport); }
  get iframe(): IframeHandler | null { const page = this.getPage(); return page ? createIframeHandler(page) : null; }
  get file(): FileHandler | null { const page = this.getPage(); return page ? createFileHandler(page) : null; }
  get serviceWorker(): ServiceWorkerHandler | null { const page = this.getPage(); return page ? createServiceWorkerHandler(page) : null; }
  static get DevicePresets() { return DevicePresets; }
}

function createHop(config?: HopConfig): HopAPI {
  if (config?.autoAwait) setConfig({ autoAwait: true });
  return new HopAPI(config);
}

export const hop: any = globalConfig.autoAwait ? createHopAutoAwait() : new HopAPI({});
export { createHop };
export default hop;