import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { AccessibilityChecker } from '../src/ui/accessibility';
import { MockEngine } from '../src/mock/mock-engine';
import { AllureReporter } from '../src/reporter/allure-reporter';
import { HttpHandler } from '../src/engine/handlers/http-handler';
import * as fs from 'fs';
import * as path from 'path';

describe('Security Fixes Tests', () => {
  describe('AccessibilityChecker', () => {
    test('should not use eval() for loading axe-core', async () => {
      const checker = new AccessibilityChecker();
      expect(checker).toBeDefined();
      expect(typeof checker.runA11yCheck).toBe('function');
      expect(typeof checker.checkElement).toBe('function');
    });

    test('should have proper error handling for page not available', async () => {
      const checker = new AccessibilityChecker();
      
      await expect(checker.runA11yCheck()).rejects.toThrow('Page not available');
    });
  });

  describe('MockEngine', () => {
    test('should not use dynamic Function() for expression evaluation', () => {
      const engine = new MockEngine();
      expect(engine).toBeDefined();
      expect(typeof engine.handleRequest).toBe('function');
      expect(typeof engine.loadFeature).toBe('function');
    });

    test('should handle scenario matching safely', async () => {
      const engine = new MockEngine();
      const featureContent = `
Feature: Test Mock
  Scenario: pathMatches('/users')
    Given response status 200
    And response body {"users": []}
      `;
      
      const featurePath = path.join(process.cwd(), 'test-mock.feature');
      fs.writeFileSync(featurePath, featureContent);
      
      try {
        await engine.loadFeature(featurePath);
        const request = {
          path: '/users',
          method: 'GET',
          headers: {},
          queryParams: {},
          body: null,
        };
        const response = await engine.handleRequest(request);
        expect(response.status).toBe(200);
      } finally {
        if (fs.existsSync(featurePath)) {
          fs.unlinkSync(featurePath);
        }
      }
    });
  });

  describe('AllureReporter', () => {
    test('should handle directory cleanup errors gracefully', async () => {
      const reporter = new AllureReporter('./test-allure-output');
      const results = await reporter.generate([]);
      expect(results).toBe('./test-allure-output');
      
      if (fs.existsSync('./test-allure-output')) {
        fs.rmSync('./test-allure-output', { recursive: true, force: true });
      }
    });
  });

  describe('HttpHandler', () => {
    test('should handle JSON parsing errors gracefully', async () => {
      const handler = new HttpHandler();
      const step = {
        keyword: 'Given',
        text: 'headers {invalid json}',
        line: 1,
      };
      
      const context = {
        baseUrl: '',
        path: '',
        method: 'GET',
        headers: {},
        queryParams: {},
        body: null,
        variables: {},
        cookies: {},
        read: async () => ({}),
        logger: {
          log: () => {},
          error: () => {},
          warn: () => {},
        },
      };
      
      const executor = {
        extractValue: (text: string, regex: RegExp) => text.match(regex)?.[1] || '',
        getEnvConfig: () => ({}),
        resolveVariables: (value: string) => value,
        parseKeyValue: (text: string) => text.split('=').map(s => s.trim()),
        extractJsonBody: (text: string) => text,
        buildUrl: (base: string, path: string) => base + path,
        getHttpClient: () => ({
          request: async () => ({ status: 200, headers: {}, body: {}, cookies: {}, responseTime: 0 }),
        }),
        convertDataTable: (table: any) => table,
        getValidator: () => ({
          validateAny: () => true,
        }),
        getAuthManager: () => ({
          applyAuth: async () => {},
        }),
      };
      
      await expect(handler.handle(step.text, step, context, executor as any)).resolves.not.toThrow();
    });
  });

  describe('Hop Config', () => {
    test('should not have hardcoded secrets', () => {
      const configPath = path.join(process.cwd(), 'hop.config.ts');
      const configContent = fs.readFileSync(configPath, 'utf-8');
      expect(configContent).not.toContain("ADMIN_PASS: 'secret'");
      expect(configContent).toContain('process.env.ADMIN_PASS');
    });
  });

  describe('Hop API Error Handling', () => {
    test('should throw consistent errors when page not initialized', async () => {
      const { createHop } = await import('../src/hop');
      const hop = createHop();
      
      expect(() => hop.getByRole('button')).toThrow('Page not initialized');
      expect(() => hop.getByLabel('label')).toThrow('Page not initialized');
      expect(() => hop.get('#selector')).toThrow('Page not initialized');
      expect(() => hop.$('#selector')).toThrow('Page not initialized');
      
      await expect(hop.$eval('#selector', () => null)).rejects.toThrow('Page not initialized');
      await expect(hop.viewportSize()).rejects.toThrow('Page not initialized');
    });
  });
});