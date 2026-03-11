/**
 * Configuration Loader for Hop BDD Framework
 * Loads and merges configuration from hop.config.ts
 */
import * as path from 'path';
import * as fs from 'fs';

export interface HopConfig {
  features: string;
  steps: string;
  reports: string;
  format: string[];
  timeout: number;
  retry: number;
  parallel: number;
  tags: {
    include: string[];
    exclude: string[];
  };
  headers: Record<string, string>;
  environments: Record<string, { baseUrl?: string; [key: string]: any }>;
}

export interface CliOptions {
  features?: string;
  steps?: string;
  reports?: string;
  format?: string;
  timeout?: number;
  retry?: number;
  parallel?: boolean;
  concurrency?: number;
  tags?: string;
  env?: string;
  verbose?: boolean;
  report?: boolean;
  reportDir?: string;
}

const DEFAULT_CONFIG: HopConfig = {
  features: './features',
  steps: './steps',
  reports: './reports',
  format: ['html'],
  timeout: 30000,
  retry: 0,
  parallel: 1,
  tags: {
    include: [],
    exclude: [],
  },
  headers: {},
  environments: {},
};

/**
 * Load configuration from hop.config.ts
 */
export function loadConfig(configPath?: string): HopConfig {
  const searchPaths = [
    path.resolve(process.cwd(), 'hop.config.ts'),
    path.resolve(process.cwd(), 'hop.config.js'),
    path.resolve(process.cwd(), 'config/hop.config.ts'),
    path.resolve(process.cwd(), 'config/hop.config.js'),
  ];
  
  if (configPath) {
    searchPaths.unshift(path.resolve(process.cwd(), configPath));
  }
  
  for (const filePath of searchPaths) {
    if (fs.existsSync(filePath)) {
      try {
        // Try to require the config file
        const configModule = require(filePath);
        const config = configModule.default || configModule;
        
        // Merge with defaults
        return mergeConfig(DEFAULT_CONFIG, config);
      } catch (error) {
        console.warn(`⚠️  Failed to load config from ${filePath}:`, error);
      }
    }
  }
  
  // Return default config if no config file found
  return DEFAULT_CONFIG;
}

/**
 * Merge user config with defaults
 */
function mergeConfig(defaults: HopConfig, userConfig: Partial<HopConfig>): HopConfig {
  return {
    features: userConfig.features || defaults.features,
    steps: userConfig.steps || defaults.steps,
    reports: userConfig.reports || defaults.reports,
    format: userConfig.format || defaults.format,
    timeout: userConfig.timeout ?? defaults.timeout,
    retry: userConfig.retry ?? defaults.retry,
    parallel: userConfig.parallel ?? defaults.parallel,
    tags: {
      include: userConfig.tags?.include || defaults.tags.include,
      exclude: userConfig.tags?.exclude || defaults.tags.exclude,
    },
    headers: { ...defaults.headers, ...userConfig.headers },
    environments: { ...defaults.environments, ...userConfig.environments },
  };
}

/**
 * Merge CLI options with config file
 * CLI options take precedence over config file
 */
export function mergeOptions(config: HopConfig, cliOptions: CliOptions): Required<CliOptions> {
  return {
    features: cliOptions.features || config.features,
    steps: cliOptions.steps || config.steps,
    reports: cliOptions.reports || config.reports,
    format: cliOptions.format || config.format[0],
    timeout: cliOptions.timeout ?? config.timeout,
    retry: cliOptions.retry ?? config.retry,
    parallel: cliOptions.parallel ?? (config.parallel > 1),
    concurrency: cliOptions.concurrency ?? (config.parallel || 4),
    tags: cliOptions.tags || getTagString(config.tags),
    env: cliOptions.env || 'test',
    verbose: cliOptions.verbose || false,
    report: cliOptions.report || false,
    reportDir: cliOptions.reportDir || config.reports,
  };
}

/**
 * Convert tags object to string for CLI
 */
function getTagString(tags: { include: string[]; exclude: string[] }): string {
  if (tags.include.length > 0) {
    return tags.include.map(t => `@${t}`).join(',');
  }
  return '';
}

/**
 * Get environment-specific configuration
 */
export function getEnvConfig(config: HopConfig, env: string): Record<string, any> {
  return config.environments[env] || {};
}
