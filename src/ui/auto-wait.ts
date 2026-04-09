import type { Page, Locator } from 'playwright-core';

export type WaitCondition = 'visible' | 'hidden' | 'attached' | 'detached' | 'stable' | 'ready';

export interface AutoWaitOptions {
  enabled?: boolean;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  waitForVisible?: boolean;
  waitForStable?: boolean;
}

export interface WaitOptions {
  timeout?: number;
  state?: WaitCondition;
  retries?: number;
}

export class AutoWaitManager {
  private options: AutoWaitOptions;
  private defaultTimeout = 30000;
  private defaultRetries = 2;

  constructor(options: AutoWaitOptions = {}) {
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

  async waitForElement(
    page: Page | null,
    selector: string,
    condition: WaitCondition = 'visible',
    options: WaitOptions = {}
  ): Promise<void> {
    if (!page || !this.options.enabled) return;

    const timeout = options.timeout || this.options.timeout || this.defaultTimeout;
    const state = this.mapCondition(condition);

    try {
      await page.waitForSelector(selector, { state, timeout });
    } catch (error) {
      const retries = options.retries || this.options.retries || this.defaultRetries;
      await this.retryWait(page, selector, condition, retries);
    }
  }

  private async retryWait(
    page: Page,
    selector: string,
    condition: WaitCondition,
    retries: number
  ): Promise<void> {
    for (let i = 0; i < retries; i++) {
      try {
        const state = this.mapCondition(condition);
        await page.waitForSelector(selector, { state, timeout: 5000 });
        return;
      } catch {
        if (i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, this.options.retryDelay || 500));
        }
      }
    }
    throw new Error(`Element '${selector}' did not meet condition '${condition}' after ${retries} retries`);
  }

  async waitForStable(page: Page | null, selector: string): Promise<void> {
    if (!page || !this.options.waitForStable) return;

    await page.waitForFunction(
      (sel) => {
        const el = document.querySelector(sel);
        if (!el) return false;
        const box = el.getBoundingClientRect();
        return box.width > 0 && box.height > 0;
      },
      selector,
      { timeout: this.options.timeout || this.defaultTimeout }
    );
  }

  async waitForNetworkIdle(page: Page | null, idleTime = 1000): Promise<void> {
    if (!page) return;
    await page.waitForLoadState('networkidle', { timeout: this.options.timeout || this.defaultTimeout });
  }

  async waitForResponse(page: Page | null, urlPattern: string, timeout?: number): Promise<any> {
    if (!page) throw new Error('Page not available');
    return await page.waitForResponse(urlPattern, { timeout: timeout || this.options.timeout || this.defaultTimeout });
  }

  async waitForNavigation(page: Page | null, options: { timeout?: number; waitUntil?: string } = {}): Promise<void> {
    if (!page) throw new Error('Page not available');
    await page.waitForLoadState(options.waitUntil || 'networkidle', { timeout: options.timeout || this.options.timeout || this.defaultTimeout });
  }

  private mapCondition(condition: WaitCondition): 'visible' | 'hidden' | 'attached' | 'detached' {
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

  setEnabled(enabled: boolean): void {
    this.options.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.options.enabled ?? true;
  }

  getOptions(): AutoWaitOptions {
    return { ...this.options };
  }
}

export function createAutoWaitManager(options?: AutoWaitOptions): AutoWaitManager {
  return new AutoWaitManager(options);
}

export async function autoWait(
  page: Page | null,
  action: 'click' | 'type' | 'hover' | 'select' | 'check' | 'fill',
  selector: string,
  options: { value?: string; autoWait?: AutoWaitOptions } = {}
): Promise<void> {
  const autoWait = createAutoWaitManager(options.autoWait);

  if (!page) throw new Error('Page not available');

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