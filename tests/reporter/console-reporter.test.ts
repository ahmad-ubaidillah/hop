import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { ConsoleReporter } from '../../src/reporter/console-reporter';
import type { Feature, TestResult } from '../../src/types/index.js';

describe('ConsoleReporter', () => {
  let reporter: ConsoleReporter;
  let originalLog: typeof console.log;
  let logs: string[];

  beforeEach(() => {
    reporter = new ConsoleReporter();
    logs = [];
    originalLog = console.log;
    console.log = mock((...args: any[]) => {
      logs.push(args.join(' '));
    }) as any;
  });

  afterEach(() => {
    console.log = originalLog;
  });

  describe('printFeatures', () => {
    test('should print feature name', () => {
      const features: Feature[] = [
        {
          name: 'Login Feature',
          description: 'Test login functionality',
          tags: [],
          scenarios: [],
          background: null,
          rules: null,
        },
      ];

      reporter.printFeatures(features);

      expect(logs.some(l => l.includes('Login Feature'))).toBe(true);
    });

    test('should print feature description', () => {
      const features: Feature[] = [
        {
          name: 'Login Feature',
          description: 'As a user I want to login',
          tags: [],
          scenarios: [],
          background: null,
          rules: null,
        },
      ];

      reporter.printFeatures(features);

      expect(logs.some(l => l.includes('As a user I want to login'))).toBe(true);
    });

    test('should print feature tags', () => {
      const features: Feature[] = [
        {
          name: 'Login Feature',
          description: '',
          tags: ['smoke', 'auth'],
          scenarios: [],
          background: null,
          rules: null,
        },
      ];

      reporter.printFeatures(features);

      expect(logs.some(l => l.includes('@smoke'))).toBe(true);
      expect(logs.some(l => l.includes('@auth'))).toBe(true);
    });

    test('should print scenario name', () => {
      const features: Feature[] = [
        {
          name: 'Login Feature',
          description: '',
          tags: [],
          scenarios: [
            {
              name: 'Successful login',
              tags: [],
              steps: [],
              outline: false,
              examples: null,
            },
          ],
          background: null,
          rules: null,
        },
      ];

      reporter.printFeatures(features);

      expect(logs.some(l => l.includes('Successful login'))).toBe(true);
    });

    test('should print scenario outline indicator', () => {
      const features: Feature[] = [
        {
          name: 'Login Feature',
          description: '',
          tags: [],
          scenarios: [
            {
              name: 'Login with multiple users',
              tags: [],
              steps: [],
              outline: true,
              examples: null,
            },
          ],
          background: null,
          rules: null,
        },
      ];

      reporter.printFeatures(features);

      expect(logs.some(l => l.includes('(Outline)'))).toBe(true);
    });

    test('should print scenario tags', () => {
      const features: Feature[] = [
        {
          name: 'Login Feature',
          description: '',
          tags: [],
          scenarios: [
            {
              name: 'Successful login',
              tags: ['positive'],
              steps: [],
              outline: false,
              examples: null,
            },
          ],
          background: null,
          rules: null,
        },
      ];

      reporter.printFeatures(features);

      expect(logs.some(l => l.includes('@positive'))).toBe(true);
    });

    test('should print steps', () => {
      const features: Feature[] = [
        {
          name: 'Login Feature',
          description: '',
          tags: [],
          scenarios: [
            {
              name: 'Successful login',
              tags: [],
              steps: [
                { keyword: 'Given', text: 'user is on login page', docString: null, dataTable: null },
                { keyword: 'When', text: 'user enters credentials', docString: null, dataTable: null },
                { keyword: 'Then', text: 'user should be logged in', docString: null, dataTable: null },
              ],
              outline: false,
              examples: null,
            },
          ],
          background: null,
          rules: null,
        },
      ];

      reporter.printFeatures(features);

      expect(logs.some(l => l.includes('Given') && l.includes('user is on login page'))).toBe(true);
      expect(logs.some(l => l.includes('When') && l.includes('user enters credentials'))).toBe(true);
      expect(logs.some(l => l.includes('Then') && l.includes('user should be logged in'))).toBe(true);
    });

    test('should print examples table', () => {
      const features: Feature[] = [
        {
          name: 'Login Feature',
          description: '',
          tags: [],
          scenarios: [
            {
              name: 'Login with multiple users',
              tags: [],
              steps: [],
              outline: true,
              examples: [
                {
                  table: {
                    headers: ['username', 'password'],
                    rows: [['admin', 'admin123'], ['user', 'user123']],
                  },
                },
              ],
            },
          ],
          background: null,
          rules: null,
        },
      ];

      reporter.printFeatures(features);

      expect(logs.some(l => l.includes('username') && l.includes('password'))).toBe(true);
      expect(logs.some(l => l.includes('admin') && l.includes('admin123'))).toBe(true);
    });
  });

  describe('printResults', () => {
    test('should print total test count', () => {
      const results: TestResult[] = [
        createTestResult('passed'),
        createTestResult('failed'),
        createTestResult('skipped'),
      ];

      reporter.printResults(results);

      expect(logs.some(l => l.includes('Total:') && l.includes('3'))).toBe(true);
    });

    test('should print passed count', () => {
      const results: TestResult[] = [
        createTestResult('passed'),
        createTestResult('passed'),
        createTestResult('failed'),
      ];

      reporter.printResults(results);

      expect(logs.some(l => l.includes('Passed:') && l.includes('2'))).toBe(true);
    });

    test('should print failed count', () => {
      const results: TestResult[] = [
        createTestResult('passed'),
        createTestResult('failed'),
        createTestResult('failed'),
      ];

      reporter.printResults(results);

      expect(logs.some(l => l.includes('Failed:') && l.includes('2'))).toBe(true);
    });

    test('should print skipped count', () => {
      const results: TestResult[] = [
        createTestResult('passed'),
        createTestResult('skipped'),
        createTestResult('skipped'),
      ];

      reporter.printResults(results);

      expect(logs.some(l => l.includes('Skipped:') && l.includes('2'))).toBe(true);
    });

    test('should print total duration', () => {
      const results: TestResult[] = [
        { ...createTestResult('passed'), duration: 1000 },
        { ...createTestResult('passed'), duration: 2000 },
      ];

      reporter.printResults(results);

      expect(logs.some(l => l.includes('Duration:') && l.includes('3.00s'))).toBe(true);
    });

    test('should print failed tests section when there are failures', () => {
      const results: TestResult[] = [
        createTestResult('failed', 'Login Feature', 'Invalid credentials'),
      ];

      reporter.printResults(results);

      expect(logs.some(l => l.includes('FAILED TESTS'))).toBe(true);
      expect(logs.some(l => l.includes('Login Feature'))).toBe(true);
      expect(logs.some(l => l.includes('Invalid credentials'))).toBe(true);
    });

    test('should not print failed tests section when no failures', () => {
      const results: TestResult[] = [
        createTestResult('passed'),
        createTestResult('passed'),
      ];

      reporter.printResults(results);

      expect(logs.some(l => l.includes('FAILED TESTS'))).toBe(false);
    });

    test('should print passed tests section when there are passes', () => {
      const results: TestResult[] = [
        createTestResult('passed', 'Login Feature', 'Successful login'),
      ];

      reporter.printResults(results);

      expect(logs.some(l => l.includes('PASSED TESTS'))).toBe(true);
      expect(logs.some(l => l.includes('Login Feature') && l.includes('Successful login'))).toBe(true);
    });

    test('should not print passed tests section when no passes', () => {
      const results: TestResult[] = [
        createTestResult('failed'),
        createTestResult('failed'),
      ];

      reporter.printResults(results);

      expect(logs.some(l => l.includes('PASSED TESTS'))).toBe(false);
    });

    test('should limit passed tests to 20', () => {
      const results: TestResult[] = [];
      for (let i = 0; i < 25; i++) {
        results.push(createTestResult('passed', `Feature ${i}`, `Scenario ${i}`));
      }

      reporter.printResults(results);

      expect(logs.some(l => l.includes('and 5 more'))).toBe(true);
    });

    test('should print error message for failed test', () => {
      const results: TestResult[] = [
        {
          ...createTestResult('failed'),
          error: 'Expected status 200 but got 404',
        },
      ];

      reporter.printResults(results);

      expect(logs.some(l => l.includes('Expected status 200 but got 404'))).toBe(true);
    });

    test('should print failed step info', () => {
      const results: TestResult[] = [
        {
          ...createTestResult('failed'),
          steps: [
            {
              step: { keyword: 'Given', text: 'user is on login page', docString: null, dataTable: null },
              status: 'passed',
              duration: 100,
              error: null,
            },
            {
              step: { keyword: 'When', text: 'user enters invalid credentials', docString: null, dataTable: null },
              status: 'failed',
              duration: 50,
              error: 'Invalid credentials',
            },
          ],
        },
      ];

      reporter.printResults(results);

      expect(logs.some(l => l.includes('Failed at:') && l.includes('When'))).toBe(true);
    });
  });
});

function createTestResult(
  status: 'passed' | 'failed' | 'skipped',
  featureName = 'Test Feature',
  scenarioName = 'Test Scenario'
): TestResult {
  return {
    featureName,
    scenarioName,
    status,
    duration: 100,
    steps: [
      {
        step: { keyword: 'Given', text: 'a test step', docString: null, dataTable: null },
        status: status === 'skipped' ? 'skipped' : 'passed',
        duration: 50,
        error: null,
      },
    ],
    error: null,
  };
}
