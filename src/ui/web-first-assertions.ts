import type { BrowserManager } from './browser-manager.js';

export type AssertionType = 
  | 'toBeVisible' | 'toBeHidden' | 'toBeAttached'
  | 'toHaveText' | 'toContainText' | 'toHaveValue'
  | 'toHaveTitle' | 'toHaveURL' | 'toHaveCount'
  | 'toBeEnabled' | 'toBeDisabled' | 'toBeChecked'
  | 'toHaveAttribute' | 'toHaveClass' | 'toHaveCSS';

export interface AssertionOptions {
  timeout?: number;
  retryInterval?: number;
  message?: string;
  ignoreCase?: boolean;
}

export interface AssertionResult {
  passed: boolean;
  actual?: any;
  expected?: any;
  message?: string;
}

export class WebFirstAssertions {
  private manager: BrowserManager;
  private defaultTimeout = 5000;
  private defaultRetryInterval = 100;

  constructor(manager: BrowserManager) {
    this.manager = manager;
  }

  private getPage() {
    const page = this.manager.getPage();
    if (!page) throw new Error('Browser not launched. Call launch() first.');
    return page;
  }

  private async retry<T>(
    fn: () => Promise<T>,
    options: AssertionOptions
  ): Promise<T> {
    const timeout = options.timeout || this.defaultTimeout;
    const interval = options.retryInterval || this.defaultRetryInterval;
    const startTime = Date.now();
    let lastError: Error | null = null;

    while (Date.now() - startTime < timeout) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (Date.now() - startTime + interval < timeout) {
          await this.sleep(interval);
        }
      }
    }

    throw lastError || new Error('Assertion timeout');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async toBeVisible(selector: string, options: AssertionOptions = {}): Promise<boolean> {
    const page = this.getPage();
    
    return await this.retry(async () => {
      const isVisible = await page.isVisible(selector);
      if (!isVisible) {
        throw new Error(`Element '${selector}' is not visible`);
      }
      return true;
    }, options);
  }

  async toBeHidden(selector: string, options: AssertionOptions = {}): Promise<boolean> {
    const page = this.getPage();
    
    return await this.retry(async () => {
      const isHidden = await page.isHidden(selector);
      if (!isHidden) {
        throw new Error(`Element '${selector}' is visible`);
      }
      return true;
    }, options);
  }

  async toBeAttached(selector: string, options: AssertionOptions = {}): Promise<boolean> {
    const page = this.getPage();
    
    return await this.retry(async () => {
      const element = await page.$(selector);
      if (!element) {
        throw new Error(`Element '${selector}' is not attached`);
      }
      return true;
    }, options);
  }

  async toHaveText(selector: string, expected: string | RegExp, options: AssertionOptions = {}): Promise<boolean> {
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

  async toContainText(selector: string, text: string, options: AssertionOptions = {}): Promise<boolean> {
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

  async toHaveValue(selector: string, value: string | RegExp, options: AssertionOptions = {}): Promise<boolean> {
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

  async toHaveTitle(expected: string | RegExp, options: AssertionOptions = {}): Promise<boolean> {
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

  async toHaveURL(url: string | RegExp, options: AssertionOptions = {}): Promise<boolean> {
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

  async toHaveCount(selector: string, count: number, options: AssertionOptions = {}): Promise<boolean> {
    const page = this.getPage();
    
    return await this.retry(async () => {
      const elements = await page.$$(selector);
      if (elements.length !== count) {
        throw new Error(`Expected ${count} elements, but found ${elements.length}`);
      }
      return true;
    }, options);
  }

  async toBeEnabled(selector: string, options: AssertionOptions = {}): Promise<boolean> {
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

  async toBeDisabled(selector: string, options: AssertionOptions = {}): Promise<boolean> {
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

  async toBeChecked(selector: string, options: AssertionOptions = {}): Promise<boolean> {
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

  async toHaveAttribute(selector: string, attr: string, value?: string | RegExp, options: AssertionOptions = {}): Promise<boolean> {
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

  async toHaveClass(selector: string, className: string | RegExp, options: AssertionOptions = {}): Promise<boolean> {
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

  async toHaveCSS(selector: string, property: string, value: string | RegExp, options: AssertionOptions = {}): Promise<boolean> {
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

  async toBeFocused(selector: string, options: AssertionOptions = {}): Promise<boolean> {
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
  constructor(private assertions: WebFirstAssertions) {}

  async toBeVisible(selector: string, options: AssertionOptions = {}): Promise<boolean> {
    return await this.assertions.toBeHidden(selector, options);
  }

  async toBeHidden(selector: string, options: AssertionOptions = {}): Promise<boolean> {
    return await this.assertions.toBeVisible(selector, options);
  }

  async toHaveText(selector: string, text: string, options: AssertionOptions = {}): Promise<boolean> {
    return !(await this.assertions.toContainText(selector, text, { ...options, timeout: 1000 }));
  }

  async toHaveTitle(title: string, options: AssertionOptions = {}): Promise<boolean> {
    return !(await this.assertions.toHaveTitle(title, { ...options, timeout: 1000 }));
  }

  async toHaveURL(url: string, options: AssertionOptions = {}): Promise<boolean> {
    return !(await this.assertions.toHaveURL(url, { ...options, timeout: 1000 }));
  }

  async toBeEnabled(selector: string, options: AssertionOptions = {}): Promise<boolean> {
    return await this.assertions.toBeDisabled(selector, options);
  }

  async toBeDisabled(selector: string, options: AssertionOptions = {}): Promise<boolean> {
    return await this.assertions.toBeEnabled(selector, options);
  }

  async toBeChecked(selector: string, options: AssertionOptions = {}): Promise<boolean> {
    return !(await this.assertions.toBeChecked(selector, { ...options, timeout: 1000 }));
  }
}

export function createWebFirstAssertions(manager: BrowserManager): WebFirstAssertions {
  return new WebFirstAssertions(manager);
}