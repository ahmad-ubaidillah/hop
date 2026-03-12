import { resolveEnvVariables as resolveEnv } from './env-loader.js';
import type { EnvConfig } from './env-loader.js';
import type { TestContext } from '../types/index.js';

export class VariableResolver {
  private cache = new Map<string, any>();

  constructor(private envConfig: EnvConfig = {}) {}

  public resolve(value: any, context: TestContext): any {
    if (value === null || value === undefined) return value;
    if (Array.isArray(value)) return value.map(item => this.resolve(item, context));
    if (typeof value === 'object') {
      const result: Record<string, any> = {};
      for (const [key, val] of Object.entries(value)) {
        result[key] = this.resolve(val, context);
      }
      return result;
    }
    if (typeof value !== 'string') return value;

    const cacheKey = `${value}_${JSON.stringify(context.variables)}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

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

    const result = resolved.replace(/\$\{(\w+)\}/g, (_, name) => context.variables[name] ?? `$\{${name}\}`)
                          .replace(/#\((\w+)\)/g, (_, name) => context.variables[name] ?? `#(${name})`)
                          .replace(/#(\w+)/g, (_, name) => context.variables[name] ?? `#${name}`);

    this.cache.set(cacheKey, result);
    return result;
  }
}
