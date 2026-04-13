export class AutoWaitManager {
    options;
    defaultTimeout = 30000;
    defaultRetries = 2;
    constructor(options = {}) {
        this.options = {
            enabled: true,
            timeout: 30000,
            retries: 2,
            retryDelay: 500,
            waitForVisible: true,
            waitForStable: true,
            ...options,
        };
    }
    async waitForElement(page, selector, condition = 'visible', options = {}) {
        if (!page || !this.options.enabled)
            return;
        const timeout = options.timeout || this.options.timeout || this.defaultTimeout;
        const state = this.mapCondition(condition);
        try {
            await page.waitForSelector(selector, { state, timeout });
        }
        catch (error) {
            const retries = options.retries || this.options.retries || this.defaultRetries;
            await this.retryWait(page, selector, condition, retries);
        }
    }
    async retryWait(page, selector, condition, retries) {
        for (let i = 0; i < retries; i++) {
            try {
                const state = this.mapCondition(condition);
                await page.waitForSelector(selector, { state, timeout: 5000 });
                return;
            }
            catch {
                if (i < retries - 1) {
                    await new Promise((resolve) => setTimeout(resolve, this.options.retryDelay || 500));
                }
            }
        }
        throw new Error(`Element '${selector}' did not meet condition '${condition}' after ${retries} retries`);
    }
    async waitForStable(page, selector) {
        if (!page || !this.options.waitForStable)
            return;
        await page.waitForFunction((sel) => {
            const el = document.querySelector(sel);
            if (!el)
                return false;
            const box = el.getBoundingClientRect();
            return box.width > 0 && box.height > 0;
        }, selector, { timeout: this.options.timeout || this.defaultTimeout });
    }
    async waitForNetworkIdle(page, idleTime = 1000) {
        if (!page)
            return;
        await page.waitForLoadState('networkidle', { timeout: this.options.timeout || this.defaultTimeout });
    }
    async waitForResponse(page, urlPattern, timeout) {
        if (!page)
            throw new Error('Page not available');
        return await page.waitForResponse(urlPattern, { timeout: timeout || this.options.timeout || this.defaultTimeout });
    }
    async waitForNavigation(page, options = {}) {
        if (!page)
            throw new Error('Page not available');
        await page.waitForLoadState(options.waitUntil || 'networkidle', { timeout: options.timeout || this.options.timeout || this.defaultTimeout });
    }
    mapCondition(condition) {
        switch (condition) {
            case 'visible':
                return 'visible';
            case 'hidden':
                return 'hidden';
            case 'attached':
                return 'attached';
            case 'detached':
                return 'detached';
            case 'stable':
            case 'ready':
                return 'attached';
            default:
                return 'visible';
        }
    }
    setEnabled(enabled) {
        this.options.enabled = enabled;
    }
    isEnabled() {
        return this.options.enabled ?? true;
    }
    getOptions() {
        return { ...this.options };
    }
}
export function createAutoWaitManager(options) {
    return new AutoWaitManager(options);
}
export async function autoWait(page, action, selector, options = {}) {
    const autoWait = createAutoWaitManager(options.autoWait);
    if (!page)
        throw new Error('Page not available');
    await autoWait.waitForElement(page, selector, 'visible');
    switch (action) {
        case 'click':
            await page.click(selector);
            break;
        case 'type':
            await page.fill(selector, options.value || '');
            break;
        case 'hover':
            await page.hover(selector);
            break;
        case 'select':
            if (options.value) {
                await page.selectOption(selector, { label: options.value });
            }
            break;
        case 'check':
            await page.check(selector);
            break;
        case 'fill':
            await page.fill(selector, options.value || '');
            break;
    }
    await autoWait.waitForNetworkIdle(page);
}
