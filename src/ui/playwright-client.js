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
    manager;
    interactions;
    assertions;
    webFirst;
    constructor(options = {}) {
        const timeout = typeof options.timeout === 'string' ? parseInt(options.timeout, 10) : (options.timeout || 30000);
        this.manager = new BrowserManager({ headless: true, browser: 'chromium', viewport: { width: 1280, height: 720 }, ...options, timeout });
        this.interactions = new BrowserInteractions(this.manager);
        this.assertions = new BrowserAssertions(this.manager);
        this.webFirst = createWebFirstAssertions(this.manager);
    }
    async launch() { await this.manager.launch(); }
    async close() {
        const videoPath = await this.manager.getVideoPath();
        await this.manager.close();
    }
    addRequestInterceptor(h) { this.manager.addRequestInterceptor(h); }
    addResponseInterceptor(h) { this.manager.addResponseInterceptor(h); }
    getPage() { return this.manager.getPage(); }
    getContext() { return this.manager.getContext(); }
    isSaveVideoOnFailure() { return this.manager.isSaveVideoOnFailure(); }
    async getVideoPath() { return this.manager.getRecordedVideoPath(); }
    // -- Interactions Facade --
    async mockResponse(url, res, status = 200) { await this.interactions.mockResponse(url, res, status); }
    async abortRequests(url) { await this.interactions.abortRequests(url); }
    async navigate(url) { await this.interactions.navigate(url); }
    async click(selector) { await this.interactions.click(selector); }
    async type(selector, text, clear = false) { await this.interactions.type(selector, text, clear); }
    async fill(selector, text) { await this.interactions.fill(selector, text); }
    async refresh() { await this.interactions.refresh(); }
    async evaluate(fn) { return await this.interactions.evaluate(fn); }
    async setCookie(n, v, d) { await this.interactions.setCookie(n, v, d); }
    async skipModal() { await this.interactions.refresh(); }
    async screenshot(opts) { return await this.interactions.screenshot(opts); }
    // -- Assertions Facade --
    async waitForResponse(url, t) { return await this.assertions.waitForResponse(url, t); }
    async waitForUrl(url, t) { await this.assertions.waitForUrl(url, t); }
    async isVisible(selector) { return await this.assertions.isVisible(selector); }
    async getText(selector) { return await this.assertions.getText(selector); }
    async containsText(selector, text) { return await this.assertions.containsText(selector, text); }
    async getCookies() { return await this.assertions.getCookies(); }
    async getUrl() { return await this.assertions.getUrl(); }
    async getTitle() { return await this.assertions.getTitle(); }
    // -- Web-First Assertions (Playwright-style) --
    expect(selector) { return this.webFirst; }
    async expectVisible(selector, options) { return await this.webFirst.toBeVisible(selector, options); }
    async expectHidden(selector, options) { return await this.webFirst.toBeHidden(selector, options); }
    async expectText(selector, text, options) { return await this.webFirst.toHaveText(selector, text, options); }
    async expectContainsText(selector, text, options) { return await this.webFirst.toContainText(selector, text, options); }
    async expectValue(selector, value, options) { return await this.webFirst.toHaveValue(selector, value, options); }
    async expectTitle(title, options) { return await this.webFirst.toHaveTitle(title, options); }
    async expectURL(url, options) { return await this.webFirst.toHaveURL(url, options); }
    async expectCount(selector, count, options) { return await this.webFirst.toHaveCount(selector, count, options); }
    async expectEnabled(selector, options) { return await this.webFirst.toBeEnabled(selector, options); }
    async expectDisabled(selector, options) { return await this.webFirst.toBeDisabled(selector, options); }
    async expectChecked(selector, options) { return await this.webFirst.toBeChecked(selector, options); }
    async expectAttribute(selector, attr, value, options) { return await this.webFirst.toHaveAttribute(selector, attr, value, options); }
    async expectClass(selector, className, options) { return await this.webFirst.toHaveClass(selector, className, options); }
    async expectCSS(selector, property, value, options) { return await this.webFirst.toHaveCSS(selector, property, value, options); }
    // -- Semantic Locators --
    getByRole(role, options) { const page = this.manager.getPage(); return page ? createSemanticLocators(page).getByRole(role, options) : null; }
    getByLabel(text, options) { const page = this.manager.getPage(); return page ? createSemanticLocators(page).getByLabel(text, options) : null; }
    getByPlaceholder(text, options) { const page = this.manager.getPage(); return page ? createSemanticLocators(page).getByPlaceholder(text, options) : null; }
    getByText(text, options) { const page = this.manager.getPage(); return page ? createSemanticLocators(page).getByText(text, options) : null; }
    getByTestId(testId) { const page = this.manager.getPage(); return page ? createSemanticLocators(page).getByTestId(testId) : null; }
    getByAltText(text, options) { const page = this.manager.getPage(); return page ? createSemanticLocators(page).getByAltText(text, options) : null; }
    getByTitle(text, options) { const page = this.manager.getPage(); return page ? createSemanticLocators(page).getByTitle(text, options) : null; }
    // -- Visual Regression --
    getVisualRegression(options) { return createVisualRegression(options); }
    async compareScreenshot(actual, baseline, diffPath) { return createVisualRegression().compareScreenshots(actual, baseline, diffPath); }
    // -- Trace Viewer --
    getTraceViewer(testId) { return createTraceViewer(testId, this.options.browser, this.options.viewport); }
    // -- Iframe & File Handling --
    getIframeHandler() { const page = this.manager.getPage(); return page ? createIframeHandler(page) : null; }
    getFileHandler() { const page = this.manager.getPage(); return page ? createFileHandler(page) : null; }
    // -- Service Worker --
    getServiceWorkerHandler() { const page = this.manager.getPage(); return page ? createServiceWorkerHandler(page) : null; }
    // -- Codegen --
    startCodegen(options) { return createCodegen(options); }
    // -- UI Mode --
    static startUIMode(options) { return createUIMode(options); }
    // -- Device Presets --
    static getDevicePresets() { return DevicePresets; }
}
