import type { Feature, TestResult, EngineOptions, Logger } from '../types/index.js';
import { BufferedLogger } from '../utils/buffered-logger.js';
import { TestResultCollector } from './test-result-collector.js';
import { StepExecutor } from './step-executor.js';

export class ExecutionManager {
  constructor(
    private options: EngineOptions,
    private envConfig: Record<string, string>,
    private runFeature: (feature: Feature, collector: TestResultCollector, executor: StepExecutor) => Promise<TestResult[]>
  ) {}

  public async run(features: Feature[], collector: TestResultCollector): Promise<TestResult[]> {
    if (this.options.parallel) {
      return this.runParallel(features, collector);
    }
    return this.runSequential(features, collector);
  }

  private async runSequential(features: Feature[], collector: TestResultCollector): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const executor = this.createExecutor();
    for (const feature of features) {
      results.push(...(await this.runFeature(feature, collector, executor)));
    }
    await executor.cleanup();
    return results;
  }

  private async runParallel(features: Feature[], collector: TestResultCollector): Promise<TestResult[]> {
    const concurrency = this.options.concurrency || 4;
    const chunks = this.splitIntoChunks(features, concurrency);
    const featurePromises = chunks.map(async (chunk) => {
      const workerLogger = new BufferedLogger();
      const workerExecutor = this.createExecutor(workerLogger);
      const chunkResults: TestResult[] = [];
      for (const feature of chunk) {
        chunkResults.push(...(await this.runFeature(feature, collector, workerExecutor)));
        if (this.options.verbose && workerLogger.getLogs().length > 0) {
          console.log(`\n--- Logs for Feature: ${feature.name} ---`);
          workerLogger.print();
          workerLogger.clear();
        }
      }
      await workerExecutor.cleanup();
      return chunkResults;
    });
    return (await Promise.all(featurePromises)).flat();
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
      video: this.options.video,
    });
  }

  private splitIntoChunks<T>(array: T[], count: number): T[][] {
    const chunks: T[][] = Array.from({ length: Math.min(count, array.length) }, () => []);
    array.forEach((item, index) => chunks[index % chunks.length].push(item));
    return chunks;
  }
}
