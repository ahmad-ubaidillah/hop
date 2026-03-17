/**
 * Snapshot Testing for Hop Framework
 * Priority 15: State comparison and snapshots
 */

import * as fs from 'fs';
import * as path from 'path';

export interface Snapshot {
  name: string;
  value: any;
  timestamp: number;
}

export interface SnapshotOptions {
  snapshotsDir?: string;
  update?: boolean;
}

/**
 * Snapshot Tester
 */
export class SnapshotTester {
  private snapshots: Map<string, Snapshot> = new Map();
  private snapshotsDir: string;
  private update: boolean = false;

  constructor(options: SnapshotOptions = {}) {
    this.snapshotsDir = options.snapshotsDir || './snapshots';
    this.update = options.update || false;

    if (!fs.existsSync(this.snapshotsDir)) {
      fs.mkdirSync(this.snapshotsDir, { recursive: true });
    }

    this.loadSnapshots();
  }

  /**
   * Load snapshots from disk
   */
  private loadSnapshots(): void {
    const files = fs.readdirSync(this.snapshotsDir);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(this.snapshotsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        
        this.snapshots.set(data.name, {
          name: data.name,
          value: data.value,
          timestamp: data.timestamp,
        });
      }
    }
  }

  /**
   * Match snapshot
   */
  match(name: string, value: any): { matched: boolean; diff?: any } {
    const existing = this.snapshots.get(name);
    
    if (!existing) {
      // No snapshot exists - create it
      if (this.update) {
        this.saveSnapshot(name, value);
        return { matched: true };
      }
      return { matched: false };
    }

    // Compare
    const serialized = JSON.stringify(value);
    const existingSerialized = JSON.stringify(existing.value);
    
    if (serialized === existingSerialized) {
      return { matched: true };
    }

    // Not matched - show diff
    return {
      matched: false,
      diff: this.getDiff(existing.value, value),
    };
  }

  /**
   * Get diff between two values
   */
  private getDiff(oldValue: any, newValue: any): any {
    const diff: any = {
      old: oldValue,
      new: newValue,
    };

    // Simple diff - in production use deep-diff
    if (typeof oldValue !== typeof newValue) {
      diff.typeChanged = true;
    } else if (Array.isArray(oldValue) && Array.isArray(newValue)) {
      diff.added = newValue.filter((v: any) => !oldValue.includes(v));
      diff.removed = oldValue.filter((v: any) => !newValue.includes(v));
    } else if (typeof oldValue === 'object' && typeof newValue === 'object') {
      const oldKeys = Object.keys(oldValue);
      const newKeys = Object.keys(newValue);
      
      diff.added = newKeys.filter(k => !oldKeys.includes(k));
      diff.removed = oldKeys.filter(k => !newKeys.includes(k));
      diff.modified = newKeys.filter(k => oldKeys.includes(k) && oldValue[k] !== newValue[k]);
    }

    return diff;
  }

  /**
   * Save snapshot
   */
  saveSnapshot(name: string, value: any): void {
    const snapshot: Snapshot = {
      name,
      value,
      timestamp: Date.now(),
    };

    this.snapshots.set(name, snapshot);

    const filePath = path.join(this.snapshotsDir, `${name}.json`);
    fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2));
  }

  /**
   * Update snapshot
   */
  updateSnapshot(name: string, value: any): void {
    this.saveSnapshot(name, value);
  }

  /**
   * Delete snapshot
   */
  deleteSnapshot(name: string): void {
    this.snapshots.delete(name);
    
    const filePath = path.join(this.snapshotsDir, `${name}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  /**
   * Clear all snapshots
   */
  clear(): void {
    const files = fs.readdirSync(this.snapshotsDir);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        fs.unlinkSync(path.join(this.snapshotsDir, file));
      }
    }
    
    this.snapshots.clear();
  }

  /**
   * Get snapshot
   */
  get(name: string): Snapshot | undefined {
    return this.snapshots.get(name);
  }

  /**
   * List all snapshots
   */
  list(): Snapshot[] {
    return Array.from(this.snapshots.values());
  }
}

/**
 * Create snapshot tester
 */
export function createSnapshotTester(options?: SnapshotOptions): SnapshotTester {
  return new SnapshotTester(options);
}

/**
 * Snapshot decorator
 */
export function snapshot(name: string) {
  return function (target: any, propertyKey: string) {
    Object.defineProperty(target, propertyKey, {
      get: function () {
        const tester = new SnapshotTester();
        return tester.get(name)?.value;
      },
    });
  };
}
