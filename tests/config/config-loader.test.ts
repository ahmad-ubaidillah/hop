import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { loadConfig, mergeOptions, getEnvConfig, type HopConfig, type CliOptions } from '../../src/config/config-loader';
import * as fs from 'fs';
import * as path from 'path';

describe('ConfigLoader', () => {
  const originalCwd = process.cwd();

  describe('mergeOptions', () => {
    const baseConfig: HopConfig = {
      features: './features',
      steps: './steps',
      reports: './reports',
      format: ['html'],
      timeout: 30000,
      retry: 0,
      parallel: 1,
      tags: { include: [], exclude: [] },
      headers: {},
      environments: {},
    };

    test('should use CLI options over config file', () => {
      const cliOptions: CliOptions = {
        features: './cli-features',
        timeout: 60000,
      };
      
      const merged = mergeOptions(baseConfig, cliOptions);
      
      expect(merged.features).toBe('./cli-features');
      expect(merged.timeout).toBe(60000);
    });

    test('should use config file values when CLI not specified', () => {
      const cliOptions: CliOptions = {};
      
      const merged = mergeOptions(baseConfig, cliOptions);
      
      expect(merged.features).toBe('./features');
      expect(merged.timeout).toBe(30000);
    });

    test('should handle parallel option correctly', () => {
      const configWithParallel: HopConfig = { ...baseConfig, parallel: 4 };
      const cliOptions: CliOptions = {};
      
      const merged = mergeOptions(configWithParallel, cliOptions);
      
      expect(merged.parallel).toBe(true);
      expect(merged.concurrency).toBe(4);
    });

    test('should handle tags correctly', () => {
      const cliOptions: CliOptions = {
        tags: '@smoke,@login',
      };
      
      const merged = mergeOptions(baseConfig, cliOptions);
      
      expect(merged.tags).toBe('@smoke,@login');
    });

    test('should set default values for missing options', () => {
      const cliOptions: CliOptions = {};
      
      const merged = mergeOptions(baseConfig, cliOptions);
      
      expect(merged.verbose).toBe(false);
      expect(merged.report).toBe(false);
      expect(merged.video).toBe(false);
      expect(merged.env).toBe('test');
    });
  });

  describe('getEnvConfig', () => {
    const config: HopConfig = {
      features: './features',
      steps: './steps',
      reports: './reports',
      format: ['html'],
      timeout: 30000,
      retry: 0,
      parallel: 1,
      tags: { include: [], exclude: [] },
      headers: {},
      environments: {
        dev: { baseUrl: 'http://dev.example.com', apiKey: 'dev-key' },
        staging: { baseUrl: 'https://staging.example.com' },
        prod: { baseUrl: 'https://prod.example.com', apiKey: 'prod-key' },
      },
    };

    test('should return environment-specific config', () => {
      const envConfig = getEnvConfig(config, 'dev');
      
      expect(envConfig.baseUrl).toBe('http://dev.example.com');
      expect(envConfig.apiKey).toBe('dev-key');
    });

    test('should return empty object for unknown environment', () => {
      const envConfig = getEnvConfig(config, 'unknown');
      
      expect(envConfig).toEqual({});
    });

    test('should return partial config for environment', () => {
      const envConfig = getEnvConfig(config, 'staging');
      
      expect(envConfig.baseUrl).toBe('https://staging.example.com');
      expect(envConfig.apiKey).toBeUndefined();
    });
  });

  describe('loadConfig', () => {
    test('should load config from project', () => {
      const config = loadConfig();
      
      // Should load the existing config
      expect(config.features).toBeDefined();
      expect(config.steps).toBeDefined();
    });

    test('should load config from specified path', () => {
      const uniqueConfigPath = path.join(process.cwd(), 'hop.config.unique-test.ts');
      const configContent = `
export default {
  features: './custom-features',
  timeout: 60000
};
`;
      fs.writeFileSync(uniqueConfigPath, configContent);
      
      const config = loadConfig('hop.config.unique-test.ts');
      
      expect(config.features).toBe('./custom-features');
      expect(config.timeout).toBe(60000);
      
      fs.unlinkSync(uniqueConfigPath);
    });

    test('should merge config with defaults', () => {
      const uniqueConfigPath = path.join(process.cwd(), 'hop.config.merge-test.ts');
      const configContent = `
export default {
  features: './my-features'
};
`;
      fs.writeFileSync(uniqueConfigPath, configContent);
      
      const config = loadConfig('hop.config.merge-test.ts');
      
      expect(config.features).toBe('./my-features');
      expect(config.steps).toBeDefined();
      
      fs.unlinkSync(uniqueConfigPath);
    });
  });
});
