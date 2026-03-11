import type { Step, TestContext, HttpMethod, DataTable } from '../types/index.js';
import { HttpClient } from '../http/http-client.js';
import { ResponseValidator } from '../validation/response-validator.js';
import { StepRegistry } from './step-registry.js';
import type { EnvConfig } from '../utils/env-loader.js';
import { resolveEnvVariables as resolveEnv } from '../utils/env-loader.js';
import { PlaywrightClient } from '../ui/playwright-client.js';
import { AuthManager } from '../auth/auth-manager.js';
import { readFile } from 'fs/promises';
import { dirname, join } from 'path';

interface StepExecutorOptions {
  stepsPath: string;
  env: string;
  verbose: boolean;
  timeout: number;
  envConfig?: EnvConfig;
}

export class StepExecutor {
  private options: StepExecutorOptions;
  private httpClient: HttpClient;
  private validator: ResponseValidator;
  private stepRegistry: StepRegistry;
  private envConfig: EnvConfig;
  private playwright: PlaywrightClient | null = null;
  private authManager: AuthManager;
  
  constructor(options: StepExecutorOptions) {
    this.options = options;
    this.httpClient = new HttpClient({ timeout: options.timeout, verbose: options.verbose });
    this.validator = new ResponseValidator();
    this.stepRegistry = new StepRegistry(options.stepsPath);
    this.envConfig = options.envConfig || {};
    this.authManager = new AuthManager();
  }
  
  /**
   * Execute a single step
   */
  async executeStep(step: Step, context: TestContext): Promise<void> {
    // Resolve environment variables in step text
    const text = resolveEnv(step.text, this.envConfig);
    
    // URL and path steps
    if (text.match(/^url ['"](.+)['"]/i)) {
      const url = this.extractValue(text, /url ['"](.+)['"]/i);
      context.baseUrl = resolveEnv(url, this.envConfig);
      return;
    }
    
    if (text.match(/^path ['"](.+)['"]/i)) {
      const path = this.extractValue(text, /path ['"](.+)['"]/i);
      context.path = resolveEnv(path, this.envConfig);
      return;
    }
    
    // Header steps
    if (text.match(/^header .+ =/i)) {
      const [key, value] = this.parseKeyValue(text.replace(/^header /i, ''));
      context.headers[key] = this.resolveVariables(value, context);
      return;
    }
    
    // Query param steps
    if (text.match(/^param .+ =/i) || text.match(/^query param .+ =/i)) {
      const [key, value] = this.parseKeyValue(text.replace(/^(query param |param )/i, ''));
      context.queryParams[key] = this.resolveVariables(value, context);
      return;
    }
    
    // Request body steps
    if (text.match(/^request/i)) {
      if (text.match(/^request \{/i) || text.match(/^request ['"]/i)) {
        const body = this.extractJsonBody(text);
        context.body = this.resolveVariables(body, context);
        return;
      }
      
      if (text.match(/^request #(.*)/i)) {
        const varName = text.match(/^request #(.*)/i)?.[1];
        if (varName) {
          context.body = context.variables[varName.trim()];
        }
        return;
      }
      
      // Handle DocString
      if (step.docString) {
        try {
          context.body = JSON.parse(step.docString);
        } catch {
          context.body = step.docString;
        }
        return;
      }
      
      // Handle data table
      if (step.dataTable) {
        context.body = this.convertDataTable(step.dataTable);
        return;
      }
      return;
    }
    
    // Method steps
    const methodMatch = text.match(/^method (GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)/i);
    if (methodMatch) {
      context.method = methodMatch[1].toUpperCase() as HttpMethod;
      
      // Execute the HTTP request
      const fullUrl = this.buildUrl(context.baseUrl, context.path, context.queryParams);
      const response = await this.httpClient.request({
        method: context.method,
        url: fullUrl,
        headers: context.headers,
        body: context.body,
      });
      
      context.response = response;
      
      // Store response in context
      context.variables['response'] = response.body;
      context.variables['status'] = response.status;
      
      // Store cookies
      if (response.cookies) {
        context.cookies = { ...context.cookies, ...response.cookies };
      }
      
      return;
    }
    
    // Status assertion
    const statusMatch = text.match(/^status (\d+)/i);
    if (statusMatch) {
      const expectedStatus = parseInt(statusMatch[1]);
      if (context.response?.status !== expectedStatus) {
        throw new Error(`Expected status ${expectedStatus}, but got ${context.response?.status}`);
      }
      return;
    }
    
    // Match/Assert steps (fuzzy matching)
    const matchMatch = text.match(/^match\s+(response|.+)\s*==\s*(.+)$/i);
    if (matchMatch) {
      let target = matchMatch[1].trim();
      let expected = matchMatch[2].trim();
      
      // Strip outer quotes (Gherkin uses single/double quotes for values)
      expected = this.stripQuotes(expected);
      
      let actual: any;
      if (target === 'response') {
        actual = context.response?.body;
      } else if (target.startsWith('response.')) {
        const path = target.substring(8); // Remove 'response.' prefix
        // Also handle case where we got '.id' instead of 'id' (edge case from greedy regex)
        const cleanPath = path.startsWith('.') ? path.substring(1) : path;
        actual = this.getNestedValue(context.response?.body, cleanPath);
      } else if (context.variables[target]) {
        actual = context.variables[target];
      } else {
        actual = context.response?.body;
      }
      
      // Parse expected value - handle different cases
      let expectedParsed: any;
      
      // If it's a fuzzy matcher like #number, #string, #array
      if (expected.startsWith('#')) {
        // Check if it's a variable reference (#varname) or fuzzy matcher (#number, #string, etc.)
        const potentialVarName = expected.substring(1);
        if (context.variables[potentialVarName] !== undefined) {
          // It's a variable reference
          expectedParsed = context.variables[potentialVarName];
        } else {
          // It's a fuzzy matcher
          expectedParsed = expected;
        }
      }
      // If it looks like JSON (starts with { or [)
      else if ((expected.startsWith('{') && expected.endsWith('}')) || 
              (expected.startsWith('[') && expected.endsWith(']'))) {
        // Try to parse as regular JSON first (works if it's valid JSON with double quotes)
        let parsed: any;
        try {
          parsed = JSON.parse(expected);
        } catch {
          // If regular JSON fails, try to parse manually for Gherkin-style with fuzzy matchers
          parsed = this.parseGherkinJson(expected);
        }
        expectedParsed = parsed;
      }
      // Otherwise parse as value
      else {
        expectedParsed = this.parseValue(expected, context);
      }
      
      this.validator.validate(actual, expectedParsed, context);
      return;
    }
    
    // Set variable - with optional keyword prefix
    const setMatch = text.match(/^(Given|When|Then|And|But)?\s*def\s+(\w+)\s*=\s*(.+)$/i);
    if (setMatch) {
      const varName = setMatch[2];
      const valuePart = setMatch[3].trim();
      
      // Regular variable assignment
      const value = valuePart;
      
      if (value.startsWith('response')) {
        // Reference to response
        if (value === 'response') {
          context.variables[varName] = context.response?.body;
        } else if (value.startsWith('response.')) {
          context.variables[varName] = this.getNestedValue(context.response?.body, value.replace('response.', ''));
        } else if (value === 'response.status') {
          context.variables[varName] = context.response?.status;
        }
      } else if (value.startsWith("'") || value.startsWith('"')) {
        context.variables[varName] = this.extractStringValue(value);
      } else {
        context.variables[varName] = this.parseValue(value, context);
      }
      return;
    }
    
    // Load CSV file - with optional keyword prefix
    const csvMatch = text.match(/^(Given|When|Then|And|But)?\s*load\s+csv\s+['"](.+)['"]\s+into\s+(\w+)$/i);
    if (csvMatch) {
      const csvPath = csvMatch[2];
      const varName = csvMatch[3];
      await this.loadCsvFile(csvPath, varName, context);
      return;
    }
    
    // Custom step from registry
    const customHandler = this.stepRegistry.findHandler(step.keyword, text);
    if (customHandler) {
      await customHandler(step, context);
      return;
    }
    
    // UI Steps - user opens browser
    if (text.match(/^user opens browser/i)) {
      await this.handleOpenBrowser(step, context);
      return;
    }
    
    // UI Steps - user navigates to
    const navigateMatch = text.match(/^user navigates to ['"](.+)['"]/i);
    if (navigateMatch) {
      const url = resolveEnv(navigateMatch[1], this.envConfig);
      await this.handleNavigate(step, context, url);
      return;
    }
    
    // UI Steps - user clicks
    const clickMatch = text.match(/^user clicks? ['"](.+)['"]/i);
    if (clickMatch) {
      await this.handleClick(step, context, clickMatch[1]);
      return;
    }
    
    // UI Steps - user types
    const typeMatch = text.match(/^user types? ['"](.+)['"] into ['"](.+)['"]/i);
    if (typeMatch) {
      const text = typeMatch[1];
      const selector = typeMatch[2];
      await this.handleType(step, context, selector, text);
      return;
    }
    
    // UI Steps - user should see
    const shouldSeeMatch = text.match(/^user should see element ['"](.+)['"]/i);
    if (shouldSeeMatch) {
      await this.handleShouldSee(step, context, shouldSeeMatch[1]);
      return;
    }
    
    // UI Steps - user should see text
    const shouldSeeTextMatch = text.match(/^user should see text ['"](.+)['"]/i);
    if (shouldSeeTextMatch) {
      await this.handleShouldSeeText(step, context, shouldSeeTextMatch[1]);
      return;
    }
    
    // UI Steps - user refreshes page
    if (text.match(/^user refreshes page/i)) {
      await this.handleRefresh(step, context);
      return;
    }
    
    // UI Steps - user sets cookie
    const cookieMatch = text.match(/^user sets cookie ['"](.+)['"] to ['"](.+)['"]/i);
    if (cookieMatch) {
      await this.handleSetCookie(step, context, cookieMatch[1], cookieMatch[2]);
      return;
    }
    
    // Auth Steps - save auth
    const saveAuthMatch = text.match(/^save auth to ['"](.+)['"]/i);
    if (saveAuthMatch) {
      await this.handleSaveAuth(step, context, saveAuthMatch[1]);
      return;
    }
    
    // Auth Steps - load auth
    const loadAuthMatch = text.match(/^load auth from ['"](.+)['"]/i);
    if (loadAuthMatch) {
      await this.handleLoadAuth(step, context, loadAuthMatch[1]);
      return;
    }
    
    // Auth Steps - clear auth
    if (text.match(/^clear auth/i)) {
      await this.handleClearAuth(step, context);
      return;
    }
    
    // Print step - for debugging (more flexible to support variable concatenation)
    const printMatch = text.match(/^(Given|When|Then|And|But)?\s*print\s+(.+)$/i);
    if (printMatch) {
      const message = printMatch[2];
      // Resolve variables in message
      const resolvedMessage = this.resolveVariables(message, context);
      console.log(`📝 ${resolvedMessage}`);
      return;
    }
    
    // Unknown step - try to find in built-in handlers
    await this.executeBuiltInStep(step, context);
  }
  
  // UI Step Handlers
  private async handleOpenBrowser(step: Step, context: TestContext): Promise<void> {
    if (!this.playwright) {
      this.playwright = new PlaywrightClient({
        headless: true,
        timeout: this.options.timeout,
      });
    }
    await this.playwright.launch();
    context.variables['__playwright'] = this.playwright;
  }
  
  private async handleNavigate(step: Step, context: TestContext, url: string): Promise<void> {
    const pw = this.getPlaywright(context);
    if (!pw) throw new Error('Browser not opened. Use "user opens browser" first.');
    
    // Resolve variables in URL
    const resolvedUrl = this.resolveVariables(url, context);
    await pw.navigate(resolvedUrl);
  }
  
  private async handleClick(step: Step, context: TestContext, selector: string): Promise<void> {
    const pw = this.getPlaywright(context);
    if (!pw) throw new Error('Browser not opened. Use "user opens browser" first.');
    
    await pw.click(selector);
  }
  
  private async handleType(step: Step, context: TestContext, selector: string, text: string): Promise<void> {
    const pw = this.getPlaywright(context);
    if (!pw) throw new Error('Browser not opened. Use "user opens browser" first.');
    
    const resolvedText = this.resolveVariables(text, context);
    await pw.type(selector, resolvedText);
  }
  
  private async handleShouldSee(step: Step, context: TestContext, selector: string): Promise<void> {
    const pw = this.getPlaywright(context);
    if (!pw) throw new Error('Browser not opened. Use "user opens browser" first.');
    
    const isVisible = await pw.isVisible(selector);
    if (!isVisible) {
      throw new Error(`Element '${selector}' is not visible`);
    }
  }
  
  private async handleShouldSeeText(step: Step, context: TestContext, text: string): Promise<void> {
    const pw = this.getPlaywright(context);
    if (!pw) throw new Error('Browser not opened. Use "user opens browser" first.');
    
    // Try to find the text on the page
    const resolvedText = this.resolveVariables(text, context);
    const page = pw.getPage();
    if (!page) throw new Error('Page not available');
    
    const content = await page.content();
    if (!content.includes(resolvedText)) {
      throw new Error(`Text '${resolvedText}' not found on page`);
    }
  }
  
  private async handleRefresh(step: Step, context: TestContext): Promise<void> {
    const pw = this.getPlaywright(context);
    if (!pw) throw new Error('Browser not opened. Use "user opens browser" first.');
    
    await pw.refresh();
  }
  
  private async handleSetCookie(step: Step, context: TestContext, name: string, value: string): Promise<void> {
    const pw = this.getPlaywright(context);
    if (!pw) throw new Error('Browser not opened. Use "user opens browser" first.');
    
    const resolvedValue = this.resolveVariables(value, context);
    await pw.setCookie(name, resolvedValue);
  }
  
  // Auth Step Handlers
  private async handleSaveAuth(step: Step, context: TestContext, filePath: string): Promise<void> {
    if (!context.response) {
      throw new Error('No response available. Make an API call first.');
    }
    
    const auth = this.authManager.createAuthFromLogin(context.response);
    this.authManager.saveAuth(auth, filePath);
    
    // Also store in context for immediate use
    context.variables['auth'] = auth;
    
    // Add auth to headers
    if (auth.token) {
      context.headers['Authorization'] = `Bearer ${auth.token}`;
    }
    if (auth.cookies) {
      context.cookies = { ...context.cookies, ...auth.cookies };
    }
  }
  
  private async handleLoadAuth(step: Step, context: TestContext, filePath: string): Promise<void> {
    const auth = this.authManager.loadAuth(filePath);
    
    if (!auth) {
      throw new Error(`Failed to load auth from: ${filePath}`);
    }
    
    // Store in context for immediate use
    context.variables['auth'] = auth;
    
    // Add auth to headers
    if (auth.token) {
      context.headers['Authorization'] = `Bearer ${auth.token}`;
    }
    if (auth.cookies) {
      context.cookies = { ...context.cookies, ...auth.cookies };
    }
    
    console.log(`🔐 Auth loaded and applied to requests`);
  }
  
  private async handleClearAuth(step: Step, context: TestContext): Promise<void> {
    this.authManager.clearAuth();
    
    // Remove auth from context
    delete context.variables['auth'];
    delete context.headers['Authorization'];
    
    console.log(`🔐 Auth cleared`);
  }
  
  private getPlaywright(context: TestContext): PlaywrightClient | null {
    return this.playwright || (context.variables['__playwright'] as PlaywrightClient) || null;
  }
  
  private extractValue(text: string, regex: RegExp): string {
    const match = text.match(regex);
    return match ? match[1] : '';
  }
  
  private parseKeyValue(text: string): [string, string] {
    const match = text.match(/^(.+?)\s*=\s*(.+)$/);
    if (match) {
      return [match[1].trim(), match[2].trim()];
    }
    return [text, ''];
  }
  
  private extractJsonBody(text: string): any {
    const match = text.match(/^request\s+(\{[\s\S]*\})/i);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch {
        return match[1];
      }
    }
    return undefined;
  }
  
  private convertDataTable(table: { headers: string[]; rows: string[][] }): any {
    if (table.rows.length === 0) return {};
    
    // Convert to object with key-value pairs
    const result: Record<string, any> = {};
    for (const row of table.rows) {
      for (let i = 0; i < table.headers.length; i++) {
        result[table.headers[i]] = row[i];
      }
    }
    return result;
  }
  
  private buildUrl(baseUrl: string, path: string, queryParams: Record<string, string>): string {
    let url = baseUrl + path;
    
    const params = new URLSearchParams(queryParams);
    if (params.toString()) {
      url += '?' + params.toString();
    }
    
    return url;
  }
  
  private resolveVariables(value: any, context: TestContext): any {
    if (typeof value !== 'string') return value;
    
    // First resolve env variables, then context variables
    let resolved = resolveEnv(value, this.envConfig);
    
    // Replace ${var} or #var patterns with context variables
    return resolved.replace(/\$\{(\w+)\}/g, (_, name) => {
      return context.variables[name] ?? value;
    }).replace(/#(\w+)/g, (_, name) => {
      return context.variables[name] ?? value;
    });
  }
  
  private parseValue(value: string, context: TestContext): any {
    // Try to parse as JSON
    try {
      if (value.startsWith('{') || value.startsWith('[')) {
        return JSON.parse(value);
      }
    } catch {}
    
    // Check for variable reference
    if (value.startsWith('#') || value.startsWith('$')) {
      const varName = value.replace(/^#\$/, '').trim();
      return context.variables[varName] ?? value;
    }
    
    return value;
  }
  
  private parseExpectedValue(expected: string, context: TestContext): any {
    // Handle fuzzy matchers like #number, #string, #boolean, etc.
    if (expected.startsWith('#')) {
      return expected; // Return as-is for validator to handle
    }
    
    // Try to parse JSON
    try {
      return JSON.parse(expected);
    } catch {}
    
    // Handle string values
    if (expected.startsWith("'") || expected.startsWith('"')) {
      return this.extractStringValue(expected);
    }
    
    return this.resolveVariables(expected, context);
  }
  
  private extractStringValue(value: string): string {
    if (value.startsWith("'") && value.endsWith("'")) {
      return value.slice(1, -1);
    }
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1);
    }
    return value;
  }
  
  private stripQuotes(value: string): string {
    // Handle single quotes
    if (value.startsWith("'") && value.endsWith("'")) {
      return value.slice(1, -1);
    }
    // Handle double quotes
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1);
    }
    return value;
  }
  
  private normalizeJson(jsonStr: string): string {
    // First, replace fuzzy matchers with placeholders to avoid JSON parse errors
    const fuzzyMatchers: string[] = [];
    let result = jsonStr;
    
    // Find all fuzzy matchers like #number, #string, #email, etc.
    // But we need to handle them in the context of JSON (inside quotes)
    // Match '#xyz' pattern that should be preserved
    const matcherRegex = /'#(\w+)'/g;
    let match;
    let idx = 0;
    
    while ((match = matcherRegex.exec(jsonStr)) !== null) {
      const fullMatch = match[0]; // e.g., '#number'
      const placeholder = `__FUZZY_M${idx}__`;
      fuzzyMatchers.push(fullMatch); // Store '#number'
      
      // Replace in result string
      const before = result.substring(0, match.index);
      const after = result.substring(match.index + fullMatch.length);
      result = before + placeholder + after;
      
      // Adjust regex index since we modified the string
      idx++;
    }
    
    // Now replace single quotes with double quotes for the JSON string
    // Match 'string' but not already converted placeholders
    result = result.replace(/'([^']*)'/g, (match, p1) => {
      // If it contains a placeholder, don't convert
      if (p1.includes('__FUZZY_')) {
        return match;
      }
      // Escape any existing double quotes
      const escaped = p1.replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    
    // Now restore the fuzzy matchers
    for (let i = 0; i < fuzzyMatchers.length; i++) {
      result = result.replace(`__FUZZY_M${i}__`, fuzzyMatchers[i]);
    }
    
    return result;
  }
  
  /**
   * Parse Gherkin-style JSON with fuzzy matchers
   * Handles: { id: '#number', name: '#string' }
   * Returns an object with fuzzy matcher strings preserved
   */
  private parseGherkinJson(jsonStr: string): any {
    const result: any = {};
    const trimmed = jsonStr.trim();
    
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      // Parse object
      const inner = trimmed.slice(1, -1);
      const pairs = this.splitByComma(inner);
      
      for (const pair of pairs) {
        const colonIndex = pair.indexOf(':');
        if (colonIndex === -1) continue;
        
        const key = pair.substring(0, colonIndex).trim();
        let value = pair.substring(colonIndex + 1).trim();
        
        // Remove outer quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        result[key] = value;
      }
    } else if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      // Parse array
      const inner = trimmed.slice(1, -1);
      const items = this.splitByComma(inner);
      return items.map((item: string) => {
        let value = item.trim();
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        return value;
      });
    }
    
    return result;
  }
  
  private splitByComma(str: string): string[] {
    const result: string[] = [];
    let current = '';
    let depth = 0;
    let inString = false;
    let stringChar = '';
    
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      
      if ((char === '"' || char === "'") && !inString) {
        inString = true;
        stringChar = char;
        current += char;
      } else if (char === stringChar && inString) {
        inString = false;
        current += char;
      } else if (char === '{' || char === '[') {
        depth++;
        current += char;
      } else if (char === '}' || char === ']') {
        depth--;
        current += char;
      } else if (char === ',' && depth === 0 && !inString) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    if (current) {
      result.push(current);
    }
    
    return result;
  }
  
  private getNestedValue(obj: any, path: string): any {
    if (!obj) return undefined;
    
    // Support both dot notation and bracket notation
    const parts = path.replace(/\[(\w+)\]/g, '.$1').split('.');
    let current: any = obj;
    
    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }
    
    return current;
  }
  
  private parseJsonWithFuzzyMatchers(jsonStr: string): any {
    // Replace fuzzy matchers with a placeholder before parsing, then restore
    const fuzzyMatchers: string[] = [];
    let placeholder = jsonStr;
    
    // Find all fuzzy matchers like #number, #string, #email, etc.
    const matcherRegex = /#\w+/g;
    let match;
    let idx = 0;
    
    while ((match = matcherRegex.exec(jsonStr)) !== null) {
      const placeholderStr = `__FUZZY_${idx}__`;
      fuzzyMatchers.push(match[0]);
      placeholder = placeholder.substring(0, match.index) + placeholderStr + placeholder.substring(match.index + match[0].length);
      idx++;
    }
    
    // Now parse the JSON
    try {
      const parsed = JSON.parse(placeholder);
      
      // Restore fuzzy matchers
      return this.restoreFuzzyMatchers(parsed, fuzzyMatchers);
    } catch {
      return jsonStr;
    }
  }
  
  private restoreFuzzyMatchers(obj: any, matchers: string[]): any {
    if (typeof obj === 'string') {
      for (let i = 0; i < matchers.length; i++) {
        obj = obj.replace(`__FUZZY_${i}__`, matchers[i]);
      }
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(item => this.restoreFuzzyMatchers(item, matchers));
    }
    if (typeof obj === 'object' && obj !== null) {
      const result: any = {};
      for (const key of Object.keys(obj)) {
        result[key] = this.restoreFuzzyMatchers(obj[key], matchers);
      }
      return result;
    }
    return obj;
  }
  
  private async executeBuiltInStep(step: Step, context: TestContext): Promise<void> {
    // This is where UI steps and other advanced steps would be handled
    // For now, we'll throw an error for unknown steps
    throw new Error(`Unknown step: ${step.keyword} ${step.text}`);
  }
  
  /**
   * Close browser if open
   */
  async closeBrowser(): Promise<void> {
    if (this.playwright) {
      await this.playwright.close();
      this.playwright = null;
    }
  }
  
  /**
   * Load CSV file and store as array of objects in variable
   */
  private async loadCsvFile(csvPath: string, varName: string, context: TestContext): Promise<void> {
    // Resolve environment variables in path
    const resolvedPath = resolveEnv(csvPath, this.envConfig);
    
    try {
      const content = await readFile(resolvedPath, 'utf-8');
      const table = this.parseCsvContent(content);
      
      // Convert to array of objects
      const data: Record<string, any>[] = [];
      for (const row of table.rows) {
        const obj: Record<string, any> = {};
        for (let i = 0; i < table.headers.length; i++) {
          obj[table.headers[i]] = row[i];
        }
        data.push(obj);
      }
      
      context.variables[varName] = data;
      console.log(`📄 Loaded ${data.length} rows from CSV '${csvPath}' into variable '${varName}'`);
    } catch (error) {
      throw new Error(`Failed to load CSV file '${csvPath}': ${error instanceof Error ? error.message : error}`);
    }
  }
  
  /**
   * Parse CSV content into headers and rows
   */
  private parseCsvContent(content: string): { headers: string[]; rows: string[][] } {
    const lines = content.trim().split(/\r?\n/);
    
    if (lines.length === 0) {
      return { headers: [], rows: [] };
    }
    
    // Detect delimiter (comma or semicolon)
    const firstLine = lines[0];
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    const delimiter = semicolonCount > commaCount ? ';' : ',';
    
    const headers = this.parseCsvLine(lines[0], delimiter);
    const rows: string[][] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        rows.push(this.parseCsvLine(line, delimiter));
      }
    }
    
    return { headers, rows };
  }
  
  /**
   * Parse a single CSV line handling quoted values
   */
  private parseCsvLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }
}
