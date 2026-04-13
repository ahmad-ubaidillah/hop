/**
 * Plugin System for Hop Framework
 * Custom reporters, handlers, formatters, and hooks
 */
export class PluginManager {
    reporters = new Map();
    handlers = new Map();
    formatters = new Map();
    hooks = new Map();
    plugins = new Map();
    /**
     * Register a reporter plugin
     */
    registerReporter(reporter) {
        if (this.reporters.has(reporter.name)) {
            console.warn(`Reporter ${reporter.name} already registered, overwriting`);
        }
        this.reporters.set(reporter.name, reporter);
    }
    /**
     * Register a handler plugin
     */
    registerHandler(handler) {
        if (this.handlers.has(handler.name)) {
            console.warn(`Handler ${handler.name} already registered, overwriting`);
        }
        this.handlers.set(handler.name, handler);
    }
    /**
     * Register a formatter plugin
     */
    registerFormatter(formatter) {
        if (this.formatters.has(formatter.name)) {
            console.warn(`Formatter ${formatter.name} already registered, overwriting`);
        }
        this.formatters.set(formatter.name, formatter);
    }
    /**
     * Register a hook plugin
     */
    registerHook(hook) {
        if (this.hooks.has(hook.name)) {
            console.warn(`Hook ${hook.name} already registered, overwriting`);
        }
        this.hooks.set(hook.name, hook);
    }
    /**
     * Register a complete plugin with config
     */
    register(plugin) {
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
    unregister(name) {
        this.plugins.delete(name);
        this.reporters.delete(name);
        this.handlers.delete(name);
        this.formatters.delete(name);
        this.hooks.delete(name);
    }
    /**
     * Get reporter by name
     */
    getReporter(name) {
        return this.reporters.get(name);
    }
    /**
     * Get handler by name
     */
    getHandler(name) {
        return this.handlers.get(name);
    }
    /**
     * Get all reporters
     */
    getAllReporters() {
        return Array.from(this.reporters.values());
    }
    /**
     * Get all handlers sorted by priority
     */
    getAllHandlers() {
        return Array.from(this.handlers.values())
            .sort((a, b) => (b.priority || 0) - (a.priority || 0));
    }
    /**
     * Get all formatters sorted by priority
     */
    getAllFormatters() {
        return Array.from(this.formatters.values())
            .sort((a, b) => (b.priority || 0) - (a.priority || 0));
    }
    /**
     * Get all hooks
     */
    getAllHooks() {
        return Array.from(this.hooks.values());
    }
    /**
     * Find handler for a step
     */
    findHandler(stepText) {
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
    async executeReporterEvent(event, arg) {
        for (const reporter of this.reporters.values()) {
            try {
                const handler = reporter[event];
                if (handler) {
                    await handler(arg);
                }
            }
            catch (error) {
                console.error(`Error in reporter ${reporter.name}:`, error);
            }
        }
    }
    /**
     * Execute hook event
     */
    async executeHookEvent(event, arg) {
        for (const hook of this.hooks.values()) {
            try {
                const handler = hook[event];
                if (handler) {
                    await handler(arg);
                }
            }
            catch (error) {
                console.error(`Error in hook ${hook.name}:`, error);
            }
        }
    }
    /**
     * Format data through all formatters
     */
    formatData(data) {
        let result = data;
        for (const formatter of this.getAllFormatters()) {
            result = formatter.format(result);
        }
        return result;
    }
    /**
     * Clear all plugins
     */
    clear() {
        this.plugins.clear();
        this.reporters.clear();
        this.handlers.clear();
        this.formatters.clear();
        this.hooks.clear();
    }
    /**
     * List all registered plugins
     */
    listPlugins() {
        return Array.from(this.plugins.values());
    }
    /**
     * Check if plugin is registered
     */
    has(name) {
        return this.plugins.has(name);
    }
    /**
     * Enable plugin
     */
    enable(name) {
        const config = this.plugins.get(name);
        if (config) {
            config.enabled = true;
        }
    }
    /**
     * Disable plugin
     */
    disable(name) {
        const config = this.plugins.get(name);
        if (config) {
            config.enabled = false;
        }
    }
}
// Global plugin manager instance
let globalPluginManager = null;
/**
 * Get global plugin manager
 */
export function getPluginManager() {
    if (!globalPluginManager) {
        globalPluginManager = new PluginManager();
    }
    return globalPluginManager;
}
/**
 * Reset global plugin manager
 */
export function resetPluginManager() {
    globalPluginManager = null;
}
/**
 * Create a new plugin manager
 */
export function createPluginManager() {
    return new PluginManager();
}
/**
 * Decorator for registering plugins
 */
export function reporter(name) {
    return function (constructor) {
        const instance = new constructor();
        getPluginManager().registerReporter({ ...instance, name });
        return constructor;
    };
}
export function handler(name, pattern, priority) {
    return function (constructor) {
        const instance = new constructor();
        getPluginManager().registerHandler({ ...instance, name, pattern, priority });
        return constructor;
    };
}
export function formatter(name, priority) {
    return function (constructor) {
        const instance = new constructor();
        getPluginManager().registerFormatter({ ...instance, name, priority });
        return constructor;
    };
}
export function hook(name) {
    return function (constructor) {
        const instance = new constructor();
        getPluginManager().registerHook({ ...instance, name });
        return constructor;
    };
}
