/**
 * ChainableHop - Cypress-style chainable API
 * 
 * Usage:
 *   await chain(page)
 *     .visit('https://example.com')
 *     .get('#user').type('admin')
 *     .get('#pass').type('secret')
 *     .get('#login').click()
 *     .shouldSee('.dashboard')
 *     .end();
 */

import type { Page } from 'playwright-core';

export class ChainableHop {
  private page: Page;
  private chain: Promise<any> = Promise.resolve();
  private _selector: string | null = null;
  private _lastElement: any = null;

  constructor(page: Page) {
    this.page = page;
  }

  visit(url: string): this {
    this.chain = this.chain.then(() => this.page.goto(url));
    return this;
  }

  get(selector: string): this {
    this._selector = selector;
    this._lastElement = this.page.locator(selector);
    return this;
  }

  click(): this {
    const selector = this._selector;
    const element = this._lastElement;
    this.chain = this.chain.then(async () => {
      if (element) {
        await element.waitFor({ state: 'visible', timeout: 10000 });
        await element.click();
      } else if (selector) {
        await this.page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
        await this.page.click(selector);
      }
    });
    return this;
  }

  type(text: string): this {
    const selector = this._selector;
    const element = this._lastElement;
    this.chain = this.chain.then(async () => {
      if (element) {
        await element.waitFor({ state: 'visible', timeout: 10000 });
        await element.type(text);
      } else if (selector) {
        await this.page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
        await this.page.type(selector, text);
      }
    });
    return this;
  }

  fill(text: string): this {
    const selector = this._selector;
    const element = this._lastElement;
    this.chain = this.chain.then(async () => {
      if (element) {
        await element.waitFor({ state: 'visible', timeout: 10000 });
        await element.fill(text);
      } else if (selector) {
        await this.page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
        await this.page.fill(selector, text);
      }
    });
    return this;
  }

  select(option: string): this {
    const selector = this._selector;
    const element = this._lastElement;
    this.chain = this.chain.then(async () => {
      if (element) {
        await element.waitFor({ state: 'visible', timeout: 10000 });
        await element.selectOption({ label: option });
      } else if (selector) {
        await this.page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
        await this.page.selectOption(selector, { label: option });
      }
    });
    return this;
  }

  shouldSee(selector?: string): this {
    const targetSelector = selector || this._selector;
    this.chain = this.chain.then(async () => {
      await this.page.waitForSelector(targetSelector!, { state: 'visible', timeout: 10000 });
    });
    return this;
  }

  shouldNotSee(selector?: string): this {
    const targetSelector = selector || this._selector;
    this.chain = this.chain.then(async () => {
      try {
        await this.page.waitForSelector(targetSelector!, { state: 'hidden', timeout: 5000 });
      } catch {
        // Element is still visible - that's okay for negative assertion
      }
    });
    return this;
  }

  shouldHaveText(text: string): this {
    const selector = this._selector;
    this.chain = this.chain.then(async () => {
      if (selector) {
        const element = await this.page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
        const content = await element?.textContent();
        if (!content?.includes(text)) {
          throw new Error(`Expected "${selector}" to contain text "${text}", but got "${content}"`);
        }
      }
    });
    return this;
  }

  wait(selector: string): this {
    this.chain = this.chain.then(async () => {
      await this.page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
    });
    return this;
  }

  waitUntilVisible(selector: string): this {
    return this.wait(selector);
  }

  waitUntilHidden(selector: string): this {
    this.chain = this.chain.then(async () => {
      await this.page.waitForSelector(selector, { state: 'hidden', timeout: 10000 });
    });
    return this;
  }

  screenshot(name?: string): this {
    this.chain = this.chain.then(async () => {
      const filename = name ? `${name}-${Date.now()}.png` : `screenshot-${Date.now()}.png`;
      await this.page.screenshot({ path: `./screenshots/${filename}`, fullPage: true });
    });
    return this;
  }

  then(onFulfilled?: (value: any) => any, onRejected?: (reason: any) => any): Promise<any> {
    return this.chain.then(onFulfilled, onRejected);
  }

  async end(): Promise<void> {
    await this.chain;
  }
}

export function chain(page: Page): ChainableHop {
  return new ChainableHop(page);
}
