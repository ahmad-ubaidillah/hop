import type { Feature, Scenario, TestContext, TestResult, StepResult } from '../types/index.js';
import { StepExecutor } from './step-executor.js';
import { HooksRunner } from './hooks-runner.js';
import { TestResultCollector } from './test-result-collector.js';
import { type SnippetOptions } from './snippet-generator.js';
import { StepExecutionHandler } from './step-execution-handler.js';

export class ScenarioRunner {
  private hooksRunner: HooksRunner;
  private stepExecutionHandler: StepExecutionHandler;

  constructor(hooksRunner: HooksRunner, undefinedSteps: SnippetOptions[]) {
    this.hooksRunner = hooksRunner;
    this.stepExecutionHandler = new StepExecutionHandler(hooksRunner, undefinedSteps);
  }

  public async runScenarioOutline(
    feature: Feature,
    scenario: Scenario,
    table: { headers: string[]; rows: string[][] },
    collector: TestResultCollector,
    featureContext: TestContext,
    executor: StepExecutor
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];
    for (let i = 0; i < table.rows.length; i++) {
      const row = table.rows[i];
      const context = { ...featureContext, variables: { ...featureContext.variables } };
      table.headers.forEach((h, j) => context.variables[h] = row[j]);
      const result = await this.runScenario(feature, this.inject(scenario, table.headers, row), collector, context, executor, ` (Row ${i + 1})`);
      results.push(result);
    }
    return results;
  }

  public async runScenario(
    feature: Feature,
    scenario: Scenario,
    collector: TestResultCollector,
    context: TestContext,
    executor: StepExecutor,
    suffix: string = ''
  ): Promise<TestResult> {
    const startTime = Date.now();
    const stepResults: StepResult[] = [];
    const scenarioContext: TestContext = { ...context, variables: { ...context.variables } };
    
    await this.hooksRunner.beforeScenario(scenario, scenarioContext);
    for (const step of scenario.steps) {
      const stepResult = await this.stepExecutionHandler.execute(step, scenarioContext, scenario.name, executor);
      stepResults.push(stepResult);
      if (stepResult.status === 'failed') break;
    }
    
    context.variables = { ...context.variables, ...scenarioContext.variables };
    const failedStep = stepResults.find(r => r.status === 'failed');
    const result: TestResult = {
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

  private inject(scenario: Scenario, headers: string[], row: string[]): Scenario {
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
