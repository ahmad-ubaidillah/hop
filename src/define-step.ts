import type { TestContext } from './types/index.js';

export interface StepDefinition {
  pattern: string | RegExp;
  handler: (this: TestContext, ...args: any[]) => Promise<void>;
  type?: 'given' | 'when' | 'then';
}

class StepRegistry {
  private steps: StepDefinition[] = [];

  define(pattern: string | RegExp, handler: StepDefinition['handler'], type?: StepDefinition['type']): void {
    this.steps.push({ pattern, handler, type });
  }

  find(text: string): StepDefinition | null {
    for (const step of this.steps) {
      if (typeof step.pattern === 'string') {
        const regex = this.patternToRegex(step.pattern);
        if (regex.test(text)) {
          return step;
        }
      } else if (step.pattern.test(text)) {
        return step;
      }
    }
    return null;
  }

  private patternToRegex(pattern: string): RegExp {
    let regex = pattern
      .replace(/\{string\}/g, '(.+)')
      .replace(/\{int\}/g, '(\\d+)')
      .replace(/\{float\}/g, '([\\d.]+)')
      .replace(/\{word\}/g, '(\\w+)')
      .replace(/\{.*?\}/g, '(.+)');
    return new RegExp(`^${regex}$`, 'i');
  }

  getAll(): StepDefinition[] {
    return [...this.steps];
  }

  clear(): void {
    this.steps = [];
  }
}

const globalStepRegistry = new StepRegistry();

export function defineStep(pattern: string | RegExp, handler: StepDefinition['handler']): void {
  globalStepRegistry.define(pattern, handler);
}

export function defineGiven(pattern: string | RegExp, handler: StepDefinition['handler']): void {
  globalStepRegistry.define(pattern, handler, 'given');
}

export function defineWhen(pattern: string | RegExp, handler: StepDefinition['handler']): void {
  globalStepRegistry.define(pattern, handler, 'when');
}

export function defineThen(pattern: string | RegExp, handler: StepDefinition['handler']): void {
  globalStepRegistry.define(pattern, handler, 'then');
}

export function getStepRegistry(): StepRegistry {
  return globalStepRegistry;
}

export function clearStepDefinitions(): void {
  globalStepRegistry.clear();
}

export { StepRegistry };
export type { StepDefinition as StepDefinitionType };