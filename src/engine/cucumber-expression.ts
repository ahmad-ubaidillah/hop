/**
 * Cucumber Expression Parser for Hop BDD Framework
 * Supports: {int}, {float}, {string}, {word}, {boolean}
 */

// Built-in type patterns
const TYPE_PATTERNS: Record<string, string> = {
  '{int}': '-?\\d+',
  '{float}': '-?\\d+\\.\\d+',
  '{boolean}': '(true|false|yes|no)',
  '{word}': '\\w+',
  '{string}': '"[^"]+"|\'[^\']+\'|\\S+',
};

// Built-in type converters
const TYPE_CONVERTERS: Record<string, (value: string) => any> = {
  '{int}': (value: string) => parseInt(value, 10),
  '{float}': (value: string) => parseFloat(value),
  '{boolean}': (value: string) => {
    const lower = value.toLowerCase();
    return lower === 'true' || lower === 'yes' || lower === '1';
  },
  '{word}': (value: string) => value,
  '{string}': (value: string) => {
    // Remove surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }
    return value;
  },
};

export interface ParsedExpression {
  regex: RegExp;
  parameterNames: string[];
  parameterTypes: string[];
}

export interface MatchResult {
  matched: boolean;
  parameters: Record<string, any>;
}

/**
 * Parse a Cucumber expression and return regex + parameter info
 */
export function parseCucumberExpression(expression: string): ParsedExpression {
  const parameterNames: string[] = [];
  const parameterTypes: string[] = [];
  
  // Find all {type} or {name:type} patterns
  let regexStr = expression;
  let typeIndex = 0;
  
  // Match {type} or {name:type}
  const typePattern = /\{([^}]+)\}/g;
  
  let match;
  while ((match = typePattern.exec(expression)) !== null) {
    const fullMatch = match[0]; // e.g., {int} or {userId:int}
    const content = match[1];    // e.g., int or userId:int
    
    // Check if it has a custom name (e.g., {userId:int})
    let typeName: string;
    let paramName: string;
    
    if (content.includes(':')) {
      const parts = content.split(':');
      paramName = parts[0];
      typeName = parts[1];
    } else {
      paramName = `param${typeIndex}`;
      typeName = content;
    }
    
    // Get the type pattern
    const typeKey = `{${typeName}}`;
    const pattern = TYPE_PATTERNS[typeKey] || '.*';
    
    parameterNames.push(paramName);
    parameterTypes.push(typeName);
    
    // Replace in regex string
    regexStr = regexStr.replace(fullMatch, `(${pattern})`);
    
    typeIndex++;
  }
  
  // Escape special regex characters except for our capture groups
  // We need to be careful not to double-escape our capture groups
  // The approach: rebuild regex with proper escaping
  regexStr = buildEscapedRegex(expression, parameterNames, parameterTypes);
  
  return {
    regex: new RegExp(`^${regexStr}$`, 'i'),
    parameterNames,
    parameterTypes,
  };
}

/**
 * Build a properly escaped regex from Cucumber expression
 */
function buildEscapedRegex(expression: string, paramNames: string[], paramTypes: string[]): string {
  let result = '';
  let paramIndex = 0;
  let inBrace = false;
  let currentParam = '';
  
  for (let i = 0; i < expression.length; i++) {
    const char = expression[i];
    
    if (char === '{') {
      inBrace = true;
      currentParam = '';
      continue;
    }
    
    if (char === '}') {
      inBrace = false;
      
      // Get the type
      const typeName = currentParam.includes(':') ? currentParam.split(':')[1] : currentParam;
      const typeKey = `{${typeName}}`;
      const pattern = TYPE_PATTERNS[typeKey] || '.*';
      
      result += `(${pattern})`;
      paramIndex++;
      continue;
    }
    
    if (inBrace) {
      currentParam += char;
      continue;
    }
    
    // Escape special regex characters
    if (char === '^' || char === '$' || char === '\\' || char === '.' || 
        char === '*' || char === '+' || char === '?' || char === '(' || 
        char === ')' || char === '[' || char === ']' || char === '|' ||
        char === '/') {
      result += '\\' + char;
    } else {
      result += char;
    }
  }
  
  return result;
}

/**
 * Match a step text against a parsed expression
 */
export function matchExpression(expression: string, stepText: string): MatchResult {
  const parsed = parseCucumberExpression(expression);
  const match = parsed.regex.exec(stepText);
  
  if (!match) {
    return { matched: false, parameters: {} };
  }
  
  // Convert parameters based on their types
  const parameters: Record<string, any> = {};
  
  for (let i = 0; i < parsed.parameterNames.length; i++) {
    const name = parsed.parameterNames[i];
    const type = parsed.parameterTypes[i];
    const value = match[i + 1]; // Capture groups start at index 1
    
    const typeKey = `{${type}}`;
    const converter = TYPE_CONVERTERS[typeKey];
    
    if (converter) {
      parameters[name] = converter(value);
    } else {
      parameters[name] = value;
    }
  }
  
  return { matched: true, parameters };
}

/**
 * Register a custom type transformer
 */
export function registerCustomType(typeName: string, pattern: string, converter: (value: string) => any): void {
  TYPE_PATTERNS[`{${typeName}}`] = pattern;
  TYPE_CONVERTERS[`{${typeName}}`] = converter;
}

/**
 * Get all supported built-in types
 */
export function getSupportedTypes(): string[] {
  return Object.keys(TYPE_PATTERNS);
}
