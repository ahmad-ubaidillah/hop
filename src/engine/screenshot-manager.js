import { mkdir } from 'fs/promises';
import { join } from 'path';
import * as path from 'path';
export class ScreenshotManager {
    reportDir;
    constructor(reportDir = './reports') {
        this.reportDir = reportDir;
    }
    async capture(name, context, pw) {
        if (!pw)
            return undefined;
        const page = pw.getPage();
        if (!page)
            return undefined;
        const screenshotsDir = join(this.reportDir, 'screenshots');
        await mkdir(screenshotsDir, { recursive: true });
        const fileName = `${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.png`;
        const filePath = join(screenshotsDir, fileName);
        await pw.screenshot({ path: filePath });
        return path.resolve(filePath);
    }
}
