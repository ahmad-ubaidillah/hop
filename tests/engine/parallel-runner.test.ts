import { describe, test, expect, beforeEach } from 'bun:test';
import { ParallelRunner, IsolatedContext } from '../../src/engine/parallel-runner';

describe('ParallelRunner', () => {
  describe('IsolatedContext', () => {
    test('should create isolated context with unique ID', () => {
      const context = new IsolatedContext('test-1');
      expect(context.getStateId()).toBe('test-1');
    });

    test('should manage variables independently', () => {
      const context = new IsolatedContext('test-1');
      context.setVariables({ name: 'John', age: 30 });
      
      const vars = context.getVariables();
      expect(vars.name).toBe('John');
      expect(vars.age).toBe(30);
    });

    test('should merge variables correctly', () => {
      const context = new IsolatedContext('test-1');
      context.setVariables({ name: 'John' });
      context.mergeVariables({ age: 30, city: 'NYC' });
      
      const vars = context.getVariables();
      expect(vars.name).toBe('John');
      expect(vars.age).toBe(30);
      expect(vars.city).toBe('NYC');
    });
  });

  describe('ParallelRunner', () => {
    let runner: ParallelRunner;

    beforeEach(() => {
      runner = new ParallelRunner({
        concurrency: 4,
        featuresPath: './features',
        stepsPath: './steps',
        env: 'test',
        verbose: false,
        debug: false,
        timeout: 30000,
        envConfig: {},
        video: false,
      });
    });

    test('should create isolated executor', () => {
      const executor = runner.createIsolatedExecutor();
      expect(executor).toBeDefined();
    });

    test('should clear state cache', () => {
      runner.clearState();
      // Should not throw
    });
  });

  describe('state isolation', () => {
    test('should keep parallel states isolated', () => {
      const context1 = new IsolatedContext('worker-1');
      const context2 = new IsolatedContext('worker-2');
      
      context1.setVariables({ shared: 'value1' });
      context2.setVariables({ shared: 'value2' });
      
      expect(context1.getVariables().shared).toBe('value1');
      expect(context2.getVariables().shared).toBe('value2');
    });
  });
});
