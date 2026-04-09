import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import type { Page } from 'playwright-core';

export interface TraceStep {
  id: string;
  timestamp: number;
  type: 'action' | 'assertion' | 'navigation' | 'network' | 'console' | 'error' | 'screenshot';
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number;
  data?: Record<string, any>;
  error?: string;
  screenshotPath?: string;
  domSnapshot?: string;
}

export interface TraceEvent {
  level: 'log' | 'info' | 'warning' | 'error';
  message: string;
  timestamp: number;
  location?: string;
}

export interface TraceNetwork {
  url: string;
  method: string;
  status?: number;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  postData?: string;
  responseBody?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

export interface TraceData {
  id: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  browser: string;
  viewport: { width: number; height: number };
  url: string;
  title?: string;
  steps: TraceStep[];
  consoleLogs: TraceEvent[];
  networkCalls: TraceNetwork[];
  errors: TraceEvent[];
}

export class TraceViewer {
  private trace: TraceData;
  private currentStepId = 0;
  private startTime: number;
  private page: Page | null = null;
  private outputDir: string;

  constructor(
    testId: string,
    browser: string = 'chromium',
    viewport: { width: number; height: number } = { width: 1280, height: 720 },
    outputDir: string = 'reports/traces'
  ) {
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

  setPage(page: Page): void {
    this.page = page;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.page) return;

    this.page.on('console', msg => {
      this.trace.consoleLogs.push({
        level: msg.type() as any,
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

  startStep(name: string, type: TraceStep['type'], data?: Record<string, any>): string {
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

  async captureStep(
    stepId: string,
    status: TraceStep['status'],
    options: {
      error?: string;
      screenshot?: boolean;
      domSnapshot?: boolean;
    } = {}
  ): Promise<void> {
    const step = this.trace.steps.find(s => s.id === stepId);
    if (!step) return;

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
      } catch {}
    }
  }

  async captureDOMSnapshot(stepId: string): Promise<void> {
    const step = this.trace.steps.find(s => s.id === stepId);
    if (!step || !this.page) return;

    try {
      step.domSnapshot = await this.page.content();
    } catch {}
  }

  addNetworkCall(network: TraceNetwork): void {
    this.trace.networkCalls.push(network);
  }

  async captureCurrentState(screenshot = true): Promise<void> {
    if (!this.page) return;

    try {
      this.trace.url = this.page.url();
      this.trace.title = await this.page.title();
    } catch {}

    if (screenshot) {
      const screenshotDir = join(this.outputDir, this.trace.id, 'screenshots');
      if (!existsSync(screenshotDir)) {
        await mkdir(screenshotDir, { recursive: true });
      }
      const screenshotPath = join(screenshotDir, 'final-state.png');
      await this.page.screenshot({ path: screenshotPath });
    }
  }

  async finalize(): Promise<TraceData> {
    this.trace.endTime = Date.now();
    this.trace.duration = this.trace.endTime - this.trace.startTime;

    if (this.page) {
      try {
        this.trace.url = this.page.url();
        this.trace.title = await this.page.title();
      } catch {}
    }

    return this.trace;
  }

  async save(): Promise<string> {
    const traceDir = join(this.outputDir, this.trace.id);
    if (!existsSync(traceDir)) {
      await mkdir(traceDir, { recursive: true });
    }

    const tracePath = join(traceDir, 'trace.json');
    await writeFile(tracePath, JSON.stringify(this.trace, null, 2));

    return tracePath;
  }

  getTrace(): TraceData {
    return this.trace;
  }

  static async loadTrace(path: string): Promise<TraceData> {
    const { readFile } = await import('fs/promises');
    const content = await readFile(path, 'utf-8');
    return JSON.parse(content);
  }
}

export function createTraceViewer(
  testId: string,
  browser?: string,
  viewport?: { width: number; height: number },
  outputDir?: string
): TraceViewer {
  return new TraceViewer(testId, browser, viewport, outputDir);
}