import { createAccessibilityChecker, createBrowserAPI, AccessibilityChecker, BrowserAPI } from '../../ui/accessibility.js';
export class BrowserApiHandler {
    accessibilityChecker;
    browserApi;
    constructor() {
        this.accessibilityChecker = createAccessibilityChecker();
        this.browserApi = createBrowserAPI();
    }
    canHandle(text) {
        return text.match(/^(Given|When|Then|And|But)?\s*get (window|document)/i) !== null ||
            text.match(/^(Given|When|Then|And|But)?\s*(localStorage|sessionStorage)/i) !== null ||
            text.match(/^(Given|When|Then|And|But)?\s*check accessibility/i) !== null ||
            text.match(/^(Given|When|Then|And|But)?\s*navigator/i) !== null ||
            text.match(/^(Given|When|Then|And|But)?\s*screen/i) !== null;
    }
    async handle(text, step, context, executor) {
        const pw = executor.getPlaywright(context);
        const page = pw?.getPage();
        if (!page)
            throw new Error('Browser not opened. Use "user opens browser" first.');
        this.accessibilityChecker.setPage(page);
        this.browserApi.setPage(page);
        const getWindowMatch = text.match(/get window/i);
        const getDocMatch = text.match(/get document/i);
        const localStorageMatch = text.match(/localStorage/i);
        const sessionStorageMatch = text.match(/sessionStorage/i);
        const accessibilityMatch = text.match(/check accessibility/i);
        const navigatorMatch = text.match(/navigator/i);
        const screenMatch = text.match(/screen/i);
        if (getWindowMatch) {
            const windowInfo = await this.browserApi.getWindow();
            context.variables['__window'] = windowInfo;
            console.log('   ℹ️ Window object retrieved');
            return;
        }
        if (getDocMatch) {
            const docInfo = await this.browserApi.getDocument();
            context.variables['__document'] = docInfo;
            console.log('   ℹ️ Document object retrieved');
            return;
        }
        if (localStorageMatch) {
            const localStorage = await this.browserApi.getLocalStorage();
            context.variables['__localStorage'] = localStorage;
            console.log(`   ℹ️ LocalStorage: ${Object.keys(localStorage).length} items`);
            return;
        }
        if (sessionStorageMatch) {
            const sessionStorage = await this.browserApi.getSessionStorage();
            context.variables['__sessionStorage'] = sessionStorage;
            console.log(`   ℹ️ SessionStorage: ${Object.keys(sessionStorage).length} items`);
            return;
        }
        if (accessibilityMatch) {
            const elementMatch = text.match(/element ['"]([^'"]+)['"]/i);
            let result;
            if (elementMatch) {
                result = await this.accessibilityChecker.checkElement(elementMatch[1]);
            }
            else {
                result = await this.accessibilityChecker.runA11yCheck(context);
            }
            this.accessibilityChecker.printResults(result);
            context.variables['__a11y_result'] = result;
            if (!result.passed) {
                const criticalCount = result.violations.filter(v => v.impact === 'critical').length;
                if (criticalCount > 0) {
                    throw new Error(`Accessibility check failed with ${criticalCount} critical violation(s)`);
                }
            }
            return;
        }
        if (navigatorMatch) {
            const navigator = await this.browserApi.getNavigator();
            context.variables['__navigator'] = navigator;
            console.log(`   ℹ️ Navigator: ${navigator.userAgent.substring(0, 50)}...`);
            return;
        }
        if (screenMatch) {
            const screen = await this.browserApi.getScreen();
            context.variables['__screen'] = screen;
            console.log(`   ℹ️ Screen: ${screen.width}x${screen.height}`);
            return;
        }
    }
}
