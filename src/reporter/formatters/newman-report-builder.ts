import type { TestResult, StepResult } from '../../types/index.js';

/**
 * NewmanReportBuilder: Generates a Newman-style dashboard report.
 * Inspired by DannyDainton's newman-reporter-htmlextra.
 */
export class NewmanReportBuilder {
  public static buildHtmlReport(results: TestResult[], timestamp: string): string {
    const totalIterations = results.length;
    const totalAssertions = results.reduce((acc, r) => acc + r.steps.length, 0);
    const failedTests = results.filter(r => r.status === 'failed').length;
    const skippedTests = results.filter(r => r.status === 'skipped').length;
    const totalPassed = results.filter(r => r.status === 'passed').length;
    const duration = results.reduce((acc, r) => acc + r.duration, 0);

    const resultsJson = JSON.stringify(results);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hop - Newman Run Dashboard</title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdn.datatables.net/1.10.19/css/dataTables.bootstrap4.min.css">
    <link href="https://fonts.googleapis.com/css?family=Open+Sans:400,600,700" rel="stylesheet">
    <style>
        body {
            background-color: #f8f9fa;
            font-family: 'Open Sans', sans-serif;
            font-size: 14px;
        }
        .container { max-width: 1200px; }
        .dashboard-header {
            background: #fff;
            padding: 20px 0;
            margin-bottom: 30px;
            border-bottom: 1px solid #dee2e6;
        }
        .dashboard-title {
            color: #333;
            font-weight: 700;
            font-size: 48px;
            margin-bottom: 5px;
        }
        .dashboard-timestamp {
            color: #666;
            font-size: 16px;
        }
        .metric-card {
            border-radius: 4px;
            padding: 20px;
            color: #fff;
            text-align: left;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .metric-card h6 {
            text-transform: uppercase;
            font-size: 11px;
            font-weight: 700;
            margin-bottom: 5px;
            opacity: 0.8;
        }
        .metric-value {
            font-size: 48px;
            font-weight: 400;
            line-height: 1;
        }
        .bg-teal { background-color: #008c99; }
        .bg-green { background-color: #28a745; }
        .bg-red { background-color: #dc3545; }
        .bg-orange { background-color: #ffc107; color: #333 !important; }
        
        .nav-pills .nav-link {
            border-radius: 0;
            color: #fff;
            background: #999;
            padding: 10px 20px;
            font-weight: 600;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .nav-pills .nav-link.active {
            background-color: #fff !important;
            color: #333 !important;
        }

        /* Color-coded tabs when active */
        .nav-pills .nav-link#pills-summary-tab.active { border-top: 3px solid #008c99; }
        .nav-pills .nav-link#pills-requests-tab.active { border-top: 3px solid #008c99; }
        .nav-pills .nav-link#pills-failed-tab.active { border-top: 3px solid #dc3545; }
        .nav-pills .nav-link#pills-skipped-tab.active { border-top: 3px solid #ffc107; }

        /* Color-coded tabs when not active (Newman style) */
        #pills-summary-tab:not(.active) { background-color: #008c99; }
        #pills-requests-tab:not(.active) { background-color: #008c99; }
        #pills-failed-tab:not(.active) { background-color: #dc3545; }
        #pills-skipped-tab:not(.active) { background-color: #ffc107; color: #333 !important; }

        .nav-container {
            background: #333;
            margin-bottom: 30px;
        }
        
        .section-header {
            background-color: #008c99;
            color: white;
            padding: 8px 15px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            margin-bottom: 0;
        }
        .info-box {
            background: #fff;
            border: 1px solid #008c99;
            margin-bottom: 20px;
            border-radius: 4px;
            overflow: hidden;
        }
        .info-content {
            padding: 15px;
        }
        .info-item {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 5px;
        }
        .info-label { font-weight: 700; }
        
        .card {
            border: 1px solid #dee2e6;
            margin-bottom: 10px;
            border-radius: 4px;
        }
        .card-header {
            background: #fff;
            padding: 10px 15px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .status-badge {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 10px;
        }
        .status-passed { background: #28a745; }
        .status-failed { background: #dc3545; }
        .status-skipped { background: #ffc107; }
        
        .step {
            display: flex;
            padding: 8px 15px;
            border-bottom: 1px solid #f1f1f1;
        }
        .step-keyword {
            width: 80px;
            font-weight: 700;
            color: #008c99;
        }
        .step-text { flex: 1; }
        .step-dur { font-size: 11px; color: #999; }
        
        .error-pre {
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            margin: 15px;
            border-radius: 4px;
            font-family: monospace;
            white-space: pre-wrap;
        }
        
        .thumbnail {
            width: 200px;
            margin: 15px;
            cursor: pointer;
            border: 1px solid #dee2e6;
            border-radius: 4px;
        }

        /* Sidebar stats style */
        .summary-table { width: 100%; margin-bottom: 0; }
        .summary-table th { background: #f8f9fa; font-size: 11px; text-transform: uppercase; }
        .summary-table td, .summary-table th { padding: 8px 15px; border: 1px solid #f1f1f1; }
    </style>
</head>
<body>
    <div class="nav-container">
        <div class="container">
            <ul class="nav nav-pills" id="pills-tab" role="tablist">
                <li class="nav-item">
                    <a class="nav-link active" id="pills-summary-tab" data-toggle="pill" href="#pills-summary" role="tab">Summary</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" id="pills-requests-tab" data-toggle="pill" href="#pills-requests" role="tab">Total Scenarios (${results.length})</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" id="pills-failed-tab" data-toggle="pill" href="#pills-failed" role="tab">Failed Tests (${failedTests})</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" id="pills-skipped-tab" data-toggle="pill" href="#pills-skipped" role="tab">Skipped Tests (${skippedTests})</a>
                </li>
            </ul>
        </div>
    </div>

    <div class="container">
        <div class="text-center mb-5">
            <h1 class="dashboard-title">Newman Run Dashboard</h1>
            <div class="dashboard-timestamp">${new Date(timestamp).toLocaleString()}</div>
        </div>

        <div class="row">
            <div class="col-md-3">
                <div class="metric-card bg-teal">
                    <h6>Total Iterations</h6>
                    <div class="metric-value">${totalIterations}</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="metric-card bg-green">
                    <h6>Total Assertions</h6>
                    <div class="metric-value">${totalAssertions}</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="metric-card bg-red">
                    <h6>Total Failed Tests</h6>
                    <div class="metric-value">${failedTests}</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="metric-card bg-orange">
                    <h6>Total Skipped Tests</h6>
                    <div class="metric-value">${skippedTests}</div>
                </div>
            </div>
        </div>

        <div class="tab-content" id="pills-tabContent">
            <!-- SUMMARY TAB -->
            <div class="tab-pane fade show active" id="pills-summary" role="tabpanel">
                <div class="info-box">
                    <h5 class="section-header">File Information</h5>
                    <div class="info-content">
                        <div class="info-item"><span class="info-label">Run Date:</span> <span>${new Date(timestamp).toLocaleDateString()}</span></div>
                        <div class="info-item"><span class="info-label">Framework:</span> <span>Hop Framework</span></div>
                    </div>
                </div>

                <div class="info-box">
                    <h5 class="section-header">Timings and Data</h5>
                    <div class="info-content">
                        <div class="info-item"><span class="info-label">Total run duration:</span> <span>${(duration / 1000).toFixed(2)}s</span></div>
                        <div class="info-item"><span class="info-label">Average response time:</span> <span>${Math.round(duration / (results.length || 1))}ms</span></div>
                    </div>
                </div>

                <div class="info-box">
                    <table class="summary-table">
                        <thead>
                            <tr>
                                <th>Summary Item</th>
                                <th>Total</th>
                                <th>Failed</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>Scenarios</td><td>${results.length}</td><td>${failedTests}</td></tr>
                            <tr><td>Steps (Assertions)</td><td>${totalAssertions}</td><td>${results.reduce((acc, r) => acc + r.steps.filter(s => s.status === 'failed').length, 0)}</td></tr>
                            <tr><td>Skipped Tests</td><td>${skippedTests}</td><td>-</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- TOTAL REQUESTS TAB -->
            <div class="tab-pane fade" id="pills-requests" role="tabpanel">
                <div id="requests-accordion">
                    ${results.map((r, i) => this.renderScenarioCard(r, i)).join('')}
                </div>
            </div>

            <!-- FAILED TESTS TAB -->
            <div class="tab-pane fade" id="pills-failed" role="tabpanel">
                ${failedTests > 0 
                    ? results.filter(r => r.status === 'failed').map((r, i) => this.renderScenarioCard(r, i, 'failed')).join('')
                    : '<div class="alert alert-success">There are no failed tests</div>'
                }
            </div>

            <!-- SKIPPED TESTS TAB -->
            <div class="tab-pane fade" id="pills-skipped" role="tabpanel">
                ${skippedTests > 0
                    ? results.filter(r => r.status === 'skipped').map((r, i) => this.renderScenarioCard(r, i, 'skipped')).join('')
                    : '<div class="alert alert-info">There are no skipped tests</div>'
                }
            </div>
        </div>
    </div>

    <script src="https://code.jquery.com/jquery-3.3.1.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js"></script>
    <script>
        $(document).ready(function() {
            $('.card-header').click(function() {
                $(this).next('.collapse').collapse('toggle');
            });
        });
    </script>
</body>
</html>
`;
  }

  private static renderScenarioCard(result: TestResult, index: number, filter?: string): string {
    const id = `collapse-${filter || 'all'}-${index}`;
    return `
        <div class="card">
            <div class="card-header" id="heading-${id}">
                <div class="d-flex align-items-center">
                    <div class="status-badge status-${result.status}"></div>
                    <div class="font-weight-bold">${result.featureName} / ${result.scenarioName}</div>
                </div>
                <div class="text-muted small">${result.duration}ms</div>
            </div>
            <div id="${id}" class="collapse show">
                <div class="card-body p-0">
                    <div class="steps-area">
                        ${result.steps.map(s => `
                            <div class="step">
                                <div class="step-keyword">${s.step.keyword}</div>
                                <div class="step-text">${s.step.text}</div>
                                <div class="step-dur">${s.duration}ms</div>
                            </div>
                        `).join('')}
                    </div>
                    ${result.error ? `<div class="error-pre">${result.error}</div>` : ''}
                    ${result.screenshotPath ? `<img src="${result.screenshotPath}" class="thumbnail">` : ''}
                </div>
            </div>
        </div>
    `;
  }
}
