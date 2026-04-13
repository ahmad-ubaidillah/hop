/**
 * Timeout Manager - Handles per-scenario, per-step, and global timeouts
 */
export class TimeoutManager {
    globalTimeout;
    scenarioTimeout;
    stepTimeout;
    onTimeout;
    globalTimer;
    currentScenarioTimer;
    activeTimeouts = new Map();
    isRunning = false;
    startTime = 0;
    constructor(options = {}) {
        this.globalTimeout = options.globalTimeout;
        this.scenarioTimeout = options.scenarioTimeout;
        this.stepTimeout = options.stepTimeout;
        this.onTimeout = options.onTimeout;
    }
    /**
     * Start the global timeout
     */
    startGlobal() {
        if (!this.globalTimeout || this.globalTimer)
            return;
        this.startTime = Date.now();
        this.isRunning = true;
        this.globalTimer = setTimeout(() => {
            this.handleTimeout('global', {
                elapsed: Date.now() - this.startTime,
                timeout: this.globalTimeout,
            });
        }, this.globalTimeout);
    }
    /**
     * Stop the global timeout
     */
    stopGlobal() {
        if (this.globalTimer) {
            clearTimeout(this.globalTimer);
            this.globalTimer = undefined;
        }
        this.isRunning = false;
    }
    /**
     * Start a scenario timeout
     */
    startScenario(scenarioName, featureName) {
        if (!this.scenarioTimeout || this.currentScenarioTimer)
            return;
        this.currentScenarioTimer = setTimeout(() => {
            this.handleTimeout('scenario', {
                scenarioName,
                featureName,
                elapsed: Date.now() - this.startTime,
                timeout: this.scenarioTimeout,
            });
        }, this.scenarioTimeout);
    }
    /**
     * Stop the scenario timeout
     */
    stopScenario() {
        if (this.currentScenarioTimer) {
            clearTimeout(this.currentScenarioTimer);
            this.currentScenarioTimer = undefined;
        }
    }
    /**
     * Run a function with step timeout
     * Returns a promise that resolves with the result or rejects on timeout
     */
    async runWithStepTimeout(stepText, fn, scenarioName, featureName) {
        if (!this.stepTimeout) {
            return fn();
        }
        const timeoutId = `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const stepStartTime = Date.now();
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.activeTimeouts.delete(timeoutId);
                const error = new TimeoutError(`Step timed out after ${this.stepTimeout}ms: "${stepText}"`, 'step', { stepText, scenarioName, featureName, elapsed: Date.now() - stepStartTime, timeout: this.stepTimeout });
                if (this.onTimeout) {
                    this.onTimeout('step', error.context);
                }
                reject(error);
            }, this.stepTimeout);
            this.activeTimeouts.set(timeoutId, {
                id: timeoutId,
                type: 'step',
                startTime: stepStartTime,
                timeout: this.stepTimeout,
                timer,
                resolve: () => { clearTimeout(timer); this.activeTimeouts.delete(timeoutId); },
                reject: (err) => { clearTimeout(timer); this.activeTimeouts.delete(timeoutId); },
            });
            fn()
                .then((result) => {
                const handle = this.activeTimeouts.get(timeoutId);
                if (handle) {
                    clearTimeout(handle.timer);
                    this.activeTimeouts.delete(timeoutId);
                }
                resolve(result);
            })
                .catch((error) => {
                const handle = this.activeTimeouts.get(timeoutId);
                if (handle) {
                    clearTimeout(handle.timer);
                    this.activeTimeouts.delete(timeoutId);
                }
                reject(error);
            });
        });
    }
    /**
     * Cancel a specific timeout
     */
    cancelTimeout(timeoutId) {
        const handle = this.activeTimeouts.get(timeoutId);
        if (handle) {
            clearTimeout(handle.timer);
            this.activeTimeouts.delete(timeoutId);
        }
    }
    /**
     * Cancel all active timeouts
     */
    cancelAll() {
        this.stopGlobal();
        this.stopScenario();
        for (const [id, handle] of this.activeTimeouts) {
            clearTimeout(handle.timer);
        }
        this.activeTimeouts.clear();
    }
    /**
     * Get elapsed time since global start
     */
    getElapsedTime() {
        return this.startTime ? Date.now() - this.startTime : 0;
    }
    /**
     * Check if timeout manager is running
     */
    getIsRunning() {
        return this.isRunning;
    }
    /**
     * Update timeout configurations
     */
    updateOptions(options) {
        if (options.globalTimeout !== undefined)
            this.globalTimeout = options.globalTimeout;
        if (options.scenarioTimeout !== undefined)
            this.scenarioTimeout = options.scenarioTimeout;
        if (options.stepTimeout !== undefined)
            this.stepTimeout = options.stepTimeout;
        if (options.onTimeout !== undefined)
            this.onTimeout = options.onTimeout;
    }
    handleTimeout(type, context) {
        const error = new TimeoutError(`${type === 'global' ? 'Global' : type === 'scenario' ? 'Scenario' : 'Step'} timeout after ${context.timeout}ms`, type, context);
        if (this.onTimeout) {
            this.onTimeout(type, context);
        }
        // For global/scenario timeouts, throw the error
        if (type !== 'step') {
            throw error;
        }
    }
}
export class TimeoutError extends Error {
    type;
    context;
    constructor(message, type, context) {
        super(message);
        this.name = 'TimeoutError';
        this.type = type;
        this.context = context;
    }
}
/**
 * Create a timeout manager with options from engine config
 */
export function createTimeoutManager(timeout) {
    return new TimeoutManager({
        globalTimeout: timeout,
        scenarioTimeout: timeout,
        stepTimeout: Math.min(timeout, 30000), // Max 30s per step
    });
}
