import type { Feature, TestContext, TestResult, EngineOptions, Logger } from '../types/index.js';
import { BufferedLogger } from '../utils/buffered-logger.js';
import { TestResultCollector } from './test-result-collector.js';
import { StepExecutor } from './step-executor.js';
import { HooksRunner } from './hooks-runner.js';
import { loadEnv } from '../utils/env-loader.js';
import { GherkinParser } from '../parser/gherkin-parser.js';
import { generateUndefinedStepMessage, type SnippetOptions } from './snippet-generator.js';
import { TagFilter } from '../utils/tag-filter.js';
import { ScenarioRunner } from './scenario-runner.js';

export class TestEngine {
  private options: EngineOptions;
  private envConfig: Record<string, string>;
  private hooksRunner: HooksRunner;
  private scenarioRunner: ScenarioRunner;
  private undefinedSteps: SnippetOptions[] = [];
  
  constructor(options: EngineOptions) {
    this.options = options;
    this.envConfig = loadEnv(options.env);
    
    if (options.verbose) {
      console.log('📋 Environment variables loaded:', Object.keys(this.envConfig).length);
    }
    
    this.hooksRunner = new HooksRunner('./hooks');
    this.scenarioRunner = new ScenarioRunner(this.hooksRunner, this.undefinedSteps);
  }

  private createExecutor(logger?: Logger): StepExecutor {
    return new StepExecutor({
      featuresPath: this.options.featuresPath,
      stepsPath: this.options.stepsPath,
      env: this.options.env,
      verbose: this.options.verbose,
      timeout: this.options.timeout,
      envConfig: this.envConfig,
      logger,
    });
  }
  
  async run(features: Feature[], collector: TestResultCollector): Promise<TestResult[]> {
    const results: TestResult[] = [];
    await this.hooksRunner.beforeAll();
    
    const filteredFeatures = TagFilter.filter(features, this.options.tags);
    
    if (this.options.parallel) {
      const concurrency = this.options.concurrency || 4;
      const chunks = this.splitIntoChunks(filteredFeatures, concurrency);
      
      const featurePromises = chunks.map(async (chunk) => {
        const workerLogger = new BufferedLogger();
        const workerExecutor = this.createExecutor(workerLogger);
        const chunkResults: TestResult[] = [];
        
        for (const feature of chunk) {
          const featureResults = await this.runFeature(feature, collector, workerExecutor);
          chunkResults.push(...featureResults);
          
          if (this.options.verbose && workerLogger.getLogs().length > 0) {
            console.log(`\n--- Logs for Feature: ${feature.name} ---`);
            workerLogger.print();
            workerLogger.clear();
          }
        }
        await workerExecutor.cleanup();
        return chunkResults;
      });
      
      const allResultsChunks = await Promise.all(featurePromises);
      for (const chunkResults of allResultsChunks) {
        results.push(...chunkResults);
      }
    } else {
      const executor = this.createExecutor();
      for (const feature of filteredFeatures) {
        const featureResults = await this.runFeature(feature, collector, executor);
        results.push(...featureResults);
      }
      await executor.cleanup();
    }
    
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

  private splitIntoChunks<T>(array: T[], count: number): T[][] {
    const chunks: T[][] = Array.from({ length: Math.min(count, array.length) }, () => []);
    array.forEach((item, index) => {
      chunks[index % chunks.length].push(item);
    });
    return chunks;
  }
  
  private createContext(featureFilePath?: string, logger: Logger = console): TestContext {
    return {
      baseUrl: '',
      path: '',
      method: 'GET',
      headers: {},
      queryParams: {},
      body: undefined,
      variables: {},
      cookies: {},
      read: async (filePath: string) => {
        const parser = new GherkinParser();
        return await parser.read(filePath, featureFilePath);
      },
      logger,
    };
  }
}
