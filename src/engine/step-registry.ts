import type { Step, TestContext } from '../types/index.js';
import { parseCucumberExpression, matchExpression, type ParsedExpression } from './cucumber-expression.js';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

type StepHandler = (step: Step, context: TestContext, params?: Record<string, any>) => Promise<void> | void;

interface StepMapping {
  pattern: RegExp;
  expression?: ParsedExpression;
  handler: StepHandler;
  originalPattern: string;
}

export class StepRegistry {
  private mappings: Map<string, StepMapping[]> = new Map();
  private stepsPath: string;
  private loaded = false;
  
  constructor(stepsPath: string) {
    this.stepsPath = stepsPath;
  }
  
  async loadCustomSteps(): Promise<void> {
    if (this.loaded) return;
    
    try {
      const stepsDir = join(process.cwd(), this.stepsPath);
      
      const stats = await stat(stepsDir);
      
      if (stats.isDirectory()) {
        console.log(`[Hop] Loading custom steps from: ${stepsDir}`);
        await this.loadStepsFromDirectory(stepsDir);
      } else {
        console.log(`[Hop] Loading custom steps from: ${this.stepsPath}`);
        await this.loadSingleFile(this.stepsPath);
      }
      
      this.loaded = true;
      
      const registeredCount = this.getRegisteredSteps().length;
      console.log(`[Hop] Registered ${registeredCount} custom step(s)`);
    } catch (e) {
      console.log(`[Hop] No custom steps directory found at: ${this.stepsPath}`);
    }
  }
  
  private async loadStepsFromDirectory(dirPath: string): Promise<void> {
    const files = await readdir(dirPath);
    
    for (const file of files) {
      if (!file.endsWith('.ts') && !file.endsWith('.js')) continue;
      if (file.startsWith('.')) continue;
      
      const filePath = join(dirPath, file);
      await this.loadSingleFile(filePath);
    }
  }
  
  private async loadSingleFile(filePath: string): Promise<void> {
    try {
      console.log(`[Hop] Loading step file: ${filePath}`);
      const module = await import(filePath + '?t=' + Date.now());
      
      if (module.default) {
        const stepCount = Object.keys(module.default).length;
        console.log(`[Hop] Found ${stepCount} step(s) in default export`);
        this.registerSteps(module.default);
      }
      
      for (const [name, handler] of Object.entries(module)) {
        if (name !== 'default' && typeof handler === 'function') {
          this.registerStep(name, handler as StepHandler);
        }
      }
    } catch (e) {
      console.warn(`[Hop] Failed to load steps from ${filePath}:`, e);
    }
  }
  
  registerSteps(steps: Record<string, StepHandler>): void {
    for (const [pattern, handler] of Object.entries(steps)) {
      this.registerStep(pattern, handler);
    }
  }
  
  registerStep(pattern: string, handler: StepHandler): void {
    const [keyword, ...patternParts] = pattern.split(' ');
    const patternStr = patternParts.join(' ');
    
    if (!keyword) return;
    
    const isCucumberExpression = /\{[^}]+\}/.test(patternStr);
    
    let regex: RegExp;
    let parsedExpression;
    
    if (isCucumberExpression) {
      parsedExpression = parseCucumberExpression(patternStr);
      regex = parsedExpression.regex;
    } else {
      regex = this.convertToRegex(patternStr);
    }
    
    if (!this.mappings.has(keyword)) {
      this.mappings.set(keyword, []);
    }
    
    this.mappings.get(keyword)!.push({
      pattern: regex,
      expression: parsedExpression,
      handler,
      originalPattern: patternStr,
    });
  }
  
  findHandler(keyword: string, text: string): { handler: StepHandler; params?: Record<string, any> } | null {
    const mappings = this.mappings.get(keyword) || [];
    
    for (const mapping of mappings) {
      if (mapping.expression) {
        const result = matchExpression(mapping.originalPattern, text);
        if (result.matched) {
          return { handler: mapping.handler, params: result.parameters };
        }
      } else {
        mapping.pattern.lastIndex = 0;
        if (mapping.pattern.test(text)) {
          return { handler: mapping.handler };
        }
      }
    }
    
    return null;
  }
  
  private convertToRegex(pattern: string): RegExp {
    let regexStr = pattern
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\(([^)]+)\)/g, (_, p) => `(${p})`)
      .replace(/'([^']+)'/g, '($1)')
      .replace(/"([^"]+)"/g, '($1)');
    
    return new RegExp(`^${regexStr}$`, 'i');
  }
  
  getRegisteredSteps(): string[] {
    const steps: string[] = [];
    for (const [keyword, mappings] of this.mappings) {
      for (const mapping of mappings) {
        steps.push(`${keyword} ${mapping.originalPattern}`);
      }
    }
    return steps;
  }
}
