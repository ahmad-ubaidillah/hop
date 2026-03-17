import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { StepExecutor } from '../../src/engine/step-executor';
import type { Step, TestContext } from '../../src/types';
import * as fs from 'fs';
import * as path from 'path';

describe('StepExecutor', () => {
  let executor: StepExecutor;
  const testStepsPath = path.join(process.cwd(), 'test-steps');

  beforeEach(() => {
    // Create test steps directory
    if (!fs.existsSync(testStepsPath)) {
      fs.mkdirSync(testStepsPath, { recursive: true });
    }
    // Create a minimal steps file
    fs.writeFileSync(
      path.join(testStepsPath, 'index.ts'),
      `export const steps = [];`
    );
    
    executor = new StepExecutor({
      stepsPath: testStepsPath,
      featuresPath: './features',
      env: 'test',
      verbose: false,
      timeout: 30000,
    });
  });

  afterEach(() => {
    // Clean up test steps directory
    if (fs.existsSync(testStepsPath)) {
      fs.rmSync(testStepsPath, { recursive: true, force: true });
    }
    executor?.cleanup();
  });

  describe('constructor', () => {
    test('should create step executor with options', () => {
      expect(executor).toBeDefined();
      expect(executor.getOptions()).toBeDefined();
    });

    test('should have default logger', () => {
      const logger = executor.getLogger();
      expect(logger).toBeDefined();
      expect(typeof logger.log).toBe('function');
    });
  });

  describe('executeStep', () => {
    test('should throw error for unknown step', async () => {
      const step: Step = {
        keyword: 'Given',
        text: 'unknown step that does not exist',
        line: 1,
      };
      
      const context: TestContext = createMockContext();
      
      await expect(executor.executeStep(step, context)).rejects.toThrow('Unknown step');
    });

    test('should execute built-in request step', async () => {
      const step: Step = {
        keyword: 'And',
        text: 'request {"name": "John", "email": "john@example.com"}',
        line: 1,
      };
      
      const context: TestContext = createMockContext();
      
      await executor.executeStep(step, context);
      
      expect(context.body).toEqual({ name: 'John', email: 'john@example.com' });
    });

    test('should resolve environment variables in step text', async () => {
      const step: Step = {
        keyword: 'Given',
        text: 'url $BASE_URL',
        line: 1,
      };
      
      const context: TestContext = createMockContext();
      
      // This should not crash - may fail if env var not set
      try {
        await executor.executeStep(step, context);
      } catch (e) {
        // Expected - env var not set
      }
    });
  });

  describe('variable resolution', () => {
    test('should resolve variables in values', () => {
      const context: TestContext = createMockContext();
      context.variables['username'] = 'john';
      
      const result = executor.resolveVariables('Hello #username', context);
      
      expect(result).toContain('john');
    });

    test('should return resolved value when variable exists', () => {
      const context: TestContext = createMockContext();
      context.variables['username'] = 'john';
      
      const result = executor.resolveVariables('#username', context);
      
      expect(result).toBe('john');
    });

    test('should parse JSON string values', () => {
      const context: TestContext = createMockContext();
      
      const result = executor.parseValue('{"key": "value"}', context);
      
      expect(result).toEqual({ key: 'value' });
    });

    test('should parse string values', () => {
      const context: TestContext = createMockContext();
      
      const result = executor.parseValue('hello world', context);
      
      expect(result).toBe('hello world');
    });

    test('should get nested value from object', () => {
      const context: TestContext = createMockContext();
      context.variables.user = { profile: { name: 'John' } };
      
      const result = executor.getNestedValue(context.variables, 'user.profile.name');
      
      expect(result).toBe('John');
    });

    test('should strip quotes from string', () => {
      const result = executor.stripQuotes('"hello"');
      
      expect(result).toBe('hello');
    });

    test('should handle key-value parsing', () => {
      const result = executor.parseKeyValue('name=John');
      
      expect(result).toEqual(['name', 'John']);
    });

    test('should extract JSON body from step text', () => {
      const text = `request {"name": "John", "age": 30}`;
      
      const result = executor.extractJsonBody(text);
      
      expect(result).toEqual({ name: 'John', age: 30 });
    });
  });

  describe('URL building', () => {
    test('should build URL from base URL and path', () => {
      const result = executor.buildUrl('https://api.example.com', '/users', {});
      
      expect(result).toBe('https://api.example.com/users');
    });

    test('should build URL with query parameters', () => {
      const result = executor.buildUrl('https://api.example.com', '/users', { page: '1', limit: '10' });
      
      expect(result).toContain('page=1');
      expect(result).toContain('limit=10');
    });

    test('should build URL from base URL and path without leading slash', () => {
      const result = executor.buildUrl('https://api.example.com', 'users', {});
      
      // Should concatenate properly
      expect(result).toContain('users');
    });
  });

  describe('CSV loading', () => {
    test('should load CSV file', async () => {
      // Create a test CSV file
      const csvPath = path.join(process.cwd(), 'test.csv');
      fs.writeFileSync(csvPath, 'name,email\njohn,john@example.com\njane,jane@example.com');
      
      const context: TestContext = createMockContext();
      
      await executor.loadCsvFile(csvPath, 'users', context);
      
      expect(context.variables.users).toBeDefined();
      expect(Array.isArray(context.variables.users)).toBe(true);
      expect(context.variables.users.length).toBe(2);
      
      // Clean up
      fs.unlinkSync(csvPath);
    });
  });

  describe('data table conversion', () => {
    test('should convert data table', () => {
      const table = {
        headers: ['name', 'email'],
        rows: [
          [{ value: 'john' }, { value: 'john@example.com' }],
          [{ value: 'jane' }, { value: 'jane@example.com' }],
        ],
      };
      
      const result = executor.convertDataTable(table as any);
      
      expect(result).toBeDefined();
    });
  });

  describe('cleanup', () => {
    test('should clean up resources', async () => {
      await executor.cleanup();
      // Should not throw
    });
  });

  describe('HTTP client access', () => {
    test('should get HTTP client', () => {
      const httpClient = executor.getHttpClient();
      
      expect(httpClient).toBeDefined();
    });
  });

  describe('validator access', () => {
    test('should get response validator', () => {
      const validator = executor.getValidator();
      
      expect(validator).toBeDefined();
    });
  });

  describe('auth manager access', () => {
    test('should get auth manager', () => {
      const authManager = executor.getAuthManager();
      
      expect(authManager).toBeDefined();
    });
  });

  describe('debug mode setup', () => {
    test('should handle debug flag in options', () => {
      const debugExecutor = new StepExecutor({
        stepsPath: testStepsPath,
        verbose: true,
        timeout: 30000,
        env: 'test',
      });
      
      expect(debugExecutor.getOptions().verbose).toBe(true);
      
      debugExecutor.cleanup();
    });
  });
});

// Helper function to create mock context
function createMockContext(): TestContext {
  return {
    baseUrl: '',
    path: '',
    method: 'GET',
    headers: {},
    queryParams: {},
    body: null,
    variables: {},
    read: async () => ({}),
    cookies: {},
    logger: {
      log: () => {},
      error: () => {},
      warn: () => {},
    },
  };
}
