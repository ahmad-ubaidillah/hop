import { describe, test, expect, beforeEach } from 'bun:test';
import { DebugLogger, getDebugLogger } from '../../src/utils/debug-logger';
import type { Step, TestContext } from '../../src/types';

describe('DebugLogger', () => {
  let logger: DebugLogger;

  beforeEach(() => {
    logger = new DebugLogger({ enabled: false });
  });

  describe('constructor', () => {
    test('should create debug logger with default options', () => {
      expect(logger).toBeDefined();
      expect(logger.isEnabled()).toBe(false);
    });

    test('should create debug logger with custom options', () => {
      const customLogger = new DebugLogger({ 
        enabled: true, 
        showStepDetails: false,
        showVariables: false 
      });
      expect(customLogger.isEnabled()).toBe(true);
    });
  });

  describe('enable/disable', () => {
    test('should enable debug mode', () => {
      logger.setEnabled(true);
      expect(logger.isEnabled()).toBe(true);
    });

    test('should disable debug mode', () => {
      logger.setEnabled(true);
      logger.setEnabled(false);
      expect(logger.isEnabled()).toBe(false);
    });
  });

  describe('breakpoints', () => {
    test('should set breakpoints', () => {
      logger.setBreakpoints(['login', 'password']);
      expect(logger.isBreakpoint('user enters login')).toBe(true);
      expect(logger.isBreakpoint('user enters password')).toBe(true);
      expect(logger.isBreakpoint('user clicks submit')).toBe(false);
    });

    test('should match partial breakpoint text', () => {
      logger.setBreakpoints(['logs in']);
      expect(logger.isBreakpoint('Given the user logs in with')).toBe(true);
    });
  });

  describe('formatContextForFailure', () => {
    test('should format context for failure', () => {
      const context: TestContext = {
        baseUrl: 'https://api.example.com',
        path: '/users/1',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        queryParams: {},
        body: { name: 'John' },
        variables: { token: 'abc123', userId: 1 },
        cookies: {},
        logger: console,
        read: async () => ({}),
      };

      const step: Step = {
        keyword: 'Given',
        text: 'the user is logged in',
        line: 5,
      };

      const result = logger.formatContextForFailure(context, step, 'Authentication failed');

      expect(result).toContain('STEP FAILED');
      expect(result).toContain('Given the user is logged in');
      expect(result).toContain('https://api.example.com/users/1');
      expect(result).toContain('POST');
      expect(result).toContain('Authentication failed');
      expect(result).toContain('userId');
    });
  });

  describe('global logger', () => {
    test('should get global logger instance', () => {
      const globalLogger = getDebugLogger();
      expect(globalLogger).toBeDefined();
    });

    test('should be same instance', () => {
      const logger1 = getDebugLogger();
      const logger2 = getDebugLogger();
      expect(logger1).toBe(logger2);
    });
  });
});
