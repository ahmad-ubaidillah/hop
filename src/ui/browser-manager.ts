import { chromium } from 'playwright-core';
import type { Browser, BrowserContext, Page } from 'playwright-core';
import type { PlaywrightOptions, NetworkRequest } from './types.ts';

export class BrowserManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private options: PlaywrightOptions;
  private videosDir: string = './videos';
  private requestInterceptors: ((request: any) => void)[] = [];
  private responseInterceptors: ((response: any) => void)[] = [];

  constructor(options: PlaywrightOptions) {
    this.options = options;
  }

  async launch(): Promise<void> {
    try {
      const browserType = this.options.browser === 'firefox' ? 'firefox' : 
                         this.options.browser === 'webkit' ? 'webkit' : 'chromium';
      
      const contextOptions: any = {
        viewport: this.options.viewport,
      };
      
      if (this.options.video) {
        contextOptions.recordVideo = {
          dir: this.videosDir,
          size: this.options.viewport,
        };
      }
      
      this.browser = await chromium.launch({ 
        headless: this.options.headless,
      });
      
      this.context = await this.browser.newContext(contextOptions);
      
      await this.setupNetworkInterception();
      
      this.page = await this.context.newPage();
      
      if (this.page) {
        this.page.setDefaultTimeout(this.options.timeout || 30000);
      }
    } catch (error) {
      throw new Error(`Failed to launch browser: ${error instanceof Error ? error.message : error}`);
    }
  }

  private async setupNetworkInterception(): Promise<void> {
    if (!this.context) return;
    
    await this.context.route('**/*', async (route, request) => {
      for (const interceptor of this.requestInterceptors) {
        interceptor(request);
      }
      await route.continue();
    });
  }

  async close(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
    
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  addRequestInterceptor(handler: (request: any) => void): void {
    this.requestInterceptors.push(handler);
  }

  addResponseInterceptor(handler: (response: any) => void): void {
    this.responseInterceptors.push(handler);
  }

  getPage(): Page | null {
    return this.page;
  }

  getContext(): BrowserContext | null {
    return this.context;
  }

  getOptions(): PlaywrightOptions {
    return this.options;
  }
}
