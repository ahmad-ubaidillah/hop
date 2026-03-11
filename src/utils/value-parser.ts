import { resolveEnvVariables as resolveEnv } from './env-loader.js';
import type { EnvConfig } from './env-loader.js';
import type { TestContext } from '../types/index.js';

export class ValueParser {
  private envConfig: EnvConfig;

  constructor(envConfig: EnvConfig = {}) {
    this.envConfig = envConfig;
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
    const match = text.match(/^(?:(?:Given|When|Then|And|But)\s+)?request\s+(\{[\s\S]*\})/i);
    if (match) {
      const content = match[1];
      try {
        // Try standard JSON first
        return JSON.parse(content);
      } catch {
        // Handle unquoted keys or fuzzy patterns by transforming to valid JSON (simple attempt)
        try {
          // Replace unquoted keys: { title: '...' } -> { "title": '...' }
          const processed = content
            .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
            .replace(/'/g, '"');
          return JSON.parse(processed);
        } catch {
          return content;
        }
      }
    }
    return undefined;
  }
  
  public convertDataTable(table: { headers: string[]; rows: string[][] }): any {
    if (table.rows.length === 0) return {};
    
    // Convert to object with key-value pairs
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
    if (value === null || value === undefined) return value;

    if (Array.isArray(value)) {
      return value.map(item => this.resolveVariables(item, context));
    }

    if (typeof value === 'object') {
      const result: Record<string, any> = {};
      for (const [key, val] of Object.entries(value)) {
        result[key] = this.resolveVariables(val, context);
      }
      return result;
    }

    if (typeof value !== 'string') return value;
    
    // First resolve env variables, then context variables
    let resolved = resolveEnv(value, this.envConfig);
    
    // Replace ${var}, #var, or #(var) patterns with context variables
    // Use regex to find all matches and handle types
    
    // Special case: if the whole string is just a variable reference, return the actual type (number, object, etc.)
    const fullMatch = resolved.match(/^#\((\w+)\)$/);
    if (fullMatch) {
      const name = fullMatch[1];
      if (context.variables[name] !== undefined) {
        return context.variables[name];
      }
    }

    const fullMatch2 = resolved.match(/^#(\w+)$/);
    if (fullMatch2) {
      const name = fullMatch2[1];
      if (context.variables[name] !== undefined) {
        return context.variables[name];
      }
    }

    return resolved.replace(/\$\{(\w+)\}/g, (_, name) => {
      return context.variables[name] ?? `$\{${name}\}`;
    }).replace(/#\((\w+)\)/g, (_, name) => {
      return context.variables[name] ?? `#(${name})`;
    }).replace(/#(\w+)/g, (_, name) => {
      return context.variables[name] ?? `#${name}`;
    });
  }
  
  public parseValue(value: string, context: TestContext): any {
    // Handle quoted strings first
    if (value.startsWith("'") || value.startsWith('"')) {
      return this.stripQuotes(value);
    }

    // Try to parse as JSON
    try {
      if (value.startsWith('{') || value.startsWith('[')) {
        try {
          return JSON.parse(value);
        } catch {
          return this.parseGherkinJson(value);
        }
      }
    } catch {}
    
    // Check for variable reference (with prefix or just the name)
    if (value.startsWith('#') || value.startsWith('$')) {
      const varName = value.replace(/^[#\$]/, '').replace(/[()]/g, '').trim();
      return context.variables[varName] ?? value;
    }

    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(value) && context.variables[value] !== undefined) {
      return context.variables[value];
    }
    
    // Handle numeric strings
    if (value && !isNaN(Number(value)) && !value.includes('-') && !value.includes(':')) {
      return Number(value);
    }

    // Try to evaluate as a JS expression (Karate fallback)
    try {
      if (!value.startsWith("'") && !value.startsWith('"')) {
        const fn = new Function(...Object.keys(context.variables), `return ${value}`);
        const result = fn(...Object.values(context.variables));
        if (result !== undefined) return result;
      }
    } catch {
      // Ignore and return as string
    }
    
    return value;
  }
  
  public stripQuotes(value: string): string {
    // Handle single quotes
    if (value.startsWith("'") && value.endsWith("'")) {
      return value.slice(1, -1);
    }
    // Handle double quotes
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1);
    }
    return value;
  }
  
  /**
   * Parse Gherkin-style JSON with fuzzy matchers
   * Handles: { id: '#number', name: '#string' }
   * Returns an object with fuzzy matcher strings preserved
   */
  public parseGherkinJson(jsonStr: string): any {
    const trimmed = jsonStr.trim();
    
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const result: any = {};
      const inner = trimmed.slice(1, -1);
      const pairs = this.splitByComma(inner);
      
      for (const pair of pairs) {
        const colonIndex = pair.indexOf(':');
        if (colonIndex === -1) continue;
        
        let key = pair.substring(0, colonIndex).trim();
        if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
          key = key.slice(1, -1);
        }

        let value = pair.substring(colonIndex + 1).trim();
        result[key] = this.parseGherkinValue(value);
      }
      return result;
    } else if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      const inner = trimmed.slice(1, -1);
      const items = this.splitByComma(inner);
      return items.map((item: string) => this.parseGherkinValue(item.trim()));
    }
    
    return trimmed;
  }

  private parseGherkinValue(value: string): any {
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }
    
    if (value.startsWith('{') || value.startsWith('[')) {
      return this.parseGherkinJson(value);
    }
    
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 'null') return null;
    
    if (value && !isNaN(Number(value)) && !value.includes('-') && !value.includes(':')) {
      return Number(value);
    }
    
    return value;
  }
  
  private splitByComma(str: string): string[] {
    const result: string[] = [];
    let current = '';
    let depth = 0;
    let inString = false;
    let stringChar = '';
    
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      
      if ((char === '"' || char === "'") && !inString) {
        inString = true;
        stringChar = char;
        current += char;
      } else if (char === stringChar && inString) {
        inString = false;
        current += char;
      } else if (char === '{' || char === '[') {
        depth++;
        current += char;
      } else if (char === '}' || char === ']') {
        depth--;
        current += char;
      } else if (char === ',' && depth === 0 && !inString) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    if (current) {
      result.push(current);
    }
    
    return result;
  }
  
  public getNestedValue(obj: any, path: string): any {
    if (!obj) return undefined;
    
    // Support both dot notation and bracket notation
    const parts = path.replace(/\[(\w+)\]/g, '.$1').split('.').filter(p => p !== '');
    let current: any = obj;
    
    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }
    
    return current;
  }
}
