import type { TestResult, StepResult } from '../types/index.js';

export class TestResultCollector {
  private results: TestResult[] = [];
  
  add(result: TestResult): void {
    this.results.push(result);
  }
  
  getResults(): TestResult[] {
    return this.results;
  }
  
  getPassed(): TestResult[] {
    return this.results.filter(r => r.status === 'passed');
  }
  
  getFailed(): TestResult[] {
    return this.results.filter(r => r.status === 'failed');
  }
  
  getSkipped(): TestResult[] {
    return this.results.filter(r => r.status === 'skipped');
  }
  
  getTotalDuration(): number {
    return this.results.reduce((sum, r) => sum + r.duration, 0);
  }
  
  getSummary(): {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
  } {
    return {
      total: this.results.length,
      passed: this.getPassed().length,
      failed: this.getFailed().length,
      skipped: this.getSkipped().length,
      duration: this.getTotalDuration(),
    };
  }
  
  getFailedTests(): Array<{
    feature: string;
    scenario: string;
    step: StepResult | undefined;
    error: string | undefined;
  }> {
    return this.getFailed().map(r => ({
      feature: r.featureName,
      scenario: r.scenarioName,
      step: r.steps.find(s => s.status === 'failed'),
      error: r.error,
    }));
  }
  
  clear(): void {
    this.results = [];
  }
  
  toJSON(): string {
    return JSON.stringify({
      summary: this.getSummary(),
      results: this.results,
    }, null, 2);
  }
  
  toJUnitXML(): string {
    const failures = this.getFailed();
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<testsuite name="hop" tests="' + this.results.length + '" failures="' + failures.length + '" time="' + (this.getTotalDuration() / 1000) + '">\n';
    
    for (const result of this.results) {
      xml += '  <testcase name="' + this.escapeXml(result.scenarioName) + '" classname="' + this.escapeXml(result.featureName) + '" time="' + (result.duration / 1000) + '">\n';
      
      if (result.status === 'failed') {
        xml += '    <failure message="' + this.escapeXml(result.error || 'Test failed') + '">\n';
        xml += this.escapeXml(result.error || '') + '\n';
        xml += '    </failure>\n';
      }
      
      xml += '  </testcase>\n';
    }
    
    xml += '</testsuite>';
    return xml;
  }
  
  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp')
      .replace(/</g, '&lt')
      .replace(/>/g, '&gt')
      .replace(/"/g, '&quot')
      .replace(/'/g, '&apos');
  }
}
