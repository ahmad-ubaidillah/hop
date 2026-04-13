/**
 * Timeout Hook/Callback for Hop Framework
 * Priority 3: Timeout management with hooks
 */
/**
 * Timeout Manager with hooks
 */
export class TimeoutManager {
    config;
    timers = new Map();
    startTimes = new Map();
    hooks = new Map();
    timeouts = new Set();
    constructor(config = {}) {
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
    registerHook(name, callback, timeout) {
        this.hooks.set(name, {
            onTimeout: callback,
            timeout: timeout || this.config.step || 30000,
        });
    }
    /**
     * Start a timer
     */
    start(name, type = 'step', customTimeout) {
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
            const context = {
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
            }
            catch (error) {
                console.error(`Timeout hook error for ${name}:`, error);
            }
            this.timeouts.delete(name);
        }, timeout);
        this.timers.set(name, timer);
    }
    /**
     * Stop a timer
     */
    stop(name) {
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
    isTimedOut(name) {
        return this.timeouts.has(name);
    }
    /**
     * Get elapsed time
     */
    getElapsed(name) {
        const startTime = this.startTimes.get(name);
        if (!startTime)
            return 0;
        return Date.now() - startTime;
    }
    /**
     * Clear all timers
     */
    clear() {
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
    getStatus() {
        return {
            active: this.timers.size,
            timers: Array.from(this.timers.keys()),
        };
    }
}
/**
 * Create timeout manager
 */
export function createTimeoutManager(config) {
    return new TimeoutManager(config);
}
/**
 * Timeout decorator
 */
export function withTimeout(manager, name, type, timeout) {
    return function (...args) {
        manager.start(name, type, timeout);
        try {
            const result = args[0].apply(this, args.slice(1));
            manager.stop(name);
            return result;
        }
        catch (error) {
            manager.stop(name);
            throw error;
        }
    };
}
/**
 * Async timeout decorator
 */
export async function withTimeoutAsync(manager, name, type, fn, timeout) {
    manager.start(name, type, timeout);
    try {
        const result = await fn();
        manager.stop(name);
        return result;
    }
    catch (error) {
        manager.stop(name);
        throw error;
    }
}
