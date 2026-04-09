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
  type: 'navigate' | 'click' | 'type' | 'select' | 'hover' | 'wait' | 'screenshot' | 'assertion' | 'scroll' | 'keypress' | 'doubleClick' | 'rightClick' | 'check' | 'uncheck';
  selector?: string;
  value?: string;
  text?: string;
  timestamp: number;
  duration?: number;
  option?: string;
  key?: string;
  assertType?: 'text' | 'value' | 'visible' | 'enabled' | 'checked' | 'hidden';
  waitFor?: 'visible' | 'hidden' | 'clickable' | 'stable';
  waitTimeout?: number;
}

export interface RecorderOptions {
  outputPath?: string;
  browser?: 'chromium' | 'firefox' | 'webkit';
  headless?: boolean;
  slowMo?: number;
  baseURL?: string;
  generateSteps?: boolean;
  stepPath?: string;
}

interface SelectorInfo {
  selector: string;
  tag: string;
  text: string;
  id?: string;
  name?: string;
  dataTestId?: string;
  dataCy?: string;
  ariaLabel?: string;
  type?: string;
  role?: string;
  href?: string;
}

/**
 * Enhanced Hop Recorder with support for:
 * - Click, double-click, right-click
 * - Type, select, check/uncheck
 * - Hover, scroll, keyboard shortcuts
 * - Wait actions (visible, hidden, clickable, stable)
 * - Assertions (text, value, visible, enabled, checked, hidden)
 * - Screenshot capture
 * - Better selector generation (priority: testid > aria > role > name > text)
 * - Auto-generate step definitions
 */
export class Recorder {
  private browser: any = null;
  private context: any = null;
  private page: any = null;
  private events: RecordingEvent[] = [];
  private startTime: number = 0;
  private options: RecorderOptions;
  private isRecording = false;
  private pendingActions: string[] = [];
  private lastNavigatedUrl = '';
  private stepDefinitions: Map<string, string> = new Map();

  constructor(options: RecorderOptions = {}) {
    this.options = {
      browser: 'chromium',
      headless: false,
      slowMo: 50,
      outputPath: './features/recorded.feature',
      stepPath: './steps/recorded.steps.ts',
      generateSteps: true,
      ...options,
    };
  }

  async start(): Promise<void> {
    const pw = await getPlaywright();
    const browserType = this.options.browser === 'firefox' ? pw.firefox : 
                       this.options.browser === 'webkit' ? pw.webkit : pw.chromium;
    
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║              🎬 Hop Recorder - Enhanced Mode              ║');
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log('║  Actions:                                                ║');
    console.log('║    • Click, Double-click, Right-click                   ║');
    console.log('║    • Type, Select, Check, Uncheck                        ║');
    console.log('║    • Hover, Scroll, Keyboard shortcuts                   ║');
    console.log('║    • Wait for (visible, clickable, stable)             ║');
    console.log('║    • Assertions (text, value, visible, enabled)         ║');
    console.log('║    • Screenshot                                         ║');
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log('║  Stop: Press ESC or click "Stop Recording" button        ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    this.browser = await browserType.launch({
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
      this.lastNavigatedUrl = this.options.baseURL;
      this.recordEvent('navigate', undefined, this.options.baseURL);
    }

    await this.injectRecorderUI();
    await this.waitForStop();
  }

  private async setupEventListeners(): Promise<void> {
    if (!this.page) return;

    // Console messages from injected script
    this.page.on('console', async (msg) => {
      if (msg.type() === 'log' && msg.text().startsWith('[HOP_RECORD]')) {
        const data = msg.text().replace('[HOP_RECORD]', '');
        try {
          const event = JSON.parse(data);
          this.events.push(event);
          console.log(`  📝 ${this.formatEventLog(event)}`);
        } catch {}
      }
    });

    // Navigation detection
    this.page.on('framenavigated', async (frame) => {
      if (this.isRecording && frame === this.page.mainFrame()) {
        const url = this.page.url();
        if (url !== this.lastNavigatedUrl) {
          this.lastNavigatedUrl = url;
          this.recordEvent('navigate', undefined, url);
        }
      }
    });

    // Dialog handling
    this.page.on('dialog', async (dialog) => {
      if (this.isRecording) {
        console.log(`  ⚠️ Dialog: ${dialog.message()}`);
        await dialog.accept();
      }
    });

    // Request failures
    this.page.on('requestfailed', (request) => {
      if (this.isRecording) {
        console.log(`  ❌ Failed: ${request.url()}`);
      }
    });
  }

  private formatEventLog(event: RecordingEvent): string {
    switch (event.type) {
      case 'navigate':
        return `🌐 Navigate to ${event.value}`;
      case 'click':
        return `👆 Click ${event.selector}`;
      case 'doubleClick':
        return `👆👆 Double-click ${event.selector}`;
      case 'rightClick':
        return `🖱️ Right-click ${event.selector}`;
      case 'type':
        return `⌨️ Type into ${event.selector}`;
      case 'select':
        return `📋 Select ${event.option} from ${event.selector}`;
      case 'check':
        return `☑️ Check ${event.selector}`;
      case 'uncheck':
        return `⬜ Uncheck ${event.selector}`;
      case 'hover':
        return `👋 Hover ${event.selector}`;
      case 'scroll':
        return `📜 Scroll ${event.selector || 'page'}`;
      case 'keypress':
        return `⌨️ Press ${event.key}`;
      case 'wait':
        return `⏳ Wait for ${event.waitFor} ${event.selector || ''}`;
      case 'assertion':
        return `✅ Assert ${event.assertType} ${event.selector}`;
      case 'screenshot':
        return `📸 Screenshot: ${event.value}`;
      default:
        return `${event.type} ${event.selector || ''}`;
    }
  }

  /**
   * Generate optimized selector prioritizing:
   * 1. data-testid (testability)
   * 2. aria-label / aria-labelledby (accessibility)
   * 3. role (semantic)
   * 4. name (form elements)
   * 5. text content (links, buttons)
   * 6. id (unique)
   */
  private async getSelectorInfo(element: any): Promise<SelectorInfo> {
    try {
      const info = await element.evaluate((el: any) => {
        const getAttr = (attr: string) => el.getAttribute(attr);
        
        return {
          tag: el.tagName.toLowerCase(),
          text: el.textContent?.trim().substring(0, 100) || '',
          id: el.id || undefined,
          name: getAttr('name'),
          dataTestId: getAttr('data-testid'),
          dataCy: getAttr('data-cy'),
          ariaLabel: getAttr('aria-label'),
          ariaLabelledby: getAttr('aria-labelledby'),
          type: getAttr('type'),
          role: el.getAttribute('role'),
          href: getAttr('href'),
          for: getAttr('for'), // label
          value: (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) 
            ? el.value 
            : undefined,
          checked: (el instanceof HTMLInputElement) ? el.checked : undefined,
          disabled: (el instanceof HTMLInputElement || el instanceof HTMLButtonElement || el instanceof HTMLSelectElement) 
            ? el.disabled 
            : undefined,
        };
      });
      return info;
    } catch {
      return { tag: 'element', text: '', selector: 'element' };
    }
  }

  private buildBestSelector(info: SelectorInfo): string {
    const { tag, id, name, dataTestId, dataCy, ariaLabel, type, role, href, text } = info;

    // Priority 1: data-testid (best for testing)
    if (dataTestId) return `[data-testid="${dataTestId}"]`;
    
    // Priority 2: data-cy (Cypress style)
    if (dataCy) return `[data-cy="${dataCy}"]`;
    
    // Priority 3: aria-label
    if (ariaLabel) return `[aria-label="${ariaLabel}"]`;
    
    // Priority 4: name (form elements)
    if (name) return `${tag}[name="${name}"]`;
    
    // Priority 5: id
    if (id && !id.includes('hop-')) return `#${id}`;
    
    // Priority 6: role
    if (role) {
      if (role === 'button') return 'button';
      if (role === 'link') return 'a';
      if (role === 'textbox') return 'input';
      if (role === 'checkbox') return 'input[type="checkbox"]';
      if (role === 'radio') return 'input[type="radio"]';
      if (role === 'combobox') return 'select';
      return `[role="${role}"]`;
    }
    
    // Priority 7: href for links
    if (tag === 'a' && href) {
      return href.length < 50 ? `a[href="${href}"]` : 'a';
    }
    
    // Priority 8: type for inputs
    if (tag === 'input' && type) return `input[type="${type}"]`;
    
    // Priority 9: button with text
    if (tag === 'button' && text) {
      const textSafe = text.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20);
      return `button:has-text("${text}")`;
    }
    
    // Priority 10: tag
    return tag;
  }

  private recordEvent(
    type: RecordingEvent['type'], 
    selector?: string, 
    value?: string,
    extra?: Partial<RecordingEvent>
  ): void {
    this.events.push({
      type,
      selector,
      value,
      timestamp: Date.now(),
      ...extra,
    });
  }

  private async injectRecorderUI(): Promise<void> {
    if (!this.page) return;

    // Inject styles
    await this.page.addStyleTag({
      content: `
        #hop-recorder-panel {
          position: fixed;
          top: 10px;
          right: 10px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          padding: 12px 20px;
          border-radius: 12px;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 14px;
          z-index: 99999;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: move;
          user-select: none;
          backdrop-filter: blur(10px);
        }
        #hop-recorder-panel .recording-dot {
          width: 12px;
          height: 12px;
          background: #ef4444;
          border-radius: 50%;
          animation: hop-pulse 1s ease-in-out infinite;
        }
        @keyframes hop-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.9); }
        }
        #hop-recorder-panel .action-buttons {
          display: flex;
          gap: 8px;
        }
        #hop-recorder-panel button {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s;
        }
        #hop-recorder-panel button:hover {
          background: rgba(255,255,255,0.3);
          transform: translateY(-1px);
        }
        #hop-recorder-panel button.assert-btn { background: #10b981; }
        #hop-recorder-panel button.wait-btn { background: #f59e0b; }
        #hop-recorder-panel button.screenshot-btn { background: #3b82f6; }
        #hop-recorder-panel .event-count {
          background: rgba(0,0,0,0.3);
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-variant-numeric: tabular-nums;
        }
        #hop-recorder-panel .shortcuts {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 8px;
          background: #1e1e2e;
          border-radius: 8px;
          padding: 12px;
          font-size: 11px;
          color: #94a3b8;
          display: none;
          min-width: 200px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        #hop-recorder-panel:hover .shortcuts { display: block; }
        #hop-recorder-panel .shortcuts kbd {
          background: #3b82f6;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          margin-right: 8px;
          font-family: monospace;
        }
      `,
    });

    // Inject main script
    await this.page.addScriptTag({
      content: `
        (function() {
          // State
          let eventCount = 0;
          const MAX_EVENTS = 500;

          // Create panel
          const panel = document.createElement('div');
          panel.id = 'hop-recorder-panel';
          panel.innerHTML = \`
            <div class="recording-dot"></div>
            <span>Recording</span>
            <div class="event-count" id="hop-event-count">0 events</div>
            <div class="action-buttons">
              <button class="assert-btn" id="hop-assert-btn" title="Add assertion (A)">Assert</button>
              <button class="wait-btn" id="hop-wait-btn" title="Add wait (W)">Wait</button>
              <button class="screenshot-btn" id="hop-screenshot-btn" title="Take screenshot (S)">📸</button>
              <button id="hop-stop-btn">Stop</button>
            </div>
            <div class="shortcuts">
              <div><kbd>A</kbd> Add assertion</div>
              <div><kbd>W</kbd> Add wait</div>
              <div><kbd>S</kbd> Screenshot</div>
              <div><kbd>ESC</kbd> Stop</div>
            </div>
          \`;
          document.body.appendChild(panel);

          const eventCountEl = document.getElementById('hop-event-count');

          function emitEvent(event) {
            if (eventCount >= MAX_EVENTS) return;
            eventCount++;
            eventCountEl.textContent = eventCount + ' events';
            console.log('[HOP_RECORD]' + JSON.stringify(event));
          }

          function getSelector(target) {
            const getAttr = (a) => target.getAttribute(a);
            const id = target.id;
            const name = getAttr('name');
            const dataTestId = getAttr('data-testid');
            const dataCy = getAttr('data-cy');
            const ariaLabel = getAttr('aria-label');
            const type = getAttr('type');
            const role = target.getAttribute('role');
            const href = getAttr('href');
            const tag = target.tagName.toLowerCase();

            if (dataTestId) return '[data-testid="' + dataTestId + '"]';
            if (dataCy) return '[data-cy="' + dataCy + '"]';
            if (ariaLabel) return '[aria-label="' + ariaLabel + '"]';
            if (name) return tag + '[name="' + name + '"]';
            if (id && !id.includes('hop-')) return '#' + id;
            if (tag === 'a' && href) return 'a[href="' + href + '"]';
            if (tag === 'input' && type) return 'input[type="' + type + '"]';
            if (tag === 'button') return 'button';
            return tag;
          }

          function getText(target) {
            return target.textContent?.trim().substring(0, 50) || '';
          }

          // Click handler
          let lastClickTime = 0;
          document.addEventListener('click', function(e) {
            const now = Date.now();
            if (now - lastClickTime < 300) return;
            lastClickTime = now;

            const target = e.target;
            if (target.id === 'hop-stop-btn' || 
                target.id === 'hop-assert-btn' ||
                target.id === 'hop-wait-btn' ||
                target.id === 'hop-screenshot-btn') return;

            const selector = getSelector(target);
            const text = getText(target);

            // Determine click type
            let clickType = 'click';
            if (e.detail === 2) clickType = 'doubleClick';
            else if (e.button === 2) clickType = 'rightClick';

            emitEvent({
              type: clickType,
              selector: selector,
              text: text,
              timestamp: now
            });

            e.preventDefault();
          }, true);

          // Right-click context menu prevention
          document.addEventListener('contextmenu', function(e) {
            const target = e.target;
            const selector = getSelector(target);
            const text = getText(target);

            emitEvent({
              type: 'rightClick',
              selector: selector,
              text: text,
              timestamp: Date.now()
            });
            
            // Don't prevent context menu for now, just record
          }, true);

          // Input/Type handler
          document.addEventListener('input', function(e) {
            const target = e.target;
            const tag = target.tagName.toLowerCase();
            
            if (tag === 'input' || tag === 'textarea') {
              const selector = getSelector(target);
              emitEvent({
                type: 'type',
                selector: selector,
                value: target.value,
                timestamp: Date.now()
              });
            }
          }, true);

          // Change handler for select
          document.addEventListener('change', function(e) {
            const target = e.target;
            if (target.tagName.toLowerCase() === 'select') {
              const selector = getSelector(target);
              const option = target.options[target.selectedIndex];
              emitEvent({
                type: 'select',
                selector: selector,
                option: option?.text || option?.value,
                value: target.value,
                timestamp: Date.now()
              });
            }
          }, true);

          // Checkbox handler
          document.addEventListener('change', function(e) {
            const target = e.target;
            if (target.tagName.toLowerCase() === 'input' && target.type === 'checkbox') {
              const selector = getSelector(target);
              emitEvent({
                type: target.checked ? 'check' : 'uncheck',
                selector: selector,
                timestamp: Date.now()
              });
            }
          }, true);

          // Hover handler
          document.addEventListener('mouseenter', function(e) {
            const target = e.target;
            const tag = target.tagName.toLowerCase();
            if (tag === 'a' || tag === 'button' || target.getAttribute('role') === 'button') {
              const selector = getSelector(target);
              emitEvent({
                type: 'hover',
                selector: selector,
                timestamp: Date.now()
              });
            }
          }, true);

          // Keyboard handler
          document.addEventListener('keydown', function(e) {
            const key = e.key;
            if (key === 'Escape') {
              window.parent.postMessage({ type: 'HOP_STOP_RECORDING' }, '*');
            }
            
            // Only record special keys or when in form
            const tag = e.target.tagName.toLowerCase();
            const isFormElement = tag === 'input' || tag === 'textarea' || tag === 'select';
            
            if (key === 'Enter' || key === 'Tab' || key === 'Escape') {
              emitEvent({
                type: 'keypress',
                key: key,
                timestamp: Date.now()
              });
            }
          }, true);

          // Button actions
          document.getElementById('hop-stop-btn').addEventListener('click', function() {
            window.parent.postMessage({ type: 'HOP_STOP_RECORDING' }, '*');
          });

          document.getElementById('hop-assert-btn').addEventListener('click', function(e) {
            // This would need more complex implementation
            emitEvent({
              type: 'assertion',
              assertType: 'visible',
              selector: 'body',
              timestamp: Date.now()
            });
          });

          document.getElementById('hop-wait-btn').addEventListener('click', function(e) {
            emitEvent({
              type: 'wait',
              waitFor: 'visible',
              selector: 'body',
              waitTimeout: 5000,
              timestamp: Date.now()
            });
          });

          document.getElementById('hop-screenshot-btn').addEventListener('click', function(e) {
            emitEvent({
              type: 'screenshot',
              value: 'manual-' + Date.now(),
              timestamp: Date.now()
            });
          });

          // Keyboard shortcuts
          document.addEventListener('keydown', function(e) {
            if (e.target.tagName.toLowerCase() === 'input' || 
                e.target.tagName.toLowerCase() === 'textarea') return;
            
            if (e.key === 'a' || e.key === 'A') {
              if (!e.ctrlKey && !e.metaKey) {
                document.getElementById('hop-assert-btn').click();
              }
            }
            if (e.key === 'w' || e.key === 'W') {
              if (!e.ctrlKey && !e.metaKey) {
                document.getElementById('hop-wait-btn').click();
              }
            }
            if (e.key === 's' || e.key === 'S') {
              if (!e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                document.getElementById('hop-screenshot-btn').click();
              }
            }
          });

          // Drag and drop for panel
          let isDragging = false;
          let startX, startY, initialX, initialY;
          
          panel.addEventListener('mousedown', function(e) {
            if (e.target === panel || panel.contains(e.target)) {
              if (e.target.tagName !== 'BUTTON') {
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                initialX = panel.offsetLeft;
                initialY = panel.offsetTop;
              }
            }
          });

          document.addEventListener('mousemove', function(e) {
            if (isDragging) {
              const dx = e.clientX - startX;
              const dy = e.clientY - startY;
              panel.style.left = (initialX + dx) + 'px';
              panel.style.top = (initialY + dy) + 'px';
              panel.style.right = 'auto';
            }
          });

          document.addEventListener('mouseup', function() {
            isDragging = false;
          });

        })();
      `,
    });

    // Listen for stop message
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
    console.log('\n🛑 Recording stopped!');
    console.log(`📊 Total events recorded: ${this.events.length}\n`);

    if (this.browser) {
      await this.browser.close();
    }
  }

  /**
   * Generate Gherkin feature file with enhanced steps
   */
  generateFeature(featureName?: string): string {
    const name = featureName || 'Recorded Test';
    const timestamp = new Date().toISOString();

    // Deduplicate consecutive type events (they come from input event)
    const events = this.events.filter((e, i, arr) => {
      if (e.type === 'type' && i > 0 && arr[i - 1].type === 'type') {
        return false;
      }
      return true;
    });

    let steps = '';
    const usedSelectors = new Set<string>();

    for (const event of events) {
      const step = this.generateStep(event, usedSelectors);
      if (step) steps += step + '\n';
    }

    // Add final screenshot if not already captured
    const hasScreenshot = events.some(e => e.type === 'screenshot');
    if (!hasScreenshot) {
      steps += `    And user takes screenshot 'final'\n`;
    }

    return `Feature: ${name}
  Recorded at: ${timestamp}

  Background:
    Given set viewport size 1280 720

  Scenario: Recorded test
${steps}`;
  }

  private generateStep(event: RecordingEvent, usedSelectors: Set<string>): string {
    const escapeValue = (val: string) => val?.replace(/'/g, "\\'") || '';
    const sanitizeSelector = (sel: string) => {
      if (!sel) return sel;
      // Avoid duplicates by adding index
      if (usedSelectors.has(sel)) {
        return sel;
      }
      usedSelectors.add(sel);
      return sel;
    };

    switch (event.type) {
      case 'navigate':
        return `    Given user navigates to '${escapeValue(event.value)}'`;

      case 'click':
        return `    When user clicks '${sanitizeSelector(event.selector || '')}'`;

      case 'doubleClick':
        return `    When user double clicks '${sanitizeSelector(event.selector || '')}'`;

      case 'rightClick':
        return `    When user right clicks '${sanitizeSelector(event.selector || '')}'`;

      case 'type':
        if (event.selector && event.value !== undefined) {
          return `    And user types '${escapeValue(event.value)}' into '${sanitizeSelector(event.selector)}'`;
        }
        return '';

      case 'select':
        if (event.selector && event.option) {
          return `    And user selects '${escapeValue(event.option)}' from '${sanitizeSelector(event.selector)}'`;
        }
        return '';

      case 'check':
        return `    And user checks '${sanitizeSelector(event.selector || '')}'`;

      case 'uncheck':
        return `    And user unchecks '${sanitizeSelector(event.selector || '')}'`;

      case 'hover':
        return `    And user hovers over '${sanitizeSelector(event.selector || '')}'`;

      case 'scroll':
        if (event.selector) {
          return `    And user scrolls to '${sanitizeSelector(event.selector)}'`;
        }
        return `    And user scrolls to bottom`;

      case 'keypress':
        if (event.key === 'Enter') {
          return `    And user presses Enter`;
        } else if (event.key === 'Escape') {
          return `    And user presses Escape`;
        } else if (event.key === 'Tab') {
          return `    And user presses Tab`;
        }
        return `    And user presses '${event.key}'`;

      case 'wait':
        if (event.waitFor === 'visible') {
          return `    And user waits for '${sanitizeSelector(event.selector || '')}' to be visible`;
        } else if (event.waitFor === 'hidden') {
          return `    And user waits for '${sanitizeSelector(event.selector || '')}' to be hidden`;
        } else if (event.waitFor === 'clickable') {
          return `    And user waits for '${sanitizeSelector(event.selector || '')}' to be clickable`;
        }
        return `    And user waits for ${event.waitTimeout || 5000} ms`;

      case 'assertion':
        if (event.assertType === 'text' && event.selector) {
          return `    Then user should see text '${escapeValue(event.text || '')}' in '${sanitizeSelector(event.selector)}'`;
        } else if (event.assertType === 'value' && event.selector) {
          return `    Then '${sanitizeSelector(event.selector)}' should have value '${escapeValue(event.value || '')}'`;
        } else if (event.assertType === 'visible') {
          return `    Then user should see '${sanitizeSelector(event.selector || 'element')}'`;
        } else if (event.assertType === 'enabled') {
          return `    Then '${sanitizeSelector(event.selector || '')}' should be enabled`;
        } else if (event.assertType === 'checked') {
          return `    Then '${sanitizeSelector(event.selector || '')}' should be checked`;
        } else if (event.assertType === 'hidden') {
          return `    Then user should not see '${sanitizeSelector(event.selector || '')}'`;
        }
        return `    Then user should see '${sanitizeSelector(event.selector || '')}'`;

      case 'screenshot':
        return `    And user takes screenshot '${event.value || 'capture'}'`;

      default:
        return '';
    }
  }

  /**
   * Generate TypeScript step definitions
   */
  generateStepDefinitions(): string {
    const steps = new Set<string>();
    const uiSteps = new Set<string>();

    for (const event of this.events) {
      const { step, uiStep } = this.getStepDefinition(event);
      if (step) steps.add(step);
      if (uiStep) uiSteps.add(uiStep);
    }

    const stepArray = Array.from(steps);
    const uiStepArray = Array.from(uiSteps);

    return `// Auto-generated step definitions
// Generated at: ${new Date().toISOString()}

import { Given, When, Then, And } from 'hop-framework';

// UI Interaction Steps
${uiStepArray.join('\n')}

// Assertion Steps
${stepArray.join('\n')}
`;
  }

  private getStepDefinition(event: RecordingEvent): { step: string; uiStep: string } {
    const selector = event.selector || '';
    
    switch (event.type) {
      case 'navigate':
        return {
          uiStep: `Given('user navigates to {string}', async (url) => {\n  await page.goto(url);\n});`,
          step: '',
        };
      case 'click':
        return {
          uiStep: `When('user clicks {string}', async (selector: string) => {\n  await page.click(selector);\n});`,
          step: '',
        };
      case 'doubleClick':
        return {
          uiStep: `When('user double clicks {string}', async (selector: string) => {\n  await page.dblclick(selector);\n});`,
          step: '',
        };
      case 'type':
        return {
          uiStep: `And('user types {string} into {string}', async (value: string, selector: string) => {\n  await page.fill(selector, value);\n});`,
          step: '',
        };
      case 'select':
        return {
          uiStep: `And('user selects {string} from {string}', async (option: string, selector: string) => {\n  await page.selectOption(selector, { label: option });\n});`,
          step: '',
        };
      case 'check':
        return {
          uiStep: `And('user checks {string}', async (selector: string) => {\n  await page.check(selector);\n});`,
          step: '',
        };
      case 'hover':
        return {
          uiStep: `And('user hovers over {string}', async (selector: string) => {\n  await page.hover(selector);\n});`,
          step: '',
        };
      case 'wait':
        return {
          uiStep: `And('user waits for {string} to be {string}', async (selector: string, condition: string) => {\n  if (condition === 'visible') await page.waitForSelector(selector, { state: 'visible' });\n  if (condition === 'hidden') await page.waitForSelector(selector, { state: 'hidden' });\n  if (condition === 'clickable') await page.waitForSelector(selector, { state: 'attached' });\n});`,
          step: '',
        };
      case 'screenshot':
        return {
          uiStep: `And('user takes screenshot {string}', async (name: string) => {\n  await page.screenshot({ path: \`reports/screenshots/\${name}.png\` });\n});`,
          step: '',
        };
      default:
        return { step: '', uiStep: '' };
    }
  }

  async save(outputPath?: string): Promise<string> {
    const featurePath = outputPath || this.options.outputPath || './features/recorded.feature';
    const dir = dirname(featurePath);
    await mkdir(dir, { recursive: true });

    const feature = this.generateFeature();
    await writeFile(featurePath, feature, 'utf-8');
    console.log(`✅ Feature file saved to: ${featurePath}`);

    // Generate step definitions if enabled
    if (this.options.generateSteps) {
      const stepPath = this.options.stepPath || './steps/recorded.steps.ts';
      const stepDir = dirname(stepPath);
      await mkdir(stepDir, { recursive: true });
      
      const steps = this.generateStepDefinitions();
      await writeFile(stepPath, steps, 'utf-8');
      console.log(`✅ Step definitions saved to: ${stepPath}`);
    }

    return featurePath;
  }

  getEvents(): RecordingEvent[] {
    return this.events;
  }

  getSummary(): { type: string; count: number }[] {
    const counts = new Map<string, number>();
    for (const event of this.events) {
      counts.set(event.type, (counts.get(event.type) || 0) + 1);
    }
    return Array.from(counts.entries()).map(([type, count]) => ({ type, count }));
  }
}

export async function runRecorder(options: RecorderOptions): Promise<void> {
  const recorder = new Recorder(options);
  await recorder.start();
  
  console.log('\n📊 Recording Summary:');
  for (const { type, count } of recorder.getSummary()) {
    console.log(`   ${type}: ${count}`);
  }
  console.log('');
  
  await recorder.save();
}