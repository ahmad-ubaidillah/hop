import { HttpClient } from '../http/http-client.js';
import { ResponseValidator } from '../validation/response-validator.js';
import { StepRegistry } from './step-registry.js';
import { resolveEnvVariables as resolveEnv } from '../utils/env-loader.js';
import { PlaywrightClient } from '../ui/playwright-client.js';
import { AuthManager } from '../auth/auth-manager.js';
import { readFile } from 'fs/promises';
import { FeatureCaller } from './feature-caller.js';
import { DbManager } from '../db/db-manager.js';
import { MockServer } from '../mock/mock-server.js';
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
import { ComponentTester } from './handlers/component-tester.js';
import { ComponentTesterHandler } from './handlers/component-tester.js';
import { ValueParser } from '../utils/value-parser.js';
import { ScreenshotManager } from './screenshot-manager.js';
import { HopError, createErrorFromStep, isUndefinedStepError } from '../utils/error-formatter.js';
import { generateUndefinedStepMessage } from './snippet-generator.js';
export class StepExecutor {
    options;
    handlers;
    httpClient;
    validator;
    stepRegistry;
    envConfig;
    playwright = null;
    authManager;
    featureCaller = null;
    db;
    mockServers = [];
    logger;
    valueParser;
    screenshotManager;
    constructor(options) {
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
        this.screenshotManager = new ScreenshotManager(options.reportDir || './reports');
        this.handlers = [
            new DbHandler(), new CoreHandler(), new HttpHandler(),
            new AssertionHandler(), new UiHandler(), new AuthHandler(),
            new DataHandler(), new ContractHandler(), new GrpcHandler(),
            new NetworkHandler(), new SpyStubHandler(), new BrowserApiHandler(),
            new ComponentTesterHandler(),
        ];
    }
    async initialize() {
        await this.stepRegistry.loadCustomSteps();
    }
    getLogger() { return this.logger; }
    getHttpClient() { return this.httpClient; }
    getValidator() { return this.validator; }
    getAuthManager() { return this.authManager; }
    getFeatureCaller() { return this.featureCaller; }
    getDbManager() { return this.db; }
    getOptions() { return this.options; }
    getEnvConfig() { return this.envConfig; }
    getPlaywright(context) {
        return context?.variables['__playwright'] || this.playwright;
    }
    setPlaywright(pw) { this.playwright = pw; }
    addMockServer(server) { this.mockServers.push(server); }
    async executeStep(step, context) {
        const text = resolveEnv(step.text, this.envConfig);
        const handler = this.handlers.find(h => h.canHandle(text));
        if (handler) {
            try {
                return await handler.handle(text, step, context, this);
            }
            catch (error) {
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
            }
            catch (error) {
                if (error instanceof Error) {
                    const hopError = createErrorFromStep(step, error, context);
                    throw hopError;
                }
                throw error;
            }
        }
        const snippet = {
            keyword: step.keyword,
            stepText: step.text,
            stepPattern: step.text,
        };
        throw new HopError(`Unknown step: ${step.keyword} ${step.text}`, { step, context, suggestions: [`Run 'hop test --snippet' to generate step definitions`, `Create custom step in './steps' directory`] });
    }
    // IStepExecutor interface methods delegated to ValueParser
    resolveVariables(value, context) { return this.valueParser.resolveVariables(value, context); }
    parseValue(value, context) { return this.valueParser.parseValue(value, context); }
    getNestedValue(obj, path) { return this.valueParser.getNestedValue(obj, path); }
    stripQuotes(value) { return this.valueParser.stripQuotes(value); }
    parseKeyValue(text) { return this.valueParser.parseKeyValue(text); }
    extractJsonBody(text) { return this.valueParser.extractJsonBody(text); }
    convertDataTable(table) { return this.valueParser.convertDataTable(table); }
    buildUrl(baseUrl, path, queryParams) { return this.valueParser.buildUrl(baseUrl, path, queryParams); }
    extractValue(text, regex) { return this.valueParser.extractValue(text, regex); }
    parseGherkinJson(jsonStr) { return this.valueParser.parseGherkinJson(jsonStr); }
    async takeScreenshot(name, context) {
        return this.screenshotManager.capture(name, context, this.getPlaywright(context));
    }
    async loadCsvFile(csvPath, varName, context) {
        const resolved = resolveEnv(csvPath, this.envConfig);
        try {
            const { CsvParser } = await import('../utils/csv-parser.js');
            const table = new CsvParser().parseCsvContent(await readFile(resolved, 'utf-8'));
            context.variables[varName] = table.rows.map(row => Object.fromEntries(table.headers.map((h, i) => [h, row[i]])));
            this.logger.log(`📄 Loaded ${context.variables[varName].length} rows from CSV '${csvPath}'`);
        }
        catch (e) {
            throw new Error(`Failed to load CSV '${csvPath}': ${e instanceof Error ? e.message : e}`);
        }
    }
    async handleCallFeature(path, context, args = {}, backgroundOnly = false) {
        if (!this.featureCaller)
            throw new Error('FeatureCaller not initialized');
        const result = await this.featureCaller.call(path, { args: this.resolveVariables(args, context), backgroundOnly });
        if (!result.success)
            throw new Error(`Failed to call feature '${path}': ${result.error}`);
        context.variables = { ...context.variables, ...result.variables };
        this.logger.log(`🔗 Called feature: ${path} (${result.duration}ms)`);
    }
    async cleanup() {
        await Promise.all(this.mockServers.map(s => s.stop?.()));
        if (this.playwright)
            await this.playwright.close();
        this.db?.close();
        this.mockServers = [];
        this.playwright = null;
    }
}
