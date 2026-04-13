import type { Step, TestContext, Logger } from '../types/index.js';
import { HttpClient } from '../http/http-client.js';
import { ResponseValidator } from '../validation/response-validator.js';
import { StepRegistry } from './step-registry.js';
import type { EnvConfig } from '../utils/env-loader.js';
import { resolveEnvVariables as resolveEnv } from '../utils/env-loader.js';
import { PlaywrightClient } from '../ui/playwright-client.js';
import { AuthManager } from '../auth/auth-manager.js';
import { readFile } from 'fs/promises';
import { FeatureCaller } from './feature-caller.js';
import { DbManager } from '../db/db-manager.js';
import { MockServer } from '../mock/mock-server.js';
import type { IStepExecutor, StepHandler } from './handlers/types.js';
import { HttpHandler } from './handlers/http-handler.js';
import { UiHandler } from './handlers/ui-handler.js';
import { AuthHandler } from './handlers/auth-handler.js';
import { DbHandler } from './handlers/db-handler.js';
import { AssertionHandler } from './handlers/assertion-handler.js';
import { CoreHandler } from './handlers/core-handler.js';
import { DataHandler } from './handlers/data-handler.js';
import { ContractHandler } from './handlers/contract-handler.js';
import { GrpcHandler } from './handlers/grpc-handler.js';
import { NetworkHandler } from './handlers/network-handler.js';
import { SpyStubHandler } from './handlers/spy-stub-handler.js';
import { BrowserApiHandler } from './handlers/browser-api-handler.js';
import { ComponentTester } from '../ui/component-tester.js';
import { ComponentTesterHandler } from './handlers/component-tester.js';
import { ValueParser } from '../utils/value-parser.js';
import { ScreenshotManager } from './screenshot-manager.js';
import { HopError, createErrorFromStep, isUndefinedStepError } from '../utils/error-formatter.js';
import { TimeTravelDebugger, createTimeTravelDebugger } from './time-travel.js';
import { generateUndefinedStepMessage, type SnippetOptions } from './snippet-generator.js';

interface StepExecutorOptions {
  stepsPath: string;
  featuresPath?: string;
  env: string;
  verbose: boolean;
  timeout: number;
  envConfig?: EnvConfig;
  logger?: Logger;
  reportDir?: string;
  video?: boolean | 'always' | 'on-failure' | 'never';
}

export class StepExecutor implements IStepExecutor {
  private handlers: StepHandler[];
  private httpClient: HttpClient;
  private validator: ResponseValidator;
  private stepRegistry: StepRegistry;
  private envConfig: EnvConfig;
  private playwright: PlaywrightClient | null = null;
  private authManager: AuthManager;
  private featureCaller: FeatureCaller | null = null;
  private db: DbManager;
  private mockServers: MockServer[] = [];
  private logger: Logger;
  private valueParser: ValueParser;
  private screenshotManager: ScreenshotManager;
  private timeTravelDebugger: TimeTravelDebugger;
  
  constructor(private options: StepExecutorOptions) {
    this.logger = options.logger || console;
    this.httpClient = new HttpClient({ timeout: options.timeout, verbose: options.verbose, logger: this.logger });
    this.validator = new ResponseValidator();
    this.stepRegistry = new StepRegistry(options.stepsPath);
    this.envConfig = options.envConfig || {};
    this.authManager = new AuthManager();
    this.featureCaller = new FeatureCaller();
    this.featureCaller.setStepExecutor(this);
    this.db = new DbManager();
    this.valueParser = new ValueParser(this.envConfig);
    this.screenshotManager = new ScreenshotManager(options.reportDir || './reports');
    this.timeTravelDebugger = createTimeTravelDebugger();
    
    this.handlers = [
      new DbHandler(), new CoreHandler(), new HttpHandler(),
      new AssertionHandler(), new UiHandler(), new AuthHandler(),
      new DataHandler(), new ContractHandler(), new GrpcHandler(),
      new NetworkHandler(), new SpyStubHandler(), new BrowserApiHandler(),
      new ComponentTesterHandler(),
    ];
  }

  async initialize(): Promise<void> {
    await this.stepRegistry.loadCustomSteps();
  }

  public getLogger(): Logger { return this.logger; }
  public getHttpClient(): HttpClient { return this.httpClient; }
  public getValidator(): ResponseValidator { return this.validator; }
  public getAuthManager(): AuthManager { return this.authManager; }
  public getFeatureCaller(): FeatureCaller | null { return this.featureCaller; }
  public getDbManager(): DbManager { return this.db; }
  public getOptions(): any { return this.options; }
  public getEnvConfig(): EnvConfig { return this.envConfig; }
  
  public getPlaywright(context?: TestContext): PlaywrightClient | null {
    return (context?.variables['__playwright'] as PlaywrightClient) || this.playwright;
  }
  public setPlaywright(pw: PlaywrightClient | null): void { this.playwright = pw; }
  public addMockServer(server: any): void { this.mockServers.push(server); }
  public enableTimeTravel(): void { this.timeTravelDebugger.enable(); }
  public disableTimeTravel(): void { this.timeTravelDebugger.disable(); }
  public getTimeTravelDebugger(): TimeTravelDebugger { return this.timeTravelDebugger; }

  async executeStep(step: Step, context: TestContext): Promise<void> {
    const text = resolveEnv(step.text, this.envConfig);
    
    if (this.timeTravelDebugger.isEnabled() && this.playwright) {
      const page = this.playwright.getPage();
      if (page) {
        await this.timeTravelDebugger.captureStep(page, step.keyword, text, context.variables);
      }
    }
    
    const handler = this.handlers.find(h => h.canHandle(text));
    if (handler) {
      try {
        return await handler.handle(text, step, context, this);
      } catch (error) {
        if (error instanceof Error) {
          const hopError = createErrorFromStep(step, error, context);
          throw hopError;
        }
        throw error;
      }
    }
    
    const custom = this.stepRegistry.findHandler(step.keyword, text);
    if (custom) {
      try {
        return await custom.handler(step, context, custom.params);
      } catch (error) {
        if (error instanceof Error) {
          const hopError = createErrorFromStep(step, error, context);
          throw hopError;
        }
        throw error;
      }
    }
    
    const suggestions = this.getStepSuggestions(step.text);
    
    throw new HopError(
      `Unknown step: ${step.keyword} ${step.text}`,
      { 
        step, 
        context, 
        suggestions 
      }
    );
  }

  // IStepExecutor interface methods delegated to ValueParser
  public resolveVariables(value: any, context: TestContext): any { return this.valueParser.resolveVariables(value, context); }
  public parseValue(value: string, context: TestContext): any { return this.valueParser.parseValue(value, context); }
  public getNestedValue(obj: any, path: string): any { return this.valueParser.getNestedValue(obj, path); }
  public stripQuotes(value: string): string { return this.valueParser.stripQuotes(value); }
  public parseKeyValue(text: string): [string, string] { return this.valueParser.parseKeyValue(text); }
  public extractJsonBody(text: string): any { return this.valueParser.extractJsonBody(text); }
  public convertDataTable(table: any): any { return this.valueParser.convertDataTable(table); }
  public buildUrl(baseUrl: string, path: string, queryParams: Record<string, string>): string { return this.valueParser.buildUrl(baseUrl, path, queryParams); }
  public extractValue(text: string, regex: RegExp): string { return this.valueParser.extractValue(text, regex); }
  public parseGherkinJson(jsonStr: string): any { return this.valueParser.parseGherkinJson(jsonStr); }

  public async takeScreenshot(name: string, context: TestContext): Promise<string | undefined> {
    return this.screenshotManager.capture(name, context, this.getPlaywright(context));
  }
  
  public async loadCsvFile(csvPath: string, varName: string, context: TestContext): Promise<void> {
    const resolved = resolveEnv(csvPath, this.envConfig);
    try {
      const { CsvParser } = await import('../utils/csv-parser.js');
      const table = new CsvParser().parseCsvContent(await readFile(resolved, 'utf-8'));
      context.variables[varName] = table.rows.map(row => 
        Object.fromEntries(table.headers.map((h, i) => [h, row[i]]))
      );
      this.logger.log(`📄 Loaded ${context.variables[varName].length} rows from CSV '${csvPath}'`);
    } catch (e) {
      throw new Error(`Failed to load CSV '${csvPath}': ${e instanceof Error ? e.message : e}`);
    }
  }
  
  public async handleCallFeature(path: string, context: TestContext, args: any = {}, backgroundOnly = false): Promise<void> {
    if (!this.featureCaller) throw new Error('FeatureCaller not initialized');
    const result = await this.featureCaller.call(path, { args: this.resolveVariables(args, context), backgroundOnly });
    if (!result.success) throw new Error(`Failed to call feature '${path}': ${result.error}`);
    context.variables = { ...context.variables, ...result.variables };
    this.logger.log(`🔗 Called feature: ${path} (${result.duration}ms)`);
  }
  
  public async cleanup(): Promise<void> {
    await Promise.all(this.mockServers.map(s => (s as any).stop?.()));
    if (this.playwright) await this.playwright.close();
    this.db?.close();
    this.mockServers = [];
    this.playwright = null;
  }

  private getStepSuggestions(stepText: string): string[] {
    const suggestions: string[] = [];
    const lowerText = stepText.toLowerCase();
    
    if (lowerText.includes('open') || lowerText.includes('visit') || lowerText.includes('navigate')) {
      suggestions.push('Use: I open \'https://example.com\'');
      suggestions.push('Or: user navigates to \'https://example.com\'');
    }
    
    if (lowerText.includes('fill') || lowerText.includes('type') || lowerText.includes('input')) {
      suggestions.push('Use: I fill \'#selector\' with \'value\'');
      suggestions.push('Or: I type \'value\' into \'#selector\'');
      suggestions.push('Or: user types \'value\' into \'#selector\'');
    }
    
    if (lowerText.includes('click') || lowerText.includes('press')) {
      suggestions.push('Use: I click \'#selector\'');
      suggestions.push('Or: user clicks \'#selector\'');
    }
    
    if (lowerText.includes('see') || lowerText.includes('should') || lowerText.includes('expect')) {
      suggestions.push('Use: I should see \'.selector\'');
      suggestions.push('Or: user should see element \'.selector\'');
    }
    
    if (lowerText.includes('wait')) {
      suggestions.push('Use: I wait for \'.selector\'');
      suggestions.push('Or: user waits for \'.selector\' to be visible');
    }
    
    if (lowerText.includes('select')) {
      suggestions.push('Use: I select \'Option\' from \'#selector\'');
      suggestions.push('Or: user selects \'Option\' from \'#selector\'');
    }
    
    if (suggestions.length === 0) {
      suggestions.push('Run \'hop test --snippet\' to generate step definitions');
      suggestions.push('Create custom step in \'./steps\' directory');
      suggestions.push('Browser steps: I open, I click, I fill, I should see, I wait for');
    }
    
    return suggestions;
  }
}
