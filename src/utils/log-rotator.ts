/**
 * Log Rotation for Hop Framework
 * Priority 6: Log file rotation
 */

import * as fs from 'fs';
import * as path from 'path';

export interface LogRotationConfig {
  logDir: string;
  maxSize?: number; // bytes
  maxFiles?: number;
  compress?: boolean;
  dateFormat?: string;
}

export interface LogFile {
  name: string;
  path: string;
  size: number;
  created: Date;
  modified: Date;
}

/**
 * Log Rotator
 */
export class LogRotator {
  private config: LogRotationConfig;
  private currentLogPath: string;

  constructor(config: LogRotationConfig) {
    this.config = {
      maxSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
      compress: true,
      dateFormat: 'YYYY-MM-DD',
      ...config,
    };

    // Ensure log directory exists
    if (!fs.existsSync(this.config.logDir)) {
      fs.mkdirSync(this.config.logDir, { recursive: true });
    }

    this.currentLogPath = path.join(this.config.logDir, 'hop.log');
  }

  /**
   * Write to log file
   */
  write(data: string): void {
    // Check if rotation needed
    this.checkRotation();

    fs.appendFileSync(this.currentLogPath, data + '\n', { encoding: 'utf8' });
  }

  /**
   * Check if rotation is needed
   */
  private checkRotation(): void {
    if (!fs.existsSync(this.currentLogPath)) {
      return;
    }

    const stats = fs.statSync(this.currentLogPath);
    
    if (stats.size >= (this.config.maxSize || 10 * 1024 * 1024)) {
      this.rotate();
    }
  }

  /**
   * Rotate log files
   */
  private rotate(): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archiveName = `hop-${timestamp}.log`;
    const archivePath = path.join(this.config.logDir, archiveName);

    // Rename current log to archive
    fs.renameSync(this.currentLogPath, archivePath);

    // Compress if enabled
    if (this.config.compress) {
      // In production, use gzip
      console.log(`Log rotated to ${archiveName}`);
    }

    // Clean old files
    this.cleanOldFiles();
  }

  /**
   * Clean old log files
   */
  private cleanOldFiles(): void {
    const maxFiles = this.config.maxFiles || 10;
    const files = this.getLogFiles();

    if (files.length > maxFiles) {
      const toDelete = files.slice(maxFiles);
      for (const file of toDelete) {
        fs.unlinkSync(file.path);
      }
    }
  }

  /**
   * Get all log files
   */
  getLogFiles(): LogFile[] {
    const files: LogFile[] = [];
    
    if (!fs.existsSync(this.config.logDir)) {
      return files;
    }

    const dirFiles = fs.readdirSync(this.config.logDir);
    
    for (const file of dirFiles) {
      if (file.startsWith('hop-') && file.endsWith('.log')) {
        const filePath = path.join(this.config.logDir, file);
        const stats = fs.statSync(filePath);
        
        files.push({
          name: file,
          path: filePath,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
        });
      }
    }

    return files.sort((a, b) => a.modified.getTime() - b.modified.getTime());
  }

  /**
   * Get current log path
   */
  getCurrentLogPath(): string {
    return this.currentLogPath;
  }

  /**
   * Read log file
   */
  readLog(fileName?: string): string {
    const logPath = fileName 
      ? path.join(this.config.logDir, fileName)
      : this.currentLogPath;
    
    if (!fs.existsSync(logPath)) {
      return '';
    }

    return fs.readFileSync(logPath, 'utf8');
  }

  /**
   * Clear all logs
   */
  clear(): void {
    const files = this.getLogFiles();
    
    for (const file of files) {
      fs.unlinkSync(file.path);
    }

    // Create fresh log file
    fs.writeFileSync(this.currentLogPath, '', { encoding: 'utf8' });
  }

  /**
   * Get total log size
   */
  getTotalSize(): number {
    const files = this.getLogFiles();
    return files.reduce((sum, file) => sum + file.size, 0);
  }
}

/**
 * Create log rotator
 */
export function createLogRotator(config: LogRotationConfig): LogRotator {
  return new LogRotator(config);
}

/**
 * Progress Bar for Console Output
 * Priority 6
 */
export class ProgressBar {
  private total: number;
  private current: number = 0;
  private width: number = 40;
  private label: string;
  private startTime: number;

  constructor(label: string, total: number) {
    this.label = label;
    this.total = total;
    this.startTime = Date.now();
  }

  /**
   * Update progress
   */
  update(current: number): void {
    this.current = current;
    this.render();
  }

  /**
   * Increment progress
   */
  increment(): void {
    this.current++;
    this.render();
  }

  /**
   * Render progress bar
   */
  private render(): void {
    const percent = this.total > 0 ? Math.round((this.current / this.total) * 100) : 0;
    const filled = Math.round((this.current / this.total) * this.width) || 0;
    const empty = this.width - filled;
    
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    const elapsed = Date.now() - this.startTime;
    const rate = this.current > 0 ? (this.current / elapsed) * 1000 : 0;
    
    process.stdout.write(`\r${this.label}: [${bar}] ${percent}% (${this.current}/${this.total}) ${rate.toFixed(1)}/s`);
    
    if (this.current >= this.total) {
      process.stdout.write('\n');
    }
  }

  /**
   * Complete the progress bar
   */
  complete(): void {
    this.current = this.total;
    this.render();
  }
}

/**
 * Create progress bar
 */
export function createProgressBar(label: string, total: number): ProgressBar {
  return new ProgressBar(label, total);
}
