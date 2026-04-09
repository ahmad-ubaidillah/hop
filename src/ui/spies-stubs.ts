import type { Page } from 'playwright-core';

export interface SpyCall {
  id: string;
  name: string;
  args: any[];
  returnValue?: any;
  timestamp: number;
  thisArg?: any;
}

export interface Spy {
  name: string;
  calls: SpyCall[];
  wrappedFn?: Function;
  originalFn?: Function;
  callCount: number;
}

export interface Stub {
  name: string;
  calls: SpyCall[];
  returnValue: any;
  behavior?: (args: any[]) => any;
  isFakeFunction: boolean;
}

export interface Clock {
  id: number;
  now: number;
  logs: { method: string; args: any[]; timestamp: number }[];
  timers: Map<string, any>;
  intervals: Map<string, any>;
}

export class SpiesStubsManager {
  private spies: Map<string, Spy> = new Map();
  private stubs: Map<string, Stub> = new Map();
  private clock: Clock | null = null;
  private page: Page | null = null;

  setPage(page: Page): void {
    this.page = page;
  }

  spy(object: any, methodName: string): Spy {
    const originalFn = object[methodName];
    const spy: Spy = {
      name: methodName,
      calls: [],
      originalFn,
      wrappedFn: originalFn,
      callCount: 0,
    };

    const wrapped = function (this: any, ...args: any[]) {
      spy.callCount++;
      spy.calls.push({
        id: `spy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: methodName,
        args,
        thisArg: this,
        timestamp: Date.now(),
      });

      return originalFn.apply(this, args);
    };

    object[methodName] = wrapped;
    this.spies.set(`${object.constructor?.name || 'obj'}.${methodName}`, spy);

    return spy;
  }

  stub(object: any, methodName: string, returnValue?: any): Stub {
    const stub: Stub = {
      name: methodName,
      calls: [],
      returnValue,
      isFakeFunction: true,
    };

    const wrapped = function (this: any, ...args: any[]) {
      stub.calls.push({
        id: `stub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: methodName,
        args,
        thisArg: this,
        timestamp: Date.now(),
        returnValue: stub.returnValue,
      });

      if (stub.behavior) {
        return stub.behavior(args);
      }

      return stub.returnValue;
    };

    object[methodName] = wrapped;
    this.stubs.set(`${object.constructor?.name || 'obj'}.${methodName}`, stub);

    return stub;
  }

  spyOn(windowObj: any, methodName: string): Spy {
    return this.spy(windowObj, methodName);
  }

  stubOn(windowObj: any, methodName: string, returnValue?: any): Stub {
    return this.stub(windowObj, methodName, returnValue);
  }

  restoreAll(): void {
    for (const [key, spy] of this.spies) {
      if (spy.originalFn) {
        const [objName, methodName] = key.split('.');
        const obj = objName === 'obj' ? window : (window as any)[objName];
        if (obj && typeof obj[methodName] === 'function') {
          obj[methodName] = spy.originalFn;
        }
      }
    }
    this.spies.clear();
    this.stubs.clear();
  }

  restore(spyOrStubName: string): void {
    const spy = this.spies.get(spyOrStubName);
    if (spy?.originalFn) {
      const [objName, methodName] = spyOrStubName.split('.');
      const obj = objName === 'obj' ? window : (window as any)[objName];
      if (obj) {
        obj[methodName] = spy.originalFn;
      }
    }
    this.spies.delete(spyOrStubName);
    this.stubs.delete(spyOrStubName);
  }

  getSpyCalls(spyName: string): SpyCall[] {
    return this.spies.get(spyName)?.calls || [];
  }

  getStubCalls(stubName: string): SpyCall[] {
    return this.stubs.get(stubName)?.calls || [];
  }

  wasCalled(spyOrStubName: string): boolean {
    const spy = this.spies.get(spyOrStubName);
    const stub = this.stubs.get(spyOrStubName);
    return (spy?.callCount || 0) > 0 || (stub?.calls.length || 0) > 0;
  }

  wasCalledTimes(spyOrStubName: string, times: number): boolean {
    const spy = this.spies.get(spyOrStubName);
    const stub = this.stubs.get(spyOrStubName);
    return (spy?.callCount || stub?.calls.length || 0) === times;
  }

  getCallCount(spyOrStubName: string): number {
    const spy = this.spies.get(spyOrStubName);
    const stub = this.stubs.get(spyOrStubName);
    return spy?.callCount || stub?.calls.length || 0;
  }

  printSummary(): void {
    console.log('\n📊 Spies & Stubs Summary');
    console.log('═══════════════════════════════');

    if (this.spies.size > 0) {
      console.log('\n🔍 Spies:');
      for (const [name, spy] of this.spies) {
        console.log(`   ${name}: called ${spy.callCount} times`);
      }
    }

    if (this.stubs.size > 0) {
      console.log('\n🎭 Stubs:');
      for (const [name, stub] of this.stubs) {
        console.log(`   ${name}: called ${stub.calls.length} times, returns ${JSON.stringify(stub.returnValue)}`);
      }
    }

    if (this.spies.size === 0 && this.stubs.size === 0) {
      console.log('   (none)');
    }

    console.log('═══════════════════════════════\n');
  }
}

export class ClockControl {
  private clock: Clock | null = null;
  private originalSetTimeout: any = null;
  private originalSetInterval: any = null;
  private originalDate: any = null;
  private originalPerformanceNow: any = null;

  constructor(private page: Page | null) {}

  clock(): Clock {
    if (!this.clock) {
      this.clock = {
        id: Date.now(),
        now: Date.now(),
        logs: [],
        timers: new Map(),
        intervals: new Map(),
      };
    }
    return this.clock;
  }

  tick(ms: number): void {
    if (this.clock) {
      this.clock.now += ms;
      console.log(`   ⏰ Clock advanced ${ms}ms to ${new Date(this.clock.now).toISOString()}`);
    }
  }

  setSystemTime(time: number | Date): void {
    const newTime = typeof time === 'number' ? time : time.getTime();
    if (this.clock) {
      this.clock.now = newTime;
      console.log(`   ⏰ System time set to ${new Date(newTime).toISOString()}`);
    }
  }

  restore(): void {
    this.clock = null;
    console.log('   ⏰ Clock restored to real time');
  }

  getDate(): Date {
    return this.clock ? new Date(this.clock.now) : new Date();
  }
}

export function createSpiesStubsManager(): SpiesStubsManager {
  return new SpiesStubsManager();
}

export function createClockControl(page: Page | null): ClockControl {
  return new ClockControl(page);
}