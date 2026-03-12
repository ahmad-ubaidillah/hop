/**
 * Environment variable loader for Hop
 * Supports .env files and environment-specific overrides
 */
import * as fs from 'fs';
import * as path from 'path';

export interface EnvConfig {
  [key: string]: string;
}

/**
 * Load environment variables from .env file
 * Supports .env, .env.test, .env.staging, .env.production
 */
export function loadEnv(env: string = 'test'): EnvConfig {
  const config: EnvConfig = {};
  
  // Common env file locations
  const envFilePaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), `.env.${env}`),
    path.resolve(process.cwd(), '.env.local'),
  ];
  
  for (const envFilePath of envFilePaths) {
    if (fs.existsSync(envFilePath)) {
      const content = fs.readFileSync(envFilePath, 'utf-8');
      parseEnvFile(content, config);
    }
  }
  
  // Also merge with existing process.env (Bun loads .env automatically)
  // This ensures we get both file-based and system env vars
  for (const key of Object.keys(process.env)) {
    if (process.env[key]) {
      config[key] = process.env[key]!;
    }
  }
  
  return config;
}

/**
 * Parse .env file content into key-value pairs
 */
function parseEnvFile(content: string, config: EnvConfig): void {
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
export function resolveEnvVariables(value: string, env: EnvConfig): string {
  return value.replace(/\$\{(\w+)\}/g, (_, name) => {
    return env[name] ?? process.env[name] ?? '';
  }).replace(/\$(\w+)/g, (_, name) => {
    return env[name] ?? process.env[name] ?? '';
  });
}
