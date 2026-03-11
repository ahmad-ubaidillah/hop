import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { TestResult } from '../types/index.js';
import type { TestResultCollector } from '../engine/test-result-collector.js';

export class HtmlReporter {
  private outputDir: string = './reports';
  
  constructor(outputDir?: string) {
    if (outputDir) {
      this.outputDir = outputDir;
    }
  }

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
    
    console.log(`✨ Premium Report generated: ${outputPath}`);
  }
  
  private generateHtml(
    results: TestResult[],
    summary: { total: number; passed: number; failed: number; skipped: number; duration: number },
    failedTests: any[]
  ): string {
    const passedPercent = summary.total > 0 ? Math.round((summary.passed / summary.total) * 100) : 0;
    const failedPercent = summary.total > 0 ? Math.round((summary.failed / summary.total) * 100) : 0;
    
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hop Premium Test Report</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-deep: #0f172a;
            --bg-card: rgba(30, 41, 59, 0.7);
            --primary: #6366f1;
            --success: #10b981;
            --error: #ef4444;
            --warning: #f59e0b;
            --text-main: #f8fafc;
            --text-dim: #94a3b8;
            --glass-border: rgba(255, 255, 255, 0.1);
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body { 
            font-family: 'Outfit', sans-serif; 
            background-color: var(--bg-deep); 
            background-image: 
                radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 40%),
                radial-gradient(circle at 90% 80%, rgba(16, 185, 129, 0.1) 0%, transparent 40%);
            color: var(--text-main); 
            padding: 40px 20px;
            min-height: 100vh;
            line-height: 1.6;
        }

        .container { max-width: 1200px; margin: 0 auto; }

        header {
            margin-bottom: 50px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            animation: fadeInDown 0.8s ease-out;
        }

        .brand h1 { 
            font-size: 3.5rem; 
            font-weight: 700; 
            letter-spacing: -2px;
            background: linear-gradient(to right, #818cf8, #34d399);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 5px;
        }

        .brand p { color: var(--text-dim); font-size: 1.1rem; }

        .timestamp { text-align: right; color: var(--text-dim); }

        .dashboard { 
            display: grid; 
            grid-template-columns: repeat(4, 1fr); 
            gap: 20px; 
            margin-bottom: 40px; 
            animation: fadeInUp 0.8s ease-out 0.2s both;
        }

        .stat-card {
            background: var(--bg-card);
            backdrop-filter: blur(12px);
            border: 1px solid var(--glass-border);
            padding: 25px;
            border-radius: 24px;
            transition: transform 0.3s ease, border-color 0.3s ease;
        }

        .stat-card:hover { 
            transform: translateY(-5px); 
            border-color: rgba(255, 255, 255, 0.2);
        }

        .stat-card h3 { font-size: 0.9rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: var(--text-dim); margin-bottom: 10px; }
        .stat-card .value { font-size: 2.5rem; font-weight: 700; color: white; }
        
        .stat-card.passed .value { color: var(--success); }
        .stat-card.failed .value { color: var(--error); }

        .progress-section {
            margin-bottom: 50px;
            animation: fadeIn 1s ease-out 0.4s both;
        }

        .progress-meta { display: flex; justify-content: space-between; margin-bottom: 15px; font-weight: 600; }
        
        .main-progress { 
            height: 12px; 
            background: rgba(255,255,255,0.05); 
            border-radius: 6px; 
            overflow: hidden; 
            display: flex;
        }

        .bar-passed { background: var(--success); height: 100%; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1); }
        .bar-failed { background: var(--error); height: 100%; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1); }

        .filters {
            display: flex;
            gap: 15px;
            margin-bottom: 30px;
            animation: fadeIn 1s ease-out 0.6s both;
        }

        .filter-btn {
            background: var(--bg-card);
            border: 1px solid var(--glass-border);
            color: var(--text-main);
            padding: 10px 20px;
            border-radius: 12px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
        }

        .filter-btn:hover { background: rgba(255,255,255,0.1); }
        .filter-btn.active { background: var(--primary); border-color: var(--primary); }

        .results-table {
            background: var(--bg-card);
            backdrop-filter: blur(12px);
            border: 1px solid var(--glass-border);
            border-radius: 24px;
            overflow: hidden;
            animation: fadeIn 1s ease-out 0.8s both;
        }

        .feature-group { border-bottom: 1px solid var(--glass-border); }
        .feature-header { 
            padding: 20px 30px; 
            background: rgba(255,255,255,0.03); 
            display: flex; 
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
        }

        .feature-header h2 { font-size: 1.25rem; font-weight: 600; }

        .scenario-item {
            padding: 15px 30px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            display: flex;
            align-items: center;
            gap: 20px;
            transition: background 0.2s ease;
        }

        .scenario-item:hover { background: rgba(255,255,255,0.02); }

        .status-badge {
            width: 10px;
            height: 10px;
            border-radius: 50%;
        }

        .status-badge.passed { background: var(--success); box-shadow: 0 0 10px var(--success); }
        .status-badge.failed { background: var(--error); box-shadow: 0 0 10px var(--error); }

        .scenario-info { flex: 1; }
        .scenario-info .name { font-weight: 600; font-size: 1.05rem; }
        .scenario-info .tags { font-size: 0.8rem; color: var(--primary); margin-top: 4px; }

        .duration { font-family: 'JetBrains Mono', monospace; font-size: 0.9rem; color: var(--text-dim); }

        .error-block {
            margin: 10px 30px 20px;
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 12px;
            padding: 20px;
        }

        .error-block h4 { color: var(--error); margin-bottom: 10px; font-size: 0.9rem; text-transform: uppercase; }
        .error-block pre { 
            font-family: 'JetBrains Mono', monospace; 
            font-size: 0.85rem; 
            color: #fecaca; 
            white-space: pre-wrap;
            background: rgba(0,0,0,0.2);
            padding: 15px;
            border-radius: 8px;
        }

        .screenshot-thumb {
            margin-top: 15px;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid var(--glass-border);
            max-width: 400px;
        }

        .screenshot-thumb img { width: 100%; display: block; }

        footer { text-align: center; margin-top: 60px; color: var(--text-dim); font-size: 0.9rem; }

        @keyframes fadeInDown {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .hidden { display: none; }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div class="brand">
                <h1>HOP</h1>
                <p>High-Performance BDD Test Report</p>
            </div>
            <div class="timestamp">
                <p>Execution Date</p>
                <strong>${new Date().toLocaleString()}</strong>
            </div>
        </header>

        <div class="dashboard">
            <div class="stat-card">
                <h3>Total Scenarios</h3>
                <div class="value">${summary.total}</div>
            </div>
            <div class="stat-card passed">
                <h3>Passed</h3>
                <div class="value">${summary.passed}</div>
            </div>
            <div class="stat-card failed">
                <h3>Failed</h3>
                <div class="value">${summary.failed}</div>
            </div>
            <div class="stat-card">
                <h3>Total Time</h3>
                <div class="value">${(summary.duration / 1000).toFixed(2)}s</div>
            </div>
        </div>

        <div class="progress-section">
            <div class="progress-meta">
                <span>Pass Rate: ${passedPercent}%</span>
                <span>Failure Rate: ${failedPercent}%</span>
            </div>
            <div class="main-progress">
                <div class="bar-passed" style="width: ${passedPercent}%"></div>
                <div class="bar-failed" style="width: ${failedPercent}%"></div>
            </div>
        </div>

        <div class="filters">
            <button class="filter-btn active" onclick="filterResults('all')">All Tests</button>
            <button class="filter-btn" onclick="filterResults('passed')">Passed</button>
            <button class="filter-btn" onclick="filterResults('failed')">Failed</button>
        </div>

        <div class="results-table">
            <div id="results-container">
                ${this.renderResults(results)}
            </div>
        </div>

        <footer>
            <p>&copy; ${new Date().getFullYear()} Hop Framework. Engineering Excellence.</p>
        </footer>
    </div>

    <script>
        function filterResults(status) {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');

            const items = document.querySelectorAll('.scenario-item');
            const errors = document.querySelectorAll('.error-block');
            
            items.forEach((item, idx) => {
                const itemStatus = item.getAttribute('data-status');
                const errorBlock = item.nextElementSibling?.classList.contains('error-block') ? item.nextElementSibling : null;
                
                if (status === 'all' || itemStatus === status) {
                    item.classList.remove('hidden');
                    if (errorBlock && itemStatus === 'failed') errorBlock.classList.remove('hidden');
                } else {
                    item.classList.add('hidden');
                    if (errorBlock) errorBlock.classList.add('hidden');
                }
            });
        }
    </script>
</body>
</html>`;
    
    return html;
  }

  private renderResults(results: TestResult[]): string {
    // Group by feature
    const features: Record<string, TestResult[]> = {};
    results.forEach(r => {
      if (!features[r.featureName]) features[r.featureName] = [];
      features[r.featureName].push(r);
    });

    let html = '';
    for (const [featureName, scenarios] of Object.entries(features)) {
      html += `
        <div class="feature-group">
            <div class="feature-header">
                <h2>📁 ${featureName}</h2>
                <span>${scenarios.length} Scenarios</span>
            </div>
            <div class="scenarios">
                ${scenarios.map(s => this.renderScenario(s)).join('')}
            </div>
        </div>`;
    }
    return html;
  }

  private renderScenario(s: TestResult): string {
    const tags = s.tags.length > 0 ? `<div class="tags">${s.tags.map(t => `@${t}`).join(' ')}</div>` : '';
    let html = `
        <div class="scenario-item" data-status="${s.status}">
            <div class="status-badge ${s.status}"></div>
            <div class="scenario-info">
                <div class="name">${s.scenarioName}</div>
                ${tags}
            </div>
            <div class="duration">${s.duration}ms</div>
        </div>`;
    
    if (s.status === 'failed') {
      html += `
        <div class="error-block" data-status="failed">
            <h4>Failed at assertion</h4>
            <pre>${s.error || 'Unknown error'}</pre>
            ${s.screenshotPath ? `
            <div class="screenshot-thumb">
                <p style="font-size: 0.8rem; margin-bottom: 5px; color: var(--text-dim)">Screenshot on failure:</p>
                <img src="${s.screenshotPath}" alt="Screenshot">
            </div>` : ''}
        </div>`;
    }
    
    return html;
  }
}
