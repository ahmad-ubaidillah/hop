import { BufferedLogger } from '../utils/buffered-logger.js';
import { TestResultCollector } from './test-result-collector.js';
import { StepExecutor } from './step-executor.js';
export class ExecutionManager {
    options;
    envConfig;
    runFeature;
    constructor(options, envConfig, runFeature) {
        this.options = options;
        this.envConfig = envConfig;
        this.runFeature = runFeature;
    }
    async run(features, collector) {
        if (this.options.parallel) {
            return this.runParallel(features, collector);
        }
        return this.runSequential(features, collector);
    }
    async runSequential(features, collector) {
        const results = [];
        const executor = this.createExecutor();
        await executor.initialize();
        for (const feature of features) {
            results.push(...(await this.runFeature(feature, collector, executor)));
        }
        await executor.cleanup();
        return results;
    }
    async runParallel(features, collector) {
        const concurrency = this.options.concurrency || 4;
        const chunks = this.splitIntoChunks(features, concurrency);
        const featurePromises = chunks.map(async (chunk) => {
            const workerLogger = new BufferedLogger();
            const workerExecutor = this.createExecutor(workerLogger);
            await workerExecutor.initialize();
            const chunkResults = [];
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
    createExecutor(logger) {
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
    splitIntoChunks(array, count) {
        const chunks = Array.from({ length: Math.min(count, array.length) }, () => []);
        array.forEach((item, index) => chunks[index % chunks.length].push(item));
        return chunks;
    }
}
