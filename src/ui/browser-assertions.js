export class BrowserAssertions {
    manager;
    constructor(manager) {
        this.manager = manager;
    }
    async isVisible(selector) {
        const page = this.manager.getPage();
        if (!page)
            throw new Error('Browser not launched. Call launch() first.');
        return await page.isVisible(selector);
    }
    async getText(selector) {
        const page = this.manager.getPage();
        if (!page)
            throw new Error('Browser not launched. Call launch() first.');
        return await page.textContent(selector) || '';
    }
    async containsText(selector, text) {
        const page = this.manager.getPage();
        if (!page)
            throw new Error('Browser not launched. Call launch() first.');
        const element = await page.$(selector);
        if (!element)
            return false;
        const elementText = await element.textContent();
        return elementText?.includes(text) || false;
    }
    async waitForSelector(selector, timeout) {
        const page = this.manager.getPage();
        if (!page)
            throw new Error('Browser not launched. Call launch() first.');
        await page.waitForSelector(selector, { timeout });
    }
    async waitForElementVisible(selector, timeout) {
        const page = this.manager.getPage();
        if (!page)
            throw new Error('Browser not launched. Call launch() first.');
        await page.waitForSelector(selector, { state: 'visible', timeout });
    }
    async waitForElementHidden(selector, timeout) {
        const page = this.manager.getPage();
        if (!page)
            throw new Error('Browser not launched. Call launch() first.');
        await page.waitForSelector(selector, { state: 'hidden', timeout });
    }
    async waitForElementDetached(selector, timeout) {
        const page = this.manager.getPage();
        if (!page)
            throw new Error('Browser not launched. Call launch() first.');
        await page.waitForSelector(selector, { state: 'detached', timeout });
    }
    async waitForNavigation(timeout) {
        const page = this.manager.getPage();
        if (!page)
            throw new Error('Browser not launched. Call launch() first.');
        await page.waitForLoadState('networkidle', { timeout });
    }
    async waitForUrl(urlPattern, timeout) {
        const page = this.manager.getPage();
        if (!page)
            throw new Error('Browser not launched. Call launch() first.');
        await page.waitForURL(urlPattern, { timeout });
    }
    async waitForResponse(urlPattern, timeout) {
        const page = this.manager.getPage();
        if (!page)
            throw new Error('Browser not launched. Call launch() first.');
        return await page.waitForResponse(response => response.url().match(urlPattern) !== null, { timeout });
    }
    async waitForRequest(urlPattern, timeout) {
        const page = this.manager.getPage();
        if (!page)
            throw new Error('Browser not launched. Call launch() first.');
        return await page.waitForRequest(request => request.url().match(urlPattern) !== null, { timeout });
    }
    async getUrl() {
        const page = this.manager.getPage();
        if (!page)
            throw new Error('Browser not launched. Call launch() first.');
        return page.url();
    }
    async getTitle() {
        const page = this.manager.getPage();
        if (!page)
            throw new Error('Browser not launched. Call launch() first.');
        return await page.title();
    }
    async getCookies() {
        const context = this.manager.getContext();
        if (!context)
            throw new Error('Browser context not created. Call launch() first.');
        const cookies = await context.cookies();
        const result = {};
        for (const cookie of cookies) {
            result[cookie.name] = cookie.value;
        }
        return result;
    }
}
