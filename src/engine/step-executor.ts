import type { Step, TestContext, HttpMethod, DataTable, Logger } from '../types/index.js';
import { HttpClient } from '../http/http-client.js';
import { ResponseValidator } from '../validation/response-validator.js';
import { StepRegistry } from './step-registry.js';
import type { EnvConfig } from '../utils/env-loader.js';
import { resolveEnvVariables as resolveEnv } from '../utils/env-loader.js';
import { PlaywrightClient } from '../ui/playwright-client.js';
import { AuthManager } from '../auth/auth-manager.js';
import { readFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
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
import { CsvParser } from '../utils/csv-parser.js';

interface StepExecutorOptions {
  stepsPath: string;
  featuresPath?: string;
  env: string;
  verbose: boolean;
  timeout: number;
  envConfig?: EnvConfig;
  logger?: Logger;
}

export class StepExecutor implements IStepExecutor {
  private handlers: StepHandler[] = [];
  private options: StepExecutorOptions;
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
  private csvParser: CsvParser;
  
  constructor(options: StepExecutorOptions) {
    this.options = options;
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
    this.csvParser = new CsvParser();
    
    this.handlers = [
      new DbHandler(),
      new CoreHandler(),
      new HttpHandler(),
      new AssertionHandler(),
      new UiHandler(),
      new AuthHandler(),
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
    if (context && context.variables['__playwright']) {
      return context.variables['__playwright'] as PlaywrightClient;
    }
    return this.playwright;
  }
  
  public setPlaywright(pw: PlaywrightClient | null): void {
    this.playwright = pw;
  }
  
  public addMockServer(server: any): void {
    this.mockServers.push(server);
  }

  async executeStep(step: Step, context: TestContext): Promise<void> {
    const text = resolveEnv(step.text, this.envConfig);
    
    for (const handler of this.handlers) {
      if (handler.canHandle(text)) {
        await handler.handle(text, step, context, this);
        return;
      }
    }
    
    const customHandlerResult = this.stepRegistry.findHandler(step.keyword, text);
    if (customHandlerResult) {
      await customHandlerResult.handler(step, context, customHandlerResult.params);
      return;
    }
    
    await this.executeBuiltInStep(step, context);
  }

  public extractValue(text: string, regex: RegExp): string {
    return this.valueParser.extractValue(text, regex);
  }
  
  public parseKeyValue(text: string): [string, string] {
    return this.valueParser.parseKeyValue(text);
  }
  
  public extractJsonBody(text: string): any {
    return this.valueParser.extractJsonBody(text);
  }
  
  public convertDataTable(table: { headers: string[]; rows: string[][] }): any {
    return this.valueParser.convertDataTable(table);
  }
  
  public buildUrl(baseUrl: string, path: string, queryParams: Record<string, string>): string {
    return this.valueParser.buildUrl(baseUrl, path, queryParams);
  }
  
  public resolveVariables(value: any, context: TestContext): any {
    return this.valueParser.resolveVariables(value, context);
  }
  
  public parseValue(value: string, context: TestContext): any {
    return this.valueParser.parseValue(value, context);
  }
  
  public stripQuotes(value: string): string {
    return this.valueParser.stripQuotes(value);
  }

  public parseGherkinJson(jsonStr: string): any {
    return this.valueParser.parseGherkinJson(jsonStr);
  }
  
  public getNestedValue(obj: any, path: string): any {
    return this.valueParser.getNestedValue(obj, path);
  }
  
  private async executeBuiltInStep(step: Step, context: TestContext): Promise<void> {
    throw new Error(`Unknown step: ${step.keyword} ${step.text}`, {
      cause: { step, isUndefinedStep: true }
    });
  }
  
  async closeBrowser(): Promise<void> {
    if (this.playwright) {
      await this.playwright.close();
      this.playwright = null;
    }
  }

  public async takeScreenshot(name: string, context: TestContext): Promise<string | undefined> {
    const pw = this.getPlaywright(context);
    if (!pw) return undefined;
    
    const page = pw.getPage();
    if (!page) return undefined;
    
    const reportDir = (this.options as any).reportDir || './reports';
    const screenshotsDir = join(reportDir, 'screenshots');
    
    await mkdir(screenshotsDir, { recursive: true });
    
    const fileName = `${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.png`;
    const filePath = join(screenshotsDir, fileName);
    
    await pw.screenshot({ path: filePath });
    
    // Return relative path for HTML report
    return join('screenshots', fileName);
  }
  
  public async loadCsvFile(csvPath: string, varName: string, context: TestContext): Promise<void> {
    const resolvedPath = resolveEnv(csvPath, this.envConfig);
    
    try {
      const content = await readFile(resolvedPath, 'utf-8');
      const table = this.csvParser.parseCsvContent(content);
      
      const data: Record<string, any>[] = [];
      for (const row of table.rows) {
        const obj: Record<string, any> = {};
        for (let i = 0; i < table.headers.length; i++) {
          obj[table.headers[i]] = row[i];
        }
        data.push(obj);
      }
      
      context.variables[varName] = data;
      this.logger.log(`📄 Loaded ${data.length} rows from CSV '${csvPath}' into variable '${varName}'`);
    } catch (error) {
      throw new Error(`Failed to load CSV file '${csvPath}': ${error instanceof Error ? error.message : error}`);
    }
  }
  
  public async handleCallFeature(
    featurePath: string, 
    context: TestContext, 
    args: Record<string, any> = {},
    backgroundOnly: boolean = false
  ): Promise<void> {
    if (!this.featureCaller) {
      throw new Error('FeatureCaller not initialized');
    }
    
    const resolvedArgs = this.resolveVariables(args, context);
    
    const result = await this.featureCaller.call(featurePath, {
      args: resolvedArgs,
      backgroundOnly,
    });
    
    if (!result.success) {
      throw new Error(`Failed to call feature '${featurePath}': ${result.error}`);
    }
    
    context.variables = { ...context.variables, ...result.variables };
    
    this.logger.log(`🔗 Called feature: ${featurePath} (${result.duration}ms)`);
  }
  
  public async cleanup(): Promise<void> {
    for (const server of this.mockServers) {
      if (typeof (server as any).stop === 'function') {
        await (server as any).stop();
      }
    }
    this.mockServers = [];

    if (this.playwright) {
      await this.playwright.close();
      this.playwright = null;
    }

    if (this.db) {
      this.db.close();
    }
  }
}
