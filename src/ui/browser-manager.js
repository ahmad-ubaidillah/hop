import { chromium, firefox, webkit } from 'playwright-core';
import { join } from 'path';
import { DevicePresets } from './semantic-locators.js';
export class BrowserManager {
    options;
    browser = null;
    context = null;
    page = null;
    requestInterceptors = [];
    responseInterceptors = [];
    videoMode = 'never';
    saveVideoOnFailure = false;
    videoPath;
    constructor(options) {
        this.options = options;
        if (options.video === true) {
            this.videoMode = 'always';
        }
        else if (options.video === 'on-failure') {
            this.videoMode = 'on-failure';
            this.saveVideoOnFailure = true;
        }
        else if (options.video === 'always') {
            this.videoMode = 'always';
        }
    }
    async launch() {
        if (this.browser)
            return;
        const type = this.options.browser === 'firefox' ? firefox : this.options.browser === 'webkit' ? webkit : chromium;
        this.browser = await type.launch({ headless: this.options.headless });
        const contextOptions = {
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
    setupInterceptors() {
        if (!this.page)
            return;
        this.page.on('request', req => this.requestInterceptors.forEach(h => h(req)));
        this.page.on('response', res => this.responseInterceptors.forEach(h => h(res)));
    }
    addRequestInterceptor(h) { this.requestInterceptors.push(h); }
    addResponseInterceptor(h) { this.responseInterceptors.push(h); }
    getPage() { return this.page; }
    getContext() { return this.context; }
    getOptions() { return this.options; }
    isSaveVideoOnFailure() { return this.saveVideoOnFailure; }
    async getVideoPath() {
        if (this.context && this.saveVideoOnFailure) {
            const video = this.context.video?.();
            if (video) {
                return await video.path();
            }
        }
        return undefined;
    }
    async close() {
        if (this.saveVideoOnFailure && this.context) {
            try {
                const video = this.context.video?.();
                if (video) {
                    this.videoPath = await video.path();
                }
            }
            catch (e) {
                console.warn(`Failed to get video path: ${e instanceof Error ? e.message : e}`);
            }
        }
        try {
            await this.browser?.close();
        }
        catch (e) {
            console.error(`Failed to close browser: ${e instanceof Error ? e.message : e}`);
        }
        finally {
            this.browser = null;
            this.context = null;
            this.page = null;
        }
    }
    getRecordedVideoPath() {
        return this.videoPath;
    }
}
