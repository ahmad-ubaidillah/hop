export class SchemaValidator {
  /**
   * Validate using JSON Schema (AJV-style)
   */
  static async validateWithJsonSchema(actual: any, schema: any): Promise<{ valid: boolean; errors?: string[] }> {
    try {
      // Simple JSON Schema validation implementation
      const errors: string[] = [];
      
      SchemaValidator.validateSchema(actual, schema, '', errors);
      
      if (errors.length > 0) {
        return { valid: false, errors };
      }
      
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }
  
  /**
   * Recursive JSON Schema validation helper
   */
  private static validateSchema(actual: any, schema: any, path: string, errors: string[]): void {
    if (!schema) return;

    if (schema.type) {
      switch (schema.type) {
        case 'string':
          if (typeof actual !== 'string') errors.push(`${path}: expected string, got ${typeof actual}`);
          break;
        case 'number':
        case 'integer':
          if (typeof actual !== 'number') errors.push(`${path}: expected number, got ${typeof actual}`);
          break;
        case 'boolean':
          if (typeof actual !== 'boolean') errors.push(`${path}: expected boolean, got ${typeof actual}`);
          break;
        case 'array':
          if (!Array.isArray(actual)) errors.push(`${path}: expected array, got ${typeof actual}`);
          break;
        case 'object':
          if (typeof actual !== 'object' || actual === null || Array.isArray(actual)) {
            errors.push(`${path}: expected object, got ${typeof actual}`);
          }
          break;
        case 'null':
          if (actual !== null) errors.push(`${path}: expected null, got ${actual}`);
          break;
      }
    }
    
    if (schema.minLength && typeof actual === 'string' && actual.length < schema.minLength) {
      errors.push(`${path}: string length ${actual.length} is less than minLength ${schema.minLength}`);
    }
    if (schema.maxLength && typeof actual === 'string' && actual.length > schema.maxLength) {
      errors.push(`${path}: string length ${actual.length} is greater than maxLength ${schema.maxLength}`);
    }
    if (schema.pattern && typeof actual === 'string') {
      try {
        const regex = new RegExp(schema.pattern);
        if (!regex.test(actual)) {
          errors.push(`${path}: string '${actual}' does not match pattern ${schema.pattern}`);
        }
      } catch (e) {
        errors.push(`${path}: invalid pattern ${schema.pattern}`);
      }
    }
    
    if (schema.minimum !== undefined && typeof actual === 'number' && actual < schema.minimum) {
      errors.push(`${path}: ${actual} is less than minimum ${schema.minimum}`);
    }
    if (schema.maximum !== undefined && typeof actual === 'number' && actual > schema.maximum) {
      errors.push(`${path}: ${actual} is greater than maximum ${schema.maximum}`);
    }
    
    if (schema.minItems && Array.isArray(actual) && actual.length < schema.minItems) {
      errors.push(`${path}: array length ${actual.length} is less than minItems ${schema.minItems}`);
    }
    if (schema.maxItems && Array.isArray(actual) && actual.length > schema.maxItems) {
      errors.push(`${path}: array length ${actual.length} is greater than maxItems ${schema.maxItems}`);
    }
    if (schema.items && Array.isArray(actual)) {
      actual.forEach((item, index) => {
        SchemaValidator.validateSchema(item, schema.items, `${path}[${index}]`, errors);
      });
    }
    
    if (schema.properties && typeof actual === 'object' && actual !== null) {
      for (const key of Object.keys(schema.properties)) {
        if (actual[key] !== undefined) {
          SchemaValidator.validateSchema(actual[key], schema.properties[key], `${path}.${key}`, errors);
        }
      }
    }
    
    if (schema.required && typeof actual === 'object' && actual !== null) {
      for (const requiredKey of schema.required) {
        if (actual[requiredKey] === undefined) {
          errors.push(`${path}: missing required property '${requiredKey}'`);
        }
      }
    }
  }

  /**
   * Validate using ArkType schema (if available)
   */
  static async validateWithArkType(actual: any, schema: string): Promise<{ valid: boolean; errors?: string[] }> {
    try {
      const arktypeModule = await import('arktype');
      
      let type: any;
      if (typeof arktypeModule === 'object') {
        if ('type' in arktypeModule && typeof (arktypeModule as any).type === 'function') {
          type = (arktypeModule as any).type(schema);
        } else if ('parse' in arktypeModule && typeof (arktypeModule as any).parse === 'function') {
          type = (arktypeModule as any).parse(schema);
        } else {
          return { valid: false, errors: ['ArkType API not recognized'] };
        }
      } else if (typeof arktypeModule === 'function') {
        type = (arktypeModule as any)(schema);
      } else {
        return { valid: false, errors: ['ArkType not found'] };
      }
      
      if (!type) {
        return { valid: false, errors: ['Failed to parse ArkType schema'] };
      }
      
      const result = type(actual);
      
      if (result && typeof result === 'object') {
        if ('then' in result) {
          return { valid: true };
        }
        if ('errors' in result) {
          return {
            valid: false,
            errors: Array.isArray(result.errors) ? result.errors.map((e: any) => e.message || String(e)) : [String(result.errors)],
          };
        }
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
