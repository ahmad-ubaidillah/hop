/**
 * Debug Logger for Hop BDD Framework
 * Provides detailed debugging output for test execution
 */
import type { Step, TestContext, Scenario } from '../types/index.js';

export interface DebugOptions {
  enabled: boolean;
  showStepDetails: boolean;
  showContext: boolean;
  showVariables: boolean;
  showRequestResponse: boolean;
  breakpoints: string[];
}

export class DebugLogger {
  private options: DebugOptions;
  private stepIndex: number = 0;
  private indentLevel: number = 0;

  constructor(options: Partial<DebugOptions> = {}) {
    this.options = {
      enabled: options.enabled ?? false,
      showStepDetails: options.showStepDetails ?? true,
      showContext: options.showContext ?? true,
      showVariables: options.showVariables ?? true,
      showRequestResponse: options.showRequestResponse ?? true,
      breakpoints: options.breakpoints ?? [],
    };
  }

  setEnabled(enabled: boolean): void {
    this.options.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.options.enabled;
  }

  setBreakpoints(breakpoints: string[]): void {
    this.options.breakpoints = breakpoints;
  }

  isBreakpoint(stepText: string): boolean {
    return this.options.breakpoints.some(bp => stepText.includes(bp));
  }

  log(message: string, ...args: any[]): void {
    if (!this.options.enabled) return;
    const indent = '  '.repeat(this.indentLevel);
    console.log(`${indent}🔍 [DEBUG] ${message}`, ...args);
  }

  logStep(step: Step, context: TestContext): void {
    if (!this.options.enabled || !this.options.showStepDetails) return;
    
    this.log(`Executing step: ${step.keyword} ${step.text}`);
    this.log(`  - Line: ${step.line}`);
    
    if (step.docString) {
      this.log(`  - DocString: ${step.docString.substring(0, 100)}...`);
    }
    
    if (step.dataTable) {
      this.log(`  - DataTable: ${step.dataTable.headers.join(', ')} (${step.dataTable.rows.length} rows)`);
    }
  }

  logContext(context: TestContext): void {
    if (!this.options.enabled || !this.options.showContext) return;
    
    this.log('━━━ Context ━━━');
    this.log(`  baseUrl: ${context.baseUrl || '(none)'}`);
    this.log(`  path: ${context.path || '(none)'}`);
    this.log(`  method: ${context.method}`);
    
    if (Object.keys(context.headers).length > 0) {
      this.log(`  headers: ${JSON.stringify(context.headers)}`);
    }
    
    if (Object.keys(context.queryParams).length > 0) {
      this.log(`  queryParams: ${JSON.stringify(context.queryParams)}`);
    }
    
    if (context.body !== undefined && context.body !== null) {
      this.log(`  body: ${JSON.stringify(context.body).substring(0, 200)}...`);
    }
    
    if (Object.keys(context.cookies).length > 0) {
      this.log(`  cookies: ${JSON.stringify(context.cookies)}`);
    }
  }

  logVariables(context: TestContext): void {
    if (!this.options.enabled || !this.options.showVariables) return;
    
    const vars = context.variables;
    if (Object.keys(vars).length === 0) {
      this.log('  variables: (none)');
      return;
    }
    
    this.log('━━━ Variables ━━━');
    for (const [key, value] of Object.entries(vars)) {
      if (key.startsWith('__')) continue; // Skip internal variables
      const displayValue = typeof value === 'object' 
        ? JSON.stringify(value).substring(0, 100) 
        : String(value);
      this.log(`  ${key}: ${displayValue}`);
    }
  }

  logRequest(method: string, url: string, headers?: Record<string, string>, body?: any): void {
    if (!this.options.enabled || !this.options.showRequestResponse) return;
    
    this.log('━━━ HTTP Request ━━━');
    this.log(`  ${method} ${url}`);
    if (headers) {
      this.log(`  Headers: ${JSON.stringify(headers)}`);
    }
    if (body) {
      this.log(`  Body: ${JSON.stringify(body).substring(0, 200)}...`);
    }
  }

  logResponse(status: number, statusText: string, headers?: Record<string, string>, body?: any, duration?: number): void {
    if (!this.options.enabled || !this.options.showRequestResponse) return;
    
    this.log('━━━ HTTP Response ━━━');
    this.log(`  ${status} ${statusText}${duration ? ` (${duration}ms)` : ''}`);
    if (headers) {
      this.log(`  Headers: ${JSON.stringify(headers)}`);
    }
    if (body) {
      const bodyStr = typeof body === 'object' ? JSON.stringify(body) : body;
      this.log(`  Body: ${bodyStr.substring(0, 500)}...`);
    }
  }

  logError(error: Error | string, context?: TestContext): void {
    if (!this.options.enabled) return;
    
    this.log('━━━ Error ━━━');
    this.log(`  ${error instanceof Error ? error.message : error}`);
    
    if (error instanceof Error && error.stack) {
      this.log(`  Stack: ${error.stack.split('\n').slice(0, 3).join('\n')}`);
    }
    
    if (context && this.options.showContext) {
      this.logContext(context);
    }
    
    if (context && this.options.showVariables) {
      this.logVariables(context);
    }
  }

  logScenarioStart(scenario: Scenario, featureName: string): void {
    if (!this.options.enabled) return;
    this.stepIndex = 0;
    this.indentLevel = 0;
    this.log(`━━━━━━━ Starting: ${scenario.name} (Feature: ${featureName}) ━━━━━━━`);
    this.indentLevel = 1;
  }

  logScenarioEnd(scenarioName: string, status: 'passed' | 'failed' | 'skipped', duration: number): void {
    if (!this.options.enabled) return;
    this.indentLevel = 0;
    const icon = status === 'passed' ? '✅' : status === 'failed' ? '❌' : '⏭️';
    this.log(`${icon} Finished: ${scenarioName} (${status}) - ${duration}ms`);
  }

  logBreakpoint(step: Step): void {
    if (!this.options.enabled) return;
    this.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.log(`🛑 BREAKPOINT REACHED: ${step.keyword} ${step.text}`);
    this.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  formatContextForFailure(context: TestContext, step: Step, error: string): string {
    const lines: string[] = [];
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('🔴 STEP FAILED');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push(`Step: ${step.keyword} ${step.text}`);
    lines.push(`Line: ${step.line}`);
    lines.push('');
    lines.push('📍 Context:');
    lines.push(`  URL: ${context.baseUrl}${context.path}`);
    lines.push(`  Method: ${context.method}`);
    
    if (Object.keys(context.headers).length > 0) {
      lines.push(`  Headers: ${JSON.stringify(context.headers)}`);
    }
    
    if (context.body !== undefined) {
      lines.push(`  Body: ${JSON.stringify(context.body)}`);
    }
    
    lines.push('');
    lines.push('📦 Variables:');
    for (const [key, value] of Object.entries(context.variables)) {
      if (!key.startsWith('__')) {
        lines.push(`  ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
      }
    }
    
    lines.push('');
    lines.push('❌ Error:');
    lines.push(`  ${error}`);
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return lines.join('\n');
  }

  increaseIndent(): void {
    this.indentLevel++;
  }

  decreaseIndent(): void {
    this.indentLevel = Math.max(0, this.indentLevel - 1);
  }
}

// Global debug logger instance
let globalDebugLogger: DebugLogger | null = null;

export function getDebugLogger(): DebugLogger {
  if (!globalDebugLogger) {
    globalDebugLogger = new DebugLogger();
  }
  return globalDebugLogger;
}

export function setDebugLogger(logger: DebugLogger): void {
  globalDebugLogger = logger;
}
