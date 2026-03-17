/**
 * Process Manager - Handles graceful shutdown and signal handling
 */

export type CleanupCallback = () => Promise<void> | void;

export interface ProcessManagerOptions {
  gracefulShutdownTimeout?: number;
  onShutdown?: (reason: 'SIGINT' | 'SIGTERM' | 'UNCAUGHT_ERROR' | 'EXIT') => void;
}

export class ProcessManager {
  private static instance: ProcessManager;
  private cleanupCallbacks: CleanupCallback[] = [];
  private isShuttingDown = false;
  private gracefulShutdownTimeout: number;
  private onShutdown?: (reason: 'SIGINT' | 'SIGTERM' | 'UNCAUGHT_ERROR' | 'EXIT') => void;
  
  private constructor(options: ProcessManagerOptions = {}) {
    this.gracefulShutdownTimeout = options.gracefulShutdownTimeout || 30000;
    this.onShutdown = options.onShutdown;
    this.setupSignalHandlers();
    this.setupErrorHandlers();
  }
  
  static getInstance(options?: ProcessManagerOptions): ProcessManager {
    if (!ProcessManager.instance) {
      ProcessManager.instance = new ProcessManager(options);
    }
    return ProcessManager.instance;
  }
  
  private setupSignalHandlers(): void {
    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
      console.log('\n⚠️  Received SIGINT (Ctrl+C) - Starting graceful shutdown...');
      this.shutdown('SIGINT');
    });
    
    // Handle SIGTERM (docker, k8s)
    process.on('SIGTERM', () => {
      console.log('\n⚠️  Received SIGTERM - Starting graceful shutdown...');
      this.shutdown('SIGTERM');
    });
  }
  
  private setupErrorHandlers(): void {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('\n❌ Uncaught Exception:', error.message);
      console.error(error.stack);
      this.shutdown('UNCAUGHT_ERROR');
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('\n❌ Unhandled Promise Rejection:', reason);
      this.shutdown('UNCAUGHT_ERROR');
    });
  }
  
  /**
   * Register a cleanup callback to be called during shutdown
   */
  registerCleanup(callback: CleanupCallback): void {
    this.cleanupCallbacks.push(callback);
  }
  
  /**
   * Unregister a cleanup callback
   */
  unregisterCleanup(callback: CleanupCallback): void {
    const index = this.cleanupCallbacks.indexOf(callback);
    if (index > -1) {
      this.cleanupCallbacks.splice(index, 1);
    }
  }
  
  /**
   * Perform graceful shutdown
   */
  async shutdown(reason: 'SIGINT' | 'SIGTERM' | 'UNCAUGHT_ERROR' | 'EXIT' = 'EXIT'): Promise<void> {
    if (this.isShuttingDown) {
      console.log('⚠️  Already shutting down...');
      return;
    }
    
    this.isShuttingDown = true;
    
    // Notify listeners
    if (this.onShutdown) {
      this.onShutdown(reason);
    }
    
    console.log(`\n🔄 Running ${this.cleanupCallbacks.length} cleanup handlers...`);
    
    // Run all cleanup callbacks with timeout
    const cleanupPromises = this.cleanupCallbacks.map(async (callback, index) => {
      try {
        const timeoutPromise = new Promise<void>((resolve) => 
          setTimeout(() => {
            console.log(`⚠️  Cleanup handler ${index + 1} timed out`);
            resolve();
          }, 5000)
        );
        
        const cleanupPromise = Promise.resolve(callback());
        await Promise.race([cleanupPromise, timeoutPromise]);
        console.log(`✅ Cleanup handler ${index + 1} completed`);
      } catch (error) {
        console.error(`❌ Cleanup handler ${index + 1} failed:`, error);
      }
    });
    
    await Promise.all(cleanupPromises);
    
    console.log('👋 Shutdown complete. Goodbye!');
    process.exit(reason === 'UNCAUGHT_ERROR' ? 1 : 0);
  }
  
  /**
   * Check if the process is shutting down
   */
  getIsShuttingDown(): boolean {
    return this.isShuttingDown;
  }
  
  /**
   * Force exit (for emergency situations)
   */
  forceExit(code: number = 1): void {
    console.log('🚨 Forcing immediate exit...');
    process.exit(code);
  }
}

/**
 * Create and initialize the global process manager
 */
export function initProcessManager(options?: ProcessManagerOptions): ProcessManager {
  return ProcessManager.getInstance(options);
}
