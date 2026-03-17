/**
 * Structured Logger for Hop Framework
 * Provides configurable log levels, JSON output, and log file support
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggerOptions {
  level?: LogLevel;
  output?: 'console' | 'json' | 'both';
  file?: string;
  color?: boolean;
  timestamp?: boolean;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class StructuredLogger {
  private level: LogLevel;
  private output: 'console' | 'json' | 'both';
  private file?: string;
  private color: boolean;
  private timestamp: boolean;
  private fs?: typeof import('fs');
  
  constructor(options: LoggerOptions = {}) {
    this.level = options.level || 'info';
    this.output = options.output || 'console';
    this.file = options.file;
    this.color = options.color !== false;
    this.timestamp = options.timestamp !== false;
  }
  
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }
  
  private formatMessage(level: LogLevel, message: string, context?: Record<string, any>): string {
    const timestamp = this.timestamp ? new Date().toISOString() : '';
    const levelStr = level.toUpperCase().padEnd(5);
    
    if (this.output === 'json') {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        context,
      };
      return JSON.stringify(entry);
    }
    
    // Console output
    const prefix = this.timestamp ? `[${timestamp}] ` : '';
    const levelColor = this.getLevelColor(level);
    const coloredLevel = this.color ? `${levelColor}${levelStr}\x1b[0m` : levelStr;
    
    let formatted = `${prefix}${coloredLevel} ${message}`;
    
    if (context && Object.keys(context).length > 0) {
      formatted += ` ${JSON.stringify(context)}`;
    }
    
    return formatted;
  }
  
  private getLevelColor(level: LogLevel): string {
    switch (level) {
      case 'debug': return '\x1b[36m'; // cyan
      case 'info': return '\x1b[32m';  // green
      case 'warn': return '\x1b[33m';  // yellow
      case 'error': return '\x1b[31m'; // red
      default: return '\x1b[0m';
    }
  }
  
  private writeToFile(message: string): void {
    if (!this.file) return;
    
    const fs = require('fs');
    
    try {
      fs.appendFileSync(this.file, message + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }
  
  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(level)) return;
    
    const formatted = this.formatMessage(level, message, context);
    
    if (this.output === 'console' || this.output === 'both') {
      if (level === 'error') {
        console.error(formatted);
      } else if (level === 'warn') {
        console.warn(formatted);
      } else {
        console.log(formatted);
      }
    }
    
    if (this.file && (this.output === 'json' || this.output === 'both')) {
      this.writeToFile(formatted);
    }
  }
  
  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }
  
  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }
  
  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }
  
  error(message: string, context?: Record<string, any>): void {
    this.log('error', message, context);
  }
  
  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }
  
  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return this.level;
  }
  
  /**
   * Create a child logger with additional context
   */
  child(context: Record<string, any>): StructuredLogger {
    const childLogger = new StructuredLogger({
      level: this.level,
      output: this.output,
      file: this.file,
      color: this.color,
      timestamp: this.timestamp,
    });
    
    const originalLog = childLogger.log.bind(childLogger);
    childLogger.log = (level: LogLevel, message: string, additionalContext?: Record<string, any>) => {
      originalLog(level, message, { ...context, ...additionalContext });
    };
    
    return childLogger;
  }
}

// Default logger instance
let defaultLogger: StructuredLogger | null = null;

export function getLogger(options?: LoggerOptions): StructuredLogger {
  if (!defaultLogger) {
    defaultLogger = new StructuredLogger(options);
  }
  return defaultLogger;
}

export function setLogger(logger: StructuredLogger): void {
  defaultLogger = logger;
}
