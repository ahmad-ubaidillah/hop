import { resolveEnvVariables as resolveEnv } from './env-loader.js';
export class VariableResolver {
    envConfig;
    cache = new Map();
    constructor(envConfig = {}) {
        this.envConfig = envConfig;
    }
    resolve(value, context) {
        if (value === null || value === undefined)
            return value;
        if (Array.isArray(value))
            return value.map(item => this.resolve(item, context));
        if (typeof value === 'object') {
            const result = {};
            for (const [key, val] of Object.entries(value)) {
                result[key] = this.resolve(val, context);
            }
            return result;
        }
        if (typeof value !== 'string')
            return value;
        const cacheKey = `${value}_${JSON.stringify(context.variables)}`;
        if (this.cache.has(cacheKey))
            return this.cache.get(cacheKey);
        let resolved = resolveEnv(value, this.envConfig);
        // Full match optimizations
        const fullMatch = resolved.match(/^[#\$]\(?(\w+)\)?$/);
        if (fullMatch) {
            const name = fullMatch[1];
            if (context.variables[name] !== undefined) {
                const result = context.variables[name];
                this.cache.set(cacheKey, result);
                return result;
            }
        }
        const result = resolved.replace(/\$\{(\w+)\}/g, (_, name) => context.variables[name] ?? '')
            .replace(/#\((\w+)\)/g, (_, name) => context.variables[name] ?? '')
            .replace(/#(\w+)/g, (_, name) => context.variables[name] ?? '');
        this.cache.set(cacheKey, result);
        return result;
    }
}
