import type { TestResult, StepResult } from '../types/index.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

/**
 * Allure Report Generator
 * Generates Allure-compatible JSON results for integration with Allure framework
 * See: https://allure.io/
 */
export class AllureReporter {
  private outputPath: string;
  private testResults: AllureTestResult[] = [];

  constructor(outputPath: string = './reports/allure-results') {
    this.outputPath = outputPath;
  }

  /**
   * Generate Allure report files
   */
  async generate(results: TestResult[]): Promise<string> {
    // Create output directory
    await mkdir(this.outputPath, { recursive: true });
    
    let idx = 0;
    for (const result of results) {
      const allureResult = this.convertToAllure(result, idx++);
      const filename = `${allureResult.uuid}-result.json`;
      const filepath = join(this.outputPath, filename);
      await writeFile(filepath, JSON.stringify(allureResult, null, 2), 'utf-8');
    }
    
    return this.outputPath;
  }

  /**
   * Convert Hop result to Allure format
   */
  private convertToAllure(result: TestResult, index: number): AllureTestResult {
    const uuid = `hop-${Date.now()}-${index}`;
    const start = Date.now() - result.duration;
    const stop = Date.now();
    
    return {
      uuid,
      historyId: this.generateHistoryId(result),
      fullName: `${result.featureName}: ${result.scenarioName}`,
      name: result.scenarioName,
      description: result.featureName,
      status: this.mapStatus(result.status),
      statusDetails: result.error ? {
        message: result.error,
        trace: result.error
      } : undefined,
      stage: 'finished',
      start,
      stop,
      labels: [
        { name: 'feature', value: result.featureName },
        { name: 'suite', value: result.featureName },
        ...result.tags.map(tag => ({ name: 'tag', value: tag }))
      ],
      parameters: [],
      steps: result.steps.map(s => this.convertStep(s))
    };
  }

  /**
   * Convert step to Allure format
   */
  private convertStep(step: StepResult): AllureStep {
    return {
      name: `${step.step.keyword} ${step.step.text}`,
      status: this.mapStatus(step.status),
      start: Date.now() - step.duration,
      stop: Date.now(),
      steps: [],
      attachments: [],
      parameters: []
    };
  }

  /**
   * Generate unique history ID
   */
  private generateHistoryId(result: TestResult): string {
    return `${result.featureName}:${result.scenarioName}`.replace(/\s+/g, '-').toLowerCase();
  }

  /**
   * Map Hop status to Allure status
   */
  private mapStatus(status: string): 'passed' | 'failed' | 'skipped' | 'broken' | 'pending' {
    switch (status) {
      case 'passed': return 'passed';
      case 'failed': return 'failed';
      case 'skipped': return 'skipped';
      default: return 'broken';
    }
  }
}

interface AllureTestResult {
  uuid: string;
  historyId: string;
  fullName: string;
  name: string;
  description: string;
  status: 'passed' | 'failed' | 'skipped' | 'broken' | 'pending';
  statusDetails?: {
    message: string;
    trace: string;
  };
  stage: 'finished';
  start: number;
  stop: number;
  labels: Array<{ name: string; value: string }>;
  parameters: unknown[];
  steps: AllureStep[];
}

interface AllureStep {
  name: string;
  status: 'passed' | 'failed' | 'skipped' | 'broken' | 'pending';
  start: number;
  stop: number;
  steps: unknown[];
  attachments: unknown[];
  parameters: unknown[];
}
