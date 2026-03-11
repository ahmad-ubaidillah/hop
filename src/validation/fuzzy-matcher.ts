import type { TestContext } from '../types/index.js';

export class FuzzyMatcher {
  /**
   * Check if a string is a fuzzy matcher
   */
  static isFuzzyMatch(expected: any): boolean {
    return typeof expected === 'string' && expected.startsWith('#');
  }

  /**
   * Handle fuzzy matchers like #number, #string, #boolean, etc.
   */
  static validate(actual: any, matcher: string, context: TestContext): void {
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
        
      case 'ignore':
      case '#ignore':
        // Match anything
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
      case '#uuid':
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(actual)) {
          throw new Error(`Expected UUID, but got: ${actual}`);
        }
        break;
        
      case 'email':
      case '#email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(actual)) {
          throw new Error(`Expected email, but got: ${actual}`);
        }
        break;

      case 'date':
      case '#date':
        const dateRegex = /^\d{4}-\d{2}-\d{2}/;
        if (!dateRegex.test(actual) || isNaN(Date.parse(actual))) {
          throw new Error(`Expected date (YYYY-MM-DD), but got: ${actual}`);
        }
        break;
        
      default:
        // Handle #[length] (e.g. #[3], #[>0])
        if (matcher.startsWith('#[')) {
          if (!Array.isArray(actual)) {
            throw new Error(`Expected array for length match, but got ${typeof actual}`);
          }
          
          const lengthExpr = matcher.match(/#\[(.+)\]/)?.[1];
          if (!lengthExpr) break;
          
          if (lengthExpr.startsWith('>') || lengthExpr.startsWith('<') || lengthExpr.startsWith('=') || lengthExpr.startsWith('!')) {
            const operatorMatch = lengthExpr.match(/^([><=!]+)\s*(\d+)$/);
            if (operatorMatch) {
              const op = operatorMatch[1];
              const val = parseInt(operatorMatch[2]);
              let passed = false;
              if (op === '>') passed = actual.length > val;
              else if (op === '>=') passed = actual.length >= val;
              else if (op === '<') passed = actual.length < val;
              else if (op === '<=') passed = actual.length <= val;
              else if (op === '==' || op === '=') passed = actual.length === val;
              else if (op === '!=') passed = actual.length !== val;
              
              if (!passed) throw new Error(`Expected array length ${op} ${val}, but got ${actual.length}`);
            }
          } else if (!isNaN(parseInt(lengthExpr))) {
            const expectedLength = parseInt(lengthExpr);
            if (actual.length !== expectedLength) {
              throw new Error(`Expected array length ${expectedLength}, but got ${actual.length}`);
            }
          }
          break;
        }

        // Handle #regex<pattern>
        if (matcher.startsWith('#regex')) {
            const regexMatch = matcher.match(/#regex<(.+)>$/);
            const pattern = regexMatch ? regexMatch[1] : (context.variables['__regex_pattern__'] || '.*');
            
            if (typeof actual !== 'string') {
              throw new Error(`Expected string for regex match, but got ${typeof actual}`);
            }
            
            try {
              const regex = new RegExp(pattern);
              if (!regex.test(actual)) {
                throw new Error(`String '${actual}' does not match pattern '${pattern}'`);
              }
            } catch (e) {
              if (e instanceof Error && e.message.includes('does not match')) throw e;
              throw new Error(`Invalid regex pattern: ${pattern}`);
            }
            break;
        }

        // Try to match as a string
        if (actual !== matcher && actual !== type) {
          throw new Error(`Expected ${matcher}, but got ${actual}`);
        }
    }
  }
}
