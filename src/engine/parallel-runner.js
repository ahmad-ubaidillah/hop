import { StepExecutor } from './step-executor.js';
import { HooksRunner } from './hooks-runner.js';
import { TestResultCollector } from './test-result-collector.js';
import { StepExecutionHandler } from './step-execution-handler.js';
import * as fs from 'fs';
import * as path from 'path';
/**
 * State isolation context to ensure each parallel execution has isolated state
 */
export class IsolatedContext {
    stateId;
    variables = {};
    constructor(stateId) {
        this.stateId = stateId;
    }
    getStateId() {
        return this.stateId;
    }
    getVariables() {
        return { ...this.variables };
    }
    setVariables(vars) {
        this.variables = { ...vars };
    }
    mergeVariables(vars) {
        this.variables = { ...this.variables, ...vars };
    }
}
/**
 * Parallel Runner for executing scenarios in parallel with state isolation
 */
export class ParallelRunner {
    options;
    stateCache = new Map();
    constructor(options) {
        this.options = options;
    }
    /**
     * Run multiple features in parallel
     */
    async runFeaturesParallel(features, collector, runFeature) {
        const concurrency = this.options.concurrency || 4;
        if (concurrency <= 1) {
            return this.runSequential(features, runFeature);
        }
        // Split features into chunks
        const chunks = this.splitIntoChunks(features, concurrency);
        const chunkPromises = chunks.map(async (chunk, index) => {
            const workerState = new IsolatedContext(`worker-${index}`);
            this.stateCache.set(workerState.getStateId(), workerState);
            const results = [];
            for (const feature of chunk) {
                const featureContext = this.createFeatureContext(workerState);
                const featureResults = await runFeature(feature, featureContext);
                // Save state after each feature
                workerState.mergeVariables(featureContext.variables);
                results.push(...featureResults);
                if (this.options.verbose) {
                    console.log(`[Parallel:${index}] Completed: ${feature.name}`);
                }
            }
            return results;
        });
        const allResults = await Promise.all(chunkPromises);
        return allResults.flat();
    }
    /**
     * Run scenarios within a feature in parallel
     */
    async runScenariosParallel(feature, scenarios, collector, runScenario) {
        const concurrency = this.options.concurrency || 4;
        if (concurrency <= 1 || scenarios.length <= 1) {
            return this.runScenariosSequential(scenarios, runScenario);
        }
        const workerState = new IsolatedContext(`scenario-worker-${Date.now()}`);
        // Run scenarios in parallel - each gets isolated context
        const scenarioPromises = scenarios.map(async (scenario, index) => {
            const isolatedContext = new IsolatedContext(`scenario-${index}`);
            const context = this.createScenarioContext(isolatedContext, feature.filePath);
            // Variables from parent scope if available
            const parentState = this.stateCache.values().next().value;
            if (parentState) {
                context.variables = { ...parentState.getVariables() };
            }
            return runScenario(scenario, context);
        });
        const results = await Promise.all(scenarioPromises);
        return results;
    }
    /**
     * Create isolated executor for parallel execution
     */
    createIsolatedExecutor() {
        return new StepExecutor({
            featuresPath: this.options.featuresPath,
            stepsPath: this.options.stepsPath,
            env: this.options.env,
            verbose: this.options.verbose,
            timeout: this.options.timeout,
            envConfig: this.options.envConfig,
            video: this.options.video,
        });
    }
    /**
     * Create context with isolated state
     */
    createFeatureContext(state) {
        return {
            baseUrl: '',
            path: '',
            method: 'GET',
            headers: {},
            queryParams: {},
            body: undefined,
            variables: state.getVariables(),
            cookies: {},
            logger: this.options.verbose ? console : { log: () => { }, error: () => { }, warn: () => { } },
            read: async (filePath) => {
                const fullPath = path.resolve(filePath);
                if (fs.existsSync(fullPath)) {
                    const content = fs.readFileSync(fullPath, 'utf-8');
                    return content;
                }
                return undefined;
            },
        };
    }
    createScenarioContext(state, featureFilePath) {
        return {
            baseUrl: '',
            path: '',
            method: 'GET',
            headers: {},
            queryParams: {},
            body: undefined,
            variables: { ...state.getVariables() },
            cookies: {},
            logger: this.options.verbose ? console : { log: () => { }, error: () => { }, warn: () => { } },
            read: async (filePath) => {
                const fullPath = path.resolve(filePath);
                if (fs.existsSync(fullPath)) {
                    const content = fs.readFileSync(fullPath, 'utf-8');
                    return content;
                }
                return undefined;
            },
        };
    }
    async runSequential(features, runFeature) {
        const results = [];
        const state = new IsolatedContext('main');
        for (const feature of features) {
            const context = this.createFeatureContext(state);
            const featureResults = await runFeature(feature, context);
            results.push(...featureResults);
        }
        return results;
    }
    async runScenariosSequential(scenarios, runScenario) {
        const results = [];
        const state = new IsolatedContext('main');
        for (const scenario of scenarios) {
            const context = this.createScenarioContext(state);
            const result = await runScenario(scenario, context);
            results.push(result);
        }
        return results;
    }
    splitIntoChunks(array, count) {
        const chunks = Array.from({ length: Math.min(count, array.length) }, () => []);
        array.forEach((item, index) => chunks[index % chunks.length].push(item));
        return chunks;
    }
    /**
     * Clear cached state
     */
    clearState() {
        this.stateCache.clear();
    }
}
/**
 * Create a worker for Bun/Node.js worker threads
 */
export function createWorkerScript() {
    return `
import { parentPort, workerData } from 'worker_threads';
import { StepExecutor } from './step-executor.js';
import { HooksRunner } from './hooks-runner.js';
import { StepExecutionHandler } from './step-execution-handler.js';

const { feature, options, envConfig } = workerData;

parentPort?.on('message', async (message) => {
  if (message.type === 'run') {
    try {
      const executor = new StepExecutor({
        featuresPath: options.featuresPath,
        stepsPath: options.stepsPath,
        env: options.env,
        verbose: false,
        timeout: options.timeout,
        envConfig,
        video: false,
      });
      
      const hooksRunner = new HooksRunner(options.stepsPath);
      const executionHandler = new StepExecutionHandler(hooksRunner, []);
      
      // Execute scenario
      const result = await executionHandler.execute(
        message.step,
        message.context,
        message.scenarioName,
        executor
      );
      
      parentPort?.postMessage({ success: true, result });
      await executor.cleanup();
    } catch (error) {
      parentPort?.postMessage({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }
});
`;
}
