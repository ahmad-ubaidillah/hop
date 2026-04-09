import type { Step, TestContext } from '../../types/index.js';
import type { StepHandler, IStepExecutor } from './types.js';
import { createSpiesStubsManager, createClockControl, SpiesStubsManager, ClockControl } from '../../ui/spies-stubs.js';

export class SpyStubHandler implements StepHandler {
  private spiesManager: SpiesStubsManager;
  private clockControl: ClockControl;

  constructor() {
    this.spiesManager = createSpiesStubsManager();
    this.clockControl = createClockControl(null);
  }

  canHandle(text: string): boolean {
    return text.match(/^(Given|When|Then|And|But)?\s*spy on/i) !== null ||
           text.match(/^(Given|When|Then|And|But)?\s*stub/i) !== null ||
           text.match(/^(Given|When|Then|And|But)?\s*restore (spies|stubs|clock)/i) !== null ||
           text.match(/^(Given|When|Then|And|But)?\s*clock/i) !== null ||
           text.match(/^(Given|When|Then|And|But)?\s*verify spy/i) !== null ||
           text.match(/^(Given|When|Then|And|But)?\s*verify stub/i) !== null ||
           text.match(/^(Given|When|Then|And|But)?\s*was called/i) !== null;
  }

  async handle(text: string, step: Step, context: TestContext, executor: IStepExecutor): Promise<void> {
    const spyOnMatch = text.match(/^.*spy on ['"]?(\w+)['"]?\s*(?:method)?\s*['"]?([^'""]+)['"]?/i);
    const stubMatch = text.match(/^.*stub ['"]?(\w+)['"]?\s*(?:method)?\s*['"]?([^'""]+)['"]?/i);
    const restoreMatch = text.match(/^.*restore (spies|stubs|clock)/i);
    const clockMatch = text.match(/^.*(clock|tick|set time)/i);
    const verifySpyMatch = text.match(/^.*verify spy ['"]?([^'""]+)['"]? called/i);
    const verifyStubMatch = text.match(/^.*verify stub ['"]?([^'""]+)['"]? called/i);
    const wasCalledMatch = text.match(/^.*was called/i);

    if (spyOnMatch || stubMatch) {
      const pw = executor.getPlaywright(context);
      const page = pw?.getPage();
      
      if (!page) throw new Error('Browser not opened. Use "user opens browser" first.');
      
      this.spiesManager.setPage(page);
      
      if (spyOnMatch) {
        const [, objName, methodName] = spyOnMatch;
        this.spiesManager.spyOn(window, methodName);
        console.log(`🔍 Spy created on window.${methodName}`);
        context.variables['__spies_manager'] = this.spiesManager;
        return;
      }
      
      if (stubMatch) {
        const [, objName, methodName] = stubMatch;
        const returnValueMatch = text.match(/returns? ['"]([^'"]+)['"]/i);
        const returnValue = returnValueMatch ? returnValueMatch[1] : 'stubbed';
        this.spiesManager.stubOn(window, methodName, returnValue);
        console.log(`🎭 Stub created on window.${methodName}, returns: ${returnValue}`);
        context.variables['__spies_manager'] = this.spiesManager;
        return;
      }
    }

    if (restoreMatch) {
      const type = restoreMatch[1].toLowerCase();
      
      if (type === 'spies' || type === 'stubs') {
        this.spiesManager.restoreAll();
        console.log('🔧 All spies/stubs restored');
      } else if (type === 'clock') {
        this.clockControl.restore();
        console.log('⏰ Clock restored');
      }
      return;
    }

    if (clockMatch) {
      const tickMatch = text.match(/tick (\d+)/i);
      const setTimeMatch = text.match(/set time ([\d-]+(?:T[\d:]+)?)/i);
      
      if (tickMatch) {
        this.clockControl.tick(parseInt(tickMatch[1]));
      } else if (setTimeMatch) {
        const time = new Date(setTimeMatch[1]);
        this.clockControl.setSystemTime(time);
      } else {
        this.clockControl.clock();
        console.log('⏰ Clock started (virtual time)');
      }
      
      context.variables['__clock_control'] = this.clockControl;
      return;
    }

    if (verifySpyMatch || verifyStubMatch) {
      const name = (verifySpyMatch || verifyStubMatch)![1];
      const timesMatch = text.match(/(\d+)\s*times?/i);
      
      const manager = context.variables['__spies_manager'] as SpiesStubsManager;
      if (!manager) throw new Error('No spy/stub found. Create spy/stub first.');
      
      if (timesMatch) {
        const expected = parseInt(timesMatch[1]);
        const actual = manager.getCallCount(name);
        if (actual !== expected) {
          throw new Error(`Expected ${name} to be called ${expected} times, but was called ${actual} times`);
        }
        console.log(`✅ Verified ${name} was called ${expected} times`);
      } else {
        if (!manager.wasCalled(name)) {
          throw new Error(`Expected ${name} to be called, but it was not called`);
        }
        console.log(`✅ Verified ${name} was called ${manager.getCallCount(name)} times`);
      }
      return;
    }

    if (wasCalledMatch) {
      const nameMatch = text.match(/['"]?(\w+\.\w+)['"]?/i);
      if (nameMatch) {
        const name = nameMatch[1];
        const manager = context.variables['__spies_manager'] as SpiesStubsManager;
        const callCount = manager?.getCallCount(name) || 0;
        console.log(`   ${name} was called ${callCount} times`);
      }
    }
  }
}