import type { Feature, TestResult, EngineOptions, TestContext, Logger } from '../types/index.js';
import { TestResultCollector } from './test-result-collector.js';
import { StepExecutor } from './step-executor.js';
import { HooksRunner } from './hooks-runner.js';
import { loadEnv } from '../utils/env-loader.js';
import { GherkinParser } from '../parser/gherkin-parser.js';
import { generateUndefinedStepMessage, type SnippetOptions } from './snippet-generator.js';
import { TagFilter } from '../utils/tag-filter.js';
import { ScenarioRunner } from './scenario-runner.js';
import { ExecutionManager } from './execution-manager.js';

export class TestEngine {
  private options: EngineOptions;
  private envConfig: Record<string, string>;
  private hooksRunner: HooksRunner;
  private scenarioRunner: ScenarioRunner;
  private executionManager: ExecutionManager;
  private undefinedSteps: SnippetOptions[] = [];
  
  constructor(options: EngineOptions) {
    this.options = options;
    this.envConfig = loadEnv(options.env);
    this.hooksRunner = new HooksRunner('./hooks');
    this.scenarioRunner = new ScenarioRunner(this.hooksRunner, this.undefinedSteps);
    this.executionManager = new ExecutionManager(
      options, 
      this.envConfig, 
      this.runFeature.bind(this)
    );
  }

  async run(features: Feature[], collector: TestResultCollector): Promise<TestResult[]> {
    await this.hooksRunner.beforeAll();
    const filteredFeatures = TagFilter.filter(features, this.options.tags);
    const results = await this.executionManager.run(filteredFeatures, collector);
    
    if (this.undefinedSteps.length > 0) {
      console.log(generateUndefinedStepMessage(this.undefinedSteps));
    }
    await this.hooksRunner.afterAll();
    return results;
  }

  private async runFeature(feature: Feature, collector: TestResultCollector, executor: StepExecutor): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const featureContext = this.createContext(feature.filePath, executor.getLogger());
    
    if (feature.background) {
      for (const step of feature.background.steps) {
        try {
          await executor.executeStep(step, featureContext);
        } catch (error) {
          console.error(`Background step failed in ${feature.filePath}:`, error);
        }
      }
    }
    
    for (const scenario of feature.scenarios) {
      if (scenario.outline && scenario.examples) {
        for (const example of scenario.examples) {
          const exampleResults = await this.scenarioRunner.runScenarioOutline(
            feature,
            scenario,
            example.table,
            collector,
            featureContext,
            executor
          );
          results.push(...exampleResults);
        }
      } else {
        const result = await this.scenarioRunner.runScenario(feature, scenario, collector, featureContext, executor);
        results.push(result);
      }
    }
    return results;
  }
  
  private createContext(featureFilePath?: string, logger: Logger = console): TestContext {
    const parser = new GherkinParser();
    return {
      baseUrl: '',
      path: '',
      method: 'GET',
      headers: {},
      queryParams: {},
      body: undefined,
      variables: {},
      cookies: {},
      read: async (filePath: string) => await parser.read(filePath, featureFilePath),
      logger,
    };
  }
}
