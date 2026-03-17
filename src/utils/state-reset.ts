/**
 * State Management - Reset Between Runs
 * Handles state cleanup and reset for test isolation
 */

export interface StateSnapshot {
  timestamp: number;
  data: Record<string, unknown>;
}

export interface StateManagerOptions {
  enableSnapshot?: boolean;
  maxSnapshots?: number;
  storagePath?: string;
}

export class StateReset {
  private snapshots: StateSnapshot[] = [];
  private currentState: Record<string, unknown> = {};
  private options: Required<StateManagerOptions>;

  constructor(options: StateManagerOptions = {}) {
    this.options = {
      enableSnapshot: options.enableSnapshot ?? true,
      maxSnapshots: options.maxSnapshots ?? 10,
      storagePath: options.storagePath ?? '.hop/state'
    };
  }

  /**
   * Save current state snapshot
   */
  saveSnapshot(name?: string): string {
    const snapshot: StateSnapshot = {
      timestamp: Date.now(),
      data: JSON.parse(JSON.stringify(this.currentState))
    };

    const snapshotName = name || `snapshot_${snapshot.timestamp}`;
    
    if (this.snapshots.length >= this.options.maxSnapshots) {
      this.snapshots.shift();
    }
    
    this.snapshots.push(snapshot);
    
    return snapshotName;
  }

  /**
   * Restore state from snapshot
   */
  restoreSnapshot(name: string): void {
    const snapshot = this.snapshots.find(s => 
      `snapshot_${s.timestamp}` === name || 
      Object.keys(s.data).includes(name)
    );

    if (!snapshot) {
      throw new Error(`Snapshot "${name}" not found`);
    }

    this.currentState = JSON.parse(JSON.stringify(snapshot.data));
  }

  /**
   * Get current state
   */
  getState(): Record<string, unknown> {
    return { ...this.currentState };
  }

  /**
   * Set state value
   */
  setState(key: string, value: unknown): void {
    this.currentState[key] = value;
  }

  /**
   * Get state value
   */
  getStateValue<T = unknown>(key: string): T | undefined {
    return this.currentState[key] as T | undefined;
  }

  /**
   * Clear all state
   */
  clear(): void {
    this.currentState = {};
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.clear();
    this.snapshots = [];
  }

  /**
   * Compare two states
   */
  compareStates(state1: Record<string, unknown>, state2: Record<string, unknown>): StateDiff {
    const diff: StateDiff = {
      added: {},
      removed: {},
      changed: {}
    };

    const allKeys = new Set([...Object.keys(state1), ...Object.keys(state2)]);

    for (const key of allKeys) {
      if (!(key in state1)) {
        diff.added[key] = state2[key];
      } else if (!(key in state2)) {
        diff.removed[key] = state1[key];
      } else if (JSON.stringify(state1[key]) !== JSON.stringify(state2[key])) {
        diff.changed[key] = {
          old: state1[key],
          new: state2[key]
        };
      }
    }

    return diff;
  }

  /**
   * Merge states
   */
  mergeStates(...states: Record<string, unknown>[]): Record<string, unknown> {
    const merged: Record<string, unknown> = {};

    for (const state of states) {
      for (const [key, value] of Object.entries(state)) {
        merged[key] = value;
      }
    }

    return merged;
  }

  /**
   * Get state statistics
   */
  getStats(): StateStats {
    return {
      snapshotCount: this.snapshots.length,
      stateKeys: Object.keys(this.currentState).length,
      totalSize: JSON.stringify(this.currentState).length
    };
  }
}

export interface StateDiff {
  added: Record<string, unknown>;
  removed: Record<string, unknown>;
  changed: Record<string, { old: unknown; new: unknown }>;
}

export interface StateStats {
  snapshotCount: number;
  stateKeys: number;
  totalSize: number;
}

/**
 * Test execution state context
 */
export class TestStateContext {
  private stateManager: StateReset;
  private initialState: Record<string, unknown> = {};

  constructor(options?: StateManagerOptions) {
    this.stateManager = new StateReset(options);
  }

  /**
   * Initialize state for test
   */
  async initialize(): Promise<void> {
    this.initialState = this.stateManager.getState();
  }

  /**
   * Reset state to initial
   */
  async reset(): Promise<void> {
    this.stateManager.clear();
    this.stateManager.setState('_initial', this.initialState);
  }

  /**
   * Get current context state
   */
  get context(): Record<string, unknown> {
    return this.stateManager.getState();
  }

  /**
   * Set value in context
   */
  set(key: string, value: unknown): void {
    this.stateManager.setState(key, value);
  }

  /**
   * Get value from context
   */
  get<T = unknown>(key: string): T | undefined {
    return this.stateManager.getStateValue<T>(key);
  }

  /**
   * Cleanup after test
   */
  async cleanup(): Promise<void> {
    // Save final state if needed
    this.stateManager.saveSnapshot('final');
  }
}
