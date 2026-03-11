import type { TestContext } from '../types/index.js';

export class ResponseValidator {
  /**
   * Validate actual response against expected using fuzzy matching
   */
  validate(actual: any, expected: any, context: TestContext): void {
    if (typeof expected === 'string' && expected.startsWith('#')) {
      // Fuzzy matcher
      this.validateFuzzy(actual, expected, context);
    } else if (typeof expected === 'object' && expected !== null) {
      // Object/Array validation
      this.validateObject(actual, expected, context);
    } else {
      // Exact match
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
      }
    }
  }
  
  /**
   * Handle fuzzy matchers like #number, #string, #boolean, etc.
   */
  private validateFuzzy(actual: any, matcher: string, context: TestContext): void {
    const type = matcher.slice(1);
    
    switch (type) {
      case 'number':
      case '#number':
        if (typeof actual !== 'number') {
          throw new Error(`Expected number, but got ${typeof actual}: ${actual}`);
        }
        break;
        
      case 'string':
      case '#string':
        if (typeof actual !== 'string') {
          throw new Error(`Expected string, but got ${typeof actual}: ${actual}`);
        }
        break;
        
      case 'boolean':
      case '#boolean':
        if (typeof actual !== 'boolean') {
          throw new Error(`Expected boolean, but got ${typeof actual}: ${actual}`);
        }
        break;
        
      case 'array':
      case '#array':
        if (!Array.isArray(actual)) {
          throw new Error(`Expected array, but got ${typeof actual}: ${actual}`);
        }
        break;
        
      case 'object':
      case '#object':
        if (typeof actual !== 'object' || actual === null || Array.isArray(actual)) {
          throw new Error(`Expected object, but got ${typeof actual}: ${actual}`);
        }
        break;
        
      case 'null':
        if (actual !== null) {
          throw new Error(`Expected null, but got ${actual}`);
        }
        break;
        
      case 'notnull':
      case '#notnull':
        if (actual === null || actual === undefined) {
          throw new Error(`Expected not null, but got ${actual}`);
        }
        break;
        
      case 'uuid':
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(actual)) {
          throw new Error(`Expected UUID, but got: ${actual}`);
        }
        break;
        
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(actual)) {
          throw new Error(`Expected email, but got: ${actual}`);
        }
        break;
        
      case 'regex':
      case '#regex':
        // For regex, the expected value should contain a pattern
        // This would need special handling in the step text
        throw new Error('Regex matcher requires pattern specification');
        
      case 'ignore':
      case '#ignore':
        // Ignore this field
        break;
        
      case 'present':
        if (actual === undefined) {
          throw new Error('Expected field to be present');
        }
        break;
        
      case 'absent':
        if (actual !== undefined) {
          throw new Error(`Expected field to be absent, but got: ${actual}`);
        }
        break;
        
      default:
        // Try to match as a string
        if (actual !== matcher && actual !== type) {
          throw new Error(`Expected ${matcher}, but got ${actual}`);
        }
    }
  }
  
  /**
   * Validate object structure with fuzzy matching
   */
  private validateObject(actual: any, expected: any, context: TestContext): void {
    if (actual === null || actual === undefined) {
      throw new Error(`Expected object, but got ${actual}`);
    }
    
    if (Array.isArray(expected)) {
      // Array validation
      if (!Array.isArray(actual)) {
        throw new Error(`Expected array, but got ${typeof actual}`);
      }
      
      for (let i = 0; i < expected.length; i++) {
        if (i >= actual.length) {
          throw new Error(`Expected array of length ${expected.length}, but got ${actual.length}`);
        }
        this.validate(actual[i], expected[i], context);
      }
      return;
    }
    
    // Object validation
    if (typeof actual !== 'object') {
      throw new Error(`Expected object, but got ${typeof actual}`);
    }
    
    for (const key of Object.keys(expected)) {
      const expectedValue = expected[key];
      
      // Check for fuzzy matcher prefix
      if (typeof expectedValue === 'string' && expectedValue.startsWith('#')) {
        this.validateFuzzy(actual[key], expectedValue, context);
      } else if (typeof expectedValue === 'object' && expectedValue !== null) {
        this.validateObject(actual[key], expectedValue, context);
      } else {
        if (actual[key] !== expectedValue) {
          throw new Error(`Expected ${key}=${JSON.stringify(expectedValue)}, but got ${JSON.stringify(actual[key])}`);
        }
      }
    }
  }
  
  /**
   * Validate using ArkType schema (if available)
   */
  async validateWithArkType(actual: any, schema: string): Promise<{ valid: boolean; errors?: string[] }> {
    try {
      // Dynamic import for arktype
      const arktype = await import('arktype');
      const type = arktype.parse(schema);
      const result = type(actual);
      
      if (result instanceof type.errors) {
        return {
          valid: false,
          errors: result.map((e: any) => e.message),
        };
      }
      
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }
}
