import type { Page, BrowserContext } from 'playwright-core';
import type { TestContext } from '../types/index.js';

export interface RecordedAction {
  id: number;
  type: 'click' | 'type' | 'fill' | 'select' | 'navigate' | 'wait' | 'hover' | 'scroll' | 'screenshot' | 'assert';
  selector?: string;
  value?: string;
  text?: string;
  options?: Record<string, any>;
  timestamp: number;
}

export interface CodegenOptions {
  outputPath?: string;
  baseUrl?: string;
  includeScreenshots?: boolean;
}

export class Codegen {
  private actions: RecordedAction[] = [];
  private page: Page | null = null;
  private actionId = 0;
  private baseUrl: string = '';
  private isRecording = false;
  private options: CodegenOptions;

  constructor(options: CodegenOptions = {}) {
    this.options = {
      outputPath: './features/recorded.feature',
      includeScreenshots: true,
      ...options,
    };
  }

  async startRecording(page: Page, baseUrl?: string): Promise<void> {
    this.page = page;
    this.baseUrl = baseUrl || '';
    this.actions = [];
    this.actionId = 0;
    this.isRecording = true;

    page.on('console', msg => {
      if (this.isRecording) {
        this.addAction('assert', undefined, undefined, { message: msg.text(), type: msg.type() });
      }
    });

    console.log('🎬 Recording started...');
  }

  stopRecording(): void {
    this.isRecording = false;
    console.log(`🎬 Recording stopped. ${this.actions.length} actions recorded.`);
  }

  private addAction(
    type: RecordedAction['type'],
    selector?: string,
    value?: string,
    options?: Record<string, any>
  ): void {
    this.actions.push({
      id: ++this.actionId,
      type,
      selector,
      value,
      options,
      timestamp: Date.now(),
    });
  }

  async recordClick(selector: string, options?: Record<string, any>): Promise<void> {
    if (!this.isRecording) return;
    this.addAction('click', selector, undefined, options);
  }

  async recordType(selector: string, value: string): Promise<void> {
    if (!this.isRecording) return;
    this.addAction('type', selector, value);
  }

  async recordFill(selector: string, value: string): Promise<void> {
    if (!this.isRecording) return;
    this.addAction('fill', selector, value);
  }

  async recordNavigate(url: string): Promise<void> {
    if (!this.isRecording) return;
    this.addAction('navigate', undefined, url);
    this.baseUrl = url;
  }

  async recordWait(selector: string): Promise<void> {
    if (!this.isRecording) return;
    this.addAction('wait', selector);
  }

  async recordHover(selector: string): Promise<void> {
    if (!this.isRecording) return;
    this.addAction('hover', selector);
  }

  async recordScroll(selector?: string): Promise<void> {
    if (!this.isRecording) return;
    this.addAction('scroll', selector);
  }

  generateGherkin(): string {
    const features = new Map<string, RecordedAction[]>();
    let currentFeature = 'Recorded Test';
    let featureActions: RecordedAction[] = [];

    for (const action of this.actions) {
      if (action.type === 'navigate') {
        if (featureActions.length > 0) {
          features.set(currentFeature, featureActions);
        }
        currentFeature = `Navigate to ${action.value}`;
        featureActions = [];
      }
      featureActions.push(action);
    }

    if (featureActions.length > 0) {
      features.set(currentFeature, featureActions);
    }

    let output = '';
    let scenarioCount = 0;

    for (const [featureName, actions] of features) {
      output += `Feature: ${featureName}\n\n`;
      output += `  Scenario: Recorded test ${++scenarioCount}\n`;

      for (const action of actions) {
        switch (action.type) {
          case 'navigate':
            output += `    Given open '${action.value}'\n`;
            break;
          case 'click':
            output += `    When click '${action.selector}'\n`;
            break;
          case 'type':
            output += `    And type '${action.selector}' '${action.value}'\n`;
            break;
          case 'fill':
            output += `    And fill '${action.selector}' '${action.value}'\n`;
            break;
          case 'wait':
            output += `    And wait for '${action.selector}'\n`;
            break;
          case 'hover':
            output += `    And hover '${action.selector}'\n`;
            break;
          case 'scroll':
            output += action.selector
              ? `    And scroll to '${action.selector}'\n`
              : `    And scroll to bottom\n`;
            break;
          case 'assert':
            if (action.options?.message) {
              output += `    And assert '${action.options.message}' is visible\n`;
            }
            break;
        }
      }

      output += '\n';
    }

    return output;
  }

  async save(): Promise<string> {
    const { writeFile, mkdir } = await import('fs/promises');
    const { dirname } = await import('path');
    const content = this.generateGherkin();

    await mkdir(dirname(this.options.outputPath!), { recursive: true });
    await writeFile(this.options.outputPath!, content);

    return this.options.outputPath!;
  }

  getActions(): RecordedAction[] {
    return [...this.actions];
  }

  clear(): void {
    this.actions = [];
    this.actionId = 0;
  }

  static async fromBrowserContext(
    context: BrowserContext,
    options?: CodegenOptions
  ): Promise<Codegen> {
    const codegen = new Codegen(options);
    const page = await context.newPage();

    page.on('click', async (el) => {
      const selector = await codegen.generateSelector(el);
      await codegen.recordClick(selector);
    });

    page.on('input', async (el, value) => {
      const selector = await codegen.generateSelector(el);
      if (el.isVisible()) {
        await codegen.recordType(selector, value);
      }
    });

    return codegen;
  }

  private async generateSelector(element: any): Promise<string> {
    try {
      if (element.getAttribute('data-testid')) {
        return `[data-testid="${element.getAttribute('data-testid')}"]`;
      }
      if (element.id) {
        return `#${element.id}`;
      }
      if (element.getAttribute('name')) {
        return `[name="${element.getAttribute('name')}"]`;
      }
      if (element.tagName) {
        return element.tagName.toLowerCase();
      }
      return 'body';
    } catch {
      return 'body';
    }
  }
}

export function createCodegen(options?: CodegenOptions): Codegen {
  return new Codegen(options);
}