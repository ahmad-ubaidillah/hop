export class SpiesStubsManager {
    spies = new Map();
    stubs = new Map();
    clock = null;
    page = null;
    setPage(page) {
        this.page = page;
    }
    spy(object, methodName) {
        const originalFn = object[methodName];
        const spy = {
            name: methodName,
            calls: [],
            originalFn,
            wrappedFn: originalFn,
            callCount: 0,
        };
        const wrapped = function (...args) {
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
    stub(object, methodName, returnValue) {
        const stub = {
            name: methodName,
            calls: [],
            returnValue,
            isFakeFunction: true,
        };
        const wrapped = function (...args) {
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
    spyOn(windowObj, methodName) {
        return this.spy(windowObj, methodName);
    }
    stubOn(windowObj, methodName, returnValue) {
        return this.stub(windowObj, methodName, returnValue);
    }
    restoreAll() {
        for (const [key, spy] of this.spies) {
            if (spy.originalFn) {
                const [objName, methodName] = key.split('.');
                const obj = objName === 'obj' ? window : window[objName];
                if (obj && typeof obj[methodName] === 'function') {
                    obj[methodName] = spy.originalFn;
                }
            }
        }
        this.spies.clear();
        this.stubs.clear();
    }
    restore(spyOrStubName) {
        const spy = this.spies.get(spyOrStubName);
        if (spy?.originalFn) {
            const [objName, methodName] = spyOrStubName.split('.');
            const obj = objName === 'obj' ? window : window[objName];
            if (obj) {
                obj[methodName] = spy.originalFn;
            }
        }
        this.spies.delete(spyOrStubName);
        this.stubs.delete(spyOrStubName);
    }
    getSpyCalls(spyName) {
        return this.spies.get(spyName)?.calls || [];
    }
    getStubCalls(stubName) {
        return this.stubs.get(stubName)?.calls || [];
    }
    wasCalled(spyOrStubName) {
        const spy = this.spies.get(spyOrStubName);
        const stub = this.stubs.get(spyOrStubName);
        return (spy?.callCount || 0) > 0 || (stub?.calls.length || 0) > 0;
    }
    wasCalledTimes(spyOrStubName, times) {
        const spy = this.spies.get(spyOrStubName);
        const stub = this.stubs.get(spyOrStubName);
        return (spy?.callCount || stub?.calls.length || 0) === times;
    }
    getCallCount(spyOrStubName) {
        const spy = this.spies.get(spyOrStubName);
        const stub = this.stubs.get(spyOrStubName);
        return spy?.callCount || stub?.calls.length || 0;
    }
    printSummary() {
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
    page;
    clock = null;
    originalSetTimeout = null;
    originalSetInterval = null;
    originalDate = null;
    originalPerformanceNow = null;
    constructor(page) {
        this.page = page;
    }
    clock() {
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
    tick(ms) {
        if (this.clock) {
            this.clock.now += ms;
            console.log(`   ⏰ Clock advanced ${ms}ms to ${new Date(this.clock.now).toISOString()}`);
        }
    }
    setSystemTime(time) {
        const newTime = typeof time === 'number' ? time : time.getTime();
        if (this.clock) {
            this.clock.now = newTime;
            console.log(`   ⏰ System time set to ${new Date(newTime).toISOString()}`);
        }
    }
    restore() {
        this.clock = null;
        console.log('   ⏰ Clock restored to real time');
    }
    getDate() {
        return this.clock ? new Date(this.clock.now) : new Date();
    }
}
export function createSpiesStubsManager() {
    return new SpiesStubsManager();
}
export function createClockControl(page) {
    return new ClockControl(page);
}
