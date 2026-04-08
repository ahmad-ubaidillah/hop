import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { chromium } from 'playwright';

let playwrightModule: any = null;

async function getPlaywright() {
  if (!playwrightModule) {
    try {
      playwrightModule = await import('playwright');
    } catch {
      throw new Error('playwright is not installed. Run: bun add -i playwright');
    }
  }
  return playwrightModule;
}

export interface RecordingEvent {
  type: 'navigate' | 'click' | 'type' | 'select' | 'hover' | 'wait' | 'screenshot' | 'assertion' | 'scroll' | 'keypress';
  selector?: string;
  value?: string;
  text?: string;
  timestamp: number;
  duration?: number;
}

export interface RecorderOptions {
  outputPath?: string;
  browser?: 'chromium' | 'firefox' | 'webkit';
  headless?: boolean;
  slowMo?: number;
  baseURL?: string;
}

export class Recorder {
  private browser: any = null;
  private context: any = null;
  private page: any = null;
  private events: RecordingEvent[] = [];
  private startTime: number = 0;
  private options: RecorderOptions;
  private isRecording = false;

  constructor(options: RecorderOptions = {}) {
    this.options = {
      browser: 'chromium',
      headless: false,
      slowMo: 50,
      outputPath: './features/recorded.feature',
      ...options,
    };
  }

  async start(): Promise<void> {
    const pw = await getPlaywright();
    const chromium = pw.chromium;
    
    console.log('🎬 Starting Hop Recorder...');
    console.log('Press ESC or click "Stop Recording" button to stop.\n');

    this.browser = await chromium.launch({
      headless: this.options.headless,
      args: ['--start-maximized'],
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
    });

    this.page = await this.context.newPage();
    this.startTime = Date.now();
    this.isRecording = true;

    await this.setupEventListeners();

    if (this.options.baseURL) {
      await this.page.goto(this.options.baseURL);
      this.recordEvent('navigate', this.options.baseURL);
    }

    await this.injectRecorderUI();
    await this.waitForStop();
  }

  private async setupEventListeners(): Promise<void> {
    if (!this.page) return;

    this.page.on('console', async (msg) => {
      if (msg.type() === 'log' && msg.text().startsWith('[HOP_RECORD]')) {
        const data = msg.text().replace('[HOP_RECORD]', '');
        try {
          const event = JSON.parse(data);
          this.events.push(event);
          console.log(`  📝 ${event.type}: ${event.selector || event.value || ''}`);
        } catch {}
      }
    });

    this.page.on('click', async (req) => {
      const selector = await this.getSelector(req);
      if (selector && this.isRecording) {
        this.recordEvent('click', selector);
      }
    });

    this.page.on('input', async (element, value) => {
      if (this.isRecording) {
        const tagName = await element.evaluate((el: any) => el.tagName);
        if (tagName === 'INPUT' || tagName === 'TEXTAREA') {
          const selector = await this.getSelectorForElement(element);
          this.recordEvent('type', selector, value);
        }
      }
    });

    this.page.on('dialog', async (dialog) => {
      if (this.isRecording) {
        console.log(`  ⚠️ Dialog: ${dialog.message()}`);
        await dialog.accept();
      }
    });

    this.page.on('requestfailed', (request) => {
      if (this.isRecording) {
        console.log(`  ❌ Failed: ${request.url()}`);
      }
    });
  }

  private async getSelector(element: any): Promise<string> {
    try {
      if (element._preview?.selector) {
        return element._preview.selector;
      }
    } catch {}
    return '';
  }

  private async getSelectorForElement(element: any): Promise<string> {
    try {
      const selector = await element.evaluate((el: any) => {
        const getAttribute = (attr: string) => el.getAttribute(attr);
        const id = getAttribute('id');
        const className = getAttribute('class');
        const name = getAttribute('name');
        const dataTestId = getAttribute('data-testid');
        const dataCy = getAttribute('data-cy');
        const ariaLabel = getAttribute('aria-label');

        if (id) return `#${id}`;
        if (dataTestId) return `[data-testid="${dataTestId}"]`;
        if (dataCy) return `[data-cy="${dataCy}"]`;
        if (name) return `[name="${name}"]`;
        if (ariaLabel) return `[aria-label="${ariaLabel}"]`;
        if (className) {
          const classSelector = className.trim().split(/\s+/).map((c: string) => `.${c}`).join('');
          return classSelector;
        }

        const tag = el.tagName.toLowerCase();
        return tag;
      });
      return selector;
    } catch {
      return 'input';
    }
  }

  private recordEvent(type: RecordingEvent['type'], selector?: string, value?: string): void {
    this.events.push({
      type,
      selector,
      value,
      timestamp: Date.now(),
    });
  }

  private async injectRecorderUI(): Promise<void> {
    if (!this.page) return;

    await this.page.addStyleTag({
      content: `
        #hop-recorder-panel {
          position: fixed;
          top: 10px;
          right: 10px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          font-family: system-ui, sans-serif;
          font-size: 14px;
          z-index: 99999;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: move;
        }
        #hop-recorder-panel .dot {
          width: 10px;
          height: 10px;
          background: #ef4444;
          border-radius: 50%;
          animation: pulse 1s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        #hop-recorder-panel button {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        #hop-recorder-panel button:hover {
          background: rgba(255,255,255,0.3);
        }
      `,
    });

    await this.page.addScriptTag({
      content: `
        (function() {
          const panel = document.createElement('div');
          panel.id = 'hop-recorder-panel';
          panel.innerHTML = \`
            <span class="dot"></span>
            <span>Recording...</span>
            <button id="hop-stop-btn">Stop</button>
          \`;
          document.body.appendChild(panel);

          let lastClickTime = 0;

          document.addEventListener('click', function(e) {
            const now = Date.now();
            if (now - lastClickTime < 300) return;
            lastClickTime = now;

            const target = e.target;
            const tagName = target.tagName.toLowerCase();
            if (tagName === 'button' && target.id === 'hop-stop-btn') return;

            let selector = '';
            const id = target.id;
            const className = target.className;
            const name = target.getAttribute('name');
            const dataTestId = target.getAttribute('data-testid');
            const dataCy = target.getAttribute('data-cy');
            const ariaLabel = target.getAttribute('aria-label');
            const type = target.getAttribute('type');
            const href = target.getAttribute('href');

            if (id && !id.includes('hop-')) selector = '#' + id;
            else if (dataTestId) selector = '[data-testid="' + dataTestId + '"]';
            else if (dataCy) selector = '[data-cy="' + dataCy + '"]';
            else if (name) selector = '[name="' + name + '"]';
            else if (ariaLabel) selector = '[aria-label="' + ariaLabel + '"]';
            else if (tagName === 'a' && href) selector = 'a[href="' + href + '"]';
            else if (tagName === 'button') selector = 'button' + (type ? '[type="' + type + '"]' : '');
            else selector = tagName;

            console.log('[HOP_RECORD]' + JSON.stringify({
              type: 'click',
              selector: selector,
              text: target.textContent?.trim().substring(0, 50),
              timestamp: now
            }));
          }, true);

          document.addEventListener('keydown', function(e) {
            if (e.target.tagName.toLowerCase() === 'input' ||
                e.target.tagName.toLowerCase() === 'textarea') {
              console.log('[HOP_RECORD]' + JSON.stringify({
                type: 'type',
                selector: e.target.tagName.toLowerCase() + '[name="' + e.target.getAttribute('name') + '"]',
                value: e.target.value,
                timestamp: Date.now()
              }));
            }
          }, true);

          document.addEventListener('navigation', function() {
            console.log('[HOP_RECORD]' + JSON.stringify({
              type: 'navigate',
              value: window.location.href,
              timestamp: Date.now()
            }));
          });

          let clickTimeout;
          panel.addEventListener('click', function(e) {
            if (e.target.id === 'hop-stop-btn') {
              window.parent.postMessage({ type: 'HOP_STOP_RECORDING' }, '*');
            }
          });
        })();
      `,
    });

    this.page.on('console', (msg) => {
      if (msg.text().includes('HOP_STOP_RECORDING')) {
        this.stop();
      }
    });
  }

  private async waitForStop(): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!this.isRecording) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 500);
    });
  }

  async stop(): Promise<void> {
    if (!this.isRecording) return;
    
    this.isRecording = false;
    console.log('\n🛑 Recording stopped!\n');

    if (this.browser) {
      await this.browser.close();
    }
  }

  generateFeature(featureName?: string): string {
    const name = featureName || 'Recorded Test';
    const timestamp = new Date().toISOString();

    const events = this.events.filter((e, i, arr) => {
      if (e.type === 'type' && i > 0 && arr[i - 1].type === 'type') {
        return false;
      }
      return true;
    });

    let steps = '';
    let stepIndex = 0;

    for (const event of events) {
      stepIndex++;

      switch (event.type) {
        case 'navigate':
          steps += `    Given user navigates to '${event.value}'\n`;
          break;

        case 'click':
          if (event.selector) {
            steps += `    And user clicks '${event.selector}'\n`;
          }
          break;

        case 'type':
          if (event.selector && event.value) {
            const escapedValue = event.value.replace(/'/g, "\\'");
            steps += `    And user types '${escapedValue}' into '${event.selector}'\n`;
          }
          break;

        case 'assertion':
          steps += `    Then user should see '${event.selector}'\n`;
          break;

        default:
          if (event.selector) {
            steps += `    And user clicks '${event.selector}'\n`;
          }
      }
    }

    steps += `    And user takes screenshot 'final'\n`;

    return `Feature: ${name}
  Recorded at: ${timestamp}

  Scenario: Recorded test
${steps}`;
  }

  async save(outputPath?: string): Promise<string> {
    const path = outputPath || this.options.outputPath || './features/recorded.feature';
    const dir = dirname(path);
    await mkdir(dir, { recursive: true });

    const feature = this.generateFeature();
    await writeFile(path, feature, 'utf-8');

    console.log(`✅ Recording saved to: ${path}`);
    return path;
  }

  getEvents(): RecordingEvent[] {
    return this.events;
  }
}

export async function runRecorder(options: RecorderOptions): Promise<void> {
  const recorder = new Recorder(options);
  await recorder.start();
  await recorder.save();
}
