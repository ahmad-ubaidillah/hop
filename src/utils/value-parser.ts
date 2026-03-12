import type { EnvConfig } from './env-loader.js';
import type { TestContext } from '../types/index.js';
import { VariableResolver } from './variable-resolver.js';
import { ExpressionEvaluator } from './expression-evaluator.js';
import { JsonParser } from './json-parser.ts';

export class ValueParser {
  private variableResolver: VariableResolver;
  private expressionEvaluator: ExpressionEvaluator;
  private jsonParser: JsonParser;

  constructor(envConfig: EnvConfig = {}) {
    this.variableResolver = new VariableResolver(envConfig);
    this.expressionEvaluator = new ExpressionEvaluator();
    this.jsonParser = new JsonParser();
  }

  public extractValue(text: string, regex: RegExp): string {
    const match = text.match(regex);
    return match ? match[1] : '';
  }
  
  public parseKeyValue(text: string): [string, string] {
    const match = text.match(/^(.+?)\s*=\s*(.+)$/);
    if (match) {
      return [match[1].trim(), match[2].trim()];
    }
    return [text, ''];
  }
  
  public extractJsonBody(text: string): any {
    return this.jsonParser.extractJsonBody(text);
  }
  
  public convertDataTable(table: { headers: string[]; rows: string[][] }): any {
    if (table.rows.length === 0) return {};
    const result: Record<string, any> = {};
    for (const row of table.rows) {
      for (let i = 0; i < table.headers.length; i++) {
        result[table.headers[i]] = row[i];
      }
    }
    return result;
  }
  
  public buildUrl(baseUrl: string, path: string, queryParams: Record<string, string>): string {
    let url = baseUrl + path;
    const params = new URLSearchParams(queryParams);
    if (params.toString()) {
      url += '?' + params.toString();
    }
    return url;
  }
  
  public resolveVariables(value: any, context: TestContext): any {
    return this.variableResolver.resolve(value, context);
  }
  
  public parseValue(value: string, context: TestContext): any {
    // Check for variable reference (with prefix or just the name)
    if (value.startsWith('#') || value.startsWith('$')) {
      const varName = value.replace(/^[#\$]/, '').replace(/[()]/g, '').trim();
      if (context.variables[varName] !== undefined) return context.variables[varName];
    }

    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(value) && context.variables[value] !== undefined) {
      return context.variables[value];
    }
    
    return this.expressionEvaluator.evaluate(value, context);
  }
  
  public stripQuotes(value: string): string {
    if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
      return value.slice(1, -1);
    }
    return value;
  }
  
  public parseGherkinJson(jsonStr: string): any {
    return this.jsonParser.parseGherkinJson(jsonStr);
  }
  
  public getNestedValue(obj: any, path: string): any {
    if (!obj) return undefined;
    const parts = path.replace(/\[(\w+)\]/g, '.$1').split('.').filter(p => p !== '');
    let current: any = obj;
    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }
    return current;
  }
}
