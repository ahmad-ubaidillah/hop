import readline from 'readline';
import type { Feature, Scenario, Step, TestContext } from '../types/index.js';

export interface PauseState {
  isPaused: boolean;
  currentStepIndex: number;
  stepToExecuteAfterPause: number;
}

export class TestPauseManager {
  private rl: readline.Interface;
  private isPaused = false;
  private pauseOnNextStep = false;
  private pauseOnFailure = false;
  private pauseOnStepContaining: string | null = null;
  private autoResumeDelay: number | null = null;
  private stepHistory: { step: Step; status: string; error?: string }[] = [];

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  pause(message?: string): void {
    if (this.isPaused) return;

    this.isPaused = true;
    console.log('\n⏸️  Test Paused');
    if (message) console.log(`   ${message}`);
    console.log('\nCommands:');
    console.log('   resume  - Continue running');
    console.log('   next    - Execute next step only');
    console.log('   step    - Same as next');
    console.log('   run     - Run all remaining steps without pause');
    console.log('   vars    - Show current variables');
    console.log('   history - Show step history');
    console.log('   quit    - Stop test execution');
    console.log('');
  }

  resume(): void {
    this.isPaused = false;
    console.log('\n▶️  Test Resumed\n');
  }

  async prompt(): Promise<'resume' | 'next' | 'run' | 'quit'> {
    return new Promise((resolve) => {
      this.rl.question('hop:pause> ', (answer) => {
        const cmd = answer.trim().toLowerCase();

        switch (cmd) {
          case 'resume':
          case 'r':
            this.resume();
            resolve('resume');
            break;
          case 'next':
          case 'n':
          case 'step':
          case 's':
            resolve('next');
            break;
          case 'run':
          case 'continue':
          case 'c':
            this.isPaused = false;
            resolve('run');
            break;
          case 'quit':
          case 'q':
          case 'exit':
            resolve('quit');
            break;
          case 'vars':
          case 'variables':
            console.log('   Use resume/next/run to continue');
            this.prompt().then(resolve);
            break;
          default:
            console.log('   Unknown command. Use: resume, next, run, quit');
            this.prompt().then(resolve);
        }
      });
    });
  }

  shouldPause(step: Step, error?: Error): boolean {
    if (this.pauseOnNextStep) {
      this.pauseOnNextStep = false;
      return true;
    }

    if (this.pauseOnFailure && error) {
      return true;
    }

    if (this.pauseOnStepContaining && step.text.toLowerCase().includes(this.pauseOnStepContaining.toLowerCase())) {
      return true;
    }

    return false;
  }

  requestPauseOnNextStep(): void {
    this.pauseOnNextStep = true;
  }

  setPauseOnFailure(enabled: boolean): void {
    this.pauseOnFailure = enabled;
  }

  setPauseOnStepContaining(text: string): void {
    this.pauseOnStepContaining = text;
  }

  setAutoResumeDelay(ms: number): void {
    this.autoResumeDelay = ms;
  }

  isPausedState(): boolean {
    return this.isPaused;
  }

  recordStep(step: Step, status: 'pending' | 'running' | 'passed' | 'failed', error?: string): void {
    this.stepHistory.push({ step, status, error });
  }

  showHistory(): void {
    console.log('\n📜 Step History:');
    for (let i = 0; i < this.stepHistory.length; i++) {
      const { step, status, error } = this.stepHistory[i];
      const icon = { pending: '⏳', running: '🔄', passed: '✅', failed: '❌' }[status];
      console.log(`   ${i + 1}. ${icon} ${step.keyword} ${step.text}`);
      if (error) console.log(`      Error: ${error}`);
    }
    console.log('');
  }

  close(): void {
    this.rl.close();
  }
}

export function createPauseManager(): TestPauseManager {
  return new TestPauseManager();
}

export class HotReloadWatcher {
  private watcher: any = null;
  private debounceTimer: any = null;
  private isRunning = false;
  private watchedExtensions = ['.feature', '.ts', '.js', '.json'];
  private watchedPaths: string[] = [];

  async watch(
    paths: string[],
    onChange: (changedPath: string) => void
  ): Promise<void> {
    this.watchedPaths = paths;
    const { watch } = await import('fs');

    console.log('\n🔥 Hot Reload Enabled');
    console.log(`   Watching: ${paths.join(', ')}`);

    for (const watchPath of paths) {
      try {
        watch(watchPath, { recursive: true }, (eventType, filename) => {
          if (!filename) return;

          const ext = filename.substring(filename.lastIndexOf('.'));
          if (!this.watchedExtensions.includes(ext)) return;

          if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
          }

          this.debounceTimer = setTimeout(() => {
            console.log(`\n📝 File changed: ${filename}`);
            onChange(filename);
          }, 300);
        });
      } catch (error) {
        console.warn(`   Warning: Could not watch ${watchPath}: ${error}`);
      }
    }
  }

  stop(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    console.log('\n🔥 Hot Reload Stopped\n');
  }

  setRunning(running: boolean): void {
    this.isRunning = running;
  }

  isWatching(): boolean {
    return this.isRunning;
  }
}

export function createHotReloadWatcher(): HotReloadWatcher {
  return new HotReloadWatcher();
}