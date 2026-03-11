import type { Feature, TestContext, TestResult, StepResult, EngineOptions, HttpMethod, Response, Scenario } from '../types/index.js';
import { TestResultCollector } from './test-result-collector.js';
import { StepExecutor } from './step-executor.js';
import { HooksRunner } from './hooks-runner.js';
import { loadEnv } from '../utils/env-loader.js';

export class TestEngine {
  private options: EngineOptions;
  private stepExecutor: StepExecutor;
  private envConfig: Record<string, string>;
  private hooksRunner: HooksRunner;
  
  constructor(options: EngineOptions) {
    this.options = options;
    
    // Load environment variables
    this.envConfig = loadEnv(options.env);
    
    if (options.verbose) {
      console.log('📋 Environment variables loaded:', Object.keys(this.envConfig).length);
    }
    
    this.stepExecutor = new StepExecutor({
      stepsPath: options.stepsPath,
      env: options.env,
      verbose: options.verbose,
      timeout: options.timeout,
      envConfig: this.envConfig,
    });
    
    // Initialize hooks runner
    this.hooksRunner = new HooksRunner('./hooks');
  }
  
  /**
   * Run all features
   */
  async run(features: Feature[], collector: TestResultCollector): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    // Execute beforeAll hook
    await this.hooksRunner.beforeAll();
    
    // Bun automatically loads .env files
    // Use process.env or import.meta.env for environment variables
    
    // Filter features by tags
    const filteredFeatures = this.filterByTags(features);
    
    for (const feature of filteredFeatures) {
      // Create feature-level context
      const featureContext = this.createContext();
      
      // Run background steps if present
      if (feature.background) {
        for (const step of feature.background.steps) {
          try {
            await this.stepExecutor.executeStep(step, featureContext);
          } catch (error) {
            // Log background failure but continue
            console.error('Background step failed:', error);
          }
        }
      }
      
      // Run each scenario
      for (const scenario of feature.scenarios) {
        // Handle Scenario Outline with examples
        if (scenario.outline && scenario.examples) {
          for (const example of scenario.examples) {
            const exampleResults = await this.runScenarioOutline(
              feature,
              scenario,
              example.table,
              collector,
              featureContext
            );
            results.push(...exampleResults);
          }
        } else {
          const result = await this.runScenario(feature, scenario, collector, featureContext);
          results.push(result);
        }
      }
    }
    
    // Execute afterAll hook
    await this.hooksRunner.afterAll();
    
    return results;
  }
  
  private filterByTags(features: Feature[]): Feature[] {
    if (!this.options.tags) return features;
    
    const filterTags = this.options.tags.replace(/@/g, '').split(',').map(t => t.trim());
    
    return features.map(feature => {
      // Check if feature has matching tags
      const featureHasMatchingTag = feature.tags && feature.tags.some(tag => filterTags.includes(tag));
      
      // Filter scenarios that have any matching tag OR scenarios from features with matching tags
      const filteredScenarios = feature.scenarios.filter(scenario => {
        // If scenario has tags, check for matches
        if (scenario.tags && scenario.tags.length > 0) {
          const scenarioHasMatch = scenario.tags.some(tag => filterTags.includes(tag));
          if (scenarioHasMatch) return true;
        }
        // If feature has matching tag, include all scenarios
        if (featureHasMatchingTag) return true;
        // Otherwise exclude
        return false;
      });
      
      return {
        ...feature,
        scenarios: filteredScenarios,
      };
    }).filter(feature => feature.scenarios.length > 0);
  }
  
  private createContext(): TestContext {
    return {
      baseUrl: '',
      path: '',
      method: 'GET',
      headers: {},
      queryParams: {},
      body: undefined,
      variables: {},
      cookies: {},
    };
  }
  
  private async runScenarioOutline(
    feature: Feature,
    scenario: Scenario,
    table: { headers: string[]; rows: string[][] },
    collector: TestResultCollector,
    featureContext: TestContext
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    // Clone the context for each example row
    for (let i = 0; i < table.rows.length; i++) {
      const row = table.rows[i];
      const context = { ...featureContext };
      
      // Inject table variables
      for (let j = 0; j < table.headers.length; j++) {
        context.variables[table.headers[j]] = row[j];
      }
      
      // Replace <variable> in step text
      const modifiedScenario = this.injectVariables(scenario, table.headers, row);
      
      const result = await this.runScenario(
        feature,
        modifiedScenario,
        collector,
        context,
        ` (Row ${i + 1})`
      );
      results.push(result);
    }
    
    return results;
  }
  
  private injectVariables(scenario: Scenario, headers: string[], row: string[]): Scenario {
    const map = new Map<string, string>();
    for (let i = 0; i < headers.length; i++) {
      map.set(`<${headers[i]}>`, row[i]);
    }
    
    return {
      ...scenario,
      steps: scenario.steps.map(step => ({
        ...step,
        text: this.replaceVariables(step.text, map),
      })),
    };
  }
  
  private replaceVariables(text: string, map: Map<string, string>): string {
    let result = text;
    for (const [key, value] of map) {
      // Use simple string replacement (key is already like '<title>')
      result = result.split(key).join(value);
    }
    return result;
  }
  
  private async runScenario(
    feature: Feature,
    scenario: Scenario,
    collector: TestResultCollector,
    context: TestContext,
    suffix: string = ''
  ): Promise<TestResult> {
    const startTime = Date.now();
    const stepResults: StepResult[] = [];
    
    // Create scenario-level context (clone from feature context)
    const scenarioContext: TestContext = JSON.parse(JSON.stringify(context));
    
    // Execute beforeScenario hook
    await this.hooksRunner.beforeScenario(scenario, scenarioContext);
    
    for (const step of scenario.steps) {
      const stepStartTime = Date.now();
      
      // Execute beforeStep hook
      await this.hooksRunner.beforeStep(step, scenarioContext);
      
      try {
        await this.stepExecutor.executeStep(step, scenarioContext);
        
        stepResults.push({
          step,
          status: 'passed',
          duration: Date.now() - stepStartTime,
        });
        
        // Execute afterStep hook (success)
        await this.hooksRunner.afterStep(step, scenarioContext, { status: 'passed' });
      } catch (error) {
        stepResults.push({
          step,
          status: 'failed',
          duration: Date.now() - stepStartTime,
          error: error instanceof Error ? error.message : String(error),
        });
        
        // Execute afterStep hook (failure)
        await this.hooksRunner.afterStep(step, scenarioContext, { status: 'failed', error });
        
        // Stop execution on first failure
        break;
      }
    }
    
    const duration = Date.now() - startTime;
    const failed = stepResults.some(r => r.status === 'failed');
    
    const result: TestResult = {
      featureName: feature.name,
      scenarioName: scenario.name + suffix,
      status: failed ? 'failed' : 'passed',
      duration,
      steps: stepResults,
      tags: scenario.tags,
    };
    
    if (failed) {
      const failedStep = stepResults.find(r => r.status === 'failed');
      result.error = failedStep?.error;
    }
    
    collector.add(result);
    
    // Execute afterScenario hook
    await this.hooksRunner.afterScenario(scenario, scenarioContext, result);
    
    return result;
  }
}
