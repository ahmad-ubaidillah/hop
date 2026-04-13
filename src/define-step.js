class StepRegistry {
    steps = [];
    define(pattern, handler, type) {
        this.steps.push({ pattern, handler, type });
    }
    find(text) {
        for (const step of this.steps) {
            if (typeof step.pattern === 'string') {
                const regex = this.patternToRegex(step.pattern);
                if (regex.test(text)) {
                    return step;
                }
            }
            else if (step.pattern.test(text)) {
                return step;
            }
        }
        return null;
    }
    patternToRegex(pattern) {
        let regex = pattern
            .replace(/\{string\}/g, '(.+)')
            .replace(/\{int\}/g, '(\\d+)')
            .replace(/\{float\}/g, '([\\d.]+)')
            .replace(/\{word\}/g, '(\\w+)')
            .replace(/\{.*?\}/g, '(.+)');
        return new RegExp(`^${regex}$`, 'i');
    }
    getAll() {
        return [...this.steps];
    }
    clear() {
        this.steps = [];
    }
}
const globalStepRegistry = new StepRegistry();
export function defineStep(pattern, handler) {
    globalStepRegistry.define(pattern, handler);
}
export function defineGiven(pattern, handler) {
    globalStepRegistry.define(pattern, handler, 'given');
}
export function defineWhen(pattern, handler) {
    globalStepRegistry.define(pattern, handler, 'when');
}
export function defineThen(pattern, handler) {
    globalStepRegistry.define(pattern, handler, 'then');
}
export function getStepRegistry() {
    return globalStepRegistry;
}
export function clearStepDefinitions() {
    globalStepRegistry.clear();
}
export { StepRegistry };
