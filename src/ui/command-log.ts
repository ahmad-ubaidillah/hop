import type { Page } from 'playwright-core';

export interface CommandLogEntry {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  domSnapshot?: string;
  timestamp: number;
  duration?: number;
  args?: any[];
  yields?: any;
  error?: string;
}

export interface TestTimeline {
  featureName: string;
  scenarioName: string;
  startTime: number;
  endTime?: number;
  commands: CommandLogEntry[];
}

export class CommandLog {
  private timeline: TestTimeline | null = null;
  private currentCommandId = 0;
  private snapshotsEnabled = true;
  private page: Page | null = null;

  setPage(page: Page): void {
    this.page = page;
  }

  startTimeline(featureName: string, scenarioName: string): void {
    this.timeline = {
      featureName,
      scenarioName,
      startTime: Date.now(),
      commands: [],
    };
    this.currentCommandId = 0;
    console.log('\n📋 Command Log Started');
    console.log(`   Feature: ${featureName}`);
    console.log(`   Scenario: ${scenarioName}\n`);
  }

  logCommand(
    name: string,
    status: 'pending' | 'running' | 'passed' | 'failed',
    options: {
      args?: any[];
      yields?: any;
      message?: string;
      error?: string;
      domSnapshot?: boolean;
    } = {}
  ): string {
    if (!this.timeline) return '';

    const id = `cmd-${++this.currentCommandId}`;
    let domSnapshot: string | undefined;

    if (options.domSnapshot && this.page && this.snapshotsEnabled && status === 'running') {
      domSnapshot = this.captureDomSnapshot();
    }

    const entry: CommandLogEntry = {
      id,
      name,
      status,
      args: options.args,
      yields: options.yields,
      message: options.message,
      error: options.error,
      domSnapshot,
      timestamp: Date.now(),
    };

    this.timeline.commands.push(entry);

    this.printCommand(entry);

    return id;
  }

  private captureDomSnapshot(): string | undefined {
    if (!this.page) return undefined;
    
    try {
      return this.page.content();
    } catch {
      return undefined;
    }
  }

  private printCommand(entry: CommandLogEntry): void {
    const statusIcon = {
      pending: '⏳',
      running: '🔄',
      passed: '✅',
      failed: '❌',
    }[entry.status];

    const indent = '   ';
    console.log(`${indent}${statusIcon} ${entry.name}`);

    if (entry.args && entry.args.length > 0) {
      console.log(`${indent}   Args: ${JSON.stringify(entry.args).substring(0, 100)}`);
    }

    if (entry.yields !== undefined) {
      const yieldsStr = typeof entry.yields === 'object' 
        ? JSON.stringify(entry.yields).substring(0, 50) 
        : String(entry.yields);
      console.log(`${indent}   Yields: ${yieldsStr}`);
    }

    if (entry.error) {
      console.log(`${indent}   Error: ${entry.error}`);
    }
  }

  hoverCommand(commandId: string): void {
    if (!this.timeline) return;

    const command = this.timeline.commands.find(c => c.id === commandId || c.id.endsWith(commandId));
    if (!command) {
      console.log(`   Command not found: ${commandId}`);
      return;
    }

    console.log('\n🔍 Time Travel to Command:', command.name);
    console.log('─────────────────────────────────────────');
    console.log(`   ID: ${command.id}`);
    console.log(`   Status: ${command.status}`);
    console.log(`   Timestamp: ${new Date(command.timestamp).toISOString()}`);

    if (command.args) {
      console.log(`   Arguments: ${JSON.stringify(command.args, null, 2)}`);
    }

    if (command.yields !== undefined) {
      console.log(`   Yielded: ${JSON.stringify(command.yields, null, 2)}`);
    }

    if (command.domSnapshot) {
      console.log(`   DOM: ${command.domSnapshot.substring(0, 200)}...`);
    }

    if (command.error) {
      console.log(`   Error: ${command.error}`);
    }

    console.log('─────────────────────────────────────────\n');
  }

  getSnapshotAt(commandId: string): string | undefined {
    if (!this.timeline) return undefined;

    const command = this.timeline.commands.find(c => c.id === commandId || c.id.endsWith(commandId));
    return command?.domSnapshot;
  }

  endTimeline(): void {
    if (!this.timeline) return;

    this.timeline.endTime = Date.now();
    const duration = this.timeline.endTime - this.timeline.startTime;

    console.log('\n📋 Command Log Ended');
    console.log(`   Total commands: ${this.timeline.commands.length}`);
    console.log(`   Duration: ${duration}ms\n`);

    this.printSummary();
  }

  private printSummary(): void {
    if (!this.timeline) return;

    const passed = this.timeline.commands.filter(c => c.status === 'passed').length;
    const failed = this.timeline.commands.filter(c => c.status === 'failed').length;
    const pending = this.timeline.commands.filter(c => c.status === 'pending').length;
    const running = this.timeline.commands.filter(c => c.status === 'running').length;

    console.log('═══════════════════════════════════════════════════');
    console.log('                  COMMAND SUMMARY');
    console.log('═══════════════════════════════════════════════════');
    console.log(`   ✅ Passed:  ${passed}`);
    console.log(`   ❌ Failed:  ${failed}`);
    console.log(`   ⏳ Pending:  ${pending}`);
    console.log(`   🔄 Running:  ${running}`);
    console.log('═══════════════════════════════════════════════════\n');

    if (failed > 0) {
      console.log('❌ Failed Commands:');
      for (const cmd of this.timeline.commands.filter(c => c.status === 'failed')) {
        console.log(`   ${cmd.id}: ${cmd.name}`);
        if (cmd.error) console.log(`      Error: ${cmd.error}`);
      }
      console.log('');
    }
  }

  getTimeline(): TestTimeline | null {
    return this.timeline;
  }

  exportTimeline(): string {
    return JSON.stringify(this.timeline, null, 2);
  }

  setSnapshotsEnabled(enabled: boolean): void {
    this.snapshotsEnabled = enabled;
  }
}

export function createCommandLog(): CommandLog {
  return new CommandLog();
}