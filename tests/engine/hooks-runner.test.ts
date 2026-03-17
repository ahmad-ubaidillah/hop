import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { HooksRunner, type Hooks } from '../../src/engine/hooks-runner';
import type { TestContext, Scenario, Step, TestResult } from '../../src/types';
import * as fs from 'fs';
import * as path from 'path';

describe('HooksRunner', () => {
  let runner: HooksRunner;
  const testHooksPath = path.join(process.cwd(), 'test-hooks');

  afterEach(() => {
    // Clean up test hooks directory
    if (fs.existsSync(testHooksPath)) {
      fs.rmSync(testHooksPath, { recursive: true, force: true });
    }
  });

  describe('constructor', () => {
    test('should create hooks runner with default path', () => {
      runner = new HooksRunner();
      expect(runner).toBeDefined();
    });

    test('should create hooks runner with custom path', () => {
      runner = new HooksRunner('./custom-hooks');
      expect(runner).toBeDefined();
    });
  });

  describe('hook execution', () => {
    test('should execute beforeAll hook', async () => {
      let beforeAllCalled = false;
      
      const mockHooks: Hooks = {
        beforeAll: async () => {
          beforeAllCalled = true;
        },
      };
      
      runner = new HooksRunner();
      // Manually set hooks for testing
      (runner as any).hooks = mockHooks;
      
      await runner.beforeAll();
      
      expect(beforeAllCalled).toBe(true);
    });

    test('should not fail when beforeAll is not defined', async () => {
      runner = new HooksRunner();
      (runner as any).hooks = {};
      
      // Should not throw
      await runner.beforeAll();
    });

    test('should execute afterAll hook', async () => {
      let afterAllCalled = false;
      
      const mockHooks: Hooks = {
        afterAll: async () => {
          afterAllCalled = true;
        },
      };
      
      runner = new HooksRunner();
      (runner as any).hooks = mockHooks;
      
      await runner.afterAll();
      
      expect(afterAllCalled).toBe(true);
    });

    test('should not fail when afterAll is not defined', async () => {
      runner = new HooksRunner();
      (runner as any).hooks = {};
      
      await runner.afterAll();
    });

    test('should execute beforeScenario hook', async () => {
      let beforeScenarioCalled = false;
      let receivedScenario: Scenario | undefined;
      
      const mockScenario: Scenario = {
        name: 'Test Scenario',
        steps: [],
        tags: ['@test'],
      };
      
      const mockContext: TestContext = {
        baseUrl: '',
        path: '',
        method: 'GET',
        headers: {},
        queryParams: {},
        body: null,
        variables: {},
        read: async () => ({}),
        cookies: {},
        logger: console,
      };
      
      const mockHooks: Hooks = {
        beforeScenario: async (scenario, context) => {
          beforeScenarioCalled = true;
          receivedScenario = scenario;
        },
      };
      
      runner = new HooksRunner();
      (runner as any).hooks = mockHooks;
      
      await runner.beforeScenario(mockScenario, mockContext);
      
      expect(beforeScenarioCalled).toBe(true);
      expect(receivedScenario?.name).toBe('Test Scenario');
    });

    test('should execute afterScenario hook', async () => {
      let afterScenarioCalled = false;
      let receivedResult: TestResult | undefined;
      
      const mockScenario: Scenario = {
        name: 'Test Scenario',
        steps: [],
        tags: ['@test'],
      };
      
      const mockContext: TestContext = {
        baseUrl: '',
        path: '',
        method: 'GET',
        headers: {},
        queryParams: {},
        body: null,
        variables: {},
        read: async () => ({}),
        cookies: {},
        logger: console,
      };
      
      const mockResult: TestResult = {
        featureName: 'Test Feature',
        scenarioName: 'Test Scenario',
        status: 'passed',
        duration: 1000,
        steps: [],
        tags: [],
      };
      
      const mockHooks: Hooks = {
        afterScenario: async (scenario, context, result) => {
          afterScenarioCalled = true;
          receivedResult = result;
        },
      };
      
      runner = new HooksRunner();
      (runner as any).hooks = mockHooks;
      
      await runner.afterScenario(mockScenario, mockContext, mockResult);
      
      expect(afterScenarioCalled).toBe(true);
      expect(receivedResult?.status).toBe('passed');
    });

    test('should execute beforeStep hook', async () => {
      let beforeStepCalled = false;
      let receivedStep: Step | undefined;
      
      const mockStep: Step = {
        keyword: 'Given',
        text: 'the user is on the login page',
        line: 1,
      };
      
      const mockContext: TestContext = {
        baseUrl: '',
        path: '',
        method: 'GET',
        headers: {},
        queryParams: {},
        body: null,
        variables: {},
        read: async () => ({}),
        cookies: {},
        logger: console,
      };
      
      const mockHooks: Hooks = {
        beforeStep: async (step, context) => {
          beforeStepCalled = true;
          receivedStep = step;
        },
      };
      
      runner = new HooksRunner();
      (runner as any).hooks = mockHooks;
      
      await runner.beforeStep(mockStep, mockContext);
      
      expect(beforeStepCalled).toBe(true);
      expect(receivedStep?.text).toBe('the user is on the login page');
    });

    test('should execute afterStep hook', async () => {
      let afterStepCalled = false;
      let stepResult: any;
      
      const mockStep: Step = {
        keyword: 'Given',
        text: 'the user is on the login page',
        line: 1,
      };
      
      const mockContext: TestContext = {
        baseUrl: '',
        path: '',
        method: 'GET',
        headers: {},
        queryParams: {},
        body: null,
        variables: {},
        read: async () => ({}),
        cookies: {},
        logger: console,
      };
      
      const mockStepResult = {
        status: 'passed',
        duration: 500,
      };
      
      const mockHooks: Hooks = {
        afterStep: async (step, context, result) => {
          afterStepCalled = true;
          stepResult = result;
        },
      };
      
      runner = new HooksRunner();
      (runner as any).hooks = mockHooks;
      
      await runner.afterStep(mockStep, mockContext, mockStepResult);
      
      expect(afterStepCalled).toBe(true);
      expect(stepResult.status).toBe('passed');
    });
  });

  describe('hook loading', () => {
    test('should handle missing hooks gracefully', () => {
      // Should not throw when hooks directory doesn't exist
      runner = new HooksRunner('./non-existent-hooks-directory');
      expect(runner).toBeDefined();
    });

    test('should have empty hooks when no hooks file exists', async () => {
      runner = new HooksRunner('./non-existent-hooks');
      
      // Should not throw when executing undefined hooks
      await runner.beforeAll();
      await runner.afterAll();
    });
  });

  describe('hooks with context', () => {
    test('should pass context to beforeScenario hook', async () => {
      let contextReceived: TestContext | undefined;
      
      const mockScenario: Scenario = {
        name: 'Test',
        steps: [],
        tags: [],
      };
      
      const mockContext: TestContext = {
        baseUrl: 'http://example.com',
        path: '/api',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        queryParams: { page: '1' },
        body: { name: 'test' },
        variables: { token: 'abc123' },
        read: async () => ({}),
        cookies: { session: 'xyz' },
        logger: console,
      };
      
      const mockHooks: Hooks = {
        beforeScenario: async (_scenario, context) => {
          contextReceived = context;
        },
      };
      
      runner = new HooksRunner();
      (runner as any).hooks = mockHooks;
      
      await runner.beforeScenario(mockScenario, mockContext);
      
      expect(contextReceived?.baseUrl).toBe('http://example.com');
      expect(contextReceived?.variables.token).toBe('abc123');
    });

    test('should allow modifying context in beforeScenario', async () => {
      const mockScenario: Scenario = {
        name: 'Test',
        steps: [],
        tags: [],
      };
      
      const mockContext: TestContext = {
        baseUrl: '',
        path: '',
        method: 'GET',
        headers: {},
        queryParams: {},
        body: null,
        variables: {},
        read: async () => ({}),
        cookies: {},
        logger: console,
      };
      
      const mockHooks: Hooks = {
        beforeScenario: async (_scenario, context) => {
          context.variables.setup = true;
          context.headers['Authorization'] = 'Bearer token';
        },
      };
      
      runner = new HooksRunner();
      (runner as any).hooks = mockHooks;
      
      await runner.beforeScenario(mockScenario, mockContext);
      
      expect(mockContext.variables.setup).toBe(true);
      expect(mockContext.headers['Authorization']).toBe('Bearer token');
    });
  });

  describe('error handling', () => {
    test('should handle hook errors gracefully', async () => {
      const mockHooks: Hooks = {
        beforeAll: async () => {
          throw new Error('Hook error');
        },
      };
      
      runner = new HooksRunner();
      (runner as any).hooks = mockHooks;
      
      // Should not throw, just let the error propagate
      await expect(runner.beforeAll()).rejects.toThrow('Hook error');
    });

    test('should handle async hook errors', async () => {
      const mockHooks: Hooks = {
        beforeScenario: async () => {
          throw new Error('Async hook error');
        },
      };
      
      const mockScenario: Scenario = {
        name: 'Test',
        steps: [],
        tags: [],
      };
      
      const mockContext: TestContext = {
        baseUrl: '',
        path: '',
        method: 'GET',
        headers: {},
        queryParams: {},
        body: null,
        variables: {},
        read: async () => ({}),
        cookies: {},
        logger: console,
      };
      
      runner = new HooksRunner();
      (runner as any).hooks = mockHooks;
      
      await expect(runner.beforeScenario(mockScenario, mockContext)).rejects.toThrow('Async hook error');
    });
  });
});
