import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import type { TestResult } from '../types/index.js';
import type { TestResultCollector } from '../engine/test-result-collector.js';

export class HtmlReporter {
  private outputDir: string = './reports';
  
  /**
   * Generate HTML report
   */
  async generate(results: TestResult[], collector: TestResultCollector): Promise<void> {
    const summary = collector.getSummary();
    const failedTests = collector.getFailedTests();
    
    const html = this.generateHtml(results, summary, failedTests);
    
    // Ensure directory exists
    await mkdir(this.outputDir, { recursive: true });
    
    const outputPath = join(this.outputDir, 'report.html');
    await writeFile(outputPath, html, 'utf-8');
    
    console.log(`Report generated: ${outputPath}`);
  }
  
  private generateHtml(
    results: TestResult[],
    summary: { total: number; passed: number; failed: number; skipped: number; duration: number },
    failedTests: any[]
  ): string {
    const passedPercent = summary.total > 0 ? Math.round((summary.passed / summary.total) * 100) : 0;
    
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hop Test Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 20px; }
    .header h1 { font-size: 2rem; margin-bottom: 10px; }
    .header p { opacity: 0.9; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
    .card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .card h3 { font-size: 0.9rem; color: #666; margin-bottom: 5px; }
    .card .value { font-size: 2rem; font-weight: bold; }
    .card.total { border-left: 4px solid #667eea; }
    .card.passed { border-left: 4px solid #10b981; }
    .card.failed { border-left: 4px solid #ef4444; }
    .card.skipped { border-left: 4px solid #f59e0b; }
    .progress { height: 8px; background: #e5e7eb; border-radius: 4px; margin-top: 10px; overflow: hidden; }
    .progress-bar { height: 100%; background: ${passedPercent === 100 ? '#10b981' : passedPercent > 50 ? '#f59e0b' : '#ef4444'}; transition: width 0.3s ease; }
    .results { background: white; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
    .results h2 { padding: 20px; border-bottom: 1px solid #e5e7eb; }
    .test-item { padding: 15px 20px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; }
    .test-item:last-child { border-bottom: none; }
    .test-item .status { margin-right: 15px; font-size: 1.2rem; }
    .test-item .name { flex: 1; }
    .test-item .duration { color: #666; font-size: 0.9rem; }
    .test-item.failed { background: #fef2f2; }
    .test-item.passed { background: #f0fdf4; }
    .error-details { background: #fef2f2; padding: 15px; margin: 10px 20px; border-radius: 5px; border-left: 4px solid #ef4444; }
    .error-details h4 { color: #ef4444; margin-bottom: 5px; }
    .error-details pre { background: #fff; padding: 10px; border-radius: 5px; overflow-x: auto; font-size: 0.85rem; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 0.9rem; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔷 Hop Test Report</h1>
      <p>Generated at ${new Date().toISOString()}</p>
    </div>
    
    <div class="summary">
      <div class="card total">
        <h3>Total Tests</h3>
        <div class="value">${summary.total}</div>
      </div>
      <div class="card passed">
        <h3>Passed</h3>
        <div class="value">${summary.passed}</div>
        <div class="progress"><div class="progress-bar" style="width: ${passedPercent}%"></div></div>
      </div>
      <div class="card failed">
        <h3>Failed</h3>
        <div class="value">${summary.failed}</div>
      </div>
      <div class="card skipped">
        <h3>Skipped</h3>
        <div class="value">${summary.skipped}</div>
      </div>
    </div>
    
    <div class="results">
      <h2>Test Results (${(summary.duration / 1000).toFixed(2)}s)</h2>
`;
    
    for (const result of results) {
      const statusIcon = result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⏭️';
      const statusClass = result.status;
      
      html += `
      <div class="test-item ${statusClass}">
        <span class="status">${statusIcon}</span>
        <div class="name">
          <strong>${result.featureName}</strong><br>
          <small>${result.scenarioName}</small>
        </div>
        <div class="duration">${result.duration}ms</div>
      </div>`;
      
      if (result.error) {
        html += `
      <div class="error-details">
        <h4>Error:</h4>
        <pre>${result.error}</pre>
      </div>`;
      }
    }
    
    html += `
    </div>
    
    <div class="footer">
      <p>Hop - High-Performance BDD Testing Framework</p>
    </div>
  </div>
</body>
</html>`;
    
    return html;
  }
}
