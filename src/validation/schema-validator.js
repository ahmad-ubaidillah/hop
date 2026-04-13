export class SchemaValidator {
    /**
     * Validate using JSON Schema (AJV-style)
     */
    static async validateWithJsonSchema(actual, schema) {
        try {
            const errors = [];
            SchemaValidator.validateSchema(actual, schema, '', errors);
            if (errors.length > 0) {
                return { valid: false, errors };
            }
            return { valid: true };
        }
        catch (error) {
            return {
                valid: false,
                errors: [error instanceof Error ? error.message : String(error)],
            };
        }
    }
    /**
     * Recursive JSON Schema validation helper
     */
    static validateSchema(actual, schema, path, errors) {
        if (!schema)
            return;
        if (schema.type) {
            switch (schema.type) {
                case 'string':
                    if (typeof actual !== 'string')
                        errors.push(`${path}: expected string, got ${typeof actual}`);
                    break;
                case 'number':
                case 'integer':
                    if (typeof actual !== 'number')
                        errors.push(`${path}: expected number, got ${typeof actual}`);
                    break;
                case 'boolean':
                    if (typeof actual !== 'boolean')
                        errors.push(`${path}: expected boolean, got ${typeof actual}`);
                    break;
                case 'array':
                    if (!Array.isArray(actual))
                        errors.push(`${path}: expected array, got ${typeof actual}`);
                    break;
                case 'object':
                    if (typeof actual !== 'object' || actual === null || Array.isArray(actual)) {
                        errors.push(`${path}: expected object, got ${typeof actual}`);
                    }
                    break;
                case 'null':
                    if (actual !== null)
                        errors.push(`${path}: expected null, got ${actual}`);
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
            }
            catch (e) {
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
     * Validate using fuzzy type matching
     * Compatible with Hop's existing fuzzy matching syntax
     */
    static async validateWithFuzzyType(actual, fuzzyType) {
        try {
            const result = SchemaValidator.checkFuzzyType(actual, fuzzyType);
            return { valid: result.valid, errors: result.errors };
        }
        catch (error) {
            return {
                valid: false,
                errors: [error instanceof Error ? error.message : String(error)],
            };
        }
    }
    /**
     * Check fuzzy type
     */
    static checkFuzzyType(actual, fuzzyType) {
        if (fuzzyType.startsWith('#')) {
            switch (fuzzyType.toLowerCase()) {
                case '#string':
                    return { valid: typeof actual === 'string' };
                case '#number':
                    return { valid: typeof actual === 'number' && !isNaN(actual) };
                case '#boolean':
                    return { valid: typeof actual === 'boolean' };
                case '#array':
                    return { valid: Array.isArray(actual) };
                case '#object':
                    return { valid: typeof actual === 'object' && actual !== null && !Array.isArray(actual) };
                case '#null':
                    return { valid: actual === null };
                case '#present':
                    return { valid: actual !== undefined };
                case '#uuid': {
                    if (typeof actual !== 'string')
                        return { valid: false, errors: ['Expected string for UUID'] };
                    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                    return { valid: uuidRegex.test(actual) };
                }
                case '#email': {
                    if (typeof actual !== 'string')
                        return { valid: false, errors: ['Expected string for email'] };
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    return { valid: emailRegex.test(actual) };
                }
                case '#url': {
                    if (typeof actual !== 'string')
                        return { valid: false, errors: ['Expected string for URL'] };
                    try {
                        new URL(actual);
                        return { valid: true };
                    }
                    catch {
                        return { valid: false, errors: ['Invalid URL format'] };
                    }
                }
                case '#regex':
                    return { valid: typeof actual === 'string' };
                case '#date':
                    return { valid: actual instanceof Date && !isNaN(actual.getTime()) };
                case '#integer':
                    if (typeof actual !== 'number')
                        return { valid: false, errors: ['Expected number'] };
                    return { valid: Number.isInteger(actual) };
                case '#positive':
                    if (typeof actual !== 'number')
                        return { valid: false, errors: ['Expected number'] };
                    return { valid: actual > 0 };
                case '#negative':
                    if (typeof actual !== 'number')
                        return { valid: false, errors: ['Expected number'] };
                    return { valid: actual < 0 };
                case '#any':
                    return { valid: true };
                default:
                    return { valid: false, errors: [`Unknown fuzzy type: ${fuzzyType}`] };
            }
        }
        return { valid: false, errors: [`Unknown fuzzy type: ${fuzzyType}`] };
    }
    /**
     * Legacy method - Validate using ArkType schema
     * Now uses built-in fuzzy type validation
     * @deprecated Use validateWithFuzzyType instead
     */
    static async validateWithArkType(actual, schema) {
        return this.validateWithFuzzyType(actual, schema);
    }
}
