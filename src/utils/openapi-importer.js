/**
 * OpenAPI/Swagger Importer for Hop Framework
 * Generate tests from API specifications
 */
export class OpenAPIImporter {
    spec;
    baseUrl;
    options;
    constructor(spec, options = {}) {
        this.spec = spec;
        this.baseUrl = options.baseUrl || this.extractBaseUrl(spec);
        this.options = options;
    }
    /**
     * Import from URL
     */
    static async fromUrl(url, options) {
        const response = await fetch(url);
        const spec = await response.json();
        return new OpenAPIImporter(spec, options);
    }
    /**
     * Import from file
     */
    static fromFile(spec, options) {
        return new OpenAPIImporter(spec, options);
    }
    /**
     * Extract base URL from spec
     */
    extractBaseUrl(spec) {
        if (spec.servers && spec.servers.length > 0) {
            return spec.servers[0].url;
        }
        if (spec.host) {
            const scheme = (spec.schemes && spec.schemes[0]) || 'https';
            const basePath = spec.basePath || '';
            return `${scheme}://${spec.host}${basePath}`;
        }
        return 'http://localhost:3000';
    }
    /**
     * Get all endpoints
     */
    getEndpoints() {
        const endpoints = [];
        const paths = this.spec.paths || {};
        for (const [path, methods] of Object.entries(paths)) {
            for (const [method, operation] of Object.entries(methods)) {
                if (['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method)) {
                    endpoints.push({
                        path,
                        method: method.toUpperCase(),
                        operationId: operation.operationId,
                        summary: operation.summary,
                        description: operation.description,
                        tags: operation.tags,
                        parameters: operation.parameters || [],
                        requestBody: operation.requestBody,
                        responses: operation.responses || {},
                        security: operation.security,
                    });
                }
            }
        }
        return endpoints;
    }
    /**
     * Filter endpoints by tags
     */
    filterByTags(tags) {
        return this.getEndpoints().filter(endpoint => endpoint.tags?.some(tag => tags.includes(tag)));
    }
    /**
     * Generate Gherkin feature file content
     */
    generateFeature(endpoints) {
        const endpointsToUse = endpoints || this.getEndpoints();
        const lines = [];
        // Group by tags
        const grouped = this.groupByTags(endpointsToUse);
        for (const [tag, eps] of Object.entries(grouped)) {
            const featureName = this.formatFeatureName(tag || 'API');
            lines.push(`Feature: ${featureName}`);
            lines.push('');
            if (this.options.auth) {
                lines.push(`  @auth @${tag || 'api'}`);
                lines.push(`  Background:`);
                lines.push(`    Given I set Authorization header to \${token}`);
                lines.push('');
            }
            for (const endpoint of eps) {
                const scenarios = this.generateScenariosForEndpoint(endpoint);
                lines.push(...scenarios);
                lines.push('');
            }
        }
        return lines.join('\n');
    }
    /**
     * Generate scenarios for a single endpoint
     */
    generateScenariosForEndpoint(endpoint) {
        const lines = [];
        const endpointId = endpoint.operationId || `${endpoint.method} ${endpoint.path}`;
        // Skip filtered operations
        if (this.options.skipOperations?.includes(endpointId)) {
            return lines;
        }
        const tags = [...(endpoint.tags || []), ...(this.options.tags || [])];
        if (tags.length > 0) {
            lines.push(`  @${tags.join(' @')}`);
        }
        // Success scenario
        const scenarioName = this.formatScenarioName(endpoint, 'success');
        lines.push(`  Scenario: ${scenarioName}`);
        const steps = this.generateSteps(endpoint, 'success');
        for (const step of steps) {
            lines.push(`    ${step.keyword} ${step.text}`);
        }
        lines.push('');
        // Error scenarios for 4xx/5xx responses
        const errorCodes = Object.keys(endpoint.responses).filter(code => code.startsWith('4') || code.startsWith('5'));
        for (const errorCode of errorCodes.slice(0, 2)) {
            const errorScenarioName = this.formatScenarioName(endpoint, 'error', errorCode);
            lines.push(`  Scenario: ${errorScenarioName}`);
            const errorSteps = this.generateSteps(endpoint, 'error', errorCode);
            for (const step of errorSteps) {
                lines.push(`    ${step.keyword} ${step.text}`);
            }
            lines.push('');
        }
        return lines;
    }
    /**
     * Generate steps for an endpoint
     */
    generateSteps(endpoint, type, errorCode) {
        const steps = [];
        const pathParams = endpoint.parameters?.filter(p => p.in === 'path') || [];
        const queryParams = endpoint.parameters?.filter(p => p.in === 'query') || [];
        // Set URL
        let url = endpoint.path;
        for (const param of pathParams) {
            url = url.replace(`{${param.name}}`, `<${param.name}>`);
        }
        steps.push({ keyword: 'Given', text: `url "${this.baseUrl}${url}"` });
        // Set path parameters
        for (const param of pathParams) {
            const example = param.example || this.generateExample(param.schema, param.name);
            steps.push({ keyword: 'And', text: `path ${param.name} = ${JSON.stringify(example)}` });
        }
        // Set query parameters
        for (const param of queryParams) {
            if (param.required) {
                const example = param.example || this.generateExample(param.schema, param.name);
                steps.push({ keyword: 'And', text: `param ${param.name} = ${JSON.stringify(example)}` });
            }
        }
        // Set headers
        if (this.options.auth?.type === 'bearer') {
            steps.push({ keyword: 'And', text: 'header Authorization = "Bearer ${token}"' });
        }
        // Set request body for POST/PUT/PATCH
        if (endpoint.requestBody && ['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
            const contentType = Object.keys(endpoint.requestBody.content)[0];
            if (contentType?.includes('json')) {
                const example = this.generateRequestBodyExample(endpoint.requestBody);
                if (example) {
                    steps.push({ keyword: 'And', text: `request ${JSON.stringify(example)}` });
                }
            }
        }
        // Make request
        steps.push({ keyword: 'When', text: `method ${endpoint.method}` });
        // Assert response
        if (type === 'success') {
            const successCode = Object.keys(endpoint.responses).find(c => c.startsWith('2')) || '200';
            steps.push({ keyword: 'Then', text: `status ${successCode}` });
            steps.push({ keyword: 'And', text: 'match response == "#notnull"' });
        }
        else if (errorCode) {
            steps.push({ keyword: 'Then', text: `status ${errorCode}` });
        }
        return steps;
    }
    /**
     * Group endpoints by tags
     */
    groupByTags(endpoints) {
        const grouped = { '': [] };
        for (const endpoint of endpoints) {
            if (endpoint.tags && endpoint.tags.length > 0) {
                for (const tag of endpoint.tags) {
                    if (!grouped[tag]) {
                        grouped[tag] = [];
                    }
                    grouped[tag].push(endpoint);
                }
            }
            else {
                grouped[''].push(endpoint);
            }
        }
        return grouped;
    }
    /**
     * Format feature name
     */
    formatFeatureName(tag) {
        return tag
            .replace(/-/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
    }
    /**
     * Format scenario name
     */
    formatScenarioName(endpoint, type, errorCode) {
        const summary = endpoint.summary || endpoint.path;
        if (type === 'success') {
            return `${summary} succeeds`;
        }
        return `${summary} returns ${errorCode} error`;
    }
    /**
     * Generate example value from schema
     */
    generateExample(schema, name) {
        if (!schema)
            return name;
        switch (schema.type) {
            case 'string':
                if (schema.format === 'date')
                    return '2024-01-01';
                if (schema.format === 'date-time')
                    return '2024-01-01T00:00:00Z';
                if (schema.format === 'email')
                    return 'test@example.com';
                if (schema.format === 'uuid')
                    return '123e4567-e89b-12d3-a456-426614174000';
                return 'string';
            case 'integer':
            case 'number':
                return 1;
            case 'boolean':
                return true;
            case 'array':
                return [];
            case 'object':
                return {};
            default:
                return name;
        }
    }
    /**
     * Generate request body example
     */
    generateRequestBodyExample(requestBody) {
        const contentTypes = Object.keys(requestBody.content);
        if (contentTypes.length === 0)
            return {};
        const contentType = contentTypes[0];
        const mediaType = requestBody.content[contentType];
        if (!mediaType)
            return {};
        if (mediaType.example) {
            return mediaType.example;
        }
        if (mediaType.examples) {
            const examples = Object.values(mediaType.examples);
            if (examples.length > 0) {
                const firstExample = examples[0];
                return firstExample?.value ?? {};
            }
        }
        if (mediaType.schema) {
            return this.generateFromSchema(mediaType.schema);
        }
        return {};
    }
    /**
     * Generate example from schema
     */
    generateFromSchema(schema) {
        if (!schema)
            return {};
        if (schema.example) {
            return schema.example;
        }
        if (schema.default) {
            return schema.default;
        }
        switch (schema.type) {
            case 'object':
                const obj = {};
                if (schema.properties) {
                    for (const [key, prop] of Object.entries(schema.properties)) {
                        obj[key] = this.generateFromSchema(prop);
                    }
                }
                return obj;
            case 'array':
                const itemExample = schema.items ? this.generateFromSchema(schema.items) : {};
                return [itemExample];
            default:
                return this.generateExample(schema, 'value');
        }
    }
    /**
     * Generate test cases
     */
    generateTestCases() {
        const testCases = [];
        for (const endpoint of this.getEndpoints()) {
            const successCode = Object.keys(endpoint.responses).find(c => c.startsWith('2'));
            testCases.push({
                featureName: endpoint.tags?.[0] || 'API',
                scenarioName: this.formatScenarioName(endpoint, 'success'),
                steps: this.generateSteps(endpoint, 'success'),
                tags: endpoint.tags ?? [],
            });
            for (const errorCode of Object.keys(endpoint.responses).filter(c => c.startsWith('4'))) {
                testCases.push({
                    featureName: endpoint.tags?.[0] || 'API',
                    scenarioName: this.formatScenarioName(endpoint, 'error', errorCode),
                    steps: this.generateSteps(endpoint, 'error', errorCode),
                    tags: endpoint.tags ?? [],
                });
            }
        }
        return testCases;
    }
}
/**
 * Import OpenAPI spec and generate tests
 */
export function importOpenAPI(spec, options) {
    return new OpenAPIImporter(spec, options);
}
/**
 * Import from URL
 */
export async function importOpenAPIFromUrl(url, options) {
    return OpenAPIImporter.fromUrl(url, options);
}
/**
 * Generate feature file content
 */
export function generateFeatureFile(spec, options) {
    const importer = new OpenAPIImporter(spec, options);
    return importer.generateFeature();
}
