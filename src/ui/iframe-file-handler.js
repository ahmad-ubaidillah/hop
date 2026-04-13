export class IframeHandler {
    page;
    constructor(page) {
        this.page = page;
    }
    async frame(nameOrUrl) {
        const frame = this.page.frame(nameOrUrl);
        if (!frame)
            throw new Error(`Frame not found: ${nameOrUrl}`);
        return frame;
    }
    async frameByName(name) {
        return this.page.frame(name);
    }
    async frameByUrl(url) {
        const frames = this.page.frames();
        if (typeof url === 'string') {
            return frames.find(f => f.url() === url) || null;
        }
        return frames.find(f => url.test(f.url())) || null;
    }
    async frameLocator(selector) {
        const frame = await this.page.frameLocator(selector);
        return { frame, selector };
    }
    async getFrameContent(frameName) {
        const frame = this.page.frame(frameName);
        if (!frame)
            throw new Error(`Frame not found: ${frameName}`);
        return await frame.content();
    }
    async clickInFrame(frameName, selector) {
        const frame = this.page.frame(frameName);
        if (!frame)
            throw new Error(`Frame not found: ${frameName}`);
        await frame.click(selector);
    }
    async typeInFrame(frameName, selector, value) {
        const frame = this.page.frame(frameName);
        if (!frame)
            throw new Error(`Frame not found: ${frameName}`);
        await frame.fill(selector, value);
    }
    async waitForFrame(frameName, timeout = 5000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            const frame = this.page.frame(frameName);
            if (frame)
                return;
            await new Promise(r => setTimeout(r, 100));
        }
        throw new Error(`Frame '${frameName}' not found within ${timeout}ms`);
    }
    listFrames() {
        return this.page.frames().map(f => ({
            name: f.name(),
            url: f.url(),
        }));
    }
}
export class FileHandler {
    page;
    constructor(page) {
        this.page = page;
    }
    async setInputFiles(selector, files) {
        const filePaths = Array.isArray(files) ? files : [files];
        await this.page.setInputFiles(selector, filePaths);
    }
    async setInputFilesMultiple(selector, files) {
        await this.page.setInputFiles(selector, files);
    }
    async clearInputFiles(selector) {
        await this.page.setInputFiles(selector, []);
    }
    async download(triggerAction, options = {}) {
        const { savePath = './downloads', timeout = 30000 } = options;
        const [download] = await Promise.all([
            this.page.waitForEvent('download', { timeout }),
            triggerAction(),
        ]);
        const path = await download.path();
        if (!path)
            throw new Error('Download path not available');
        return path;
    }
    async getDownloadPath(triggerAction) {
        const downloadPromise = this.page.waitForEvent('download');
        await triggerAction();
        const download = await downloadPromise;
        return await download.path();
    }
}
export function createIframeHandler(page) {
    return new IframeHandler(page);
}
export function createFileHandler(page) {
    return new FileHandler(page);
}
