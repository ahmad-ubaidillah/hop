import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
export class TraceViewer {
    trace;
    currentStepId = 0;
    startTime;
    page = null;
    outputDir;
    constructor(testId, browser = 'chromium', viewport = { width: 1280, height: 720 }, outputDir = 'reports/traces') {
        this.startTime = Date.now();
        this.outputDir = outputDir;
        this.trace = {
            id: testId,
            startTime: this.startTime,
            browser,
            viewport,
            url: '',
            steps: [],
            consoleLogs: [],
            networkCalls: [],
            errors: [],
        };
    }
    setPage(page) {
        this.page = page;
        this.setupEventListeners();
    }
    setupEventListeners() {
        if (!this.page)
            return;
        this.page.on('console', msg => {
            this.trace.consoleLogs.push({
                level: msg.type(),
                message: msg.text(),
                timestamp: Date.now(),
                location: msg.location()?.url,
            });
        });
        this.page.on('pageerror', error => {
            this.trace.errors.push({
                level: 'error',
                message: error.message,
                timestamp: Date.now(),
            });
        });
    }
    startStep(name, type, data) {
        const id = `step_${++this.currentStepId}`;
        this.trace.steps.push({
            id,
            timestamp: Date.now(),
            type,
            name,
            status: 'running',
            data,
        });
        return id;
    }
    async captureStep(stepId, status, options = {}) {
        const step = this.trace.steps.find(s => s.id === stepId);
        if (!step)
            return;
        step.status = status;
        step.duration = Date.now() - step.timestamp;
        if (status === 'failed' && options.error) {
            step.error = options.error;
        }
        if (options.screenshot && this.page) {
            const screenshotDir = join(this.outputDir, this.trace.id, 'screenshots');
            if (!existsSync(screenshotDir)) {
                await mkdir(screenshotDir, { recursive: true });
            }
            const screenshotPath = join(screenshotDir, `${stepId}.png`);
            await this.page.screenshot({ path: screenshotPath });
            step.screenshotPath = screenshotPath;
        }
        if (options.domSnapshot && this.page) {
            try {
                step.domSnapshot = await this.page.content();
            }
            catch { }
        }
    }
    async captureDOMSnapshot(stepId) {
        const step = this.trace.steps.find(s => s.id === stepId);
        if (!step || !this.page)
            return;
        try {
            step.domSnapshot = await this.page.content();
        }
        catch { }
    }
    addNetworkCall(network) {
        this.trace.networkCalls.push(network);
    }
    async captureCurrentState(screenshot = true) {
        if (!this.page)
            return;
        try {
            this.trace.url = this.page.url();
            this.trace.title = await this.page.title();
        }
        catch { }
        if (screenshot) {
            const screenshotDir = join(this.outputDir, this.trace.id, 'screenshots');
            if (!existsSync(screenshotDir)) {
                await mkdir(screenshotDir, { recursive: true });
            }
            const screenshotPath = join(screenshotDir, 'final-state.png');
            await this.page.screenshot({ path: screenshotPath });
        }
    }
    async finalize() {
        this.trace.endTime = Date.now();
        this.trace.duration = this.trace.endTime - this.trace.startTime;
        if (this.page) {
            try {
                this.trace.url = this.page.url();
                this.trace.title = await this.page.title();
            }
            catch { }
        }
        return this.trace;
    }
    async save() {
        const traceDir = join(this.outputDir, this.trace.id);
        if (!existsSync(traceDir)) {
            await mkdir(traceDir, { recursive: true });
        }
        const tracePath = join(traceDir, 'trace.json');
        await writeFile(tracePath, JSON.stringify(this.trace, null, 2));
        return tracePath;
    }
    getTrace() {
        return this.trace;
    }
    static async loadTrace(path) {
        const { readFile } = await import('fs/promises');
        const content = await readFile(path, 'utf-8');
        return JSON.parse(content);
    }
}
export function createTraceViewer(testId, browser, viewport, outputDir) {
    return new TraceViewer(testId, browser, viewport, outputDir);
}
