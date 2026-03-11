import type { Logger } from '../types/index.js';

export class BufferedLogger implements Logger {
  private logs: string[] = [];

  log(...args: any[]): void {
    this.logs.push(`📝 ${args.join(' ')}`);
  }

  error(...args: any[]): void {
    this.logs.push(`❌ ${args.join(' ')}`);
  }

  warn(...args: any[]): void {
    this.logs.push(`⚠️  ${args.join(' ')}`);
  }

  getLogs(): string[] {
    return this.logs;
  }

  clear(): void {
    this.logs = [];
  }

  print(): void {
    for (const log of this.logs) {
      console.log(log);
    }
  }
}
