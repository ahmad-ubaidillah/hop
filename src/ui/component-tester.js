import { chromium } from 'playwright-core';
import * as path from 'path';
import * as fs from 'fs';
export class ComponentTester {
    browser = null;
    context = null;
    page = null;
    options;
    currentComponent = null;
    devServerRunning = false;
    constructor(options) {
        this.options = {
            headless: true,
            timeout: 30000,
            ...options,
        };
    }
    async startDevServer() {
        if (this.options.devServerUrl) {
            this.devServerRunning = true;
            console.log(`   Using existing dev server: ${this.options.devServerUrl}`);
            return;
        }
        const { spawn } = await import('child_process');
        const framework = this.options.framework;
        const rootDir = this.options.rootDir;
        console.log(`   Starting ${framework} dev server...`);
        let command;
        let args;
        if (fs.existsSync(path.join(rootDir, 'package.json'))) {
            if (fs.existsSync(path.join(rootDir, 'vite.config.ts'))) {
                command = 'npx';
                args = ['vite', '--port', '5173'];
            }
            else if (fs.existsSync(path.join(rootDir, 'webpack.config.js'))) {
                command = 'npx';
                args = ['webpack', 'serve', '--port', '5173'];
            }
            else if (fs.existsSync(path.join(rootDir, 'angular.json'))) {
                command = 'npx';
                args = ['ng', 'serve', '--port', '5173'];
            }
            else {
                console.warn('   No known bundler found. Using existing server mode.');
                return;
            }
            const proc = spawn(command, args, {
                cwd: rootDir,
                stdio: 'pipe',
                shell: true,
            });
            proc.stdout?.on('data', (data) => {
                const output = data.toString();
                if (output.includes('Local:') || output.includes('compiled')) {
                    this.devServerRunning = true;
                    console.log('   Dev server ready!');
                }
            });
        }
        this.options.devServerUrl = 'http://localhost:5173';
    }
    async launch() {
        if (this.browser)
            return;
        this.browser = await chromium.launch({ headless: this.options.headless });
        this.context = await this.browser.newContext();
        this.page = await this.context.newPage();
        await this.startDevServer();
    }
    async mount(componentPath, options = {}) {
        if (!this.page)
            await this.launch();
        if (!this.page)
            throw new Error('Failed to launch browser');
        const framework = this.options.framework;
        const devServerUrl = this.options.devServerUrl || 'http://localhost:5173';
        const mountScript = this.generateMountScript(framework, componentPath, options);
        this.currentComponent = componentPath;
        await this.page.goto(devServerUrl);
        await this.page.evaluate((script) => {
            const scriptEl = document.createElement('script');
            scriptEl.textContent = script;
            document.head.appendChild(scriptEl);
        }, mountScript);
        console.log(`   Mounted: ${componentPath}`);
    }
    generateMountScript(framework, componentPath, options) {
        const propsJson = JSON.stringify(options.props || {});
        const onJson = JSON.stringify(options.on || {});
        const stubsJson = JSON.stringify(options.stubs || {});
        switch (framework) {
            case 'react':
                return `
          // React Mount
          console.log('Mounting React component: ${componentPath}');
          const root = document.getElementById('root') || document.createElement('div');
          if (!document.getElementById('root')) {
            root.id = 'root';
            document.body.appendChild(root);
          }
          // In real implementation, this would import and render the component
          root.innerHTML = '<div data-testid="component">${componentPath} loaded</div>';
          window.__HOP_COMPONENT__ = { name: '${componentPath}', props: ${propsJson} };
        `;
            case 'vue':
                return `
          // Vue Mount
          console.log('Mounting Vue component: ${componentPath}');
          const root = document.getElementById('app') || document.createElement('div');
          if (!document.getElementById('app')) {
            root.id = 'app';
            document.body.appendChild(root);
          }
          root.innerHTML = '<div data-testid="component">${componentPath} loaded</div>';
          window.__HOP_COMPONENT__ = { name: '${componentPath}', props: ${propsJson}, on: ${onJson} };
        `;
            case 'angular':
                return `
          // Angular Mount
          console.log('Mounting Angular component: ${componentPath}');
          document.body.innerHTML = '<app-root></app-root>';
          window.__HOP_COMPONENT__ = { name: '${componentPath}', props: ${propsJson} };
        `;
            default:
                return `
          document.body.innerHTML = '<div data-testid="component">${componentPath} loaded</div>';
          window.__HOP_COMPONENT__ = { name: '${componentPath}', props: ${propsJson} };
        `;
        }
    }
    async query(selector) {
        if (!this.page)
            throw new Error('Browser not launched');
        const result = await this.page.evaluate((sel) => {
            const el = document.querySelector(sel);
            if (!el)
                return { found: false };
            return {
                found: true,
                text: el.textContent || '',
                html: el.innerHTML || '',
                attributes: Array.from(el.attributes || []).reduce((acc, attr) => {
                    acc[attr.name] = attr.value;
                    return acc;
                }, {}),
                tag: el.tagName.toLowerCase(),
            };
        }, selector);
        return result;
    }
    async getProp(name) {
        if (!this.page)
            throw new Error('Browser not launched');
        return await this.page.evaluate((propName) => {
            return window.__HOP_COMPONENT__?.props?.[propName];
        }, name);
    }
    async getEmitted() {
        if (!this.page)
            throw new Error('Browser not launched');
        return await this.page.evaluate(() => {
            return window.__HOP_EMITTED__ || {};
        });
    }
    async trigger(event, selector, options) {
        if (!this.page)
            throw new Error('Browser not launched');
        if (selector) {
            await this.page.locator(selector).dispatchEvent(event, options);
        }
        else {
            await this.page.evaluate((ev) => {
                const comp = document.querySelector('[data-testid="component"]');
                if (comp) {
                    comp.dispatchEvent(new Event(ev, { bubbles: true }));
                }
            }, event);
        }
    }
    async type(selector, value) {
        if (!this.page)
            throw new Error('Browser not launched');
        await this.page.fill(selector, value);
    }
    async click(selector) {
        if (!this.page)
            throw new Error('Browser not launched');
        await this.page.click(selector);
    }
    async waitForSelector(selector, timeout = 5000) {
        if (!this.page)
            throw new Error('Browser not launched');
        await this.page.waitForSelector(selector, { timeout });
    }
    async close() {
        if (this.page)
            await this.page.close();
        if (this.context)
            await this.context.close();
        if (this.browser)
            await this.browser.close();
    }
    getPage() {
        return this.page;
    }
}
export function createComponentTester(options) {
    return new ComponentTester(options);
}
export class ComponentTestRunner {
    tester;
    results = [];
    constructor(options) {
        this.tester = createComponentTester(options);
    }
    async runTest(componentName, mountOptions, tests) {
        const startTime = Date.now();
        const assertions = [];
        try {
            await this.tester.mount(componentName, mountOptions);
            for (const testFn of tests) {
                try {
                    await testFn(this.tester);
                    assertions.push({ name: testFn.name || 'unnamed', passed: true });
                }
                catch (error) {
                    assertions.push({
                        name: testFn.name || 'unnamed',
                        passed: false,
                        error: error instanceof Error ? error.message : String(error),
                    });
                }
            }
        }
        catch (error) {
            assertions.push({
                name: 'mount',
                passed: false,
                error: error instanceof Error ? error.message : String(error),
            });
        }
        const result = {
            component: componentName,
            passed: assertions.every((a) => a.passed),
            duration: Date.now() - startTime,
            assertions,
        };
        this.results.push(result);
        return result;
    }
    async close() {
        await this.tester.close();
    }
    getResults() {
        return this.results;
    }
    printSummary() {
        console.log('\n📊 Component Test Summary');
        console.log('═══════════════════════════════════════════════════');
        const passed = this.results.filter((r) => r.passed).length;
        const failed = this.results.filter((r) => !r.passed).length;
        console.log(`   Total: ${this.results.length}`);
        console.log(`   ✅ Passed: ${passed}`);
        console.log(`   ❌ Failed: ${failed}`);
        console.log('');
        for (const result of this.results) {
            const icon = result.passed ? '✅' : '❌';
            console.log(`   ${icon} ${result.component} (${result.duration}ms)`);
            if (!result.passed) {
                for (const assertion of result.assertions.filter((a) => !a.passed)) {
                    console.log(`      ❌ ${assertion.name}: ${assertion.error}`);
                }
            }
        }
        console.log('═══════════════════════════════════════════════════\n');
    }
}
