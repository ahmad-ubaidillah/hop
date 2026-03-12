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
import { ValueParser } from '../utils/value-parser.js';
import { ScreenshotManager } from './screenshot-manager.js';

interface StepExecutorOptions {
  stepsPath: string;
  featuresPath?: string;
  env: string;
  verbose: boolean;
  timeout: number;
  envConfig?: EnvConfig;
  logger?: Logger;
  reportDir?: string;
  video?: boolean;
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
    
    this.handlers = [
      new DbHandler(), new CoreHandler(), new HttpHandler(),
      new AssertionHandler(), new UiHandler(), new AuthHandler(),
    ];
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

  async executeStep(step: Step, context: TestContext): Promise<void> {
    const text = resolveEnv(step.text, this.envConfig);
    const handler = this.handlers.find(h => h.canHandle(text));
    if (handler) return await handler.handle(text, step, context, this);
    
    const custom = this.stepRegistry.findHandler(step.keyword, text);
    if (custom) return await custom.handler(step, context, custom.params);
    
    throw new Error(`Unknown step: ${step.keyword} ${step.text}`, { cause: { step, isUndefinedStep: true } });
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
}
