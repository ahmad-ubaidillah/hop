/**
 * Configuration Loader for Hop BDD Framework
 * Loads and merges configuration from hop.config.ts
 */
import * as path from 'path';
import * as fs from 'fs';
const DEFAULT_CONFIG = {
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
export function loadConfig(configPath) {
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
            }
            catch (error) {
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
function mergeConfig(defaults, userConfig) {
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
export function mergeOptions(config, cliOptions) {
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
        debug: cliOptions.debug || false,
        breakpoint: cliOptions.breakpoint || '',
        report: cliOptions.report || false,
        reportDir: cliOptions.reportDir || config.reports,
        video: cliOptions.video || false,
    };
}
/**
 * Convert tags object to string for CLI
 */
function getTagString(tags) {
    if (tags.include.length > 0) {
        return tags.include.map(t => `@${t}`).join(',');
    }
    return '';
}
/**
 * Get environment-specific configuration
 */
export function getEnvConfig(config, env) {
    return config.environments[env] || {};
}
/**
 * Validate configuration
 */
export function validateConfig(config) {
    const errors = [];
    const warnings = [];
    // Validate timeout
    if (config.timeout < 0) {
        errors.push('timeout must be a positive number');
    }
    else if (config.timeout < 1000) {
        warnings.push('timeout less than 1000ms may be too short for most tests');
    }
    // Validate retry
    if (config.retry < 0) {
        errors.push('retry must be a non-negative number');
    }
    else if (config.retry > 10) {
        warnings.push('retry value greater than 10 may significantly slow down test execution');
    }
    // Validate parallel
    if (config.parallel < 1) {
        errors.push('parallel must be at least 1');
    }
    else if (config.parallel > 20) {
        warnings.push('parallel value greater than 20 may cause resource issues');
    }
    // Validate features path
    if (!config.features) {
        errors.push('features path is required');
    }
    else if (!path.isAbsolute(config.features) && !config.features.startsWith('.')) {
        warnings.push('features path should be absolute or relative (starting with .)');
    }
    // Validate steps path
    if (!config.steps) {
        errors.push('steps path is required');
    }
    else if (!path.isAbsolute(config.steps) && !config.steps.startsWith('.')) {
        warnings.push('steps path should be absolute or relative (starting with .)');
    }
    // Validate format
    const validFormats = ['html', 'json', 'junit', 'allure', 'cucumber'];
    for (const format of config.format) {
        if (!validFormats.includes(format.toLowerCase())) {
            warnings.push(`Unknown format '${format}'. Valid formats: ${validFormats.join(', ')}`);
        }
    }
    // Validate tags
    if (config.tags.include.length > 0) {
        for (const tag of config.tags.include) {
            if (!tag.startsWith('@')) {
                warnings.push(`Tag '${tag}' should start with '@'`);
            }
        }
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}
/**
 * Validate and log config issues
 */
export function validateConfigWithLogging(config) {
    const result = validateConfig(config);
    if (result.warnings.length > 0) {
        console.warn('⚠️  Configuration warnings:');
        result.warnings.forEach(w => console.warn(`  - ${w}`));
    }
    if (result.errors.length > 0) {
        console.error('❌ Configuration errors:');
        result.errors.forEach(e => console.error(`  - ${e}`));
    }
    if (result.valid) {
        console.log('✅ Configuration validation passed');
    }
    return result;
}
