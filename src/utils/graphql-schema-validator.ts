/**
 * GraphQL Schema Validation Support
 * Validates GraphQL responses against schema
 */

export interface GraphQLSchema {
  query: string;
  mutation?: string;
  subscription?: string;
  types: GraphQLType[];
}

export interface GraphQLType {
  name: string;
  kind: 'SCALAR' | 'OBJECT' | 'INPUT_OBJECT' | 'INTERFACE' | 'UNION' | 'ENUM';
  fields?: GraphQLField[];
  enumValues?: { name: string }[];
  inputFields?: GraphQLInputField[];
}

export interface GraphQLField {
  name: string;
  type: GraphQLTypeRef;
  args: GraphQLArg[];
}

export interface GraphQLInputField {
  name: string;
  type: GraphQLTypeRef;
}

export interface GraphQLArg {
  name: string;
  type: GraphQLTypeRef;
}

export interface GraphQLTypeRef {
  kind: 'NON_NULL' | 'LIST' | 'NAMED';
  name?: string;
  ofType?: GraphQLTypeRef;
}

export class GraphQLSchemaValidator {
  private schema: GraphQLSchema | null = null;

  /**
   * Load GraphQL schema from file or introspection result
   */
  async loadSchema(schemaSource: string | object): Promise<void> {
    if (typeof schemaSource === 'string') {
      // Load from file
      const { readFileSync } = await import('fs');
      this.schema = JSON.parse(schemaSource);
    } else {
      this.schema = schemaSource as GraphQLSchema;
    }
  }

  /**
   * Validate GraphQL response against schema
   */
  validateResponse(
    operationType: 'query' | 'mutation' | 'subscription',
    operationName: string,
    response: unknown
  ): ValidationResult {
    if (!this.schema) {
      return { valid: false, errors: ['Schema not loaded'] };
    }

    const errors: string[] = [];

    // Find the operation definition
    const operations = operationType === 'query' 
      ? this.schema.query 
      : operationType === 'mutation'
      ? this.schema.mutation
      : this.schema.subscription;

    if (!operations) {
      errors.push(`No ${operationType} defined in schema`);
      return { valid: false, errors };
    }

    // Validate response structure
    this.validateFields(operations, response, errors);

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private validateFields(
    selectionSet: string,
    response: unknown,
    errors: string[],
    path: string = ''
  ): void {
    if (typeof response !== 'object' || response === null) {
      if (selectionSet !== '') {
        errors.push(`Expected object at ${path}, got ${typeof response}`);
      }
      return;
    }

    const responseObj = response as Record<string, unknown>;
    const fields = this.parseSelectionSet(selectionSet);

    for (const field of fields) {
      const fieldPath = path ? `${path}.${field.name}` : field.name;

      if (!(field.name in responseObj) && field.name !== '__typename') {
        errors.push(`Missing field: ${fieldPath}`);
        continue;
      }

      // Recursively validate nested fields
      if (field.selectionSet) {
        const fieldValue = responseObj[field.name];
        if (fieldValue !== null && typeof fieldValue === 'object') {
          this.validateFields(field.selectionSet, fieldValue, errors, fieldPath);
        }
      }
    }
  }

  private parseSelectionSet(selectionSet: string): { name: string; selectionSet?: string }[] {
    const fields: { name: string; selectionSet?: string }[] = [];
    
    // Simple parser - handles basic selection sets
    const regex = /(\w+)(?:\s*:\s*(\w+))?(?:\s*\{([^}]*)\})?/g;
    let match;
    
    while ((match = regex.exec(selectionSet)) !== null) {
      fields.push({
        name: match[2] || match[1],
        selectionSet: match[3]
      });
    }

    return fields;
  }

  /**
   * Validate GraphQL query syntax
   */
  validateQuerySyntax(query: string): { valid: boolean; error?: string } {
    try {
      // Basic syntax validation
      if (!query.includes('{')) {
        return { valid: false, error: 'Query must contain { to define selection set' };
      }

      const balanced = this.checkBracketsBalanced(query);
      if (!balanced) {
        return { valid: false, error: 'Unbalanced brackets in query' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: String(error) };
    }
  }

  private checkBracketsBalanced(str: string): boolean {
    const stack: string[] = [];
    const brackets: Record<string, string> = { 
      '{': '}', 
      '(': ')', 
      '[': ']' 
    };

    for (const char of str) {
      if (char in brackets) {
        stack.push(brackets[char]);
      } else if (Object.values(brackets).includes(char)) {
        if (stack.pop() !== char) {
          return false;
        }
      }
    }

    return stack.length === 0;
  }

  /**
   * Extract variables from GraphQL query
   */
  extractVariables(query: string): string[] {
    const variables: string[] = [];
    const regex = /\$([a-zA-Z_][a-zA-Z0-9_]*)/g;
    let match;

    while ((match = regex.exec(query)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    return variables;
  }
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * GraphQL Response wrapper with helpers
 */
export class GraphQLResponse {
  constructor(private data: unknown) {}

  getData(): unknown {
    return this.data;
  }

  getErrors(): { message: string; locations?: unknown; path?: unknown }[] {
    const response = this.data as { errors?: { message: string; locations?: unknown; path?: unknown }[] };
    return response.errors || [];
  }

  hasErrors(): boolean {
    return this.getErrors().length > 0;
  }

  getField<T = unknown>(path: string): T | null {
    const parts = path.split('.');
    let current: unknown = this.data;

    for (const part of parts) {
      if (current && typeof current === 'object') {
        current = (current as Record<string, unknown>)[part];
      } else {
        return null;
      }
    }

    return current as T;
  }
}
