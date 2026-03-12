import { chromium, firefox, webkit, type Browser, type BrowserContext, type Page } from 'playwright-core';
import { join } from 'path';
import type { PlaywrightOptions } from './types.ts';

export class BrowserManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private requestInterceptors: ((req: any) => void)[] = [];
  private responseInterceptors: ((res: any) => void)[] = [];

  constructor(private options: PlaywrightOptions) {}

  public async launch(): Promise<void> {
    if (this.browser) return;
    const type = this.options.browser === 'firefox' ? firefox : this.options.browser === 'webkit' ? webkit : chromium;
    this.browser = await type.launch({ headless: this.options.headless });
    
    // Configure video recording if enabled
    const contextOptions: any = { 
      viewport: this.options.viewport,
    };

    if (this.options.video) {
      contextOptions.recordVideo = {
        dir: join('reports', 'videos'),
        size: this.options.viewport || { width: 1280, height: 720 }
      };
    }

    this.context = await this.browser.newContext(contextOptions);
    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(this.options.timeout || 30000);
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    if (!this.page) return;
    this.page.on('request', req => this.requestInterceptors.forEach(h => h(req)));
    this.page.on('response', res => this.responseInterceptors.forEach(h => h(res)));
  }

  public addRequestInterceptor(h: (req: any) => void): void { this.requestInterceptors.push(h); }
  public addResponseInterceptor(h: (res: any) => void): void { this.responseInterceptors.push(h); }

  public getPage(): Page | null { return this.page; }
  public getContext(): BrowserContext | null { return this.context; }
  public getOptions(): PlaywrightOptions { return this.options; }

  public async close(): Promise<void> {
    await this.browser?.close();
    this.browser = null;
    this.context = null;
    this.page = null;
  }
}
