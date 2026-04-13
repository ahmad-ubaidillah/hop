export class WebFirstAssertions {
    manager;
    defaultTimeout = 5000;
    defaultRetryInterval = 100;
    constructor(manager) {
        this.manager = manager;
    }
    getPage() {
        const page = this.manager.getPage();
        if (!page)
            throw new Error('Browser not launched. Call launch() first.');
        return page;
    }
    async retry(fn, options) {
        const timeout = options.timeout || this.defaultTimeout;
        const interval = options.retryInterval || this.defaultRetryInterval;
        const startTime = Date.now();
        let lastError = null;
        while (Date.now() - startTime < timeout) {
            try {
                return await fn();
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                if (Date.now() - startTime + interval < timeout) {
                    await this.sleep(interval);
                }
            }
        }
        throw lastError || new Error('Assertion timeout');
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async toBeVisible(selector, options = {}) {
        const page = this.getPage();
        return await this.retry(async () => {
            const isVisible = await page.isVisible(selector);
            if (!isVisible) {
                throw new Error(`Element '${selector}' is not visible`);
            }
            return true;
        }, options);
    }
    async toBeHidden(selector, options = {}) {
        const page = this.getPage();
        return await this.retry(async () => {
            const isHidden = await page.isHidden(selector);
            if (!isHidden) {
                throw new Error(`Element '${selector}' is visible`);
            }
            return true;
        }, options);
    }
    async toBeAttached(selector, options = {}) {
        const page = this.getPage();
        return await this.retry(async () => {
            const element = await page.$(selector);
            if (!element) {
                throw new Error(`Element '${selector}' is not attached`);
            }
            return true;
        }, options);
    }
    async toHaveText(selector, expected, options = {}) {
        const page = this.getPage();
        const ignoreCase = options.ignoreCase || false;
        return await this.retry(async () => {
            const element = await page.$(selector);
            if (!element) {
                throw new Error(`Element '${selector}' not found`);
            }
            const actualText = (await element.textContent())?.trim() || '';
            const expectedText = typeof expected === 'string' ? expected : expected.source;
            const match = ignoreCase
                ? actualText.toLowerCase() === expectedText.toLowerCase()
                : typeof expected === 'string'
                    ? actualText === expected
                    : expected.test(actualText);
            if (!match) {
                throw new Error(`Expected text '${expectedText}', but got '${actualText}'`);
            }
            return true;
        }, options);
    }
    async toContainText(selector, text, options = {}) {
        const page = this.getPage();
        const ignoreCase = options.ignoreCase || false;
        return await this.retry(async () => {
            const element = await page.$(selector);
            if (!element) {
                throw new Error(`Element '${selector}' not found`);
            }
            const actualText = (await element.textContent())?.trim() || '';
            const contains = ignoreCase
                ? actualText.toLowerCase().includes(text.toLowerCase())
                : actualText.includes(text);
            if (!contains) {
                throw new Error(`Element '${selector}' does not contain text '${text}' (actual: '${actualText}')`);
            }
            return true;
        }, options);
    }
    async toHaveValue(selector, value, options = {}) {
        const page = this.getPage();
        return await this.retry(async () => {
            const element = await page.$(selector);
            if (!element) {
                throw new Error(`Element '${selector}' not found`);
            }
            const actualValue = await element.inputValue();
            const match = typeof value === 'string'
                ? actualValue === value
                : value.test(actualValue);
            if (!match) {
                throw new Error(`Expected value '${value}', but got '${actualValue}'`);
            }
            return true;
        }, options);
    }
    async toHaveTitle(expected, options = {}) {
        const page = this.getPage();
        return await this.retry(async () => {
            const actualTitle = await page.title();
            const match = typeof expected === 'string'
                ? actualTitle === expected
                : expected.test(actualTitle);
            if (!match) {
                throw new Error(`Expected title '${expected}', but got '${actualTitle}'`);
            }
            return true;
        }, options);
    }
    async toHaveURL(url, options = {}) {
        const page = this.getPage();
        return await this.retry(async () => {
            const actualUrl = page.url();
            const match = typeof url === 'string'
                ? actualUrl === url
                : url.test(actualUrl);
            if (!match) {
                throw new Error(`Expected URL '${url}', but got '${actualUrl}'`);
            }
            return true;
        }, options);
    }
    async toHaveCount(selector, count, options = {}) {
        const page = this.getPage();
        return await this.retry(async () => {
            const elements = await page.$$(selector);
            if (elements.length !== count) {
                throw new Error(`Expected ${count} elements, but found ${elements.length}`);
            }
            return true;
        }, options);
    }
    async toBeEnabled(selector, options = {}) {
        const page = this.getPage();
        return await this.retry(async () => {
            const element = await page.$(selector);
            if (!element) {
                throw new Error(`Element '${selector}' not found`);
            }
            const isEnabled = await element.isEnabled();
            if (!isEnabled) {
                throw new Error(`Element '${selector}' is disabled`);
            }
            return true;
        }, options);
    }
    async toBeDisabled(selector, options = {}) {
        const page = this.getPage();
        return await this.retry(async () => {
            const element = await page.$(selector);
            if (!element) {
                throw new Error(`Element '${selector}' not found`);
            }
            const isDisabled = await element.isDisabled();
            if (!isDisabled) {
                throw new Error(`Element '${selector}' is enabled`);
            }
            return true;
        }, options);
    }
    async toBeChecked(selector, options = {}) {
        const page = this.getPage();
        return await this.retry(async () => {
            const element = await page.$(selector);
            if (!element) {
                throw new Error(`Element '${selector}' not found`);
            }
            const isChecked = await element.isChecked();
            if (!isChecked) {
                throw new Error(`Element '${selector}' is not checked`);
            }
            return true;
        }, options);
    }
    async toHaveAttribute(selector, attr, value, options = {}) {
        const page = this.getPage();
        return await this.retry(async () => {
            const element = await page.$(selector);
            if (!element) {
                throw new Error(`Element '${selector}' not found`);
            }
            const attrValue = await element.getAttribute(attr);
            if (attrValue === null) {
                throw new Error(`Element '${selector}' does not have attribute '${attr}'`);
            }
            if (value !== undefined) {
                const match = typeof value === 'string'
                    ? attrValue === value
                    : value.test(attrValue);
                if (!match) {
                    throw new Error(`Expected attribute '${attr}' to be '${value}', but got '${attrValue}'`);
                }
            }
            return true;
        }, options);
    }
    async toHaveClass(selector, className, options = {}) {
        const page = this.getPage();
        return await this.retry(async () => {
            const element = await page.$(selector);
            if (!element) {
                throw new Error(`Element '${selector}' not found`);
            }
            const classAttr = await element.getAttribute('class');
            const classes = classAttr?.split(' ') || [];
            const hasClass = typeof className === 'string'
                ? classes.includes(className)
                : classes.some(c => className.test(c));
            if (!hasClass) {
                throw new Error(`Element '${selector}' does not have class '${className}'`);
            }
            return true;
        }, options);
    }
    async toHaveCSS(selector, property, value, options = {}) {
        const page = this.getPage();
        return await this.retry(async () => {
            const element = await page.$(selector);
            if (!element) {
                throw new Error(`Element '${selector}' not found`);
            }
            const cssValue = await element.evaluate((el, prop) => {
                return window.getComputedStyle(el).getPropertyValue(prop);
            }, property);
            const match = typeof value === 'string'
                ? cssValue === value
                : value.test(cssValue);
            if (!match) {
                throw new Error(`Expected CSS property '${property}' to be '${value}', but got '${cssValue}'`);
            }
            return true;
        }, options);
    }
    async toBeFocused(selector, options = {}) {
        const page = this.getPage();
        return await this.retry(async () => {
            const element = await page.$(selector);
            if (!element) {
                throw new Error(`Element '${selector}' not found`);
            }
            const isFocused = await element.isFocused();
            if (!isFocused) {
                throw new Error(`Element '${selector}' is not focused`);
            }
            return true;
        }, options);
    }
    async not() {
        return new WebFirstAssertionsNegation(this);
    }
}
export class WebFirstAssertionsNegation {
    assertions;
    constructor(assertions) {
        this.assertions = assertions;
    }
    async toBeVisible(selector, options = {}) {
        return await this.assertions.toBeHidden(selector, options);
    }
    async toBeHidden(selector, options = {}) {
        return await this.assertions.toBeVisible(selector, options);
    }
    async toHaveText(selector, text, options = {}) {
        return !(await this.assertions.toContainText(selector, text, { ...options, timeout: 1000 }));
    }
    async toHaveTitle(title, options = {}) {
        return !(await this.assertions.toHaveTitle(title, { ...options, timeout: 1000 }));
    }
    async toHaveURL(url, options = {}) {
        return !(await this.assertions.toHaveURL(url, { ...options, timeout: 1000 }));
    }
    async toBeEnabled(selector, options = {}) {
        return await this.assertions.toBeDisabled(selector, options);
    }
    async toBeDisabled(selector, options = {}) {
        return await this.assertions.toBeEnabled(selector, options);
    }
    async toBeChecked(selector, options = {}) {
        return !(await this.assertions.toBeChecked(selector, { ...options, timeout: 1000 }));
    }
}
export function createWebFirstAssertions(manager) {
    return new WebFirstAssertions(manager);
}
