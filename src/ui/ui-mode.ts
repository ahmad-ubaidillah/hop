import { createInterface } from 'readline';
import { existsSync, watch } from 'fs';
import { join, dirname } from 'path';
import { spawn, type ChildProcess } from 'child_process';
import type { TestContext, Logger } from '../types/index.js';

export interface UIModeOptions {
  watch?: boolean;
  port?: number;
  headless?: boolean;
}

export interface TestSession {
  id: string;
  startTime: number;
  status: 'running' | 'passed' | 'failed' | 'skipped';
  feature?: string;
  scenario?: string;
  steps: string[];
  currentStep?: string;
  error?: string;
}

export interface WatchEvent {
  type: 'change' | 'add' | 'unlink';
  path: string;
}

export class UIMode {
  private sessions: Map<string, TestSession> = new Map();
  private watchers: Map<string, any> = new Map();
  private isRunning = false;
  private rl: ReturnType<typeof createInterface> | null = null;
  private options: UIModeOptions;
  private logger: Logger;

  constructor(options: UIModeOptions = {}, logger: Logger = console) {
    this.options = { watch: true, port: 5173, headless: false, ...options };
    this.logger = logger;
  }

  async start(): Promise<void> {
    this.isRunning = true;
    this.printWelcome();
    this.printHelp();

    this.rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    this.rl.question('> ', async (cmd) => {
      await this.handleCommand(cmd.trim());
      if (this.isRunning) {
        this.rl?.question('> ', async (nextCmd) => {
          await this.handleCommand(nextCmd.trim());
          if (this.isRunning) this.continueInput();
        });
      }
    });
  }

  private continueInput(): void {
    this.rl?.question('> ', async (cmd) => {
      await this.handleCommand(cmd.trim());
      if (this.isRunning) this.continueInput();
    });
  }

  private printWelcome(): void {
    console.log('\n🎭 Hop UI Mode');
    console.log('═══════════════════════════════════════════════');
    console.log('  Interactive test runner with watch mode');
    console.log('═══════════════════════════════════════════════\n');
  }

  private printHelp(): void {
    console.log('Commands:');
    console.log('  run [feature]    - Run tests (all or specific feature)');
    console.log('  watch             - Toggle watch mode');
    console.log('  debug             - Open browser in debug mode');
    console.log('  show [id]         - Show test details');
    console.log('  list              - List running tests');
    console.log('  stop [id]         - Stop a test');
    console.log('  clear             - Clear terminal');
    console.log('  help              - Show this help');
    console.log('  quit              - Exit UI Mode\n');
  }

  private async handleCommand(cmd: string): Promise<void> {
    const parts = cmd.split(' ');
    const command = parts[0]?.toLowerCase();
    const args = parts.slice(1);

    switch (command) {
      case 'run':
        await this.runTests(args[0]);
        break;
      case 'watch':
        this.toggleWatch(args[0]);
        break;
      case 'debug':
        await this.openDebug();
        break;
      case 'show':
        this.showTest(args[0]);
        break;
      case 'list':
        this.listTests();
        break;
      case 'stop':
        this.stopTest(args[0]);
        break;
      case 'clear':
        console.clear();
        break;
      case 'help':
        this.printHelp();
        break;
      case 'quit':
      case 'exit':
        this.stop();
        break;
      case '':
        break;
      default:
        console.log(`Unknown command: ${command}. Type 'help' for available commands.`);
    }
  }

  async runTests(featurePath?: string): Promise<void> {
    const sessionId = `test_${Date.now()}`;
    const session: TestSession = {
      id: sessionId,
      startTime: Date.now(),
      status: 'running',
      steps: [],
    };

    if (featurePath) {
      session.feature = featurePath;
    }

    this.sessions.set(sessionId, session);
    console.log(`\n▶ Running tests${featurePath ? ` (${featurePath})` : ''}... [${sessionId}]`);

    try {
      const cmd = featurePath
        ? `bun run hop test --features ${featurePath}`
        : 'bun run hop test';

      const child = spawn(cmd, { shell: true });

      child.stdout?.on('data', (data) => {
        const output = data.toString();
        this.logger.log(output);
      });

      child.stderr?.on('data', (data) => {
        const output = data.toString();
        this.logger.error(output);
      });

      child.on('close', (code) => {
        const session = this.sessions.get(sessionId);
        if (session) {
          session.status = code === 0 ? 'passed' : 'failed';
          console.log(`\n✓ Test ${sessionId} ${session.status}`);
        }
      });
    } catch (error) {
      session.status = 'failed';
      session.error = error instanceof Error ? error.message : String(error);
      console.log(`\n✗ Test failed: ${session.error}`);
    }
  }

  toggleWatch(path?: string): void {
    if (path) {
      if (this.watchers.has(path)) {
        this.watchers.get(path)?.close();
        this.watchers.delete(path);
        console.log(`⏹ Stopped watching: ${path}`);
      } else {
        this.startWatching(path);
        console.log(`👀 Watching: ${path}`);
      }
    } else {
      console.log(`Watch mode: ${this.options.watch ? 'ON' : 'OFF'}`);
    }
  }

  private startWatching(path: string): void {
    if (!existsSync(path)) {
      console.log(`Path not found: ${path}`);
      return;
    }

    const watcher = watch(path, async (eventType, filename) => {
      if (filename) {
        console.log(`\n📁 File changed: ${filename}`);
        await this.runTests(path);
      }
    });

    this.watchers.set(path, watcher);
  }

  async openDebug(): Promise<void> {
    console.log('\nDebugger opening browser...');
    const cmd = 'bun run hop test --debug --headed';
    spawn(cmd, { shell: true, stdio: 'inherit' });
  }

  showTest(id?: string): void {
    if (!id) {
      console.log('Usage: show <test-id>');
      return;
    }

    const session = this.sessions.get(id);
    if (!session) {
      console.log(`Test not found: ${id}`);
      return;
    }

    console.log(`\nTest: ${session.id}`);
    console.log(`Status: ${session.status}`);
    console.log(`Duration: ${Date.now() - session.startTime}ms`);
    if (session.feature) console.log(`Feature: ${session.feature}`);
    if (session.error) console.log(`Error: ${session.error}`);
  }

  listTests(): void {
    console.log('\nActive Tests:');
    console.log('──────────────');
    
    if (this.sessions.size === 0) {
      console.log('No active tests');
    }

    for (const [id, session] of this.sessions) {
      const duration = Date.now() - session.startTime;
      const status = session.status === 'running' ? '⏳' : session.status === 'passed' ? '✅' : '❌';
      console.log(`${status} ${id} - ${session.status} (${duration}ms)`);
    }
  }

  stopTest(id?: string): void {
    if (!id) {
      console.log('Usage: stop <test-id>');
      return;
    }

    const session = this.sessions.get(id);
    if (session) {
      session.status = 'skipped';
      console.log(`Stopped: ${id}`);
    }
  }

  stop(): void {
    this.isRunning = false;
    for (const [, watcher] of this.watchers) {
      watcher.close();
    }
    this.watchers.clear();
    this.rl?.close();
    console.log('\n👋 Goodbye!\n');
    process.exit(0);
  }
}

export function createUIMode(options?: UIModeOptions, logger?: Logger): UIMode {
  return new UIMode(options, logger);
}