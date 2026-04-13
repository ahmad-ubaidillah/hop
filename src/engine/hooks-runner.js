import * as path from 'path';
import * as fs from 'fs';
export class HooksRunner {
    hooks;
    hooksPath;
    constructor(hooksPath = './hooks') {
        this.hooksPath = hooksPath;
        this.hooks = {};
        this.loadHooks();
    }
    /**
     * Load hooks from the hooks directory
     */
    async loadHooks() {
        try {
            // Try to load hooks from the hooks directory
            const hooksFile = path.resolve(process.cwd(), this.hooksPath);
            if (fs.existsSync(hooksFile)) {
                // Check if it's a directory
                const stat = fs.statSync(hooksFile);
                if (stat.isDirectory()) {
                    // Try to load index.ts or hooks.ts
                    const indexPath = path.join(hooksFile, 'index.ts');
                    const hooksPath = path.join(hooksFile, 'hooks.ts');
                    if (fs.existsSync(indexPath)) {
                        await this.importHooks(indexPath);
                    }
                    else if (fs.existsSync(hooksPath)) {
                        await this.importHooks(hooksPath);
                    }
                }
                else if (hooksFile.endsWith('.ts') || hooksFile.endsWith('.js')) {
                    await this.importHooks(hooksFile);
                }
            }
        }
        catch (error) {
            // Silently ignore if hooks can't be loaded
            if (process.env.VERBOSE) {
                console.log('⚠️  Could not load hooks:', error);
            }
        }
    }
    /**
     * Import hooks from a file
     */
    async importHooks(filePath) {
        try {
            // Dynamic import for ES modules
            const hooksModule = await import(filePath);
            this.hooks = {
                beforeAll: hooksModule.beforeAll,
                afterAll: hooksModule.afterAll,
                beforeScenario: hooksModule.beforeScenario,
                afterScenario: hooksModule.afterScenario,
                beforeStep: hooksModule.beforeStep,
                afterStep: hooksModule.afterStep,
            };
        }
        catch (error) {
            console.warn('⚠️  Failed to import hooks:', error);
        }
    }
    /**
     * Execute beforeAll hook
     */
    async beforeAll() {
        if (this.hooks.beforeAll) {
            await this.hooks.beforeAll();
        }
    }
    /**
     * Execute afterAll hook
     */
    async afterAll() {
        if (this.hooks.afterAll) {
            await this.hooks.afterAll();
        }
    }
    /**
     * Execute beforeScenario hook
     */
    async beforeScenario(scenario, context) {
        if (this.hooks.beforeScenario) {
            await this.hooks.beforeScenario(scenario, context);
        }
    }
    /**
     * Execute afterScenario hook
     */
    async afterScenario(scenario, context, result) {
        if (this.hooks.afterScenario) {
            await this.hooks.afterScenario(scenario, context, result);
        }
    }
    /**
     * Execute beforeStep hook
     */
    async beforeStep(step, context) {
        if (this.hooks.beforeStep) {
            await this.hooks.beforeStep(step, context);
        }
    }
    /**
     * Execute afterStep hook
     */
    async afterStep(step, context, result) {
        if (this.hooks.afterStep) {
            await this.hooks.afterStep(step, context, result);
        }
    }
}
