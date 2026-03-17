/**
 * File Watcher - Hot reload and file watching for Hop Framework
 */

export interface WatcherOptions {
  debounceMs?: number;
  ignored?: string[];
  persistent?: boolean;
  watchImmediate?: boolean;
}

export interface FileChangeEvent {
  type: 'add' | 'change' | 'unlink';
  path: string;
  timestamp: number;
}

type ChangeCallback = (events: FileChangeEvent[]) => void;

export class FileWatcher {
  private watchers: Map<string, any> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private pendingEvents: Map<string, FileChangeEvent> = new Map();
  private debounceMs: number;
  private ignored: string[];
  private callbacks: ChangeCallback[] = [];
  
  constructor(options: WatcherOptions = {}) {
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
  async watch(paths: string | string[], callback: ChangeCallback): Promise<void> {
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
      .on('add', (path: string) => this.handleChange('add', path))
      .on('change', (path: string) => this.handleChange('change', path))
      .on('unlink', (path: string) => this.handleChange('unlink', path))
      .on('error', (error: Error) => console.error('Watcher error:', error));
  }
  
  /**
   * Handle file change with debouncing
   */
  private handleChange(type: FileChangeEvent['type'], path: string): void {
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
  private notifyCallbacks(events: FileChangeEvent[]): void {
    for (const callback of this.callbacks) {
      try {
        callback(events);
      } catch (error) {
        console.error('Callback error:', error);
      }
    }
  }
  
  /**
   * Stop watching
   */
  async close(): Promise<void> {
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
  private checkChokidarAvailable(): boolean {
    try {
      require.resolve('chokidar');
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Create a file watcher
 */
export function createFileWatcher(options?: WatcherOptions): FileWatcher {
  return new FileWatcher(options);
}

/**
 * Auto-runner with file watching
 */
export class AutoRunner {
  private watcher: FileWatcher | null = null;
  private runFn: () => Promise<void>;
  private isRunning = false;
  private debounceMs: number;
  private runTimer?: NodeJS.Timeout;
  
  constructor(runFn: () => Promise<void>, debounceMs: number = 1000) {
    this.runFn = runFn;
    this.debounceMs = debounceMs;
  }
  
  /**
   * Start watching and running
   */
  async start(paths: string | string[]): Promise<void> {
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
  private scheduleRun(): void {
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
  private async run(): Promise<void> {
    if (this.isRunning) {
      console.log('Previous run still in progress, skipping...');
      return;
    }
    
    this.isRunning = true;
    console.log('Running tests...');
    
    try {
      await this.runFn();
    } catch (error) {
      console.error('Run failed:', error);
    } finally {
      this.isRunning = false;
    }
  }
  
  /**
   * Stop watching
   */
  async stop(): Promise<void> {
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
export function createAutoRunner(
  runFn: () => Promise<void>,
  debounceMs?: number
): AutoRunner {
  return new AutoRunner(runFn, debounceMs);
}
