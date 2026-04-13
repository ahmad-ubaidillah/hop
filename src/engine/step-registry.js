import { parseCucumberExpression, matchExpression } from './cucumber-expression.js';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
export class StepRegistry {
    mappings = new Map();
    stepsPath;
    loaded = false;
    constructor(stepsPath) {
        this.stepsPath = stepsPath;
    }
    async loadCustomSteps() {
        if (this.loaded)
            return;
        try {
            const stepsDir = join(process.cwd(), this.stepsPath);
            const stats = await stat(stepsDir);
            if (stats.isDirectory()) {
                await this.loadStepsFromDirectory(stepsDir);
            }
            else {
                await this.loadSingleFile(this.stepsPath);
            }
            this.loaded = true;
        }
        catch {
            // No custom steps found, that's okay
        }
    }
    async loadStepsFromDirectory(dirPath) {
        const files = await readdir(dirPath);
        for (const file of files) {
            if (!file.endsWith('.ts') && !file.endsWith('.js'))
                continue;
            if (file.startsWith('.'))
                continue;
            const filePath = join(dirPath, file);
            await this.loadSingleFile(filePath);
        }
    }
    async loadSingleFile(filePath) {
        try {
            const module = await import(filePath + '?t=' + Date.now());
            if (module.default) {
                this.registerSteps(module.default);
            }
            for (const [name, handler] of Object.entries(module)) {
                if (name !== 'default' && typeof handler === 'function') {
                    this.registerStep(name, handler);
                }
            }
        }
        catch (e) {
            console.warn(`Failed to load steps from ${filePath}:`, e);
        }
    }
    registerSteps(steps) {
        for (const [pattern, handler] of Object.entries(steps)) {
            this.registerStep(pattern, handler);
        }
    }
    registerStep(pattern, handler) {
        const [keyword, ...patternParts] = pattern.split(' ');
        const patternStr = patternParts.join(' ');
        if (!keyword)
            return;
        const isCucumberExpression = /\{[^}]+\}/.test(patternStr);
        let regex;
        let parsedExpression;
        if (isCucumberExpression) {
            parsedExpression = parseCucumberExpression(patternStr);
            regex = parsedExpression.regex;
        }
        else {
            regex = this.convertToRegex(patternStr);
        }
        if (!this.mappings.has(keyword)) {
            this.mappings.set(keyword, []);
        }
        this.mappings.get(keyword).push({
            pattern: regex,
            expression: parsedExpression,
            handler,
            originalPattern: patternStr,
        });
    }
    findHandler(keyword, text) {
        const mappings = this.mappings.get(keyword) || [];
        for (const mapping of mappings) {
            if (mapping.expression) {
                const result = matchExpression(mapping.originalPattern, text);
                if (result.matched) {
                    return { handler: mapping.handler, params: result.parameters };
                }
            }
            else {
                mapping.pattern.lastIndex = 0;
                if (mapping.pattern.test(text)) {
                    return { handler: mapping.handler };
                }
            }
        }
        return null;
    }
    convertToRegex(pattern) {
        let regexStr = pattern
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            .replace(/\(([^)]+)\)/g, (_, p) => `(${p})`)
            .replace(/'([^']+)'/g, '($1)')
            .replace(/"([^"]+)"/g, '($1)');
        return new RegExp(`^${regexStr}$`, 'i');
    }
    getRegisteredSteps() {
        const steps = [];
        for (const [keyword, mappings] of this.mappings) {
            for (const mapping of mappings) {
                steps.push(`${keyword} ${mapping.originalPattern}`);
            }
        }
        return steps;
    }
}
