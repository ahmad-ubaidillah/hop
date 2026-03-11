/**
 * Custom Type Registry for Hop BDD Framework
 * Allows users to define custom type transformers
 */

import { registerCustomType, getSupportedTypes } from './cucumber-expression.js';

export interface TypeDefinition {
  name: string;
  pattern: string;
  converter: (value: string) => any;
  description?: string;
}

// Registry for custom types
const customTypes: Map<string, TypeDefinition> = new Map();

/**
 * Register a custom type transformer
 * 
 * @example
 * // Register a custom 'user' type that looks up users
 * registerType({
 *   name: 'user',
 *   pattern: '\\w+',
 *   converter: async (username) => {
 *     // Fetch user from database or API
 *     const response = await fetch(`https://api.example.com/users/${username}`);
 *     return response.json();
 *   },
 *   description: 'Transforms username into user object'
 * });
 * 
 * // Then use in step: Given user {user} is active
 */
export function registerType(definition: TypeDefinition): void {
  const { name, pattern, converter, description } = definition;
  
  // Register with Cucumber Expression parser
  registerCustomType(name, pattern, converter);
  
  // Also store for documentation
  customTypes.set(name, { name, pattern, converter, description });
  
  console.log(`📝 Custom type '{${name}}' registered`);
}

/**
 * Get all registered custom types
 */
export function getCustomTypes(): TypeDefinition[] {
  return Array.from(customTypes.values());
}

/**
 * Get all available types (built-in + custom)
 */
export function getAllTypes(): { name: string; pattern: string; description?: string; custom: boolean }[] {
  const builtInTypes = getSupportedTypes().map(t => ({
    name: t.slice(1, -1), // Remove { }
    pattern: getBuiltInPattern(t),
    description: getBuiltInDescription(t),
    custom: false,
  }));
  
  const customTypeList = Array.from(customTypes.values()).map(t => ({
    name: t.name,
    pattern: t.pattern,
    description: t.description,
    custom: true,
  }));
  
  return [...builtInTypes, ...customTypeList];
}

// Built-in pattern mappings (for reference)
const BUILT_IN_PATTERNS: Record<string, string> = {
  '{int}': '-?\\d+',
  '{float}': '-?\\d+\\.\\d+',
  '{boolean}': '(true|false|yes|no)',
  '{word}': '\\w+',
  '{string}': '"[^"]+"|\'[^\']+\'|\\S+',
};

const BUILT_IN_DESCRIPTIONS: Record<string, string> = {
  '{int}': 'Matches integers (positive or negative)',
  '{float}': 'Matches floating point numbers',
  '{boolean}': 'Matches true, false, yes, no',
  '{word}': 'Matches single word (no spaces)',
  '{string}': 'Matches quoted strings or unquoted text',
};

function getBuiltInPattern(typeKey: string): string {
  return BUILT_IN_PATTERNS[typeKey] || '.*';
}

function getBuiltInDescription(typeKey: string): string {
  return BUILT_IN_DESCRIPTIONS[typeKey] || 'Custom type';
}

// Pre-defined useful custom types
export function registerCommonTypes(): void {
  // Email type
  registerType({
    name: 'email',
    pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
    converter: (value: string) => value,
    description: 'Matches email addresses',
  });
  
  // UUID type
  registerType({
    name: 'uuid',
    pattern: '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',
    converter: (value: string) => value,
    description: 'Matches UUIDs',
  });
  
  // Date type (ISO format)
  registerType({
    name: 'date',
    pattern: '\\d{4}-\\d{2}-\\d{2}',
    converter: (value: string) => new Date(value),
    description: 'Matches dates in YYYY-MM-DD format',
  });
  
  // URL type
  registerType({
    name: 'url',
    pattern: 'https?://[^\\s]+',
    converter: (value: string) => value,
    description: 'Matches URLs',
  });
}

/**
 * Helper function to create async converters for API lookups
 */
export function createLookupConverter<T>(
  lookupFn: (key: string) => Promise<T>
): (value: string) => Promise<T> {
  return async (value: string) => {
    return await lookupFn(value);
  };
}

/**
 * Helper function to create enum converters
 */
export function createEnumConverter<T extends string>(
  ...validValues: T[]
): (value: string) => T {
  return (value: string) => {
    const normalized = value.toLowerCase();
    const found = validValues.find(v => v.toLowerCase() === normalized);
    if (!found) {
      throw new Error(`Invalid value '${value}'. Expected one of: ${validValues.join(', ')}`);
    }
    return found;
  };
}
