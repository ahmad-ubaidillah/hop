/**
 * GraphQL Schema Validation Support
 * Validates GraphQL responses against schema
 */
export class GraphQLSchemaValidator {
    schema = null;
    /**
     * Load GraphQL schema from file or introspection result
     */
    async loadSchema(schemaSource) {
        if (typeof schemaSource === 'string') {
            // Load from file
            const { readFileSync } = await import('fs');
            this.schema = JSON.parse(schemaSource);
        }
        else {
            this.schema = schemaSource;
        }
    }
    /**
     * Validate GraphQL response against schema
     */
    validateResponse(operationType, operationName, response) {
        if (!this.schema) {
            return { valid: false, errors: ['Schema not loaded'] };
        }
        const errors = [];
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
    validateFields(selectionSet, response, errors, path = '') {
        if (typeof response !== 'object' || response === null) {
            if (selectionSet !== '') {
                errors.push(`Expected object at ${path}, got ${typeof response}`);
            }
            return;
        }
        const responseObj = response;
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
    parseSelectionSet(selectionSet) {
        const fields = [];
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
    validateQuerySyntax(query) {
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
        }
        catch (error) {
            return { valid: false, error: String(error) };
        }
    }
    checkBracketsBalanced(str) {
        const stack = [];
        const brackets = {
            '{': '}',
            '(': ')',
            '[': ']'
        };
        for (const char of str) {
            if (char in brackets) {
                stack.push(brackets[char]);
            }
            else if (Object.values(brackets).includes(char)) {
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
    extractVariables(query) {
        const variables = [];
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
/**
 * GraphQL Response wrapper with helpers
 */
export class GraphQLResponse {
    data;
    constructor(data) {
        this.data = data;
    }
    getData() {
        return this.data;
    }
    getErrors() {
        const response = this.data;
        return response.errors || [];
    }
    hasErrors() {
        return this.getErrors().length > 0;
    }
    getField(path) {
        const parts = path.split('.');
        let current = this.data;
        for (const part of parts) {
            if (current && typeof current === 'object') {
                current = current[part];
            }
            else {
                return null;
            }
        }
        return current;
    }
}
