import type { Step, TestContext } from '../../types/index.js';
import type { HttpClient } from '../../http/http-client.js';
import type { ResponseValidator } from '../../validation/response-validator.js';
import type { PlaywrightClient } from '../../ui/playwright-client.js';
import type { AuthManager } from '../../auth/auth-manager.js';
import type { FeatureCaller } from '../feature-caller.js';
import type { DbManager } from '../../db/db-manager.js';
import type { EnvConfig } from '../../utils/env-loader.js';
import type { Logger, HttpMethod } from '../../types/index.js';

export interface IStepExecutor {
  getLogger(): Logger;
  getHttpClient(): HttpClient;
  getValidator(): ResponseValidator;
  getAuthManager(): AuthManager;
  getFeatureCaller(): FeatureCaller | null;
  getDbManager(): DbManager;
  getOptions(): any;
  getEnvConfig(): EnvConfig;
  
  getPlaywright(context?: TestContext): PlaywrightClient | null;
  setPlaywright(pw: PlaywrightClient | null): void;
  
  addMockServer(server: any): void;

  resolveVariables(value: any, context: TestContext): any;
  parseValue(value: string, context: TestContext): any;
  getNestedValue(obj: any, path: string): any;
  stripQuotes(value: string): string;
  parseKeyValue(text: string): [string, string];
  extractJsonBody(text: string): any;
  convertDataTable(table: any): any;
  buildUrl(baseUrl: string, path: string, queryParams: Record<string, string>): string;
  extractValue(text: string, regex: RegExp): string;
  parseGherkinJson(jsonStr: string): any;
  
  loadCsvFile(csvPath: string, varName: string, context: TestContext): Promise<void>;
  handleCallFeature(featurePath: string, context: TestContext, args?: Record<string, any>, backgroundOnly?: boolean): Promise<void>;
}

export interface StepHandler {
  canHandle(text: string): boolean;
  handle(text: string, step: Step, context: TestContext, executor: IStepExecutor): Promise<void>;
}
