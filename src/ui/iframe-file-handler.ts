import type { Page, Frame } from 'playwright-core';

export interface IframeLocator {
  frame: Frame;
  selector: string;
}

export class IframeHandler {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async frame(nameOrUrl: string): Promise<Page> {
    const frame = this.page.frame(nameOrUrl);
    if (!frame) throw new Error(`Frame not found: ${nameOrUrl}`);
    return frame as any;
  }

  async frameByName(name: string): Promise<Frame | null> {
    return this.page.frame(name);
  }

  async frameByUrl(url: string | RegExp): Promise<Frame | null> {
    const frames = this.page.frames();
    if (typeof url === 'string') {
      return frames.find(f => f.url() === url) || null;
    }
    return frames.find(f => url.test(f.url())) || null;
  }

  async frameLocator(selector: string): Promise<IframeLocator> {
    const frame = await this.page.frameLocator(selector);
    return { frame, selector };
  }

  async getFrameContent(frameName: string): Promise<string> {
    const frame = this.page.frame(frameName);
    if (!frame) throw new Error(`Frame not found: ${frameName}`);
    return await frame.content();
  }

  async clickInFrame(frameName: string, selector: string): Promise<void> {
    const frame = this.page.frame(frameName);
    if (!frame) throw new Error(`Frame not found: ${frameName}`);
    await frame.click(selector);
  }

  async typeInFrame(frameName: string, selector: string, value: string): Promise<void> {
    const frame = this.page.frame(frameName);
    if (!frame) throw new Error(`Frame not found: ${frameName}`);
    await frame.fill(selector, value);
  }

  async waitForFrame(frameName: string, timeout = 5000): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const frame = this.page.frame(frameName);
      if (frame) return;
      await new Promise(r => setTimeout(r, 100));
    }
    throw new Error(`Frame '${frameName}' not found within ${timeout}ms`);
  }

  listFrames(): { name: string | null; url: string }[] {
    return this.page.frames().map(f => ({
      name: f.name(),
      url: f.url(),
    }));
  }
}

export class FileHandler {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async setInputFiles(selector: string, files: string | string[]): Promise<void> {
    const filePaths = Array.isArray(files) ? files : [files];
    await this.page.setInputFiles(selector, filePaths);
  }

  async setInputFilesMultiple(selector: string, files: { name: string; mimeType: string; buffer: Buffer }[]): Promise<void> {
    await this.page.setInputFiles(selector, files);
  }

  async clearInputFiles(selector: string): Promise<void> {
    await this.page.setInputFiles(selector, []);
  }

  async download(
    triggerAction: () => Promise<void>,
    options: { savePath?: string; timeout?: number } = {}
  ): Promise<string> {
    const { savePath = './downloads', timeout = 30000 } = options;

    const [download] = await Promise.all([
      this.page.waitForEvent('download', { timeout }),
      triggerAction(),
    ]);

    const path = await download.path();
    if (!path) throw new Error('Download path not available');

    return path;
  }

  async getDownloadPath(triggerAction: () => Promise<void>): Promise<string | null> {
    const downloadPromise = this.page.waitForEvent('download');
    await triggerAction();
    
    const download = await downloadPromise;
    return await download.path();
  }
}

export function createIframeHandler(page: Page): IframeHandler {
  return new IframeHandler(page);
}

export function createFileHandler(page: Page): FileHandler {
  return new FileHandler(page);
}