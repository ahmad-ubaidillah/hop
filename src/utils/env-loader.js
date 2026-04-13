/**
 * Environment variable loader for Hop
 * Supports .env files and environment-specific overrides
 */
import * as fs from 'fs';
import * as path from 'path';
/**
 * Load environment variables from .env file
 * Supports .env, .env.test, .env.staging, .env.production
 */
export function loadEnv(env = 'test', options = {}) {
    const config = {};
    const envName = options.env || env;
    // Priority order (later overrides earlier):
    // 1. .env (base)
    // 2. .env.{environment} (environment-specific)
    // 3. .env.local (local overrides)
    // 4. .env.{environment}.local (highest priority)
    // 5. CLI overrides (highest priority)
    const envFilePaths = [
        path.resolve(process.cwd(), '.env'),
        path.resolve(process.cwd(), `.env.${envName}`),
        path.resolve(process.cwd(), '.env.local'),
        path.resolve(process.cwd(), `.env.${envName}.local`),
    ];
    for (const envFilePath of envFilePaths) {
        if (fs.existsSync(envFilePath)) {
            if (!options.silent) {
                console.log(`📄 Loading environment from: ${path.basename(envFilePath)}`);
            }
            const content = fs.readFileSync(envFilePath, 'utf-8');
            parseEnvFile(content, config);
        }
    }
    // Also merge with existing process.env (Bun loads .env automatically)
    // This ensures we get both file-based and system env vars
    for (const key of Object.keys(process.env)) {
        if (process.env[key]) {
            config[key] = process.env[key];
        }
    }
    // CLI overrides (highest priority)
    if (options.override) {
        for (const [key, value] of Object.entries(options.override)) {
            config[key] = value;
        }
    }
    return config;
}
/**
 * Parse .env file content into key-value pairs
 */
function parseEnvFile(content, config) {
    const lines = content.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        // Skip comments and empty lines
        if (!trimmed || trimmed.startsWith('#')) {
            continue;
        }
        // Parse KEY=VALUE
        const equalIndex = trimmed.indexOf('=');
        if (equalIndex > 0) {
            const key = trimmed.substring(0, equalIndex).trim();
            let value = trimmed.substring(equalIndex + 1).trim();
            // Remove quotes
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            config[key] = value;
        }
    }
}
/**
 * Resolve environment variables in a string
 * Supports ${VAR_NAME} and $VAR_NAME patterns
 */
export function resolveEnvVariables(value, env) {
    return value.replace(/\$\{(\w+)\}/g, (_, name) => {
        return env[name] ?? process.env[name] ?? '';
    }).replace(/\$(\w+)/g, (_, name) => {
        return env[name] ?? process.env[name] ?? '';
    });
}
/**
 * Get environment variable with fallback
 */
export function getEnvVar(key, fallback = '', env = {}) {
    return env[key] ?? process.env[key] ?? fallback;
}
/**
 * Check if environment is production
 */
export function isProduction(env = {}) {
    const nodeEnv = env.NODE_ENV || process.env.NODE_ENV || '';
    return nodeEnv.toLowerCase() === 'production';
}
/**
 * Check if environment is development
 */
export function isDevelopment(env = {}) {
    const nodeEnv = env.NODE_ENV || process.env.NODE_ENV || '';
    return nodeEnv.toLowerCase() === 'development' || nodeEnv === '';
}
