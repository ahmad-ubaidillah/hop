import type { Step, TestContext } from '../types/index.js';

type StepHandler = (step: Step, context: TestContext) => Promise<void> | void;

interface StepMapping {
  pattern: RegExp;
  handler: StepHandler;
}

export class StepRegistry {
  private mappings: Map<string, StepMapping[]> = new Map();
  private stepsPath: string;
  
  constructor(stepsPath: string) {
    this.stepsPath = stepsPath;
    this.registerBuiltInSteps();
  }
  
  /**
   * Register built-in step definitions
   */
  private registerBuiltInSteps(): void {
    // This would load custom step definitions from files
    // For now, we'll keep it simple
  }
  
  /**
   * Load custom step definitions from files
   */
  async loadCustomSteps(): Promise<void> {
    try {
      // Try to import custom steps if they exist
      const customSteps = await import(this.stepsPath + '/custom-steps.js').catch(() => null);
      if (customSteps && customSteps.default) {
        this.registerSteps(customSteps.default);
      }
    } catch {
      // No custom steps found, that's okay
    }
  }
  
  /**
   * Register custom step definitions
   */
  registerSteps(steps: Record<string, StepHandler>): void {
    for (const [pattern, handler] of Object.entries(steps)) {
      const [keyword, ...patternParts] = pattern.split(' ');
      const patternStr = patternParts.join(' ');
      
      const regex = this.convertToRegex(patternStr);
      
      if (!this.mappings.has(keyword)) {
        this.mappings.set(keyword, []);
      }
      
      this.mappings.get(keyword)!.push({
        pattern: regex,
        handler,
      });
    }
  }
  
  /**
   * Find a handler for the given step
   */
  findHandler(keyword: string, text: string): StepHandler | null {
    const mappings = this.mappings.get(keyword) || [];
    
    for (const mapping of mappings) {
      if (mapping.pattern.test(text)) {
        return mapping.handler;
      }
    }
    
    return null;
  }
  
  /**
   * Convert Gherkin pattern to regex
   */
  private convertToRegex(pattern: string): RegExp {
    // Convert "(.*)" to capture groups, etc.
    let regexStr = pattern
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape special chars
      .replace(/\(([^)]+)\)/g, (_, p) => `(${p})`) // Keep existing groups
      .replace(/'([^']+)'/g, '($1)') // Convert 'text' to group
      .replace(/"([^"]+)"/g, '($1)'); // Convert "text" to group
    
    return new RegExp(`^${regexStr}$`, 'i');
  }
}
