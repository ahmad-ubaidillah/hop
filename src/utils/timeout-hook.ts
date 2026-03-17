/**
 * Timeout Hook/Callback for Hop Framework
 * Priority 3: Timeout management with hooks
 */

export interface TimeoutConfig {
  global?: number;
  scenario?: number;
  step?: number;
  hook?: number;
}

export interface TimeoutHook {
  onTimeout: (context: TimeoutContext) => void | Promise<void>;
  timeout: number;
}

export interface TimeoutContext {
  type: 'global' | 'scenario' | 'step' | 'hook';
  name: string;
  elapsed: number;
  limit: number;
  stack?: string;
}

/**
 * Timeout Manager with hooks
 */
export class TimeoutManager {
  private config: TimeoutConfig;
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private startTimes: Map<string, number> = new Map();
  private hooks: Map<string, TimeoutHook> = new Map();
  private timeouts: Set<string> = new Set();

  constructor(config: TimeoutConfig = {}) {
    this.config = {
      global: config.global || 300000, // 5 minutes
      scenario: config.scenario || 60000, // 1 minute
      step: config.step || 30000, // 30 seconds
      hook: config.hook || 10000, // 10 seconds
    };
  }

  /**
   * Register a timeout hook
   */
  registerHook(name: string, callback: (context: TimeoutContext) => void | Promise<void>, timeout?: number): void {
    this.hooks.set(name, {
      onTimeout: callback,
      timeout: timeout || this.config.step || 30000,
    });
  }

  /**
   * Start a timer
   */
  start(name: string, type: keyof TimeoutConfig = 'step', customTimeout?: number): void {
    const timeout = customTimeout || this.config[type] || 30000;
    const startTime = Date.now();
    
    this.startTimes.set(name, startTime);
    this.timeouts.add(name);
    
    // Clear existing timer if any
    if (this.timers.has(name)) {
      clearTimeout(this.timers.get(name));
    }
    
    const timer = setTimeout(async () => {
      const elapsed = Date.now() - startTime;
      const hook = this.hooks.get(name);
      
      const context: TimeoutContext = {
        type,
        name,
        elapsed,
        limit: timeout,
        stack: new Error().stack,
      };
      
      try {
        if (hook) {
          await hook.onTimeout(context);
        }
      } catch (error) {
        console.error(`Timeout hook error for ${name}:`, error);
      }
      
      this.timeouts.delete(name);
    }, timeout);
    
    this.timers.set(name, timer);
  }

  /**
   * Stop a timer
   */
  stop(name: string): void {
    if (this.timers.has(name)) {
      clearTimeout(this.timers.get(name));
      this.timers.delete(name);
    }
    this.startTimes.delete(name);
    this.timeouts.delete(name);
  }

  /**
   * Check if timed out
   */
  isTimedOut(name: string): boolean {
    return this.timeouts.has(name);
  }

  /**
   * Get elapsed time
   */
  getElapsed(name: string): number {
    const startTime = this.startTimes.get(name);
    if (!startTime) return 0;
    return Date.now() - startTime;
  }

  /**
   * Clear all timers
   */
  clear(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.startTimes.clear();
    this.timeouts.clear();
  }

  /**
   * Get timeout status
   */
  getStatus(): { active: number; timers: string[] } {
    return {
      active: this.timers.size,
      timers: Array.from(this.timers.keys()),
    };
  }
}

/**
 * Create timeout manager
 */
export function createTimeoutManager(config?: TimeoutConfig): TimeoutManager {
  return new TimeoutManager(config);
}

/**
 * Timeout decorator
 */
export function withTimeout<T extends (...args: any[]) => any>(
  manager: TimeoutManager,
  name: string,
  type: keyof TimeoutConfig,
  timeout?: number
): T {
  return function (this: any, ...args: any[]) {
    manager.start(name, type, timeout);
    try {
      const result = args[0].apply(this, args.slice(1));
      manager.stop(name);
      return result;
    } catch (error) {
      manager.stop(name);
      throw error;
    }
  } as T;
}

/**
 * Async timeout decorator
 */
export async function withTimeoutAsync<T>(
  manager: TimeoutManager,
  name: string,
  type: keyof TimeoutConfig,
  fn: () => Promise<T>,
  timeout?: number
): Promise<T> {
  manager.start(name, type, timeout);
  try {
    const result = await fn();
    manager.stop(name);
    return result;
  } catch (error) {
    manager.stop(name);
    throw error;
  }
}
