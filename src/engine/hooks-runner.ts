/**
 * Hooks Runner for Hop BDD Framework
 * Handles before/after hooks execution
 */
import type { TestContext, Scenario, Step, TestResult } from '../types/index.js';
import * as path from 'path';
import * as fs from 'fs';

export interface Hooks {
  beforeAll?: () => Promise<void>;
  afterAll?: () => Promise<void>;
  beforeScenario?: (scenario: Scenario, context: TestContext) => Promise<void>;
  afterScenario?: (scenario: Scenario, context: TestContext, result: TestResult) => Promise<void>;
  beforeStep?: (step: Step, context: TestContext) => Promise<void>;
  afterStep?: (step: Step, context: TestContext, result: any) => Promise<void>;
}

export class HooksRunner {
  private hooks: Hooks;
  private hooksPath: string;
  
  constructor(hooksPath: string = './hooks') {
    this.hooksPath = hooksPath;
    this.hooks = {};
    this.loadHooks();
  }
  
  /**
   * Load hooks from the hooks directory
   */
  private loadHooks(): void {
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
            this.importHooks(indexPath);
          } else if (fs.existsSync(hooksPath)) {
            this.importHooks(hooksPath);
          }
        } else if (hooksFile.endsWith('.ts') || hooksFile.endsWith('.js')) {
          this.importHooks(hooksFile);
        }
      }
    } catch (error) {
      // Silently ignore if hooks can't be loaded
      if (process.env.VERBOSE) {
        console.log('⚠️  Could not load hooks:', error);
      }
    }
  }
  
  /**
   * Import hooks from a file
   */
  private importHooks(filePath: string): void {
    try {
      // Dynamic import for ES modules
      const hooksModule = require(filePath);
      
      this.hooks = {
        beforeAll: hooksModule.beforeAll,
        afterAll: hooksModule.afterAll,
        beforeScenario: hooksModule.beforeScenario,
        afterScenario: hooksModule.afterScenario,
        beforeStep: hooksModule.beforeStep,
        afterStep: hooksModule.afterStep,
      };
    } catch (error) {
      console.warn('⚠️  Failed to import hooks:', error);
    }
  }
  
  /**
   * Execute beforeAll hook
   */
  async beforeAll(): Promise<void> {
    if (this.hooks.beforeAll) {
      await this.hooks.beforeAll();
    }
  }
  
  /**
   * Execute afterAll hook
   */
  async afterAll(): Promise<void> {
    if (this.hooks.afterAll) {
      await this.hooks.afterAll();
    }
  }
  
  /**
   * Execute beforeScenario hook
   */
  async beforeScenario(scenario: Scenario, context: TestContext): Promise<void> {
    if (this.hooks.beforeScenario) {
      await this.hooks.beforeScenario(scenario, context);
    }
  }
  
  /**
   * Execute afterScenario hook
   */
  async afterScenario(scenario: Scenario, context: TestContext, result: TestResult): Promise<void> {
    if (this.hooks.afterScenario) {
      await this.hooks.afterScenario(scenario, context, result);
    }
  }
  
  /**
   * Execute beforeStep hook
   */
  async beforeStep(step: Step, context: TestContext): Promise<void> {
    if (this.hooks.beforeStep) {
      await this.hooks.beforeStep(step, context);
    }
  }
  
  /**
   * Execute afterStep hook
   */
  async afterStep(step: Step, context: TestContext, result: any): Promise<void> {
    if (this.hooks.afterStep) {
      await this.hooks.afterStep(step, context, result);
    }
  }
}
