import { StepExecutor } from './step-executor.js';
import { HooksRunner } from './hooks-runner.js';
import { TestResultCollector } from './test-result-collector.js';
import {} from './snippet-generator.js';
import { StepExecutionHandler } from './step-execution-handler.js';
export class ScenarioRunner {
    hooksRunner;
    stepExecutionHandler;
    constructor(hooksRunner, undefinedSteps) {
        this.hooksRunner = hooksRunner;
        this.stepExecutionHandler = new StepExecutionHandler(hooksRunner, undefinedSteps);
    }
    async runScenarioOutline(feature, scenario, table, collector, featureContext, executor) {
        const results = [];
        for (let i = 0; i < table.rows.length; i++) {
            const row = table.rows[i];
            const context = { ...featureContext, variables: { ...featureContext.variables } };
            table.headers.forEach((h, j) => context.variables[h] = row[j]);
            const result = await this.runScenario(feature, this.inject(scenario, table.headers, row), collector, context, executor, ` (Row ${i + 1})`);
            results.push(result);
        }
        return results;
    }
    async runScenario(feature, scenario, collector, context, executor, suffix = '') {
        const startTime = Date.now();
        const stepResults = [];
        const scenarioContext = { ...context, variables: { ...context.variables } };
        await this.hooksRunner.beforeScenario(scenario, scenarioContext);
        for (const step of scenario.steps) {
            const stepResult = await this.stepExecutionHandler.execute(step, scenarioContext, scenario.name, executor);
            stepResults.push(stepResult);
            if (stepResult.status === 'failed')
                break;
        }
        context.variables = { ...context.variables, ...scenarioContext.variables };
        const failedStep = stepResults.find(r => r.status === 'failed');
        const result = {
            featureName: feature.name,
            scenarioName: scenario.name + suffix,
            status: failedStep ? 'failed' : 'passed',
            duration: Date.now() - startTime,
            steps: stepResults,
            tags: scenario.tags,
            error: failedStep?.error,
            screenshotPath: failedStep?.screenshotPath,
            videoPath: failedStep?.videoPath,
        };
        collector.add(result);
        await this.hooksRunner.afterScenario(scenario, scenarioContext, result);
        return result;
    }
    inject(scenario, headers, row) {
        const map = new Map(headers.map((h, i) => [`<${h}>`, row[i]]));
        return {
            ...scenario,
            steps: scenario.steps.map(step => ({
                ...step,
                text: Array.from(map.entries()).reduce((t, [k, v]) => t.split(k).join(v), step.text),
            })),
        };
    }
}
