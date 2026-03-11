import type { Feature, Scenario, TestContext, TestResult, StepResult, Logger } from '../types/index.js';
import { StepExecutor } from './step-executor.js';
import { HooksRunner } from './hooks-runner.js';
import { TestResultCollector } from './test-result-collector.js';
import { type SnippetOptions } from './snippet-generator.js';

export class ScenarioRunner {
  private hooksRunner: HooksRunner;
  private undefinedSteps: SnippetOptions[];

  constructor(hooksRunner: HooksRunner, undefinedSteps: SnippetOptions[]) {
    this.hooksRunner = hooksRunner;
    this.undefinedSteps = undefinedSteps;
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
      const context = { 
        ...featureContext,
        headers: { ...featureContext.headers },
        queryParams: { ...featureContext.queryParams },
        variables: { ...featureContext.variables },
        cookies: { ...featureContext.cookies },
      };
      
      for (let j = 0; j < table.headers.length; j++) {
        context.variables[table.headers[j]] = row[j];
      }
      
      const modifiedScenario = this.injectVariables(scenario, table.headers, row);
      
      const result = await this.runScenario(
        feature,
        modifiedScenario,
        collector,
        context,
        executor,
        ` (Row ${i + 1})`
      );
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
    
    const scenarioContext: TestContext = {
      ...context,
      headers: { ...context.headers },
      queryParams: { ...context.queryParams },
      variables: { ...context.variables },
      cookies: { ...context.cookies },
    };
    
    await this.hooksRunner.beforeScenario(scenario, scenarioContext);
    
    for (const step of scenario.steps) {
      const stepStartTime = Date.now();
      await this.hooksRunner.beforeStep(step, scenarioContext);
      
      try {
        await executor.executeStep(step, scenarioContext);
        
        stepResults.push({
          step,
          status: 'passed',
          duration: Date.now() - stepStartTime,
        });
        
        await this.hooksRunner.afterStep(step, scenarioContext, { status: 'passed' });
      } catch (error) {
        // Capture screenshot if UI test
        let screenshotPath;
        try {
          screenshotPath = await executor.takeScreenshot(scenario.name, scenarioContext);
        } catch (screenshotError) {
          executor.getLogger().error('Failed to take screenshot:', screenshotError);
        }

        stepResults.push({
          step,
          status: 'failed',
          duration: Date.now() - stepStartTime,
          error: error instanceof Error ? error.message : String(error),
          screenshotPath,
        });
        
        if (error instanceof Error && error.message.startsWith('Unknown step:')) {
          const stepKey = `${step.keyword} ${step.text}`;
          const exists = this.undefinedSteps.some(s => `${s.keyword} ${s.stepText}` === stepKey);
          if (!exists) {
            this.undefinedSteps.push({
              keyword: step.keyword,
              stepText: step.text,
            });
          }
        }
        
        await this.hooksRunner.afterStep(step, scenarioContext, { status: 'failed', error });
        break;
      }
    }
    
    context.variables = { ...context.variables, ...scenarioContext.variables };
    context.headers = { ...context.headers, ...scenarioContext.headers };
    context.cookies = { ...context.cookies, ...scenarioContext.cookies };
    
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
      result.screenshotPath = failedStep?.screenshotPath;
    }
    
    collector.add(result);
    await this.hooksRunner.afterScenario(scenario, scenarioContext, result);
    
    return result;
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
      result = result.split(key).join(value);
    }
    return result;
  }
}
