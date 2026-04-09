import { chromium, firefox, webkit, type Browser, type BrowserContext, type Page } from 'playwright-core';
import { join } from 'path';
import type { PlaywrightOptions } from './types.js';
import { DevicePresets, type DeviceConfig } from './semantic-locators.js';

export type VideoMode = 'always' | 'on-failure' | 'never';

export class BrowserManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private requestInterceptors: ((req: any) => void)[] = [];
  private responseInterceptors: ((res: any) => void)[] = [];
  private videoMode: VideoMode = 'never';
  private saveVideoOnFailure = false;
  private videoPath: string | undefined;

  constructor(private options: PlaywrightOptions) {
    if (options.video === true) {
      this.videoMode = 'always';
    } else if (options.video === 'on-failure') {
      this.videoMode = 'on-failure';
      this.saveVideoOnFailure = true;
    } else if (options.video === 'always') {
      this.videoMode = 'always';
    }
  }

  public async launch(): Promise<void> {
    if (this.browser) return;
    const type = this.options.browser === 'firefox' ? firefox : this.options.browser === 'webkit' ? webkit : chromium;
    this.browser = await type.launch({ headless: this.options.headless });
    
    const contextOptions: any = { 
      viewport: this.options.viewport,
    };

    const shouldRecordVideo = this.videoMode === 'always' || this.saveVideoOnFailure;
    
    if (shouldRecordVideo) {
      contextOptions.recordVideo = {
        dir: join('reports', 'videos'),
        size: this.options.viewport || { width: 1280, height: 720 }
      };
    }

    const deviceName = this.options.device;
    if (deviceName && DevicePresets[deviceName]) {
      const device = DevicePresets[deviceName];
      contextOptions.viewport = device.viewport;
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
  public isSaveVideoOnFailure(): boolean { return this.saveVideoOnFailure; }

  public async getVideoPath(): Promise<string | undefined> {
    if (this.context && this.saveVideoOnFailure) {
      const video = this.context.video();
      if (video) {
        return await video.path();
      }
    }
    return undefined;
  }

  public async close(): Promise<void> {
    if (this.saveVideoOnFailure && this.context) {
      try {
        const video = this.context.video();
        if (video) {
          this.videoPath = await video.path();
        }
      } catch {}
    }
    
    await this.browser?.close();
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  public getRecordedVideoPath(): string | undefined {
    return this.videoPath;
  }
}