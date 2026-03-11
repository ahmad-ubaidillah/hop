import type { TestResult } from '../types/index.js';
import { writeFile } from 'fs/promises';
import { join } from 'path';

/**
 * JSON Report Generator
 * Generates machine-readable JSON report for dashboard integration
 */
export class JsonReporter {
  private outputPath: string;

  constructor(outputPath: string = './reports') {
    this.outputPath = outputPath;
  }

  /**
   * Generate JSON report from test results
   */
  async generate(results: TestResult[]): Promise<string> {
    const report = this.buildReport(results);
    const json = JSON.stringify(report, null, 2);
    
    const filename = `json-report-${Date.now()}.json`;
    const filepath = join(this.outputPath, filename);
    
    await writeFile(filepath, json, 'utf-8');
    return filepath;
  }

  /**
   * Build JSON report structure
   */
  private buildReport(results: TestResult[]) {
    const summary = this.buildSummary(results);
    const features = this.groupByFeature(results);
    
    return {
      framework: 'Hop BDD',
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      summary,
      features,
      results: results.map(r => this.transformResult(r))
    };
  }

  private buildSummary(results: TestResult[]) {
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    
    return {
      total: results.length,
      passed,
      failed,
      skipped,
      duration: totalDuration,
      passRate: results.length > 0 ? ((passed / results.length) * 100).toFixed(2) + '%' : '0%'
    };
  }

  private groupByFeature(results: TestResult[]): Record<string, unknown> {
    const grouped: Record<string, TestResult[]> = {};
    
    for (const result of results) {
      if (!grouped[result.featureName]) {
        grouped[result.featureName] = [];
      }
      grouped[result.featureName].push(result);
    }
    
    const featureSummary: Record<string, unknown> = {};
    for (const [name, featureResults] of Object.entries(grouped)) {
      const passed = featureResults.filter(r => r.status === 'passed').length;
      const failed = featureResults.filter(r => r.status === 'failed').length;
      featureSummary[name] = {
        scenarios: featureResults.length,
        passed,
        failed,
        results: featureResults.map(r => ({
          name: r.scenarioName,
          status: r.status,
          duration: r.duration,
          error: r.error
        }))
      };
    }
    
    return featureSummary;
  }

  private transformResult(result: TestResult) {
    return {
      feature: result.featureName,
      scenario: result.scenarioName,
      status: result.status,
      duration: result.duration,
      tags: result.tags,
      error: result.error,
      steps: result.steps.map(s => ({
        keyword: s.step.keyword,
        text: s.step.text,
        status: s.status,
        duration: s.duration,
        error: s.error
      }))
    };
  }
}
