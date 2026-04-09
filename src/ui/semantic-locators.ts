import type { Page, Locator } from 'playwright-core';
import type { BrowserManager } from './browser-manager.js';

export type BrowserType = 'chromium' | 'firefox' | 'webkit';

export interface DeviceConfig {
  name: string;
  viewport: { width: number; height: number };
  deviceScaleFactor?: number;
  isMobile?: boolean;
  hasTouch?: boolean;
  userAgent?: string;
}

export const DevicePresets: Record<string, DeviceConfig> = {
  'iPhone 12': {
    name: 'iPhone 12',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
  },
  'iPhone 12 Pro': {
    name: 'iPhone 12 Pro',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
  },
  'iPhone SE': {
    name: 'iPhone SE',
    viewport: { width: 375, height: 667 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
  },
  'iPhone X': {
    name: 'iPhone X',
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
  },
  'iPad Pro 11': {
    name: 'iPad Pro 11',
    viewport: { width: 834, height: 1194 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
  },
  'iPad Pro 12.9': {
    name: 'iPad Pro 12.9',
    viewport: { width: 1024, height: 1366 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
  },
  'iPad Mini': {
    name: 'iPad Mini',
    viewport: { width: 768, height: 1024 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
  },
  'Pixel 5': {
    name: 'Pixel 5',
    viewport: { width: 393, height: 851 },
    deviceScaleFactor: 2.625,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.0.0 Mobile Safari/537.36',
  },
  'Pixel 4': {
    name: 'Pixel 4',
    viewport: { width: 353, height: 745 },
    deviceScaleFactor: 2.5,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.0.0 Mobile Safari/537.36',
  },
  'Samsung Galaxy S10': {
    name: 'Samsung Galaxy S10',
    viewport: { width: 360, height: 760 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G973U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36',
  },
  'Samsung Galaxy S20': {
    name: 'Samsung Galaxy S20',
    viewport: { width: 360, height: 800 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36',
  },
  'Desktop Chrome': {
    name: 'Desktop Chrome',
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  },
  'Desktop Edge': {
    name: 'Desktop Edge',
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  },
  'Desktop Firefox': {
    name: 'Desktop Firefox',
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  },
  'Desktop Safari': {
    name: 'Desktop Safari',
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  },
};

export class SemanticLocators {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  getByRole(role: string, options: { name?: string | RegExp; exact?: boolean } = {}): Locator {
    const { name, exact } = options;
    if (name) {
      return this.page.getByRole(role as any, { name, exact });
    }
    return this.page.getByRole(role as any);
  }

  getByLabel(text: string, options: { exact?: boolean } = {}): Locator {
    return this.page.getByLabel(text, { exact: options.exact });
  }

  getByPlaceholder(text: string, options: { exact?: boolean } = {}): Locator {
    return this.page.getByPlaceholder(text, { exact: options.exact });
  }

  getByText(text: string, options: { exact?: boolean } = {}): Locator {
    return this.page.getByText(text, { exact: options.exact });
  }

  getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  getByAltText(text: string, options: { exact?: boolean } = {}): Locator {
    return this.page.getByAltText(text, { exact: options.exact });
  }

  getByTitle(text: string, options: { exact?: boolean } = {}): Locator {
    return this.page.getByTitle(text, { exact: options.exact });
  }

  getByAriaRole(role: string): Locator {
    return this.page.locator(`[role="${role}"]`);
  }
}

export function createSemanticLocators(page: Page): SemanticLocators {
  return new SemanticLocators(page);
}