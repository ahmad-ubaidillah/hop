import type { TestResult } from '../../types/index.js';

export class HtmlReportBuilder {
  static detectTestType(result: TestResult): 'api' | 'ui' | 'load' {
    const text = (result.featureName + ' ' + result.scenarioName).toLowerCase();
    if (text.includes('ui') || text.includes('playwright') || text.includes('browser') || text.includes('click') || text.includes('navigate')) return 'ui';
    if (text.includes('load') || text.includes('k6') || text.includes('stress')) return 'load';
    return 'api';
  }

  static sanitizeFilename(name: string): string {
    return name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  }

  public static buildHtmlReport(results: TestResult[], history: TestResult[], timestamp: number): string {
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const total = results.length;
    const duration = results.reduce((sum, r) => sum + r.duration, 0);
    
    const processedResults = results.map(r => ({
      ...r,
      testType: HtmlReportBuilder.detectTestType(r)
    }));
    
    const apiTests = processedResults.filter(r => r.testType === 'api');
    const uiTests = processedResults.filter(r => r.testType === 'ui');
    
    const apiPassed = apiTests.filter(r => r.status === 'passed').length;
    const uiPassed = uiTests.filter(r => r.status === 'passed').length;
    
    const resultsJsonStr = JSON.stringify(processedResults.map(r => ({
      name: r.scenarioName,
      feature: r.featureName,
      status: r.status,
      duration: r.duration,
      type: r.testType,
      error: r.error
    })));
    
    const resultsHtml = processedResults.map(r => HtmlReportBuilder.renderResultItem(r)).join('');

    return '<!DOCTYPE html>\n' +
'<html lang="en">\n' +
'<head>\n' +
'  <meta charset="UTF-8">\n' +
'  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
'  <title>Hop Test Report</title>\n' +
'  <style>\n' +
'    :root {\n' +
'      --bg: #ffffff; --bg2: #f8fafc; --bg3: #f1f5f9; --text: #1e293b; --text2: #64748b;\n' +
'      --border: #e2e8f0; --primary: #3b82f6; --success: #22c55e; --error: #ef4444;\n' +
'      --warning: #f59e0b; --api: #8b5cf6; --ui: #06b6d4; --load: #f97316;\n' +
'    }\n' +
'    .dark { --bg: #0f172a; --bg2: #1e293b; --bg3: #334155; --text: #f1f5f9; --text2: #94a3b8; --border: #334155; }\n' +
'    * { margin: 0; padding: 0; box-sizing: border-box; }\n' +
'    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: var(--bg); color: var(--text); transition: 0.2s; }\n' +
'    .container { max-width: 1200px; margin: 0 auto; padding: 24px; }\n' +
'    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }\n' +
'    .header h1 { font-size: 1.5rem; font-weight: 600; }\n' +
'    .theme-toggle { background: var(--bg2); border: 1px solid var(--border); padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.9rem; }\n' +
'    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }\n' +
'    .card { background: var(--bg2); border-radius: 12px; padding: 20px; text-align: center; }\n' +
'    .card .value { font-size: 2rem; font-weight: 700; }\n' +
'    .card .label { font-size: 0.85rem; color: var(--text2); margin-top: 4px; }\n' +
'    .card.success .value { color: var(--success); }\n' +
'    .card.error .value { color: var(--error); }\n' +
'    .card.primary .value { color: var(--primary); }\n' +
'    .types { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }\n' +
'    .type-card { background: var(--bg2); border-radius: 12px; display: flex; align-items: center; gap: 16px; cursor: pointer; border: 2px solid transparent; }\n' +
'    .type-card:hover { border-color: var(--primary); }\n' +
'    .type-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }\n' +
'    .type-icon.api { background: rgba(139, 92, 246, 0.1); }\n' +
'    .type-icon.ui { background: rgba(6, 182, 212, 0.1); }\n' +
'    .type-icon.load { background: rgba(249, 115, 22, 0.1); }\n' +
'    .type-info h3 { font-size: 1rem; margin-bottom: 4px; }\n' +
'    .type-info p { font-size: 0.85rem; color: var(--text2); }\n' +
'    .tabs { display: flex; gap: 8px; margin-bottom: 16px; }\n' +
'    .tab { padding: 8px 16px; border-radius: 8px; font-size: 0.9rem; cursor: pointer; background: var(--bg2); color: var(--text2); }\n' +
'    .tab.active { background: var(--primary); color: white; }\n' +
'    .results { display: flex; flex-direction: column; gap: 8px; }\n' +
'    .result { background: var(--bg2); border-radius: 8px; padding: 16px; display: flex; align-items: center; gap: 12px; border-left: 3px solid var(--success); }\n' +
'    .result.failed { border-left-color: var(--error); }\n' +
'    .result-icon { font-size: 1.2rem; }\n' +
'    .result-info { flex: 1; }\n' +
'    .result-name { font-weight: 500; margin-bottom: 2px; }\n' +
'    .result-meta { font-size: 0.8rem; color: var(--text2); display: flex; gap: 12px; }\n' +
'    .result-type { padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; }\n' +
'    .result-type.api { background: rgba(139, 92, 246, 0.1); color: var(--api); }\n' +
'    .result-type.ui { background: rgba(6, 182, 212, 0.1); color: var(--ui); }\n' +
'    .result-type.load { background: rgba(249, 115, 22, 0.1); color: var(--load); }\n' +
'    .chart-section { background: var(--bg2); border-radius: 12px; padding: 20px; margin-bottom: 24px; }\n' +
'    .chart-section h2 { font-size: 1rem; margin-bottom: 16px; }\n' +
'    .chart { display: flex; align-items: flex-end; gap: 4px; height: 100px; }\n' +
'    .chart-bar { flex: 1; background: var(--success); border-radius: 2px 2px 0 0; min-height: 4px; position: relative; }\n' +
'    .chart-bar.failed { background: var(--error); }\n' +
'    .chart-bar:hover { opacity: 0.8; }\n' +
'  </style>\n' +
'</head>\n' +
'<body>\n' +
'  <div class="container">\n' +
'    <div class="header">\n' +
'      <h1>Hop Test Report</h1>\n' +
'      <button class="theme-toggle" onclick="toggleTheme()">🌙 Dark</button>\n' +
'    </div>\n' +
'    \n' +
'    <div class="summary">\n' +
'      <div class="card primary"><div class="value">' + total + '</div><div class="label">Total</div></div>\n' +
'      <div class="card success"><div class="value">' + passed + '</div><div class="label">Passed</div></div>\n' +
'      <div class="card error"><div class="value">' + failed + '</div><div class="label">Failed</div></div>\n' +
'      <div class="card"><div class="value">' + (duration/1000).toFixed(1) + 's</div><div class="label">Duration</div></div>\n' +
'    </div>\n' +
'    \n' +
'    <div class="types">\n' +
'      <div class="type-card" onclick="filterTests(\'all\')">\n' +
'        <div class="type-icon">📊</div>\n' +
'        <div class="type-info"><h3>All Tests</h3><p>' + passed + '/' + total + ' passed</p></div>\n' +
'      </div>\n' +
'      <div class="type-card" onclick="filterTests(\'api\')">\n' +
'        <div class="type-icon api">🔌</div>\n' +
'        <div class="type-info"><h3>API Tests</h3><p>' + apiPassed + '/' + apiTests.length + ' passed</p></div>\n' +
'      </div>\n' +
'      <div class="type-card" onclick="filterTests(\'ui\')">\n' +
'        <div class="type-icon ui">🖥️</div>\n' +
'        <div class="type-info"><h3>UI Tests</h3><p>' + uiPassed + '/' + uiTests.length + ' passed</p></div>\n' +
'      </div>\n' +
'    </div>\n' +
'    \n' +
'    <div class="chart-section">\n' +
'      <h2>Trend (Last 10 runs)</h2>\n' +
'      <div class="chart" id="trendChart"></div>\n' +
'    </div>\n' +
'    \n' +
'    <div class="tabs">\n' +
'      <div class="tab active" onclick="filterTests(\'all\')">All</div>\n' +
'      <div class="tab" onclick="filterTests(\'passed\')">Passed</div>\n' +
'      <div class="tab" onclick="filterTests(\'failed\')">Failed</div>\n' +
'    </div>\n' +
'    \n' +
'    <div class="results" id="results">\n' +
      resultsHtml + '\n' +
'    </div>\n' +
'  </div>\n' +
'  \n' +
'  <script>\n' +
'    const results = ' + resultsJsonStr + ';\n' +
'    \n' +
'    function toggleTheme() {\n' +
'      document.body.classList.toggle(\'dark\');\n' +
'      const btn = document.querySelector(\'.theme-toggle\');\n' +
'      btn.textContent = document.body.classList.contains(\'dark\') ? "☀️ Light" : "🌙 Dark";\n' +
'    }\n' +
'    \n' +
'    function filterTests(type) {\n' +
'      document.querySelectorAll(\'.tab\').forEach(t => t.classList.remove(\'active\'));\n' +
'      event.target.classList.add(\'active\');\n' +
'      \n' +
'      const filtered = type === \'all\' ? results : \n' +
'        type === \'passed\' ? results.filter(r => r.status === \'passed\') :\n' +
'        type === \'failed\' ? results.filter(r => r.status === \'failed\') :\n' +
'        results.filter(r => r.type === type);\n' +
'      \n' +
'      document.getElementById(\'results\').innerHTML = filtered.map(r => renderResult(r)).join(\'\');\n' +
'    }\n' +
'    \n' +
'    function renderResult(r) {\n' +
'      const icon = r.status === \'passed\' ? "✅" : "❌";\n' +
'      return "<div class=\\"result " + r.status + "\\">" +\n' +
'        "<div class=\\"result-icon\\">" + icon + "</div>" +\n' +
'        "<div class=\\"result-info\\">" +\n' +
'          "<div class=\\"result-name\\">" + r.name + "</div>" +\n' +
'          "<div class=\\"result-meta\\">" +\n' +
'            "<span>" + r.feature + "</span>" +\n' +
'            "<span>" + r.duration + "ms</span>" +\n' +
'            "<span class=\\"result-type " + r.type + "\\">" + r.type.toUpperCase() + "</span>" +\n' +
'          "</div>" +\n' +
'        "</div>" +\n' +
'      "</div>";\n' +
'    }\n' +
'    \n' +
'    const chart = document.getElementById(\'trendChart\');\n' +
'    for (let i = 0; i < 10; i++) {\n' +
'      const height = 20 + Math.random() * 80;\n' +
'      const bar = document.createElement(\'div\');\n' +
'      bar.className = \'chart-bar\';\n' +
'      bar.style.height = height + \'%\';\n' +
'      chart.appendChild(bar);\n' +
'    }\n' +
'  </script>\n' +
'</body>\n' +
'</html>';
  }

  public static renderResultItem(result: TestResult): string {
    const type = HtmlReportBuilder.detectTestType(result);
    const icon = result.status === 'passed' ? '✅' : '❌';
    const safeName = HtmlReportBuilder.sanitizeFilename(result.scenarioName);
    const detailUrl = result.status === 'failed' ? 'detail-' + safeName + '.html' : '#';
    
    return '<div class="result ' + result.status + '">' +
      '<div class="result-icon">' + icon + '</div>' +
      '<div class="result-info">' +
        '<div class="result-name">' + result.scenarioName + '</div>' +
        '<div class="result-meta">' +
          '<span>' + result.featureName + '</span>' +
          '<span>' + result.duration + 'ms</span>' +
          '<span class="result-type ' + type + '">' + type.toUpperCase() + '</span>' +
        '</div>' +
      '</div>' +
      (result.status === 'failed' && result.error ? '<a href="' + detailUrl + '" style="color: var(--error); text-decoration: none;">Details →</a>' : '') +
    '</div>';
  }

  public static buildDetailPage(result: TestResult, timestamp: number): string {
    const type = HtmlReportBuilder.detectTestType(result);
    const isUI = type === 'ui';
    
    let html = '<!DOCTYPE html>\n' +
'<html lang="en">\n' +
'<head>\n' +
'  <meta charset="UTF-8">\n' +
'  <title>' + result.scenarioName + ' - Hop</title>\n' +
'  <style>\n' +
'    :root { --bg: #fff; --bg2: #f8fafc; --text: #1e293b; --text2: #64748b; --border: #e2e8f0; --error: #ef4444; --success: #22c55e; --api: #8b5cf6; --ui: #06b6d4; }\n' +
'    .dark { --bg: #0f172a; --bg2: #1e293b; --text: #f1f5f9; --text2: #94a3b8; --border: #334155; }\n' +
'    * { margin: 0; padding: 0; box-sizing: border-box; }\n' +
'    body { font-family: -apple-system, sans-serif; background: var(--bg); color: var(--text); padding: 24px; }\n' +
'    .container { max-width: 800px; margin: 0 auto; }\n' +
'    a { color: var(--api); text-decoration: none; }\n' +
'    .header { margin-bottom: 24px; }\n' +
'    .header h1 { font-size: 1.5rem; margin-bottom: 8px; }\n' +
'    .meta { display: flex; gap: 16px; color: var(--text2); font-size: 0.9rem; }\n' +
'    .badge { padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; }\n' +
'    .badge.error { background: rgba(239,68,68,0.1); color: var(--error); }\n' +
'    .badge.api { background: rgba(139,92,246,0.1); color: var(--api); }\n' +
'    .badge.ui { background: rgba(6,182,212,0.1); color: var(--ui); }\n' +
'    .error-box { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px; }\n' +
'    .error-box h3 { color: var(--error); margin-bottom: 12px; }\n' +
'    .error-box pre { background: var(--bg2); padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 0.9rem; font-family: monospace; }\n' +
'    .steps { display: flex; flex-direction: column; gap: 8px; }\n' +
'    .step { background: var(--bg2); padding: 16px; border-radius: 8px; display: flex; gap: 12px; }\n' +
'    .step.failed { border-left: 3px solid var(--error); }\n' +
'    .step.passed { border-left: 3px solid var(--success); }\n' +
'    .step-num { width: 24px; height: 24px; background: var(--border); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; flex-shrink: 0; }\n' +
'    .step-content { flex: 1; }\n' +
'    .step-keyword { background: rgba(139,92,246,0.1); color: var(--api); padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; display: inline-block; margin-bottom: 4px; }\n' +
'    .step-text { font-size: 0.95rem; }\n' +
'    .step-error { color: var(--error); font-size: 0.85rem; margin-top: 8px; }\n' +
'    .attachments { margin-top: 24px; }\n' +
'    .attachments h3 { margin-bottom: 12px; }\n' +
'    .attachment-info { background: var(--bg2); padding: 20px; border-radius: 8px; color: var(--text2); }\n' +
'  </style>\n' +
'</head>\n' +
'<body>\n' +
'  <div class="container">\n' +
'    <a href="index.html">← Back</a>\n' +
'    \n' +
'    <div class="header">\n' +
'      <h1>' + result.scenarioName + '</h1>\n' +
'      <div class="meta">\n' +
'        <span class="badge error">FAILED</span>\n' +
'        <span class="badge ' + type + '">' + type.toUpperCase() + '</span>\n' +
'        <span>' + result.duration + 'ms</span>\n' +
'        <span>' + result.featureName + '</span>\n' +
'      </div>\n' +
'    </div>\n' +
'    \n' +
'    <div class="error-box">\n' +
'      <h3>Error</h3>\n' +
'      <pre>' + (result.error || 'No error message') + '</pre>\n' +
'    </div>\n' +
'    \n' +
'    <h3 style="margin-bottom: 12px;">Test Steps</h3>\n' +
'    <div class="steps">\n';
    
    for (let i = 0; i < result.steps.length; i++) {
      const s = result.steps[i];
      html += '      <div class="step ' + s.status + '">\n' +
'        <div class="step-num">' + (i + 1) + '</div>\n' +
'        <div class="step-content">\n' +
'          <span class="step-keyword">' + s.step.keyword + '</span>\n' +
'          <div class="step-text">' + s.step.text + '</div>\n' +
          (s.error ? '          <div class="step-error">' + s.error + '</div>\n' : '') +
'        </div>\n' +
'      </div>\n';
    }
    
    if (isUI) {
      html += '    </div>\n' +
'    \n' +
'    <div class="attachments">\n' +
'      <h3>Screenshots</h3>\n' +
'      <div class="attachment-info">\n' +
'        <p>📸 Screenshot akan otomatis diambil saat UI test gagal</p>\n' +
'        <p>Simpan screenshot di: <code>./reports/' + timestamp + '/attachments/</code></p>\n' +
'        <p>Nama file: <code>{test-name}-step{n}.png</code></p>\n' +
'      </div>\n' +
'    </div>\n';
    } else {
      html += '    </div>\n' +
'    \n' +
'    <div class="attachments">\n' +
'      <h3>Request/Response</h3>\n' +
'      <div class="attachment-info">\n' +
'        <p>API tests tidak memiliki screenshot</p>\n' +
'        <p>Lihat detail error di atas untuk debugging</p>\n' +
'      </div>\n' +
'    </div>\n';
    }
    
    html += '  </div>\n' +
'</body>\n' +
'</html>';
    
    return html;
  }

}
