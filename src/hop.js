import { BrowserManager } from './ui/browser-manager.js';
import { createVisualRegression } from './ui/visual-regression.js';
import { createTraceViewer } from './ui/trace-viewer.js';
import { createIframeHandler, createFileHandler } from './ui/iframe-file-handler.js';
import { createServiceWorkerHandler } from './ui/service-worker-handler.js';
import { DevicePresets } from './ui/semantic-locators.js';
let globalConfig = { autoAwait: false };
let hopInstance = null;
function createHopAutoAwait() {
    const api = new HopAPI({});
    const handler = {
        get(target, prop) {
            const value = target[prop];
            if (typeof value === 'function') {
                return (...args) => {
                    const result = value.apply(target, args);
                    if (result instanceof Promise) {
                        result.catch(() => { });
                    }
                    return result;
                };
            }
            return value;
        }
    };
    return new Proxy(api, handler);
}
function getHopInstance() {
    if (!hopInstance) {
        hopInstance = globalConfig.autoAwait ? createHopAutoAwait() : new HopAPI({});
    }
    return hopInstance;
}
export function setConfig(config) {
    globalConfig = { ...globalConfig, ...config };
    if (config.autoAwait !== undefined) {
        hopInstance = config.autoAwait ? createHopAutoAwait() : new HopAPI({});
    }
}
export function getConfig() {
    return globalConfig;
}
const beforeAllFns = [];
const afterAllFns = [];
const beforeEachFns = [];
const afterEachFns = [];
export function before(fn) { beforeAllFns.push(fn); }
export function beforeAll(fn) { beforeAllFns.push(fn); }
export function after(fn) { afterAllFns.push(fn); }
export function afterAll(fn) { afterAllFns.push(fn); }
export function beforeEach(fn) { beforeEachFns.push(fn); }
export function afterEach(fn) { afterEachFns.push(fn); }
export async function runBeforeAll() {
    for (const fn of beforeAllFns) {
        await fn();
    }
}
export async function runAfterAll() {
    for (const fn of afterAllFns) {
        await fn();
    }
}
export async function runBeforeEach() {
    for (const fn of beforeEachFns) {
        await fn();
    }
}
export async function runAfterEach() {
    for (const fn of afterEachFns) {
        await fn();
    }
}
export function describe(name, fn) { fn(); }
export function it(name, fn) { }
export function test(name, fn) { }
class HopExpect {
    locator;
    value;
    constructor(locatorOrValue) {
        if (locatorOrValue instanceof HopLocator) {
            this.locator = locatorOrValue;
            this.value = null;
        }
        else {
            this.locator = null;
            this.value = locatorOrValue;
        }
    }
    async toBeVisible(timeout = 5000) {
        if (this.locator)
            await this.locator.should('be.visible', timeout);
        else if (this.value)
            throw new Error('Expected value to be truthy');
    }
    async toBeHidden(timeout = 5000) {
        if (this.locator)
            await this.locator.should('be.hidden', timeout);
    }
    async toBeEnabled(timeout = 5000) {
        if (this.locator)
            await this.locator.should('be.enabled', timeout);
    }
    async toBeDisabled(timeout = 5000) {
        if (this.locator)
            await this.locator.should('be.disabled', timeout);
    }
    async toBeChecked(timeout = 5000) {
        if (this.locator)
            await this.locator.should('be.checked', timeout);
    }
    async toHaveCount(count) {
        if (!this.locator)
            throw new Error('Expect requires a locator');
        const actual = await this.locator.count();
        if (actual !== count)
            throw new Error(`Expected ${count} elements, got ${actual}`);
    }
    async toHaveText(text, timeout = 5000) {
        if (!this.locator)
            throw new Error('Expect requires a locator');
        if (text)
            await this.locator.shouldHave(text);
        else {
            const actual = await this.locator.getText();
            if (!actual)
                throw new Error('Expected element to have text');
        }
    }
    async toHaveValue(value) {
        if (!this.locator)
            throw new Error('Expect requires a locator');
        if (value)
            await this.locator.shouldHaveValue(value);
        else {
            const actual = await this.locator.getValue();
            if (!actual)
                throw new Error('Expected element to have value');
        }
    }
    async toBe(value) {
        if (this.value === undefined)
            throw new Error('Expect requires a value');
        if (this.value !== value)
            throw new Error(`Expected ${value}, got ${this.value}`);
    }
    async toEqual(value) {
        if (this.value === undefined)
            throw new Error('Expect requires a value');
        if (JSON.stringify(this.value) !== JSON.stringify(value)) {
            throw new Error(`Expected ${JSON.stringify(value)}, got ${JSON.stringify(this.value)}`);
        }
    }
    async toContain(text) {
        if (this.locator)
            await this.locator.shouldContain(text);
        else if (typeof this.value === 'string' && !this.value.includes(text)) {
            throw new Error(`Expected "${this.value}" to contain "${text}"`);
        }
    }
    async toHaveAttribute(attr, value) {
        if (!this.locator)
            throw new Error('Expect requires a locator');
        await this.locator.shouldHaveAttribute(attr, value);
    }
    async toHaveCSS(property, value) {
        if (!this.locator)
            throw new Error('Expect requires a locator');
        const actual = await this.locator.evaluate((el) => getComputedStyle(el).getPropertyValue(property));
        if (actual !== value)
            throw new Error(`Expected CSS "${property}" to be "${value}", got "${actual}"`);
    }
    async not() {
        const expect = new HopExpect(this.locator || this.value);
        return expect;
    }
}
export function expect(locatorOrValue) {
    return new HopExpect(locatorOrValue);
}
class HopBrowser {
    manager = null;
    config;
    constructor(config = {}) {
        this.config = { headless: true, browser: 'chromium', viewport: { width: 1280, height: 720 }, timeout: 30000, ...config };
    }
    async launch() {
        if (!this.manager) {
            this.manager = new BrowserManager(this.config);
        }
        await this.manager.launch();
    }
    async close() {
        if (this.manager) {
            await this.manager.close();
            this.manager = null;
        }
    }
    async newPage() {
        if (!this.manager)
            await this.launch();
        return this.manager.getPage();
    }
    getPage() { return this.manager?.getPage() || null; }
    getContext() { return this.manager?.getContext() || null; }
    isLaunched() { return this.manager !== null; }
}
class HopLocator {
    pageRef;
    locator;
    constructor(page, selectorOrLocator) {
        if (!page)
            throw new Error('Page not initialized');
        this.pageRef = page;
        this.locator = typeof selectorOrLocator === 'string' ? page.locator(selectorOrLocator) : selectorOrLocator;
    }
    async click(options) {
        const opts = {};
        if (options?.force)
            opts.force = true;
        if (options?.position)
            opts.position = options.position;
        if (options?.waitForVisible)
            await this.locator.waitFor({ state: 'visible', timeout: options.timeout });
        await this.locator.click(opts);
    }
    async dblclick(options) {
        const opts = {};
        if (options?.force)
            opts.force = true;
        if (options?.position)
            opts.position = options.position;
        await this.locator.dblclick(opts);
    }
    async rightclick(options) {
        const opts = {};
        if (options?.force)
            opts.force = true;
        if (options?.position)
            opts.position = options.position;
        await this.locator.click({ button: 'right', ...opts });
    }
    async fill(value) { await this.locator.fill(value); }
    async type(text) { await this.locator.fill(text); }
    async clear() { await this.locator.clear(); }
    async select(value) { await this.locator.selectOption(value); }
    async check() { await this.locator.check(); }
    async uncheck() { await this.locator.uncheck(); }
    async hover() { await this.locator.hover(); }
    async focus() { await this.locator.focus(); }
    async blur() { await this.locator.blur(); }
    async scrollIntoView() { await this.locator.scrollIntoViewIfNeeded(); }
    async trigger(event, options) { await this.locator.dispatchEvent(event, options); }
    async selectFile(files) { await this.locator.setInputFiles(files); }
    async press(key) { await this.locator.press(key); }
    async pressKey(key) { await this.locator.press(key); }
    async fillAndEnter(value) { await this.locator.fill(value); await this.locator.press('Enter'); }
    async dragTo(target) {
        const targetLocator = typeof target === 'string' ? this.pageRef.locator(target) : target;
        await this.locator.dragTo(targetLocator);
    }
    async dragToAndDrop(target) { await this.dragTo(target); }
    async swipe(direction, distance = 500) {
        const box = await this.locator.boundingBox();
        if (!box)
            throw new Error('Element not found for swipe');
        const midX = box.x + box.width / 2;
        const midY = box.y + box.height / 2;
        let endX = midX, endY = midY;
        switch (direction) {
            case 'up':
                endY = midY - distance;
                break;
            case 'down':
                endY = midY + distance;
                break;
            case 'left':
                endX = midX - distance;
                break;
            case 'right':
                endX = midX + distance;
                break;
        }
        await this.pageRef.mouse.move(midX, midY);
        await this.pageRef.mouse.down();
        await this.pageRef.mouse.move(endX, endY, { steps: 10 });
        await this.pageRef.mouse.up();
    }
    async clickWithShift() { await this.locator.click({ modifiers: ['Shift'] }); }
    async clickWithControl() { await this.locator.click({ modifiers: ['Control'] }); }
    async clickWithMeta() { await this.locator.click({ modifiers: ['Meta'] }); }
    async selectAll() { await this.locator.focus(); await this.pageRef.keyboard.press('Control+A'); }
    async selectText(start, end) { await this.locator.focus(); await this.pageRef.keyboard.press('Control+A'); await this.pageRef.keyboard.press('ArrowLeft'); }
    async cut() { await this.selectAll(); await this.pageRef.keyboard.press('Control+X'); }
    async copy() { await this.selectAll(); await this.pageRef.keyboard.press('Control+C'); }
    async paste() { await this.pageRef.keyboard.press('Control+V'); }
    async rightClick() { await this.locator.click({ button: 'right' }); }
    async getAttribute(name) { return await this.locator.getAttribute(name); }
    async getText() { return await this.locator.textContent() || ''; }
    async getInnerHTML() { return await this.locator.innerHTML(); }
    async getValue() {
        try {
            return await this.locator.inputValue();
        }
        catch {
            return await this.locator.getAttribute('value') || '';
        }
    }
    async isVisible() { try {
        await this.locator.waitFor({ state: 'visible', timeout: 1000 });
        return true;
    }
    catch {
        return false;
    } }
    async isHidden() { return !(await this.isVisible()); }
    async isEnabled() { return await this.locator.isEnabled(); }
    async isDisabled() { return await this.locator.isDisabled(); }
    async isChecked() { return await this.locator.isChecked(); }
    async isFocused() { return false; }
    async count() { return await this.locator.count(); }
    async waitFor(options) { await this.locator.waitFor({ state: options?.state || 'visible', timeout: options?.timeout }); }
    async should(condition, timeout = 5000) {
        switch (condition) {
            case 'be.visible':
                await this.locator.waitFor({ state: 'visible', timeout });
                break;
            case 'be.hidden':
                await this.locator.waitFor({ state: 'hidden', timeout });
                break;
            case 'be.enabled':
                if (!(await this.locator.isEnabled()))
                    throw new Error('Element is not enabled');
                break;
            case 'be.disabled':
                if (!(await this.locator.isDisabled()))
                    throw new Error('Element is not disabled');
                break;
            case 'be.checked':
                if (!(await this.locator.isChecked()))
                    throw new Error('Element is not checked');
                break;
            case 'exist':
                if (await this.locator.count() === 0)
                    throw new Error('Element does not exist');
                break;
        }
    }
    async shouldHave(text) {
        const actual = await this.getText();
        if (typeof text === 'string') {
            if (actual !== text)
                throw new Error(`Expected "${text}", got "${actual}"`);
        }
        else {
            if (!text.test(actual))
                throw new Error(`Expected text to match ${text}, got "${actual}"`);
        }
    }
    async shouldContain(text) {
        const actual = await this.getText();
        if (!actual.includes(text))
            throw new Error(`Expected "${actual}" to contain "${text}"`);
    }
    async shouldHaveValue(value) {
        const actual = await this.getValue();
        if (typeof value === 'string') {
            if (actual !== value)
                throw new Error(`Expected value "${value}", got "${actual}"`);
        }
        else {
            if (!value.test(actual))
                throw new Error(`Expected value to match ${value}, got "${actual}"`);
        }
    }
    async shouldHaveAttribute(attr, value) {
        const actual = await this.getAttribute(attr);
        if (actual === null)
            throw new Error(`Element does not have attribute "${attr}"`);
        if (value) {
            if (typeof value === 'string') {
                if (actual !== value)
                    throw new Error(`Expected "${attr}" to be "${value}", got "${actual}"`);
            }
            else {
                if (!value.test(actual))
                    throw new Error(`Expected "${attr}" to match ${value}, got "${actual}"`);
            }
        }
    }
    async shouldHaveCount(count) {
        const actual = await this.count();
        if (actual !== count)
            throw new Error(`Expected ${count} elements, got ${actual}`);
    }
    debug() { console.log('🔍 Debug:', this.locator.toString()); return this; }
    then(fn) { return fn(this.locator); }
    first() { return new HopLocator(this.pageRef, this.locator.first()); }
    last() { return new HopLocator(this.pageRef, this.locator.last()); }
    nth(index) { return new HopLocator(this.pageRef, this.locator.nth(index)); }
    async evaluate(fn) { return await this.locator.evaluate(fn); }
}
class HopAPI {
    browser = null;
    currentPage = null;
    config;
    constructor(config = {}) {
        this.config = config;
    }
    get browserManager() {
        if (!this.browser)
            this.browser = new HopBrowser(this.config);
        return this.browser;
    }
    async launch() {
        await this.browserManager.launch();
        this.currentPage = this.browserManager.getPage();
    }
    async close() {
        await this.browserManager.close();
        this.currentPage = null;
    }
    async newPage() {
        if (!this.browserManager.isLaunched())
            await this.launch();
        const page = await this.browserManager.newPage();
        if (page)
            this.currentPage = page;
        return page;
    }
    getPage() { return this.currentPage || this.browserManager.getPage(); }
    get(selector) { return new HopLocator(this.getPage(), selector); }
    getByRole(role, options) {
        const page = this.getPage();
        if (!page)
            throw new Error('Page not initialized');
        return new HopLocator(page, page.getByRole(role, options));
    }
    getByLabel(text, options) { const page = this.getPage(); if (!page)
        throw new Error('Page not initialized'); return new HopLocator(page, page.getByLabel(text, options)); }
    getByPlaceholder(text, options) { const page = this.getPage(); if (!page)
        throw new Error('Page not initialized'); return new HopLocator(page, page.getByPlaceholder(text, options)); }
    getByText(text, options) { const page = this.getPage(); if (!page)
        throw new Error('Page not initialized'); return new HopLocator(page, page.getByText(text, options)); }
    getByTestId(testId) { const page = this.getPage(); if (!page)
        throw new Error('Page not initialized'); return new HopLocator(page, page.getByTestId(testId)); }
    getByAltText(text, options) { const page = this.getPage(); if (!page)
        throw new Error('Page not initialized'); return new HopLocator(page, page.getByAltText(text, options)); }
    getByTitle(text, options) { const page = this.getPage(); if (!page)
        throw new Error('Page not initialized'); return new HopLocator(page, page.getByTitle(text, options)); }
    $(selector) { const page = this.getPage(); if (!page)
        throw new Error('Page not initialized'); return new HopLocator(page, page.locator(selector).first()); }
    $$(selector) { const page = this.getPage(); if (!page)
        throw new Error('Page not initialized'); return [new HopLocator(page, page.locator(selector))]; }
    async $eval(selector, fn) { const page = this.getPage(); if (!page)
        throw new Error('Page not initialized'); return await page.$eval(selector, fn); }
    async $$eval(selector, fn) { const page = this.getPage(); if (!page)
        throw new Error('Page not initialized'); return await page.$$eval(selector, fn); }
    first(selector) { const page = this.getPage(); if (!page)
        throw new Error('Page not initialized'); return new HopLocator(page, page.locator(selector).first()); }
    last(selector) { const page = this.getPage(); if (!page)
        throw new Error('Page not initialized'); return new HopLocator(page, page.locator(selector).last()); }
    nth(selector, index) { const page = this.getPage(); if (!page)
        throw new Error('Page not initialized'); return new HopLocator(page, page.locator(selector).nth(index)); }
    filter(selector, hasText) { const page = this.getPage(); if (!page)
        throw new Error('Page not initialized'); return new HopLocator(page, page.locator(selector).filter({ hasText })); }
    async tap(selector) { const page = this.getPage(); if (!page)
        throw new Error('Page not initialized'); await page.tap(selector); }
    async pdf(options) { const page = this.getPage(); if (!page)
        throw new Error('Page not initialized'); return await page.pdf(options); }
    async visit(url) { const page = this.getPage(); if (!page)
        throw new Error('Page not initialized'); await page.goto(url); }
    async reload() { const page = this.getPage(); if (!page)
        throw new Error('Page not initialized'); await page.reload(); }
    async goBack() { const page = this.getPage(); if (!page)
        throw new Error('Page not initialized'); await page.goBack(); }
    async goForward() { const page = this.getPage(); if (!page)
        throw new Error('Page not initialized'); await page.goForward(); }
    async wait(ms) { await new Promise(resolve => setTimeout(resolve, ms)); }
    async waitForSelector(selector, options) {
        const page = this.getPage();
        if (!page)
            throw new Error('Page not initialized');
        await page.waitForSelector(selector, { state: options?.state || 'visible', timeout: options?.timeout });
        return this.get(selector);
    }
    async waitForLoadState(state) {
        const page = this.getPage();
        if (!page)
            throw new Error('Page not initialized');
        await page.waitForLoadState(state);
    }
    async waitForURL(url, options) {
        const page = this.getPage();
        if (!page)
            throw new Error('Page not initialized');
        await page.waitForURL(url, { timeout: options?.timeout });
    }
    title() { const page = this.getPage(); if (!page)
        throw new Error('Page not initialized'); return page.title(); }
    url() { const page = this.getPage(); if (!page)
        throw new Error('Page not initialized'); return page.url(); }
    async evaluate(fn) {
        const page = this.getPage();
        if (!page)
            throw new Error('Page not initialized');
        return await page.evaluate(fn);
    }
    async screenshot(options) {
        const page = this.getPage();
        if (!page)
            throw new Error('Page not initialized');
        return await page.screenshot(options);
    }
    async setViewportSize(width, height) {
        const page = this.getPage();
        if (!page)
            throw new Error('Page not initialized');
        await page.setViewportSize({ width, height });
    }
    async viewportSize() {
        const page = this.getPage();
        if (!page)
            throw new Error('Page not initialized');
        return await page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }));
    }
    async press(key, options) {
        const page = this.getPage();
        if (!page)
            throw new Error('Page not initialized');
        await page.keyboard.press(key, options);
    }
    async addStyleTag(content) {
        const page = this.getPage();
        if (!page)
            throw new Error('Page not initialized');
        await page.addStyleTag({ content });
    }
    async addScriptTag(content) {
        const page = this.getPage();
        if (!page)
            throw new Error('Page not initialized');
        await page.addScriptTag({ content });
    }
    async setCookie(name, value, options) {
        const context = this.browserManager.getContext();
        if (!context)
            throw new Error('Browser context not initialized');
        await context.addCookies([{ name, value, ...options }]);
    }
    async getCookie(name) {
        const context = this.browserManager.getContext();
        if (!context)
            throw new Error('Browser context not initialized');
        const cookies = await context.cookies();
        if (name)
            return cookies.find(c => c.name === name);
        return cookies;
    }
    async clearCookies() {
        const context = this.browserManager.getContext();
        if (!context)
            throw new Error('Browser context not initialized');
        await context.clearCookies();
    }
    async setLocalStorage(key, value) {
        const page = this.getPage();
        if (!page)
            throw new Error('Page not initialized');
        await page.evaluate(([k, v]) => localStorage.setItem(k, v), [key, value]);
    }
    async getLocalStorage(key) {
        const page = this.getPage();
        if (!page)
            throw new Error('Page not initialized');
        if (key)
            return await page.evaluate(k => localStorage.getItem(k), key);
        return await page.evaluate(() => { const r = {}; for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k)
                r[k] = localStorage.getItem(k);
        } return r; });
    }
    async clearLocalStorage() {
        const page = this.getPage();
        if (!page)
            throw new Error('Page not initialized');
        await page.evaluate(() => localStorage.clear());
    }
    async intercept(url, response) {
        const page = this.getPage();
        if (!page)
            throw new Error('Page not initialized');
        await page.route(url, route => { route.fulfill({ status: response.status || 200, body: response.body || '', headers: response.headers || { 'content-type': 'application/json' } }); });
    }
    async abortRequest(pattern, errorCode) {
        const page = this.getPage();
        if (!page)
            throw new Error('Page not initialized');
        await page.route(pattern, route => route.abort(errorCode || 'failed'));
    }
    async waitForRequest(url, timeout) {
        const page = this.getPage();
        if (!page)
            throw new Error('Page not initialized');
        return await page.waitForRequest(url, { timeout });
    }
    async waitForResponse(url, timeout) {
        const page = this.getPage();
        if (!page)
            throw new Error('Page not initialized');
        return await page.waitForResponse(url, { timeout });
    }
    get visualRegression() { return createVisualRegression(); }
    getTraceViewer(testId) { return createTraceViewer(testId, this.config.browser, this.config.viewport); }
    get iframe() { const page = this.getPage(); return page ? createIframeHandler(page) : null; }
    get file() { const page = this.getPage(); return page ? createFileHandler(page) : null; }
    get serviceWorker() { const page = this.getPage(); return page ? createServiceWorkerHandler(page) : null; }
    static get DevicePresets() { return DevicePresets; }
}
function createHop(config) {
    if (config?.autoAwait)
        setConfig({ autoAwait: true });
    return new HopAPI(config);
}
export const hop = globalConfig.autoAwait ? createHopAutoAwait() : new HopAPI({});
export { createHop };
export default hop;
