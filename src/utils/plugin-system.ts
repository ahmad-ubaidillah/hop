/**
 * Plugin System for Hop Framework
 * Custom reporters, handlers, formatters, and hooks
 */

import type { HooksRunner } from '../engine/hooks-runner';
import type { StepExecutor } from '../engine/step-executor';

export interface PluginConfig {
  name: string;
  version: string;
  description?: string;
  enabled?: boolean;
}

export interface ReporterPlugin {
  name: string;
  onTestStart?: (scenario: any) => void | Promise<void>;
  onTestEnd?: (scenario: any, result: any) => void | Promise<void>;
  onStepStart?: (step: any) => void | Promise<void>;
  onStepEnd?: (step: any, result: any) => void | Promise<void>;
  onHookStart?: (hook: any) => void | Promise<void>;
  onHookEnd?: (hook: any, result: any) => void | Promise<void>;
  onFeatureStart?: (feature: any) => void | Promise<void>;
  onFeatureEnd?: (feature: any, result: any) => void | Promise<void>;
  onExecutionStart?: () => void | Promise<void>;
  onExecutionEnd?: (results: any) => void | Promise<void>;
  generateReport?: (results: any) => string | Promise<string>;
}

export interface HandlerPlugin {
  name: string;
  pattern?: string | RegExp;
  priority?: number;
  execute: (context: any, params?: any) => any | Promise<any>;
  canHandle?: (step: string) => boolean;
}

export interface FormatterPlugin {
  name: string;
  format: (data: any) => any;
  priority?: number;
}

export interface HookPlugin {
  name: string;
  beforeAll?: (context: any) => void | Promise<void>;
  beforeEach?: (context: any) => void | Promise<void>;
  afterEach?: (context: any) => void | Promise<void>;
  afterAll?: (context: any) => void | Promise<void>;
  beforeScenario?: (scenario: any, context: any) => void | Promise<void>;
  afterScenario?: (scenario: any, context: any) => void | Promise<void>;
  beforeStep?: (step: any, context: any) => void | Promise<void>;
  afterStep?: (step: any, context: any) => void | Promise<void>;
}

export class PluginManager {
  private reporters: Map<string, ReporterPlugin> = new Map();
  private handlers: Map<string, HandlerPlugin> = new Map();
  private formatters: Map<string, FormatterPlugin> = new Map();
  private hooks: Map<string, HookPlugin> = new Map();
  private plugins: Map<string, PluginConfig> = new Map();
  
  /**
   * Register a reporter plugin
   */
  registerReporter(reporter: ReporterPlugin): void {
    if (this.reporters.has(reporter.name)) {
      console.warn(`Reporter ${reporter.name} already registered, overwriting`);
    }
    this.reporters.set(reporter.name, reporter);
  }
  
  /**
   * Register a handler plugin
   */
  registerHandler(handler: HandlerPlugin): void {
    if (this.handlers.has(handler.name)) {
      console.warn(`Handler ${handler.name} already registered, overwriting`);
    }
    this.handlers.set(handler.name, handler);
  }
  
  /**
   * Register a formatter plugin
   */
  registerFormatter(formatter: FormatterPlugin): void {
    if (this.formatters.has(formatter.name)) {
      console.warn(`Formatter ${formatter.name} already registered, overwriting`);
    }
    this.formatters.set(formatter.name, formatter);
  }
  
  /**
   * Register a hook plugin
   */
  registerHook(hook: HookPlugin): void {
    if (this.hooks.has(hook.name)) {
      console.warn(`Hook ${hook.name} already registered, overwriting`);
    }
    this.hooks.set(hook.name, hook);
  }
  
  /**
   * Register a complete plugin with config
   */
  register(plugin: PluginConfig & {
    reporter?: ReporterPlugin;
    handler?: HandlerPlugin;
    formatter?: FormatterPlugin;
    hook?: HookPlugin;
  }): void {
    this.plugins.set(plugin.name, plugin);
    
    if (plugin.reporter) {
      this.registerReporter(plugin.reporter);
    }
    if (plugin.handler) {
      this.registerHandler(plugin.handler);
    }
    if (plugin.formatter) {
      this.registerFormatter(plugin.formatter);
    }
    if (plugin.hook) {
      this.registerHook(plugin.hook);
    }
  }
  
  /**
   * Unregister a plugin
   */
  unregister(name: string): void {
    this.plugins.delete(name);
    this.reporters.delete(name);
    this.handlers.delete(name);
    this.formatters.delete(name);
    this.hooks.delete(name);
  }
  
  /**
   * Get reporter by name
   */
  getReporter(name: string): ReporterPlugin | undefined {
    return this.reporters.get(name);
  }
  
  /**
   * Get handler by name
   */
  getHandler(name: string): HandlerPlugin | undefined {
    return this.handlers.get(name);
  }
  
  /**
   * Get all reporters
   */
  getAllReporters(): ReporterPlugin[] {
    return Array.from(this.reporters.values());
  }
  
  /**
   * Get all handlers sorted by priority
   */
  getAllHandlers(): HandlerPlugin[] {
    return Array.from(this.handlers.values())
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }
  
  /**
   * Get all formatters sorted by priority
   */
  getAllFormatters(): FormatterPlugin[] {
    return Array.from(this.formatters.values())
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }
  
  /**
   * Get all hooks
   */
  getAllHooks(): HookPlugin[] {
    return Array.from(this.hooks.values());
  }
  
  /**
   * Find handler for a step
   */
  findHandler(stepText: string): HandlerPlugin | undefined {
    const handlers = this.getAllHandlers();
    return handlers.find(handler => {
      if (handler.canHandle) {
        return handler.canHandle(stepText);
      }
      if (handler.pattern) {
        if (typeof handler.pattern === 'string') {
          return stepText.includes(handler.pattern);
        }
        return handler.pattern.test(stepText);
      }
      return false;
    });
  }
  
  async executeReporterEvent(
    event: keyof Omit<ReporterPlugin, 'name' | 'generateReport'>,
    arg?: any
  ): Promise<void> {
    for (const reporter of this.reporters.values()) {
      try {
        const handler = reporter[event] as Function | undefined;
        if (handler) {
          await handler(arg);
        }
      } catch (error) {
        console.error(`Error in reporter ${reporter.name}:`, error);
      }
    }
  }
  
  /**
   * Execute hook event
   */
  async executeHookEvent(
    event: keyof Omit<HookPlugin, 'name'>,
    arg?: any
  ): Promise<void> {
    for (const hook of this.hooks.values()) {
      try {
        const handler = hook[event] as Function | undefined;
        if (handler) {
          await handler(arg);
        }
      } catch (error) {
        console.error(`Error in hook ${hook.name}:`, error);
      }
    }
  }
  
  /**
   * Format data through all formatters
   */
  formatData(data: any): any {
    let result = data;
    for (const formatter of this.getAllFormatters()) {
      result = formatter.format(result);
    }
    return result;
  }
  
  /**
   * Clear all plugins
   */
  clear(): void {
    this.plugins.clear();
    this.reporters.clear();
    this.handlers.clear();
    this.formatters.clear();
    this.hooks.clear();
  }
  
  /**
   * List all registered plugins
   */
  listPlugins(): PluginConfig[] {
    return Array.from(this.plugins.values());
  }
  
  /**
   * Check if plugin is registered
   */
  has(name: string): boolean {
    return this.plugins.has(name);
  }
  
  /**
   * Enable plugin
   */
  enable(name: string): void {
    const config = this.plugins.get(name);
    if (config) {
      config.enabled = true;
    }
  }
  
  /**
   * Disable plugin
   */
  disable(name: string): void {
    const config = this.plugins.get(name);
    if (config) {
      config.enabled = false;
    }
  }
}

// Global plugin manager instance
let globalPluginManager: PluginManager | null = null;

/**
 * Get global plugin manager
 */
export function getPluginManager(): PluginManager {
  if (!globalPluginManager) {
    globalPluginManager = new PluginManager();
  }
  return globalPluginManager;
}

/**
 * Reset global plugin manager
 */
export function resetPluginManager(): void {
  globalPluginManager = null;
}

/**
 * Create a new plugin manager
 */
export function createPluginManager(): PluginManager {
  return new PluginManager();
}

/**
 * Decorator for registering plugins
 */
export function reporter(name: string) {
  return function <T extends new (...args: any[]) => ReporterPlugin>(
    constructor: T
  ): T {
    const instance = new constructor();
    getPluginManager().registerReporter({ ...instance, name });
    return constructor;
  };
}

export function handler(name: string, pattern?: string | RegExp, priority?: number) {
  return function <T extends new (...args: any[]) => HandlerPlugin>(
    constructor: T
  ): T {
    const instance = new constructor();
    getPluginManager().registerHandler({ ...instance, name, pattern, priority });
    return constructor;
  };
}

export function formatter(name: string, priority?: number) {
  return function <T extends new (...args: any[]) => FormatterPlugin>(
    constructor: T
  ): T {
    const instance = new constructor();
    getPluginManager().registerFormatter({ ...instance, name, priority });
    return constructor;
  };
}

export function hook(name: string) {
  return function <T extends new (...args: any[]) => HookPlugin>(
    constructor: T
  ): T {
    const instance = new constructor();
    getPluginManager().registerHook({ ...instance, name });
    return constructor;
  };
}
