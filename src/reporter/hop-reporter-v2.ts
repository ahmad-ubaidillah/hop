import type { TestResult, StepResult, TestContext } from '../types/index.js';
import { writeFile, mkdir, copyFile, readFile } from 'fs/promises';
import { join, basename, resolve } from 'path';
import { TestResultCollector } from '../engine/test-result-collector.js';

/**
 * Hop Reporter v2.0: The Editor's Choice
 * Premium, standalone HTML report with minimalist design and atomic details.
 */
export class HopReporterV2 {
  private outputDir: string;

  constructor(outputDir: string = './reports') {
    this.outputDir = outputDir;
  }

  /**
   * Generate the premium standalone HTML report
   */
  async generate(results: TestResult[], collector: TestResultCollector): Promise<string> {
    const reportPath = this.outputDir;
    await mkdir(reportPath, { recursive: true });

    const summary = this.calculateSummary(results);
    const mediaResults = await this.bundleMedia(results, reportPath);
    const history = await this.updateHistory(summary);
    
    const html = this.generateHtml(mediaResults, summary, history);
    const finalPath = join(reportPath, 'index.html');
    await writeFile(finalPath, html, 'utf-8');
    
    return finalPath;
  }

  private async updateHistory(summary: any) {
    const hopDir = resolve('.hop');
    const historyPath = join(hopDir, 'history.json');
    
    try {
      await mkdir(hopDir, { recursive: true });
      let history = [];
      try {
        const content = await readFile(historyPath, 'utf-8');
        history = JSON.parse(content);
      } catch (e) {
        // New history file
      }

      const entry = {
        date: new Date().toISOString(),
        ...summary
      };

      history.push(entry);
      
      // Keep last 50 runs
      if (history.length > 50) {
        history = history.slice(-50);
      }

      await writeFile(historyPath, JSON.stringify(history, null, 2), 'utf-8');
      return history;
    } catch (e) {
      console.error('Failed to update Hop history:', e);
      return [];
    }
  }

  private calculateSummary(results: TestResult[]) {
    const total = results.length;
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const duration = results.reduce((acc, r) => acc + r.duration, 0);

    return { total, passed, failed, skipped, duration };
  }

  /**
   * Copy screenshots and videos to the report directory
   */
  private async bundleMedia(results: TestResult[], reportDir: string): Promise<TestResult[]> {
    const assetsDir = join(reportDir, 'assets');
    await mkdir(assetsDir, { recursive: true });

    const bundledResults = [];
    for (const result of results) {
      const newResult = { ...result, steps: [...result.steps] };
      
      if (result.screenshotPath) {
        try {
          const name = basename(result.screenshotPath);
          const dest = join(assetsDir, name);
          await copyFile(result.screenshotPath, dest);
          newResult.screenshotPath = `assets/${name}`;
        } catch (e) {
          console.warn(`Failed to copy screenshot: ${result.screenshotPath}`, e);
          newResult.screenshotPath = undefined;
        }
      }

      if (result.videoPath) {
        try {
          const name = basename(result.videoPath);
          const dest = join(assetsDir, name);
          await copyFile(result.videoPath, dest);
          newResult.videoPath = `assets/${name}`;
        } catch (e) {
          console.warn(`Failed to copy video: ${result.videoPath}`, e);
          newResult.videoPath = undefined;
        }
      }

      // Also handle step-level media if any
      for (let i = 0; i < newResult.steps.length; i++) {
        const step = { ...newResult.steps[i] };
        if (step.screenshotPath) {
          try {
            const name = basename(step.screenshotPath);
            const dest = join(assetsDir, name);
            await copyFile(step.screenshotPath, dest);
            step.screenshotPath = `assets/${name}`;
          } catch (e) {
            step.screenshotPath = undefined;
          }
        }
        newResult.steps[i] = step;
      }
      
      bundledResults.push(newResult);
    }
    return bundledResults;
  }

  private generateHtml(results: TestResult[], summary: any, history: any[]): string {
    const data = JSON.stringify(results);
    const summaryData = JSON.stringify(summary);
    const historyData = JSON.stringify(history);

    return `
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hop Framework - Premium Report</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <style>
        :root {
            --bg: #0a0a0c;
            --surface: #141418;
            --surface-accent: #1c1c21;
            --primary: #6366f1;
            --passed: #10b981;
            --failed: #ef4444;
            --skipped: #f59e0b;
            --text-main: #f8fafc;
            --text-dim: #94a3b8;
            --border: rgba(255, 255, 255, 0.08);
            --shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
            --modal-bg: rgba(0, 0, 0, 0.85);
        }

        [data-theme="light"] {
            --bg: #f8fafc;
            --surface: #ffffff;
            --surface-accent: #f1f5f9;
            --primary: #4f46e5;
            --passed: #059669;
            --failed: #dc2626;
            --skipped: #d97706;
            --text-main: #0f172a;
            --text-dim: #64748b;
            --border: rgba(0, 0, 0, 0.08);
            --shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            --modal-bg: rgba(255, 255, 255, 0.85);
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: var(--bg);
            color: var(--text-main);
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            line-height: 1.5;
            overflow: hidden;
            transition: background 0.3s, color 0.3s;
        }

        .app {
            display: grid;
            grid-template-columns: 340px 1fr;
            height: 100vh;
        }

        /* Sidebar Styling */
        .sidebar {
            background: var(--surface);
            border-right: 1px solid var(--border);
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 20px;
            overflow-y: auto;
        }

        .sidebar-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo {
            font-family: 'Outfit', sans-serif;
            font-size: 24px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .logo span {
            background: var(--primary);
            color: white;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 12px;
        }

        .theme-toggle {
            background: var(--surface-accent);
            border: 1px solid var(--border);
            color: var(--text-main);
            padding: 8px;
            border-radius: 8px;
            cursor: pointer;
            transition: 0.2s;
        }
        .theme-toggle:hover { background: var(--border); }

        .summary-card {
            background: var(--surface-accent);
            border-radius: 16px;
            padding: 20px;
            border: 1px solid var(--border);
            display: flex;
            flex-direction: column;
            gap: 16px;
            box-shadow: var(--shadow);
        }

        .chart-container {
            display: flex;
            justify-content: center;
            position: relative;
            cursor: pointer;
        }

        .chart-label {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            pointer-events: none;
        }

        .chart-label .total { font-size: 24px; font-weight: 700; display: block; }
        .chart-label .sub { font-size: 10px; color: var(--text-dim); text-transform: uppercase; }

        .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }

        .stat-item {
            padding: 12px;
            border-radius: 8px;
            background: rgba(var(--primary), 0.05);
            border: 1px solid transparent;
            cursor: pointer;
            transition: 0.2s;
        }
        .stat-item:hover { border-color: var(--primary); background: rgba(var(--primary), 0.1); }

        .stat-item label { font-size: 11px; color: var(--text-dim); display: block; margin-bottom: 2px; }
        .stat-item value { font-weight: 600; font-size: 16px; }
        .stat-item.passed value { color: var(--passed); }
        .stat-item.failed value { color: var(--failed); }

        .history-section {
            padding-top: 10px;
            border-top: 1px solid var(--border);
        }
        .section-title { font-size: 11px; font-weight: 700; color: var(--text-dim); text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.5px; }

        .nav-links { list-style: none; display: flex; flex-direction: column; gap: 4px; }
        .nav-item {
            padding: 10px 16px;
            border-radius: 8px;
            cursor: pointer;
            transition: 0.2s;
            display: flex;
            align-items: center;
            gap: 12px;
            color: var(--text-dim);
            font-weight: 500;
        }
        .nav-item:hover { background: var(--surface-accent); color: var(--text-main); }
        .nav-item.active { background: var(--primary); color: white; }

        /* Main Content Styling */
        .main {
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background: var(--bg);
        }

        .header {
            padding: 20px 40px;
            border-bottom: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: var(--surface);
            z-index: 10;
        }

        .search-box { position: relative; width: 400px; }
        .search-box input {
            width: 100%;
            background: var(--surface-accent);
            border: 1px solid var(--border);
            padding: 10px 16px;
            border-radius: 12px;
            color: var(--text-main);
            outline: none;
            transition: border-color 0.2s;
        }
        .search-box input:focus { border-color: var(--primary); }

        .content-area {
            flex: 1;
            padding: 40px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 32px;
        }

        .feature-group { display: flex; flex-direction: column; gap: 16px; }
        .feature-title {
            font-weight: 700;
            color: var(--text-main);
            font-size: 16px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .feature-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }

        .test-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 14px;
            overflow: hidden;
            transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
            cursor: pointer;
        }
        .test-card:hover { transform: translateY(-2px); box-shadow: var(--shadow); border-color: var(--primary); }

        .test-header {
            padding: 16px 24px;
            display: grid;
            grid-template-columns: 24px 1fr 150px 80px;
            align-items: center;
            gap: 16px;
        }

        .status-dot { width: 12px; height: 12px; border-radius: 50%; }
        .status-dot.passed { background: var(--passed); box-shadow: 0 0 10px rgba(16, 185, 129, 0.3); }
        .status-dot.failed { background: var(--failed); box-shadow: 0 0 10px rgba(239, 68, 68, 0.3); }

        .test-name { font-weight: 600; color: var(--text-main); }
        .test-meta { color: var(--text-dim); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .test-details {
            padding: 0 24px 24px 64px;
            display: none;
            border-top: 1px solid var(--border);
            padding-top: 24px;
            background: rgba(0,0,0,0.02);
        }
        .test-card.expanded .test-details { display: block; }

        .step { display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border); }
        .step-keyword { color: var(--primary); font-weight: 700; width: 60px; flex-shrink: 0; text-align: right; }
        .step-text { flex: 1; font-weight: 400; }
        .step-dur { color: var(--text-dim); font-size: 11px; font-variant-numeric: tabular-nums; }

        .media-viewer { margin-top: 24px; display: flex; gap: 16px; flex-wrap: wrap; }
        .thumbnail {
            width: 250px;
            background: var(--bg);
            border-radius: 10px;
            overflow: hidden;
            border: 1px solid var(--border);
            position: relative;
            cursor: zoom-in;
            transition: 0.2s;
        }
        .thumbnail:hover { transform: scale(1.02); border-color: var(--primary); }
        .thumbnail img, .thumbnail video { width: 100%; height: 140px; object-fit: cover; display: block; }
        .thumbnail label {
            position: absolute; bottom: 8px; left: 8px; background: rgba(0,0,0,0.7);
            color: white; padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 600;
        }

        .error-pre {
            background: #1e1e1e;
            color: #ff8b8b;
            padding: 16px;
            border-radius: 10px;
            margin-top: 20px;
            font-family: 'JetBrains Mono', 'Monaco', monospace;
            font-size: 13px;
            line-height: 1.6;
            white-space: pre-wrap;
            border-left: 4px solid var(--failed);
            overflow-x: auto;
        }

        /* Premium Lightbox Modal */
        #lightbox {
            display: none;
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: var(--modal-bg);
            z-index: 10000;
            justify-content: center;
            align-items: center;
            backdrop-filter: blur(12px);
            animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .modal-content-wrapper {
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            max-width: 90vw;
            max-height: 90vh;
            animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideUp { from { transform: translateY(20px) scale(0.98); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }

        .modal-media {
            display: block;
            max-width: 100%;
            max-height: calc(90vh - 60px);
            object-fit: contain;
            border-radius: 12px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            background: #000;
        }

        .modal-label {
            margin-top: 16px;
            background: var(--primary);
            color: white;
            padding: 6px 16px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 13px;
        }

        .close-btn {
            position: absolute;
            top: -50px;
            right: 0;
            background: none;
            border: none;
            color: var(--text-main);
            font-size: 32px;
            cursor: pointer;
            padding: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--text-dim); }

    </style>
</head>
<body>
    <div class="app">
        <aside class="sidebar">
            <div class="sidebar-header">
                <div class="logo">HOP <span>2.0</span></div>
                <button class="theme-toggle" onclick="toggleTheme()" title="Toggle Light/Dark Mode">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sun-icon" style="display:none;"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="moon-icon"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                </button>
            </div>
            
            <div class="summary-card">
                <div class="chart-container" onclick="filterResults('all')">
                    <canvas id="summaryDonut" width="160" height="160"></canvas>
                    <div class="chart-label">
                        <span class="total" id="totalCount">0</span>
                        <span class="sub">Tests</span>
                    </div>
                </div>
                <div class="stats-grid">
                    <div class="stat-item passed" onclick="filterResults('passed')">
                        <label>Passed</label>
                        <value id="passedCount">0</value>
                    </div>
                    <div class="stat-item failed" onclick="filterResults('failed')">
                        <label>Failed</label>
                        <value id="failedCount">0</value>
                    </div>
                    <div class="stat-item" onclick="filterResults('all')">
                        <label>Average</label>
                        <value id="avgTime">0ms</value>
                    </div>
                    <div class="stat-item" onclick="filterResults('all')">
                        <label>Efficiency</label>
                        <value id="successRate">0%</value>
                    </div>
                </div>
            </div>

            <div class="history-section">
                <div class="section-title">Historical Trends</div>
                <canvas id="historyChart" height="120"></canvas>
            </div>

            <nav class="nav-links">
                <div class="section-title">Views</div>
                <li class="nav-item active" onclick="filterResults('all')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 21v-7M9 21v-3M14 21v-5M19 21v-10M2 10h20"></path></svg>
                    All Executions
                </li>
                <li class="nav-item" onclick="filterResults('failed')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                    Failed Only
                </li>
                <li class="nav-item" onclick="filterResults('passed')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    Passed Only
                </li>
            </nav>
        </aside>

        <main class="main">
            <header class="header">
                <div class="search-box">
                    <input type="text" placeholder="Search scenarios, features, tags..." oninput="searchTests(this.value)">
                </div>
                <div class="test-meta">
                    Generated <span id="genTime"></span>
                </div>
            </header>

            <div class="content-area" id="resultsArea">
                <!-- Dynamic Content -->
            </div>
        </main>
    </div>

    <div id="lightbox" onclick="closeLightbox()">
        <div class="modal-content-wrapper" onclick="event.stopPropagation()">
            <button class="close-btn" onclick="closeLightbox()">&times;</button>
            <div id="lightbox-content"></div>
            <div id="lightbox-label" class="modal-label"></div>
        </div>
    </div>

    <script id="rawData" type="application/json">${data}</script>
    <script id="summaryData" type="application/json">${summaryData}</script>
    <script id="historyData" type="application/json">${historyData}</script>

    <script>
        const results = JSON.parse(document.getElementById('rawData').textContent);
        const summary = JSON.parse(document.getElementById('summaryData').textContent);
        const history = JSON.parse(document.getElementById('historyData').textContent);
        
        // Initialize Theme
        const currentTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', currentTheme);
        updateThemeIcons(currentTheme);

        function toggleTheme() {
            const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            updateThemeIcons(theme);
            // Refresh charts for theme colors
            initCharts();
        }

        function updateThemeIcons(theme) {
            document.querySelector('.sun-icon').style.display = theme === 'dark' ? 'block' : 'none';
            document.querySelector('.moon-icon').style.display = theme === 'light' ? 'block' : 'none';
        }

        // Dashboard Data
        document.getElementById('totalCount').innerText = summary.total;
        document.getElementById('passedCount').innerText = summary.passed;
        document.getElementById('failedCount').innerText = summary.failed;
        document.getElementById('avgTime').innerText = Math.round(summary.duration / (summary.total || 1)) + 'ms';
        document.getElementById('successRate').innerText = Math.round((summary.passed / (summary.total || 1)) * 100) + '%';
        document.getElementById('genTime').innerText = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let summaryChart, historyChart;

        function initCharts() {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
            const textColor = isDark ? '#94a3b8' : '#64748b';

            if (summaryChart) summaryChart.destroy();
            if (historyChart) historyChart.destroy();

            // Donut Chart
            summaryChart = new Chart(document.getElementById('summaryDonut'), {
                type: 'doughnut',
                data: {
                    labels: ['Passed', 'Failed', 'Skipped'],
                    datasets: [{
                        data: [summary.passed, summary.failed, summary.skipped],
                        backgroundColor: [
                            isDark ? '#10b981' : '#059669',
                            isDark ? '#ef4444' : '#dc2626',
                            isDark ? '#f59e0b' : '#d97706'
                        ],
                        borderWidth: 0,
                        cutout: '80%'
                    }]
                },
                options: {
                    plugins: { legend: { display: false } },
                    animation: { animateRotate: true, duration: 1000 }
                }
            });

            // Trend Chart
            historyChart = new Chart(document.getElementById('historyChart'), {
                type: 'line',
                data: {
                    labels: history.map((_, i) => i + 1),
                    datasets: [{
                        label: 'Pass Rate %',
                        data: history.map(h => Math.round((h.passed / h.total) * 100)),
                        borderColor: '#6366f1',
                        borderWidth: 2,
                        fill: true,
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        tension: 0.4,
                        pointRadius: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { display: false },
                        y: { 
                            min: 0, max: 100,
                            grid: { color: gridColor },
                            ticks: { color: textColor, font: { size: 9 }, stepSize: 50 }
                        }
                    }
                }
            });
        }

        function renderResults(filtered) {
            const area = document.getElementById('resultsArea');
            area.innerHTML = '';
            
            if (filtered.length === 0) {
                area.innerHTML = '<div style="text-align:center; padding: 100px; color: var(--text-dim);">No matching results found</div>';
                return;
            }

            const groups = filtered.reduce((acc, r) => {
                if (!acc[r.featureName]) acc[r.featureName] = [];
                acc[r.featureName].push(r);
                return acc;
            }, {});

            Object.entries(groups).forEach(([feature, tests]) => {
                const groupDiv = document.createElement('div');
                groupDiv.className = 'feature-group';
                groupDiv.innerHTML = \`<div class="feature-title">\${feature}</div>\`;
                
                tests.forEach(test => {
                    const card = document.createElement('div');
                    card.id = 'test-' + test.scenarioName.replace(/\\s+/g, '-');
                    card.className = \`test-card \${test.status}\`;
                    card.innerHTML = \`
                        <div class="test-header" onclick="toggleCard(this.parentElement)">
                            <div class="status-dot \${test.status}"></div>
                            <div class="test-name">\${test.scenarioName}</div>
                            <div class="test-meta">\${test.tags.map(t => '#' + t).join(' ')}</div>
                            <div class="test-meta">\${test.duration}ms</div>
                        </div>
                        <div class="test-details">
                            <div class="steps-area">
                                \${test.steps.map(s => \`
                                    <div class="step">
                                        <div class="step-keyword">\${s.step.keyword}</div>
                                        <div class="step-text">\${s.step.text}</div>
                                        <div class="step-dur">\${s.duration}ms</div>
                                    </div>
                                \`).join('')}
                            </div>
                            \${test.error ? \`<pre class="error-pre">\${test.error}</pre>\` : ''}
                            <div class="media-viewer">
                                \${test.screenshotPath ? \`
                                    <div class="thumbnail" onclick="openLightbox('\${test.screenshotPath}', 'Scenario Failure Screenshot')">
                                        <img src="\${test.screenshotPath}">
                                        <label>Screenshot</label>
                                    </div>
                                \` : ''}
                                \${test.videoPath ? \`
                                    <div class="thumbnail" onclick="openLightbox('\${test.videoPath}', 'Execution Video', true)">
                                        <video src="\${test.videoPath}" preload="metadata"></video>
                                        <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); pointer-events:none;">
                                            <svg width="40" height="40" viewBox="0 0 24 24" fill="white" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5))"><path d="M8 5v14l11-7z"/></svg>
                                        </div>
                                        <label>Execution Video</label>
                                    </div>
                                \` : ''}
                            </div>
                        </div>
                    \`;
                    groupDiv.appendChild(card);
                });
                area.appendChild(groupDiv);
            });
        }

        function toggleCard(card) {
            const isExpanded = card.classList.contains('expanded');
            // Close others if you want, or just toggle
            card.classList.toggle('expanded');
        }

        function filterResults(type) {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            // Find the item matching the type if possible, or use current target
            if (event && event.currentTarget && event.currentTarget.classList.contains('nav-item')) {
              event.currentTarget.classList.add('active');
            }
            
            if (type === 'all') renderResults(results);
            else renderResults(results.filter(r => r.status === type));
        }

        function searchTests(query) {
            const q = query.toLowerCase();
            const filtered = results.filter(r => 
                r.scenarioName.toLowerCase().includes(q) || 
                r.featureName.toLowerCase().includes(q) ||
                r.tags.some(t => t.toLowerCase().includes(q))
            );
            renderResults(filtered);
        }

        function openLightbox(src, label, isVideo = false) {
            const lb = document.getElementById('lightbox');
            const content = document.getElementById('lightbox-content');
            document.getElementById('lightbox-label').innerText = label;
            
            if (isVideo) {
                content.innerHTML = '<video src="' + src + '" class="modal-media" controls autoplay></video>';
            } else {
                content.innerHTML = '<img src="' + src + '" class="modal-media">';
            }
            
            lb.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }

        function closeLightbox() {
            const lb = document.getElementById('lightbox');
            const content = document.getElementById('lightbox-content');
            lb.style.display = 'none';
            content.innerHTML = ''; // Stop video playback
            document.body.style.overflow = '';
        }

        // Global Key Listener
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeLightbox();
        });

        initCharts();
        renderResults(results);
    </script>
</body>
</html>
`;
  }
}
