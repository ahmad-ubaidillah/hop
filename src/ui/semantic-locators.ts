import type { Page, Locator } from 'playwright-core';

export type BrowserType = 'chromium' | 'firefox' | 'webkit';

export interface DeviceConfig {
  name: string;
  viewport: { width: number; height: number };
}

export const DevicePresets: Record<string, DeviceConfig> = {
  'Desktop HD': {
    name: 'Desktop HD',
    viewport: { width: 1920, height: 1080 },
  },
  'Desktop': {
    name: 'Desktop',
    viewport: { width: 1280, height: 720 },
  },
  'Tablet': {
    name: 'Tablet',
    viewport: { width: 768, height: 1024 },
  },
  'Mobile': {
    name: 'Mobile',
    viewport: { width: 375, height: 667 },
  },
  'Mobile Large': {
    name: 'Mobile Large',
    viewport: { width: 414, height: 896 },
  },
};

export function getDeviceConfig(deviceName: string): DeviceConfig | null {
  return DevicePresets[deviceName] || null;
}

export class SemanticLocators {
  constructor(private page: Page) {}

  getByRole(role: string, options?: { name?: string | RegExp }): Locator {
    return this.page.getByRole(role as any, options);
  }

  getByLabel(text: string, options?: { exact?: boolean }): Locator {
    return this.page.getByLabel(text, options);
  }

  getByPlaceholder(text: string, options?: { exact?: boolean }): Locator {
    return this.page.getByPlaceholder(text, options);
  }

  getByText(text: string, options?: { exact?: boolean }): Locator {
    return this.page.getByText(text, options);
  }

  getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  getByAltText(text: string, options?: { exact?: boolean }): Locator {
    return this.page.getByAltText(text, options);
  }

  getByTitle(text: string, options?: { exact?: boolean }): Locator {
    return this.page.getByTitle(text, options);
  }
}

export function createSemanticLocators(page: Page): SemanticLocators {
  return new SemanticLocators(page);
}