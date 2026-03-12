import { mkdir } from 'fs/promises';
import { join } from 'path';
import * as path from 'path';
import type { TestContext } from '../types/index.js';
import type { PlaywrightClient } from '../ui/playwright-client.js';

export class ScreenshotManager {
  constructor(private reportDir: string = './reports') {}

  public async capture(name: string, context: TestContext, pw: PlaywrightClient | null): Promise<string | undefined> {
    if (!pw) return undefined;
    const page = pw.getPage();
    if (!page) return undefined;

    const screenshotsDir = join(this.reportDir, 'screenshots');
    await mkdir(screenshotsDir, { recursive: true });

    const fileName = `${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.png`;
    const filePath = join(screenshotsDir, fileName);

    await pw.screenshot({ path: filePath });
    return path.resolve(filePath);
  }
}
