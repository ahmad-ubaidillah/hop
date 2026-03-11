import type { TestResult } from '../types/index.js';
import { writeFile } from 'fs/promises';
import { join } from 'path';

/**
 * JUnit XML Report Generator
 * Generates XML report in JUnit format for CI/CD integration (Jenkins, GitLab, etc.)
 */
export class JunitReporter {
  private outputPath: string;

  constructor(outputPath: string = './reports') {
    this.outputPath = outputPath;
  }

  /**
   * Generate JUnit XML report from test results
   */
  async generate(results: TestResult[]): Promise<string> {
    const xml = this.buildXml(results);
    
    const filename = `junit-report-${Date.now()}.xml`;
    const filepath = join(this.outputPath, filename);
    
    await writeFile(filepath, xml, 'utf-8');
    return filepath;
  }

  /**
   * Build JUnit XML string
   */
  private buildXml(results: TestResult[]): string {
    const timestamp = new Date().toISOString();
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="Hop BDD Tests" tests="${results.length}" failures="${this.getFailureCount(results)}" skipped="0" time="${this.getTotalTime(results)}" timestamp="${timestamp}">
`;
    
    for (const result of results) {
      xml += this.buildTestSuite(result);
    }
    
    xml += `</testsuites>`;
    
    return xml;
  }

  /**
   * Build single test suite XML
   */
  private buildTestSuite(result: TestResult): string {
    const className = this.escapeXml(result.featureName);
    const testName = this.escapeXml(result.scenarioName);
    const time = (result.duration / 1000).toFixed(3);
    const ts = new Date().toISOString();
    
    let suite = `  <testsuite name="${className}" tests="1" failures="${result.status === 'failed' ? 1 : 0}" skipped="0" time="${time}" timestamp="${ts}">
`;
    suite += `    <testcase name="${testName}" classname="${className}" time="${time}">
`;
    
    if (result.status === 'failed' && result.error) {
      suite += `      <failure message="${this.escapeXml(result.error)}" type="AssertionError">
`;
      suite += `        <![CDATA[${result.error}]]>
`;
      suite += `      </failure>
`;
    }
    
    if (result.steps.length > 0) {
      const stepsXml = result.steps.map(s => 
        `${s.step.keyword} ${s.step.text} (${s.status})`
      ).join('\n');
      suite += `      <system-out><![CDATA[${stepsXml}]]></system-out>
`;
    }
    
    suite += `    </testcase>
`;
    suite += `  </testsuite>
`;
    
    return suite;
  }

  private getFailureCount(results: TestResult[]): number {
    return results.filter(r => r.status === 'failed').length;
  }

  private getTotalTime(results: TestResult[]): number {
    const totalMs = results.reduce((sum, r) => sum + r.duration, 0);
    return +(totalMs / 1000).toFixed(3);
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"');
  }
}
