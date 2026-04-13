import { VariableResolver } from './variable-resolver.js';
import { ExpressionEvaluator } from './expression-evaluator.js';
import { JsonParser } from './json-parser.js';
export class ValueParser {
    variableResolver;
    expressionEvaluator;
    jsonParser;
    constructor(envConfig = {}) {
        this.variableResolver = new VariableResolver(envConfig);
        this.expressionEvaluator = new ExpressionEvaluator();
        this.jsonParser = new JsonParser();
    }
    extractValue(text, regex) {
        const match = text.match(regex);
        return match ? match[1] : '';
    }
    parseKeyValue(text) {
        const match = text.match(/^(.+?)\s*=\s*(.+)$/);
        if (match) {
            return [match[1].trim(), match[2].trim()];
        }
        return [text, ''];
    }
    extractJsonBody(text) {
        return this.jsonParser.extractJsonBody(text);
    }
    convertDataTable(table) {
        if (table.rows.length === 0)
            return {};
        const result = {};
        for (const row of table.rows) {
            for (let i = 0; i < table.headers.length; i++) {
                result[table.headers[i]] = row[i];
            }
        }
        return result;
    }
    buildUrl(baseUrl, path, queryParams) {
        let url = baseUrl + path;
        const params = new URLSearchParams(queryParams);
        if (params.toString()) {
            url += '?' + params.toString();
        }
        return url;
    }
    resolveVariables(value, context) {
        return this.variableResolver.resolve(value, context);
    }
    parseValue(value, context) {
        // Check for variable reference (with prefix or just the name)
        if (value.startsWith('#') || value.startsWith('$')) {
            const varName = value.replace(/^[#\$]/, '').replace(/[()]/g, '').trim();
            if (context.variables[varName] !== undefined)
                return context.variables[varName];
        }
        if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(value) && context.variables[value] !== undefined) {
            return context.variables[value];
        }
        return this.expressionEvaluator.evaluate(value, context);
    }
    stripQuotes(value) {
        if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
            return value.slice(1, -1);
        }
        return value;
    }
    parseGherkinJson(jsonStr) {
        return this.jsonParser.parseGherkinJson(jsonStr);
    }
    getNestedValue(obj, path) {
        if (!obj)
            return undefined;
        const parts = path.replace(/\[(\w+)\]/g, '.$1').split('.').filter(p => p !== '');
        let current = obj;
        for (const part of parts) {
            if (current === undefined || current === null)
                return undefined;
            current = current[part];
        }
        return current;
    }
}
