import type { Feature, Scenario, TestContext, HttpMethod } from '../types/index.js';
import type { MockRequest, MockResponse } from './mock-types.js';
import { GherkinParser } from '../parser/gherkin-parser.js';
import { StepExecutor } from '../engine/step-executor.js';

export class MockEngine {
  private feature: Feature | null = null;
  private state: Record<string, any> = {};
  private stepExecutor: StepExecutor;
  private verbose: boolean;

  constructor(verbose: boolean = false) {
    this.verbose = verbose;
    this.stepExecutor = new StepExecutor({
      stepsPath: '',
      env: '',
      verbose: this.verbose,
      timeout: 5000,
      envConfig: {},
    });
  }

  async loadFeature(filePath: string) {
    const parser = new GherkinParser();
    const features = await parser.parseFeatures([filePath]);
    if (features.length === 0) {
      throw new Error(`Could not parse mock feature at ${filePath}`);
    }
    this.feature = features[0];
    
    // Initialize state from Background steps if any
    if (this.feature?.background) {
      const context = this.createInitialContext();
      for (const step of this.feature.background.steps) {
        await this.stepExecutor.executeStep(step, context);
      }
      this.state = context.variables;
    }
  }

  async handleRequest(req: MockRequest): Promise<MockResponse> {
    if (!this.feature) {
      throw new Error('Mock feature not loaded');
    }

    // Find first matching scenario
    for (const scenario of this.feature.scenarios) {
      if (this.matches(scenario, req)) {
        if (this.verbose) {
          console.log(`🎯 Matched scenario: ${scenario.name}`);
        }
        return await this.executeScenario(scenario, req);
      }
    }

    // Default 404 if no scenario matches
    return {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'No matching mock scenario found', path: req.path, method: req.method },
    };
  }

  private matches(scenario: Scenario, req: MockRequest): boolean {
    const name = scenario.name.trim();
    
    // If name contains an expression like pathMatches('/users'), evaluate it
    // For now, let's implement a simple but effective matching logic
    try {
      // Create a sandbox for matching
      const sandbox = {
        pathMatches: (p: string) => req.path === p || req.path.startsWith(p),
        methodIs: (m: string) => req.method.toUpperCase() === m.toUpperCase(),
        headerContains: (h: string, v: string) => req.headers[h.toLowerCase()]?.includes(v),
        bodyPath: (p: string) => {
          // Placeholder for body path matching if needed
          return true;
        },
        request: req.body,
        method: req.method,
        path: req.path,
      };

      // Simple implementation: if scenario name contains '&&' or specific functions, use eval-like logic
      // Otherwise, check for simple string equality or regex
      if (name.includes('pathMatches') || name.includes('methodIs') || name.includes('&&')) {
        const fn = new Function(...Object.keys(sandbox), `return ${name}`);
        return fn(...Object.values(sandbox));
      }

      // Fallback: simple string matches
      return name.includes(req.path) && name.toLowerCase().includes(req.method.toLowerCase());
    } catch (e) {
      if (this.verbose) {
        console.error(`❌ Error matching scenario "${name}":`, e);
      }
      return false;
    }
  }

  private async executeScenario(scenario: Scenario, req: MockRequest): Promise<MockResponse> {
    const context = this.createInitialContext(req);
    
    // Inject state
    context.variables = { ...this.state };
    
    // Inject request globals
    context.variables['request'] = req.body;
    context.variables['requestHeaders'] = req.headers;
    context.variables['requestParams'] = req.queryParams;
    context.variables['requestMethod'] = req.method;
    context.variables['requestPath'] = req.path;

    // Execute steps
    for (const step of scenario.steps) {
      await this.stepExecutor.executeStep(step, context);
    }

    // Update global state with any changes made in this scenario
    this.state = { ...context.variables };

    // Extract response details from context
    const responseStatus = context.variables['responseStatus'] || 200;
    const responseHeaders = context.variables['responseHeaders'] || { 'Content-Type': 'application/json' };
    const responseBody = context.variables['response'];

    return {
      status: Number(responseStatus),
      headers: responseHeaders,
      body: responseBody,
    };
  }

  private createInitialContext(req?: MockRequest): TestContext {
    return {
      baseUrl: '',
      path: req?.path || '',
      method: req?.method || 'GET',
      headers: req?.headers || {},
      queryParams: req?.queryParams || {},
      body: req?.body,
      variables: {},
      cookies: {},
      read: async (filePath: string) => {
        const parser = new GherkinParser();
        // Resolve relative to feature if possible, for now use current dir
        return await parser.read(filePath, this.feature?.filePath);
      },
      logger: this.verbose ? console : {
        log: () => {},
        error: console.error,
        warn: console.warn,
      },
    };
  }
}
