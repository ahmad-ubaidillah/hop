import * as fs from 'fs';
import * as path from 'path';
export class TimeTravelDebugger {
    snapshots = [];
    snapshotsDir;
    enabled = false;
    currentStep = 0;
    constructor(outputDir = './reports/time-travel') {
        this.snapshotsDir = outputDir;
    }
    enable() {
        this.enabled = true;
        if (!fs.existsSync(this.snapshotsDir)) {
            fs.mkdirSync(this.snapshotsDir, { recursive: true });
        }
    }
    disable() {
        this.enabled = false;
    }
    isEnabled() {
        return this.enabled;
    }
    async captureStep(page, keyword, text, variables) {
        if (!this.enabled || !page)
            return;
        this.currentStep++;
        const timestamp = Date.now();
        try {
            const screenshotPath = path.join(this.snapshotsDir, `step-${this.currentStep}-${timestamp}.png`);
            await page.screenshot({ path: screenshotPath, fullPage: true });
            const domSnapshot = await page.content();
            const snapshot = {
                stepNumber: this.currentStep,
                keyword,
                text,
                timestamp,
                screenshot: screenshotPath,
                domSnapshot,
                url: page.url(),
                variables: { ...variables },
            };
            this.snapshots.push(snapshot);
            console.log(`   📸 Snapshot ${this.currentStep}: ${keyword} ${text.substring(0, 50)}...`);
        }
        catch (e) {
            console.warn(`   ⚠️ Failed to capture snapshot: ${e}`);
        }
    }
    getSnapshots() {
        return this.snapshots;
    }
    getSnapshot(stepNumber) {
        return this.snapshots.find(s => s.stepNumber === stepNumber);
    }
    getLastSnapshot() {
        return this.snapshots[this.snapshots.length - 1];
    }
    async generateTimeline() {
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hop Time Travel Debugger</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Inter', -apple-system, sans-serif; 
      background: #0a0a0c; 
      color: #f8fafc; 
    }
    
    .container { 
      display: flex; 
      height: 100vh; 
    }
    
    .timeline {
      width: 300px;
      background: #141418;
      border-right: 1px solid rgba(255,255,255,0.08);
      overflow-y: auto;
      padding: 20px;
    }
    
    .timeline h2 {
      font-size: 14px;
      color: #6366f1;
      margin-bottom: 20px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .step {
      padding: 12px;
      margin-bottom: 8px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid transparent;
    }
    
    .step:hover {
      background: #1c1c21;
    }
    
    .step.active {
      background: #1c1c21;
      border-color: #6366f1;
    }
    
    .step-number {
      font-size: 12px;
      color: #6366f1;
      font-weight: 600;
    }
    
    .step-keyword {
      font-size: 11px;
      color: #94a3b8;
      text-transform: uppercase;
      margin-top: 4px;
    }
    
    .step-text {
      font-size: 13px;
      margin-top: 4px;
      color: #f8fafc;
    }
    
    .preview {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #0a0a0c;
    }
    
    .preview-header {
      padding: 20px;
      background: #141418;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    
    .preview-title {
      font-size: 18px;
      font-weight: 600;
    }
    
    .preview-url {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 4px;
    }
    
    .preview-image {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      overflow: auto;
    }
    
    .preview-image img {
      max-width: 100%;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    }
    
    .nav-buttons {
      display: flex;
      gap: 10px;
      padding: 15px 20px;
      background: #141418;
      border-top: 1px solid rgba(255,255,255,0.08);
    }
    
    .nav-btn {
      padding: 8px 16px;
      background: #1c1c21;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 6px;
      color: #f8fafc;
      cursor: pointer;
      font-size: 13px;
    }
    
    .nav-btn:hover {
      background: #252529;
    }
    
    .nav-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="timeline">
      <h2>⏱️ Timeline</h2>
      ${this.snapshots.map(s => `
        <div class="step" data-step="${s.stepNumber}" onclick="showStep(${s.stepNumber})">
          <div class="step-number">Step ${s.stepNumber}</div>
          <div class="step-keyword">${s.keyword}</div>
          <div class="step-text">${s.text.substring(0, 60)}${s.text.length > 60 ? '...' : ''}</div>
        </div>
      `).join('')}
    </div>
    
    <div class="preview">
      <div class="preview-header">
        <div class="preview-title" id="step-title">Select a step to preview</div>
        <div class="preview-url" id="step-url"></div>
      </div>
      <div class="preview-image" id="preview-container">
        <p style="color: #94a3b8;">Click on a step in the timeline to see the screenshot</p>
      </div>
      <div class="nav-buttons">
        <button class="nav-btn" onclick="prevStep()" id="prev-btn">← Previous</button>
        <button class="nav-btn" onclick="nextStep()" id="next-btn">Next →</button>
      </div>
    </div>
  </div>

  <script>
    const snapshots = ${JSON.stringify(this.snapshots.map(s => ({
            stepNumber: s.stepNumber,
            keyword: s.keyword,
            text: s.text,
            screenshot: path.basename(s.screenshot),
            url: s.url,
        })))};
    
    let currentStep = 0;
    
    function showStep(stepNum) {
      currentStep = stepNum;
      const snapshot = snapshots.find(s => s.stepNumber === stepNum);
      if (!snapshot) return;
      
      document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
      document.querySelector(\`.step[data-step="\${stepNum}"]\`)?.classList.add('active');
      
      document.getElementById('step-title').textContent = \`Step \${snapshot.stepNumber}: \${snapshot.keyword}\`;
      document.getElementById('step-url').textContent = snapshot.url;
      document.getElementById('preview-container').innerHTML = 
        \`<img src="\${snapshot.screenshot}" alt="Step \${snapshot.stepNumber}" />\`;
      
      document.getElementById('prev-btn').disabled = stepNum === 1;
      document.getElementById('next-btn').disabled = stepNum === snapshots.length;
    }
    
    function prevStep() {
      if (currentStep > 1) showStep(currentStep - 1);
    }
    
    function nextStep() {
      if (currentStep < snapshots.length) showStep(currentStep + 1);
    }
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') prevStep();
      if (e.key === 'ArrowRight') nextStep();
    });
    
    if (snapshots.length > 0) showStep(1);
  </script>
</body>
</html>`;
        const timelinePath = path.join(this.snapshotsDir, 'timeline.html');
        fs.writeFileSync(timelinePath, html);
        return timelinePath;
    }
    reset() {
        this.snapshots = [];
        this.currentStep = 0;
    }
}
export function createTimeTravelDebugger(outputDir) {
    return new TimeTravelDebugger(outputDir);
}
