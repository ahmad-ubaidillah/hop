import { describe, test, expect } from 'bun:test';
import { SchemaValidator } from '../../src/validation/schema-validator';

describe('SchemaValidator', () => {
  describe('validateWithJsonSchema', () => {
    test('should validate string type', async () => {
      const result = await SchemaValidator.validateWithJsonSchema('hello', { type: 'string' });
      expect(result.valid).toBe(true);
    });

    test('should fail for invalid string type', async () => {
      const result = await SchemaValidator.validateWithJsonSchema(123, { type: 'string' });
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('should validate number type', async () => {
      const result = await SchemaValidator.validateWithJsonSchema(42, { type: 'number' });
      expect(result.valid).toBe(true);
    });

    test('should validate integer type', async () => {
      const result = await SchemaValidator.validateWithJsonSchema(42, { type: 'integer' });
      expect(result.valid).toBe(true);
    });

    test('should validate boolean type', async () => {
      const result = await SchemaValidator.validateWithJsonSchema(true, { type: 'boolean' });
      expect(result.valid).toBe(true);
    });

    test('should validate array type', async () => {
      const result = await SchemaValidator.validateWithJsonSchema([1, 2, 3], { type: 'array' });
      expect(result.valid).toBe(true);
    });

    test('should validate object type', async () => {
      const result = await SchemaValidator.validateWithJsonSchema({ name: 'test' }, { type: 'object' });
      expect(result.valid).toBe(true);
    });

    test('should validate null type', async () => {
      const result = await SchemaValidator.validateWithJsonSchema(null, { type: 'null' });
      expect(result.valid).toBe(true);
    });

    test('should validate string minLength', async () => {
      const result = await SchemaValidator.validateWithJsonSchema('hello', { type: 'string', minLength: 3 });
      expect(result.valid).toBe(true);
    });

    test('should fail for string below minLength', async () => {
      const result = await SchemaValidator.validateWithJsonSchema('hi', { type: 'string', minLength: 3 });
      expect(result.valid).toBe(false);
    });

    test('should validate string maxLength', async () => {
      const result = await SchemaValidator.validateWithJsonSchema('hi', { type: 'string', maxLength: 5 });
      expect(result.valid).toBe(true);
    });

    test('should fail for string above maxLength', async () => {
      const result = await SchemaValidator.validateWithJsonSchema('hello world', { type: 'string', maxLength: 5 });
      expect(result.valid).toBe(false);
    });

    test('should validate string pattern', async () => {
      const result = await SchemaValidator.validateWithJsonSchema('test@example.com', { 
        type: 'string', 
        pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' 
      });
      expect(result.valid).toBe(true);
    });

    test('should fail for string not matching pattern', async () => {
      const result = await SchemaValidator.validateWithJsonSchema('invalid-email', { 
        type: 'string', 
        pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' 
      });
      expect(result.valid).toBe(false);
    });

    test('should validate number minimum', async () => {
      const result = await SchemaValidator.validateWithJsonSchema(10, { type: 'number', minimum: 5 });
      expect(result.valid).toBe(true);
    });

    test('should fail for number below minimum', async () => {
      const result = await SchemaValidator.validateWithJsonSchema(3, { type: 'number', minimum: 5 });
      expect(result.valid).toBe(false);
    });

    test('should validate number maximum', async () => {
      const result = await SchemaValidator.validateWithJsonSchema(3, { type: 'number', maximum: 5 });
      expect(result.valid).toBe(true);
    });

    test('should fail for number above maximum', async () => {
      const result = await SchemaValidator.validateWithJsonSchema(10, { type: 'number', maximum: 5 });
      expect(result.valid).toBe(false);
    });

    test('should validate array minItems', async () => {
      const result = await SchemaValidator.validateWithJsonSchema([1, 2, 3], { type: 'array', minItems: 2 });
      expect(result.valid).toBe(true);
    });

    test('should fail for array below minItems', async () => {
      const result = await SchemaValidator.validateWithJsonSchema([1], { type: 'array', minItems: 2 });
      expect(result.valid).toBe(false);
    });

    test('should validate array maxItems', async () => {
      const result = await SchemaValidator.validateWithJsonSchema([1, 2], { type: 'array', maxItems: 3 });
      expect(result.valid).toBe(true);
    });

    test('should fail for array above maxItems', async () => {
      const result = await SchemaValidator.validateWithJsonSchema([1, 2, 3, 4], { type: 'array', maxItems: 3 });
      expect(result.valid).toBe(false);
    });

    test('should validate array items', async () => {
      const result = await SchemaValidator.validateWithJsonSchema([1, 2, 3], { 
        type: 'array', 
        items: { type: 'number' } 
      });
      expect(result.valid).toBe(true);
    });

    test('should fail for invalid array items', async () => {
      const result = await SchemaValidator.validateWithJsonSchema([1, 'two', 3], { 
        type: 'array', 
        items: { type: 'number' } 
      });
      expect(result.valid).toBe(false);
    });

    test('should validate required properties', async () => {
      const result = await SchemaValidator.validateWithJsonSchema(
        { name: 'John', email: 'john@example.com' }, 
        { 
          type: 'object',
          required: ['name', 'email']
        }
      );
      expect(result.valid).toBe(true);
    });

    test('should fail for missing required properties', async () => {
      const result = await SchemaValidator.validateWithJsonSchema(
        { name: 'John' }, 
        { 
          type: 'object',
          required: ['name', 'email']
        }
      );
      expect(result.valid).toBe(false);
    });

    test('should validate nested object properties', async () => {
      const result = await SchemaValidator.validateWithJsonSchema(
        { user: { name: 'John', age: 30 } }, 
        { 
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                age: { type: 'number' }
              }
            }
          }
        }
      );
      expect(result.valid).toBe(true);
    });
  });

  describe('validateWithFuzzyType', () => {
    test('should validate #string', async () => {
      const result = await SchemaValidator.validateWithFuzzyType('hello', '#string');
      expect(result.valid).toBe(true);
    });

    test('should fail #string for non-string', async () => {
      const result = await SchemaValidator.validateWithFuzzyType(123, '#string');
      expect(result.valid).toBe(false);
    });

    test('should validate #number', async () => {
      const result = await SchemaValidator.validateWithFuzzyType(42, '#number');
      expect(result.valid).toBe(true);
    });

    test('should fail #number for NaN', async () => {
      const result = await SchemaValidator.validateWithFuzzyType(NaN, '#number');
      expect(result.valid).toBe(false);
    });

    test('should validate #boolean', async () => {
      const result = await SchemaValidator.validateWithFuzzyType(true, '#boolean');
      expect(result.valid).toBe(true);
    });

    test('should validate #array', async () => {
      const result = await SchemaValidator.validateWithFuzzyType([1, 2, 3], '#array');
      expect(result.valid).toBe(true);
    });

    test('should fail #array for non-array', async () => {
      const result = await SchemaValidator.validateWithFuzzyType({ length: 3 }, '#array');
      expect(result.valid).toBe(false);
    });

    test('should validate #object', async () => {
      const result = await SchemaValidator.validateWithFuzzyType({ name: 'test' }, '#object');
      expect(result.valid).toBe(true);
    });

    test('should fail #object for array', async () => {
      const result = await SchemaValidator.validateWithFuzzyType([1, 2, 3], '#object');
      expect(result.valid).toBe(false);
    });

    test('should fail #object for null', async () => {
      const result = await SchemaValidator.validateWithFuzzyType(null, '#object');
      expect(result.valid).toBe(false);
    });

    test('should validate #null', async () => {
      const result = await SchemaValidator.validateWithFuzzyType(null, '#null');
      expect(result.valid).toBe(true);
    });

    test('should fail #null for non-null', async () => {
      const result = await SchemaValidator.validateWithFuzzyType('null', '#null');
      expect(result.valid).toBe(false);
    });

    test('should validate #present', async () => {
      const result = await SchemaValidator.validateWithFuzzyType('anything', '#present');
      expect(result.valid).toBe(true);
    });

    test('should fail #present for undefined', async () => {
      const result = await SchemaValidator.validateWithFuzzyType(undefined, '#present');
      expect(result.valid).toBe(false);
    });

    test('should validate #uuid', async () => {
      const result = await SchemaValidator.validateWithFuzzyType('550e8400-e29b-41d4-a716-446655440000', '#uuid');
      expect(result.valid).toBe(true);
    });

    test('should fail #uuid for invalid format', async () => {
      const result = await SchemaValidator.validateWithFuzzyType('not-a-uuid', '#uuid');
      expect(result.valid).toBe(false);
    });

    test('should validate #email', async () => {
      const result = await SchemaValidator.validateWithFuzzyType('test@example.com', '#email');
      expect(result.valid).toBe(true);
    });

    test('should fail #email for invalid format', async () => {
      const result = await SchemaValidator.validateWithFuzzyType('invalid-email', '#email');
      expect(result.valid).toBe(false);
    });

    test('should validate #url', async () => {
      const result = await SchemaValidator.validateWithFuzzyType('https://example.com', '#url');
      expect(result.valid).toBe(true);
    });

    test('should fail #url for invalid format', async () => {
      const result = await SchemaValidator.validateWithFuzzyType('not-a-url', '#url');
      expect(result.valid).toBe(false);
    });

    test('should validate #integer', async () => {
      const result = await SchemaValidator.validateWithFuzzyType(42, '#integer');
      expect(result.valid).toBe(true);
    });

    test('should fail #integer for float', async () => {
      const result = await SchemaValidator.validateWithFuzzyType(3.14, '#integer');
      expect(result.valid).toBe(false);
    });

    test('should validate #positive', async () => {
      const result = await SchemaValidator.validateWithFuzzyType(42, '#positive');
      expect(result.valid).toBe(true);
    });

    test('should fail #positive for zero', async () => {
      const result = await SchemaValidator.validateWithFuzzyType(0, '#positive');
      expect(result.valid).toBe(false);
    });

    test('should validate #negative', async () => {
      const result = await SchemaValidator.validateWithFuzzyType(-5, '#negative');
      expect(result.valid).toBe(true);
    });

    test('should fail #negative for positive', async () => {
      const result = await SchemaValidator.validateWithFuzzyType(5, '#negative');
      expect(result.valid).toBe(false);
    });

    test('should validate #any', async () => {
      expect((await SchemaValidator.validateWithFuzzyType('anything', '#any')).valid).toBe(true);
      expect((await SchemaValidator.validateWithFuzzyType(123, '#any')).valid).toBe(true);
      expect((await SchemaValidator.validateWithFuzzyType(null, '#any')).valid).toBe(true);
      expect((await SchemaValidator.validateWithFuzzyType(undefined, '#any')).valid).toBe(true);
    });

    test('should return error for unknown fuzzy type', async () => {
      const result = await SchemaValidator.validateWithFuzzyType('test', '#unknown');
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('validateWithArkType (deprecated)', () => {
    test('should delegate to validateWithFuzzyType', async () => {
      const result = await SchemaValidator.validateWithArkType('test@example.com', '#email');
      expect(result.valid).toBe(true);
    });
  });
});
