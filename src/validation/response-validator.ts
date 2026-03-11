import type { TestContext } from '../types/index.js';
import { FuzzyMatcher } from './fuzzy-matcher.js';
import { SchemaValidator } from './schema-validator.js';

export class ResponseValidator {
  /**
   * Validate actual response against expected
   */
  validate(actual: any, expected: any, context: TestContext): void {
    if (FuzzyMatcher.isFuzzyMatch(expected)) {
      FuzzyMatcher.validate(actual, expected, context);
    } else if (typeof expected === 'object' && expected !== null) {
      this.validateObject(actual, expected, context);
    } else {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
      }
    }
  }

  /**
   * Validate that actual contains expected (for arrays and objects)
   */
  validateContains(actual: any, expected: any, context: TestContext): void {
    if (Array.isArray(actual)) {
      const found = actual.some(item => {
        try {
          if (typeof expected === 'object' && expected !== null) {
            this.validateObject(item, expected, context);
          } else {
            this.validate(item, expected, context);
          }
          return true;
        } catch {
          return false;
        }
      });

      if (!found) {
        throw new Error(`Expected array to contain ${JSON.stringify(expected)}, but no match was found.\nActual: ${JSON.stringify(actual, null, 2)}`);
      }
    } else if (typeof actual === 'object' && actual !== null) {
      this.validateObject(actual, expected, context);
    } else {
      throw new Error(`'contains' matcher only works on Objects or Arrays, but got ${typeof actual}`);
    }
  }

  /**
   * Validate that actual matches any of the expected values
   */
  validateAny(actual: any, expected: any[], context: TestContext): void {
    if (!Array.isArray(expected)) {
      throw new Error(`'any' matcher expects an array of possible values, but got ${typeof expected}`);
    }

    const found = expected.some(option => {
      try {
        this.validate(actual, option, context);
        return true;
      } catch {
        return false;
      }
    });

    if (!found) {
      throw new Error(`Expected any of ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
    }
  }
  
  /**
   * Validate object structure with exact and nested fuzzy matching
   */
  private validateObject(actual: any, expected: any, context: TestContext): void {
    if (actual === null || actual === undefined) {
      throw new Error(`Expected object, but got ${actual}`);
    }
    
    if (Array.isArray(expected)) {
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
    
    if (typeof actual !== 'object') {
      throw new Error(`Expected object, but got ${typeof actual}`);
    }
    
    for (const key of Object.keys(expected)) {
      const expectedValue = expected[key];
      
      if (FuzzyMatcher.isFuzzyMatch(expectedValue)) {
        FuzzyMatcher.validate(actual[key], expectedValue, context);
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
   * Validate using JSON Schema (AJV-style)
   */
  async validateWithJsonSchema(actual: any, schema: any): Promise<{ valid: boolean; errors?: string[] }> {
    return await SchemaValidator.validateWithJsonSchema(actual, schema);
  }

  /**
   * Validate using ArkType schema (if available)
   */
  async validateWithArkType(actual: any, schema: string): Promise<{ valid: boolean; errors?: string[] }> {
    return await SchemaValidator.validateWithArkType(actual, schema);
  }
}
