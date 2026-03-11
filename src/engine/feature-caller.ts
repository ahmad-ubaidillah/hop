/**
 * Feature Caller for Hop BDD Framework
 * Allows calling one feature from another (like karate.call)
 */

import { join, dirname } from 'path';
import { GherkinParser } from '../parser/gherkin-parser.js';
import { StepExecutor } from './step-executor.js';
import type { TestContext, Feature, Scenario, Step } from '../types/index.js';

export interface CallOptions {
  featurePath?: string; // Optional for internal use
  scenarioName?: string; // If not specified, runs all scenarios
  args?: Record<string, any>; // Arguments to pass to the called feature
  backgroundOnly?: boolean; // If true, only run background steps
}

export interface CallResult {
  success: boolean;
  result?: any;
  error?: string;
  duration: number;
  variables: Record<string, any>;
}

/**
 * Feature Caller - allows calling one feature from another
 * 
 * @example
 * In a feature file:
 *   Given call login.feature
 *   And call create-user.feature with { username: 'test', email: 'test@example.com' }
 *   And call setup-database.feature background
 */
export class FeatureCaller {
  private parser: GherkinParser;
  private basePath: string;
  private stepExecutor: StepExecutor | null = null;
  
  // Cache for loaded features to avoid re-parsing
  private featureCache: Map<string, Feature> = new Map();
  
  constructor(basePath: string = './features') {
    this.basePath = basePath;
    this.parser = new GherkinParser();
  }
  
  /**
   * Set the step executor for running called features
   */
  setStepExecutor(executor: StepExecutor): void {
    this.stepExecutor = executor;
  }
  
  /**
   * Call another feature file
   * 
   * @param featurePath - Relative path to the feature file
   * @param options - Additional options
   */
  async call(featurePath: string, options: CallOptions = {}): Promise<CallResult> {
    const startTime = Date.now();
    const { scenarioName, args = {}, backgroundOnly = false } = options;
    
    try {
      // Resolve the full path
      const fullPath = this.resolvePath(featurePath);
      
      // Load and parse the feature
      const feature = await this.loadFeature(fullPath);
      
      if (!feature) {
        return {
          success: false,
          error: `Feature not found: ${featurePath}`,
          duration: Date.now() - startTime,
          variables: {},
        };
      }
      
      // Create a context for the called feature
      const context = this.createContext(args);
      
      // Run background steps first if they exist
      if (feature.background) {
        for (const step of feature.background.steps) {
          await this.executeStep(step, context);
        }
      }
      
      if (backgroundOnly) {
        return {
          success: true,
          duration: Date.now() - startTime,
          variables: context.variables,
        };
      }
      
      // Find and run the specified scenario or all scenarios
      const scenariosToRun = scenarioName
        ? feature.scenarios.filter(s => s.name === scenarioName)
        : feature.scenarios;
      
      if (scenariosToRun.length === 0 && scenarioName) {
        return {
          success: false,
          error: `Scenario not found: ${scenarioName}`,
          duration: Date.now() - startTime,
          variables: context.variables,
        };
      }
      
      // Run each scenario
      let lastResult: any;
      for (const scenario of scenariosToRun) {
        // Create scenario context (with feature context variables)
        const scenarioContext = this.cloneContext(context);
        
        // Inject scenario outline variables if applicable
        // (This would need to be enhanced for scenario outlines with examples)
        
        // Run steps
        for (const step of scenario.steps) {
          await this.executeStep(step, scenarioContext);
        }
        
        // Store the last response
        lastResult = scenarioContext.response?.body;
      }
      
      return {
        success: true,
        result: lastResult,
        duration: Date.now() - startTime,
        variables: context.variables,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
        variables: {},
      };
    }
  }
  
  /**
   * Call a feature and return shared variables (like karate.call)
   */
  async callShared(featurePath: string, args: Record<string, any> = {}): Promise<Record<string, any>> {
    const result = await this.call(featurePath, { scenarioName: undefined, args, backgroundOnly: false });
    if (!result.success) {
      throw new Error(`Failed to call feature ${featurePath}: ${result.error}`);
    }
    return result.variables;
  }
  
  /**
   * Resolve feature path relative to the base features directory
   */
  private resolvePath(featurePath: string): string {
    // Remove .feature extension if present
    if (featurePath.endsWith('.feature')) {
      featurePath = featurePath.slice(0, -8);
    }
    return join(this.basePath, featurePath + '.feature');
  }
  
  /**
   * Load a feature file (with caching)
   */
  private async loadFeature(featurePath: string): Promise<Feature | null> {
    // Check cache first
    if (this.featureCache.has(featurePath)) {
      return this.featureCache.get(featurePath)!;
    }
    
    try {
      const content = await import('fs/promises').then(fs => 
        fs.readFile(featurePath, 'utf-8')
      );
      
      const feature = await this.parser.parse(content, featurePath);
      
      // Cache the feature
      this.featureCache.set(featurePath, feature);
      
      return feature;
    } catch (error) {
      console.error(`Failed to load feature: ${featurePath}`, error);
      return null;
    }
  }
  
  /**
   * Create a new context with initial arguments
   */
  private createContext(args: Record<string, any> = {}): TestContext {
    return {
      baseUrl: '',
      path: '',
      method: 'GET',
      headers: {},
      queryParams: {},
      body: undefined,
      variables: { ...args }, // Start with provided arguments
      cookies: {},
      read: async (filePath: string) => {
        return await this.parser.read(filePath);
      },
      logger: console,
    };
  }
  
  /**
   * Clone a context (for running scenarios)
   */
  private cloneContext(context: TestContext): TestContext {
    return {
      ...context,
      headers: { ...context.headers },
      queryParams: { ...context.queryParams },
      variables: { ...context.variables },
      cookies: { ...context.cookies },
    };
  }
  
  /**
   * Execute a single step
   */
  private async executeStep(step: Step, context: TestContext): Promise<void> {
    if (!this.stepExecutor) {
      throw new Error('StepExecutor not set. Call setStepExecutor() first.');
    }
    
    await this.stepExecutor.executeStep(step, context);
  }
  
  /**
   * Clear the feature cache
   */
  clearCache(): void {
    this.featureCache.clear();
  }
  
  /**
   * Get the number of cached features
   */
  getCacheSize(): number {
    return this.featureCache.size;
  }
}

/**
 * Global feature caller instance
 */
let globalFeatureCaller: FeatureCaller | null = null;

/**
 * Get or create the global feature caller
 */
export function getFeatureCaller(basePath: string = './features'): FeatureCaller {
  if (!globalFeatureCaller) {
    globalFeatureCaller = new FeatureCaller(basePath);
  }
  return globalFeatureCaller;
}

/**
 * Reset the global feature caller
 */
export function resetFeatureCaller(): void {
  globalFeatureCaller = null;
}
