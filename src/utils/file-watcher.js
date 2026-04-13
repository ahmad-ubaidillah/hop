/**
 * File Watcher - Hot reload and file watching for Hop Framework
 */
export class FileWatcher {
    watchers = new Map();
    debounceTimers = new Map();
    pendingEvents = new Map();
    debounceMs;
    ignored;
    callbacks = [];
    constructor(options = {}) {
        this.debounceMs = options.debounceMs || 300;
        this.ignored = options.ignored || [
            '**/node_modules/**',
            '**/dist/**',
            '**/reports/**',
            '**/test-results/**',
            '**/*.log',
        ];
    }
    /**
     * Watch files or directories
     */
    async watch(paths, callback) {
        if (!this.checkChokidarAvailable()) {
            console.warn('chokidar not installed, file watching unavailable');
            return;
        }
        const chokidar = require('chokidar');
        const pathArray = Array.isArray(paths) ? paths : [paths];
        this.callbacks.push(callback);
        const watcher = chokidar.watch(pathArray, {
            ignored: this.ignored,
            persistent: true,
            ignoreInitial: true,
            awaitWriteFinish: {
                stabilityThreshold: 200,
                pollInterval: 100,
            },
        });
        const watcherId = paths.toString();
        this.watchers.set(watcherId, watcher);
        watcher
            .on('add', (path) => this.handleChange('add', path))
            .on('change', (path) => this.handleChange('change', path))
            .on('unlink', (path) => this.handleChange('unlink', path))
            .on('error', (error) => console.error('Watcher error:', error));
    }
    /**
     * Handle file change with debouncing
     */
    handleChange(type, path) {
        const key = `${type}:${path}`;
        // Clear existing timer for this file
        if (this.debounceTimers.has(key)) {
            clearTimeout(this.debounceTimers.get(key));
        }
        // Store the event
        this.pendingEvents.set(key, {
            type,
            path,
            timestamp: Date.now(),
        });
        // Set debounce timer
        const timer = setTimeout(() => {
            const event = this.pendingEvents.get(key);
            if (event) {
                this.pendingEvents.delete(key);
                this.notifyCallbacks([event]);
            }
            this.debounceTimers.delete(key);
        }, this.debounceMs);
        this.debounceTimers.set(key, timer);
    }
    /**
     * Notify all callbacks
     */
    notifyCallbacks(events) {
        for (const callback of this.callbacks) {
            try {
                callback(events);
            }
            catch (error) {
                console.error('Callback error:', error);
            }
        }
    }
    /**
     * Stop watching
     */
    async close() {
        // Clear all debounce timers
        for (const timer of this.debounceTimers.values()) {
            clearTimeout(timer);
        }
        this.debounceTimers.clear();
        this.pendingEvents.clear();
        // Close all watchers
        for (const watcher of this.watchers.values()) {
            await watcher.close();
        }
        this.watchers.clear();
        this.callbacks = [];
    }
    /**
     * Check if chokidar is available
     */
    checkChokidarAvailable() {
        try {
            require.resolve('chokidar');
            return true;
        }
        catch {
            return false;
        }
    }
}
/**
 * Create a file watcher
 */
export function createFileWatcher(options) {
    return new FileWatcher(options);
}
/**
 * Auto-runner with file watching
 */
export class AutoRunner {
    watcher = null;
    runFn;
    isRunning = false;
    debounceMs;
    runTimer;
    constructor(runFn, debounceMs = 1000) {
        this.runFn = runFn;
        this.debounceMs = debounceMs;
    }
    /**
     * Start watching and running
     */
    async start(paths) {
        this.watcher = new FileWatcher({ debounceMs: 300 });
        await this.watcher.watch(paths, async (events) => {
            console.log(`File change detected: ${events.map(e => e.path).join(', ')}`);
            this.scheduleRun();
        });
        // Initial run
        await this.run();
    }
    /**
     * Schedule a debounced run
     */
    scheduleRun() {
        if (this.runTimer) {
            clearTimeout(this.runTimer);
        }
        this.runTimer = setTimeout(() => {
            this.run();
        }, this.debounceMs);
    }
    /**
     * Run tests
     */
    async run() {
        if (this.isRunning) {
            console.log('Previous run still in progress, skipping...');
            return;
        }
        this.isRunning = true;
        console.log('Running tests...');
        try {
            await this.runFn();
        }
        catch (error) {
            console.error('Run failed:', error);
        }
        finally {
            this.isRunning = false;
        }
    }
    /**
     * Stop watching
     */
    async stop() {
        if (this.runTimer) {
            clearTimeout(this.runTimer);
        }
        if (this.watcher) {
            await this.watcher.close();
            this.watcher = null;
        }
    }
}
/**
 * Create an auto-runner
 */
export function createAutoRunner(runFn, debounceMs) {
    return new AutoRunner(runFn, debounceMs);
}
