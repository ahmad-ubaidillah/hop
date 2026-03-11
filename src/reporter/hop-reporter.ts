import type { TestResult } from '../types/index.js';
import { writeFile, mkdir, readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { HtmlReportBuilder } from './formatters/html-report-builder.js';

/**
 * Hop Reporter - Clean, Simple, Feature-rich HTML Reporter
 * Features:
 * - Light/Dark mode toggle
 * - Charts (trend line)
 * - Filter by: API, UI, Load test
 * - Screenshot only for UI tests
 */
export class HopReporter {
  private outputPath: string;
  private historyPath: string;

  constructor(outputPath: string = './reports') {
    this.outputPath = outputPath;
    this.historyPath = join(outputPath, 'history');
  }

  async generate(results: TestResult[]): Promise<string> {
    const timestamp = Date.now();
    const reportDir = join(this.outputPath, timestamp.toString());
    
    await mkdir(reportDir, { recursive: true });
    await mkdir(this.historyPath, { recursive: true });
    
    const historyFile = join(this.historyPath, `${timestamp}.json`);
    await writeFile(historyFile, JSON.stringify(results, null, 2), 'utf-8');
    
    const historyResults = await this.loadHistory();
    const html = HtmlReportBuilder.buildHtmlReport(results, historyResults, timestamp);
    await writeFile(join(reportDir, 'index.html'), html, 'utf-8');
    
    for (const result of results) {
      if (result.status === 'failed') {
        const detailHtml = HtmlReportBuilder.buildDetailPage(result, timestamp);
        const safeName = HtmlReportBuilder.sanitizeFilename(result.scenarioName);
        await writeFile(join(reportDir, `detail-${safeName}.html`), detailHtml, 'utf-8');
      }
    }
    
    const trendData = this.calculateTrend(historyResults, results);
    await writeFile(join(reportDir, 'trend.json'), JSON.stringify(trendData, null, 2), 'utf-8');
    
    return reportDir;
  }

  async serve(port: number = 9090): Promise<void> {
    const http = await import('http');
    const { readFile, readdir, stat } = await import('fs/promises');
    
    const reports = await readdir(this.outputPath);
    const numericReports = reports
      .filter((r: string) => /^\d+$/.test(r))
      .map((r: string) => parseInt(r))
      .sort((a: number, b: number) => b - a);
    
    if (numericReports.length === 0) {
      console.log('❌ No reports found. Run tests first with --format hop');
      return;
    }
    
    const latestReport = numericReports[0].toString();
    const reportPath = join(this.outputPath, latestReport);
    
    const server = http.createServer(async (req, res) => {
      let urlPath = req.url || '/';
      urlPath = urlPath === '/' ? '/index.html' : urlPath;
      const fullPath = join(reportPath, urlPath);
      
      try {
        const fileStat = await stat(fullPath);
        let contentPath = fullPath;
        if (fileStat.isDirectory()) {
          contentPath = join(fullPath, 'index.html');
        }
        const content = await readFile(contentPath);
        const ext = contentPath.split('.').pop() || 'html';
        const contentType = this.getContentType(ext);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      } catch {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
    });

    server.listen(port, () => {
      console.log(`
╔═══════════════════════════════════════════════════
║         🎯 Hop Reporter
╠═══════════════════════════════════════════════════
║  http://localhost:${port}
║  
║  Available: ${numericReports.slice(0, 3).join(', ')}
╚═══════════════════════════════════════════════════
      `);
    });
  }

  private getContentType(ext: string): string {
    const types: Record<string, string> = {
      'html': 'text/html', 'css': 'text/css', 'js': 'application/javascript',
      'json': 'application/json', 'png': 'image/png', 'jpg': 'image/jpeg',
      'svg': 'image/svg+xml',
    };
    return types[ext] || 'text/plain';
  }

  private async loadHistory(): Promise<TestResult[]> {
    const history: TestResult[] = [];
    try {
      const files = await readdir(this.historyPath);
      const jsonFiles = files.filter((f: string) => f.endsWith('.json')).sort().slice(-30);
      for (const file of jsonFiles) {
        const content = await readFile(join(this.historyPath, file), 'utf-8');
        history.push(...JSON.parse(content));
      }
    } catch {}
    return history;
  }

  private calculateTrend(history: TestResult[], current: TestResult[]) {
    const passed = current.filter(r => r.status === 'passed').length;
    const failed = current.filter(r => r.status === 'failed').length;
    const total = current.length;
    const passRate = total > 0 ? (passed / total * 100) : 0;
    return { current: { passed, failed, total, passRate: passRate.toFixed(1) }, timestamp: Date.now() };
  }

}
