import type { Step, TestContext } from '../../types/index.js';
import type { StepHandler, IStepExecutor } from './types.js';

/**
 * DataHandler - Built-in steps for data manipulation
 * Handles: XML parsing/validation, JSON manipulation, date/time operations, loops, conditionals
 */
export class DataHandler implements StepHandler {
  canHandle(text: string): boolean {
    // XML operations
    if (text.match(/^(Given|When|Then|And|But)?\s*parse\s+xml\s+/i)) return true;
    if (text.match(/^(Given|When|Then|And|But)?\s*validate\s+xml\s+/i)) return true;
    if (text.match(/^(Given|When|Then|And|But)?\s*xpath\s+/i)) return true;
    
    // JSON operations
    if (text.match(/^(Given|When|Then|And|But)?\s*merge\s+json/i)) return true;
    if (text.match(/^(Given|When|Then|And|But)?\s*filter\s+json/i)) return true;
    if (text.match(/^(Given|When|Then|And|But)?\s*json\s+path/i)) return true;
    
    // Date/Time operations
    if (text.match(/^(Given|When|Then|And|But)?\s*current\s+date/i)) return true;
    if (text.match(/^(Given|When|Then|And|But)?\s*add\s+\d+\s+(day|hour|minute|second|month|year)/i)) return true;
    if (text.match(/^(Given|When|Then|And|But)?\s*date\s+diff/i)) return true;
    if (text.match(/^(Given|When|Then|And|But)?\s*format\s+date/i)) return true;
    
    // Loop operations
    if (text.match(/^(And|But)?\s*repeat\s+until/i)) return true;
    if (text.match(/^(Given|When|Then|And|But)?\s*for\s+each/i)) return true;
    
    // Conditional operations
    if (text.match(/^(Given|When|Then|And|But)?\s*if\s+/i)) return true;
    if (text.match(/^(Given|When|Then|And|But)?\s*unless\s+/i)) return true;
    if (text.match(/^(Given|When|Then|And|But)?\s*skip\s+if/i)) return true;
    
    // CSV operations (additional)
    if (text.match(/^(Given|When|Then|And|But)?\s*csv\s+row\s+count/i)) return true;
    if (text.match(/^(Given|When|Then|And|But)?\s*csv\s+filter/i)) return true;
    if (text.match(/^(Given|When|Then|And|But)?\s*csv\s+map/i)) return true;
    
    return false;
  }

  async handle(text: string, step: Step, context: TestContext, executor: IStepExecutor): Promise<void> {
    const logger = executor.getLogger();
    
    // ===== XML OPERATIONS =====
    
    // Parse XML: Given parse xml '<root><item>value</item></root>' into $xml
    const parseXmlMatch = text.match(/^(Given|When|Then|And|But)?\s*parse\s+xml\s+(.+?)\s+into\s+(\w+)$/i);
    if (parseXmlMatch) {
      const xmlContent = executor.stripQuotes(parseXmlMatch[2].trim());
      const varName = parseXmlMatch[3];
      try {
        const { XMLParser } = await import('fast-xml-parser');
        const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
        const result = parser.parse(xmlContent);
        context.variables[varName] = result;
        logger.log(`📦 Parsed XML into variable '${varName}'`);
      } catch (e) {
        throw new Error(`Failed to parse XML: ${e instanceof Error ? e.message : String(e)}`);
      }
      return;
    }
    
    // Validate XML against XSD: Given validate xml '<root>...</root>' against 'schema.xsd'
    const validateXmlMatch = text.match(/^(Given|When|Then|And|But)?\s*validate\s+xml\s+(.+?)\s+against\s+(.+)$/i);
    if (validateXmlMatch) {
      const xmlContent = executor.stripQuotes(validateXmlMatch[2].trim());
      const schemaPath = executor.stripQuotes(validateXmlMatch[3].trim());
      // Note: Full XSD validation would require additional libraries
      // For now, we do basic XML parsing validation
      try {
        const { XMLParser } = await import('fast-xml-parser');
        const parser = new XMLParser({ ignoreAttributes: false });
        parser.parse(xmlContent);
        logger.log(`✅ XML validation passed`);
      } catch (e) {
        throw new Error(`XML validation failed: ${e instanceof Error ? e.message : String(e)}`);
      }
      return;
    }
    
    // XPath: Then xpath '//item/text()' on $xml matches 'value'
    const xpathMatch = text.match(/^(Given|When|Then|And|But)?\s*xpath\s+(.+?)\s+on\s+(\$\w+)\s+(matches|==)\s+(.+)$/i);
    if (xpathMatch) {
      const xpath = xpathMatch[2].trim();
      const varName = xpathMatch[3].substring(1); // Remove $
      const expectedValue = executor.stripQuotes(xpathMatch[5].trim());
      const xmlData = context.variables[varName];
      
      try {
        const { XMLParser } = await import('fast-xml-parser');
        const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
        // Simple XPath-like access (not full XPath implementation)
        const pathParts = xpath.replace(/^\/\//, '').split(/\/|\[|\]/).filter(Boolean);
        let result: any = xmlData;
        for (const part of pathParts) {
          if (result && typeof result === 'object') {
            if (Array.isArray(result)) {
              result = result.find((item: any) => item[part] !== undefined)?.[part];
            } else {
              result = result[part];
            }
          }
        }
        
        if (String(result) === expectedValue) {
          logger.log(`✅ XPath '${xpath}' matches '${expectedValue}'`);
        } else {
          throw new Error(`XPath '${xpath}' expected '${expectedValue}' but got '${result}'`);
        }
      } catch (e) {
        throw new Error(`XPath evaluation failed: ${e instanceof Error ? e.message : String(e)}`);
      }
      return;
    }
    
    // ===== JSON OPERATIONS =====
    
    // Merge JSON: Given merge json {"a": 1} and {"b": 2} into $merged
    const mergeJsonMatch = text.match(/^(Given|When|Then|And|But)?\s*merge\s+json\s+(\{[\s\S]+?\})\s+and\s+(\{[\s\S]+?\})\s+into\s+(\w+)$/i);
    if (mergeJsonMatch) {
      try {
        const json1 = JSON.parse(mergeJsonMatch[2]);
        const json2 = JSON.parse(mergeJsonMatch[3]);
        const varName = mergeJsonMatch[4];
        const merged = { ...json1, ...json2 };
        context.variables[varName] = merged;
        logger.log(`🔀 Merged JSON into variable '${varName}':`, JSON.stringify(merged).substring(0, 100));
      } catch (e) {
        throw new Error(`Failed to merge JSON: ${e instanceof Error ? e.message : String(e)}`);
      }
      return;
    }
    
    // Filter JSON: Given filter json $array where 'status' == 'active' into $filtered
    const filterJsonMatch = text.match(/^(Given|When|Then|And|But)?\s*filter\s+json\s+(\$\w+)\s+where\s+(.+?)\s+(==|!=)\s+(.+?)\s+into\s+(\w+)$/i);
    if (filterJsonMatch) {
      const arrayVar = filterJsonMatch[2].substring(1);
      const field = filterJsonMatch[3].trim();
      const operator = filterJsonMatch[4];
      const expectedValue = executor.stripQuotes(filterJsonMatch[5].trim());
      const resultVar = filterJsonMatch[6];
      
      const array = context.variables[arrayVar];
      if (!Array.isArray(array)) {
        throw new Error(`Variable '${arrayVar}' is not an array`);
      }
      
      const filtered = array.filter((item: any) => {
        const actual = item[field];
        if (operator === '==') return String(actual) === expectedValue;
        if (operator === '!=') return String(actual) !== expectedValue;
        return false;
      });
      
      context.variables[resultVar] = filtered;
      logger.log(`🔍 Filtered ${array.length} items to ${filtered.length} in variable '${resultVar}'`);
      return;
    }
    
    // JSON Path: Given json path '$.store.book[*].author' on $data into $authors
    const jsonPathMatch = text.match(/^(Given|When|Then|And|But)?\s*json\s+path\s+(.+?)\s+on\s+(\$\w+)\s+into\s+(\w+)$/i);
    if (jsonPathMatch) {
      const jsonPath = jsonPathMatch[2].trim();
      const varName = jsonPathMatch[3].substring(1);
      const resultVar = jsonPathMatch[4];
      const data = context.variables[varName];
      
      try {
        // Simple JSONPath implementation (supports $, ., [], [*])
        const result = this.evaluateJsonPath(data, jsonPath);
        context.variables[resultVar] = result;
        logger.log(`🔍 JSONPath '${jsonPath}' result:`, JSON.stringify(result).substring(0, 100));
      } catch (e) {
        throw new Error(`JSONPath evaluation failed: ${e instanceof Error ? e.message : String(e)}`);
      }
      return;
    }
    
    // ===== DATE/TIME OPERATIONS =====
    
    // Current date: Given current date into $today
    const currentDateMatch = text.match(/^(Given|When|Then|And|But)?\s*current\s+date(?:\s+in\s+format\s+(.+?))?\s+into\s+(\w+)$/i);
    if (currentDateMatch) {
      const format = currentDateMatch[2] ? executor.stripQuotes(currentDateMatch[2].trim()) : 'YYYY-MM-DD';
      const varName = currentDateMatch[3];
      const now = new Date();
      context.variables[varName] = this.formatDate(now, format);
      logger.log(`📅 Current date into '${varName}': ${context.variables[varName]}`);
      return;
    }
    
    // Add time: Given add 5 days to $today into $future
    const addTimeMatch = text.match(/^(Given|When|Then|And|But)?\s*add\s+(\d+)\s+(day|days|hour|hours|minute|minutes|second|seconds|month|months|year|years)\s+to\s+(\$\w+)\s+into\s+(\w+)$/i);
    if (addTimeMatch) {
      const amount = parseInt(addTimeMatch[2]);
      const unit = addTimeMatch[3].toLowerCase().replace(/s$/, '');
      const sourceVar = addTimeMatch[4].substring(1);
      const resultVar = addTimeMatch[5];
      
      const sourceDate = context.variables[sourceVar];
      const date = sourceDate ? new Date(sourceDate) : new Date();
      
      switch (unit) {
        case 'day': date.setDate(date.getDate() + amount); break;
        case 'hour': date.setHours(date.getHours() + amount); break;
        case 'minute': date.setMinutes(date.getMinutes() + amount); break;
        case 'second': date.setSeconds(date.getSeconds() + amount); break;
        case 'month': date.setMonth(date.getMonth() + amount); break;
        case 'year': date.setFullYear(date.getFullYear() + amount); break;
      }
      
      context.variables[resultVar] = date.toISOString();
      logger.log(`➕ Added ${amount} ${unit}s to '${sourceVar}' -> '${resultVar}': ${context.variables[resultVar]}`);
      return;
    }
    
    // Date diff: Given date diff between $start and $end in days into $diff
    const dateDiffMatch = text.match(/^(Given|When|Then|And|But)?\s*date\s+diff\s+between\s+(\$\w+)\s+and\s+(\$\w+)\s+in\s+(day|days|hour|hours|minute|minutes)\s+into\s+(\w+)$/i);
    if (dateDiffMatch) {
      const startVar = dateDiffMatch[2].substring(1);
      const endVar = dateDiffMatch[3].substring(1);
      const unit = dateDiffMatch[4].toLowerCase().replace(/s$/, '');
      const resultVar = dateDiffMatch[5];
      
      const start = new Date(context.variables[startVar]);
      const end = new Date(context.variables[endVar]);
      const diffMs = Math.abs(end.getTime() - start.getTime());
      
      let diff: number;
      switch (unit) {
        case 'day': diff = Math.floor(diffMs / (1000 * 60 * 60 * 24)); break;
        case 'hour': diff = Math.floor(diffMs / (1000 * 60 * 60)); break;
        case 'minute': diff = Math.floor(diffMs / (1000 * 60)); break;
        default: diff = Math.floor(diffMs / 1000);
      }
      
      context.variables[resultVar] = diff;
      logger.log(`📊 Date diff: ${diff} ${unit}(s)`);
      return;
    }
    
    // Format date: Given format date $date with 'YYYY-MM-DD' into $formatted
    const formatDateMatch = text.match(/^(Given|When|Then|And|But)?\s*format\s+date\s+(\$\w+)\s+with\s+(.+?)\s+into\s+(\w+)$/i);
    if (formatDateMatch) {
      const dateVar = formatDateMatch[2].substring(1);
      const format = executor.stripQuotes(formatDateMatch[3].trim());
      const resultVar = formatDateMatch[4];
      
      const date = new Date(context.variables[dateVar]);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date value: ${context.variables[dateVar]}`);
      }
      
      context.variables[resultVar] = this.formatDate(date, format);
      logger.log(`📅 Formatted date: ${context.variables[resultVar]}`);
      return;
    }
    
    // ===== CSV OPERATIONS =====
    
    // CSV row count: Given csv row count of $data into $count
    const csvCountMatch = text.match(/^(Given|When|Then|And|But)?\s*csv\s+row\s+count\s+of\s+(\$\w+)\s+into\s+(\w+)$/i);
    if (csvCountMatch) {
      const csvVar = csvCountMatch[2].substring(1);
      const resultVar = csvCountMatch[3];
      const csvData = context.variables[csvVar];
      
      if (!Array.isArray(csvData)) {
        throw new Error(`Variable '${csvVar}' is not an array (CSV data)`);
      }
      
      context.variables[resultVar] = csvData.length;
      logger.log(`📊 CSV row count: ${csvData.length}`);
      return;
    }
    
    // CSV filter: Given csv filter $data where 'column' == 'value' into $filtered
    const csvFilterMatch = text.match(/^(Given|When|Then|And|But)?\s*csv\s+filter\s+(\$\w+)\s+where\s+(.+?)\s+(==|!=)\s+(.+?)\s+into\s+(\w+)$/i);
    if (csvFilterMatch) {
      const csvVar = csvFilterMatch[2].substring(1);
      const column = csvFilterMatch[3].trim();
      const operator = csvFilterMatch[4];
      const expectedValue = executor.stripQuotes(csvFilterMatch[5].trim());
      const resultVar = csvFilterMatch[6];
      
      const csvData = context.variables[csvVar];
      if (!Array.isArray(csvData)) {
        throw new Error(`Variable '${csvVar}' is not an array (CSV data)`);
      }
      
      const filtered = csvData.filter((row: any) => {
        const actual = row[column];
        if (operator === '==') return String(actual) === expectedValue;
        if (operator === '!=') return String(actual) !== expectedValue;
        return false;
      });
      
      context.variables[resultVar] = filtered;
      logger.log(`🔍 CSV filtered: ${csvData.length} -> ${filtered.length} rows`);
      return;
    }
    
    // CSV map: Given csv map $data with 'name' into $names
    const csvMapMatch = text.match(/^(Given|When|Then|And|But)?\s*csv\s+map\s+(\$\w+)\s+with\s+(.+?)\s+into\s+(\w+)$/i);
    if (csvMapMatch) {
      const csvVar = csvMapMatch[2].substring(1);
      const field = csvMapMatch[3].trim();
      const resultVar = csvMapMatch[4];
      
      const csvData = context.variables[csvVar];
      if (!Array.isArray(csvData)) {
        throw new Error(`Variable '${csvVar}' is not an array (CSV data)`);
      }
      
      const mapped = csvData.map((row: any) => row[field]);
      context.variables[resultVar] = mapped;
      logger.log(`🔄 CSV mapped '${field}': ${mapped.length} values`);
      return;
    }
    
    // ===== CONDITIONAL OPERATIONS =====
    
    // If condition: Given if $var == 'value' then def $result = 'true'
    const ifMatch = text.match(/^(Given|When|Then|And|But)?\s*if\s+(.+?)\s+then\s+def\s+(\w+)\s*=\s*(.+)$/i);
    if (ifMatch) {
      const condition = ifMatch[2].trim();
      const resultVar = ifMatch[3];
      const resultValue = executor.stripQuotes(ifMatch[4].trim());
      
      const conditionResult = this.evaluateCondition(condition, context, executor);
      context.variables[resultVar] = conditionResult ? this.parseValue(resultValue, context) : null;
      logger.log(`🔀 If '${condition}' -> '${resultVar}': ${context.variables[resultVar]}`);
      return;
    }
    
    // Unless condition: Given unless $var == 'value' then def $result = 'true'
    const unlessMatch = text.match(/^(Given|When|Then|And|But)?\s*unless\s+(.+?)\s+then\s+def\s+(\w+)\s*=\s*(.+)$/i);
    if (unlessMatch) {
      const condition = unlessMatch[2].trim();
      const resultVar = unlessMatch[3];
      const resultValue = executor.stripQuotes(unlessMatch[4].trim());
      
      const conditionResult = !this.evaluateCondition(condition, context, executor);
      context.variables[resultVar] = conditionResult ? this.parseValue(resultValue, context) : null;
      logger.log(`🔀 Unless '${condition}' -> '${resultVar}': ${context.variables[resultVar]}`);
      return;
    }
    
    // Skip if: Given skip if $var == 'value'
    // Note: This would need engine support to actually skip the step
    const skipIfMatch = text.match(/^(Given|When|Then|And|But)?\s*skip\s+if\s+(.+)$/i);
    if (skipIfMatch) {
      const condition = skipIfMatch[2].trim();
      const conditionResult = this.evaluateCondition(condition, context, executor);
      if (conditionResult) {
        logger.log(`⏭️ Skipping step because '${condition}' is true`);
        context.variables['__skipStep'] = true;
      }
      return;
    }
    
    // ===== LOOP OPERATIONS (basic variable iteration) =====
    
    // For each: Given for each $items into $item, def $index = $i
    // This sets up iteration context for subsequent steps
    const forEachMatch = text.match(/^(Given|When|Then|And|But)?\s*for\s+each\s+(\$\w+)\s+into\s+(\w+)$/i);
    if (forEachMatch) {
      const arrayVar = forEachMatch[2].substring(1);
      const itemVar = forEachMatch[3];
      
      const array = context.variables[arrayVar];
      if (!Array.isArray(array)) {
        throw new Error(`Variable '${arrayVar}' is not an array`);
      }
      
      // Store iteration info in context
      context.variables['__loopArray'] = array;
      context.variables['__loopIndex'] = 0;
      context.variables['__loopItemVar'] = itemVar;
      context.variables[itemVar] = array[0];
      logger.log(`🔁 For each: ${array.length} items, first item in '${itemVar}'`);
      return;
    }
    
    // Repeat until: And repeat until $condition
    // This would need engine support for actual repetition
    const repeatMatch = text.match(/^(And|But)?\s*repeat\s+until\s+(.+)$/i);
    if (repeatMatch) {
      const condition = repeatMatch[2].trim();
      logger.log(`🔁 Repeat until '${condition}' - requires engine support`);
      // Note: Full repeat support requires changes to step executor
      return;
    }
    
    throw new Error(`Unknown data operation: ${text}`);
  }
  
  /**
   * Simple JSONPath evaluation
   * Supports: $, .property, [index], [*], [start:end]
   */
  private evaluateJsonPath(data: any, path: string): any {
    if (path === '$') return data;
    
    let result = data;
    const tokens = this.tokenizeJsonPath(path);
    
    for (const token of tokens) {
      if (result === null || result === undefined) return undefined;
      
      if (token.type === 'root') continue;
      
      if (token.type === 'property' && token.value) {
        result = result[String(token.value)];
      } else if (token.type === 'index' && token.value !== undefined) {
        result = result[Number(token.value)];
      } else if (token.type === 'wildcard') {
        if (Array.isArray(result)) {
          result = result;
        } else if (typeof result === 'object') {
          result = Object.values(result);
        }
      } else if (token.type === 'arraySlice') {
        if (Array.isArray(result)) {
          const start = token.start ?? 0;
          const end = token.end ?? result.length;
          result = result.slice(start, end);
        }
      }
    }
    
    return result;
  }
  
  private tokenizeJsonPath(path: string): Array<{type: string; value?: string | number; start?: number; end?: number}> {
    const tokens: Array<{type: string; value?: string | number; start?: number; end?: number}> = [];
    let remaining = path;
    
    while (remaining.length > 0) {
      if (remaining.startsWith('$')) {
        tokens.push({ type: 'root' });
        remaining = remaining.substring(1);
      } else if (remaining.startsWith('.')) {
        remaining = remaining.substring(1);
        const match = remaining.match(/^([a-zA-Z_][a-zA-Z0-9_]*)/);
        if (match) {
          tokens.push({ type: 'property', value: match[1] });
          remaining = remaining.substring(match[1].length);
        }
      } else if (remaining.startsWith('[')) {
        remaining = remaining.substring(1);
        
        if (remaining.startsWith('*')) {
          tokens.push({ type: 'wildcard' });
          remaining = remaining.substring(1);
        } else if (remaining.includes(':')) {
          const parts = remaining.split(':');
          const start = parts[0] ? parseInt(parts[0]) : undefined;
          const end = parts[1] ? parseInt(parts[1].replace(/\].*$/, '')) : undefined;
          tokens.push({ type: 'arraySlice', start, end });
          remaining = remaining.replace(/^\d*:\d*\]/, '');
        } else {
          const match = remaining.match(/^(\d+)/);
          if (match) {
            tokens.push({ type: 'index', value: parseInt(match[1]) });
            remaining = remaining.substring(match[1].length);
          }
        }
        
        if (remaining.startsWith(']')) {
          remaining = remaining.substring(1);
        }
      } else {
        remaining = remaining.substring(1);
      }
    }
    
    return tokens;
  }
  
  /**
   * Format date with custom format string
   * Supports: YYYY, MM, DD, HH, mm, ss
   */
  private formatDate(date: Date, format: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }
  
  /**
   * Evaluate a condition string like '$var == 5' or "$name == 'test'"
   */
  private evaluateCondition(condition: string, context: TestContext, executor: IStepExecutor): boolean {
    // Handle == operator
    const eqMatch = condition.match(/^(.+?)\s*==\s*(.+)$/);
    if (eqMatch) {
      const left = executor.stripQuotes(eqMatch[1].trim());
      const right = executor.stripQuotes(eqMatch[2].trim());
      const leftVal = this.resolveValue(left, context, executor);
      const rightVal = this.resolveValue(right, context, executor);
      return String(leftVal) === String(rightVal);
    }
    
    // Handle != operator
    const neqMatch = condition.match(/^(.+?)\s*!=\s*(.+)$/);
    if (neqMatch) {
      const left = executor.stripQuotes(neqMatch[1].trim());
      const right = executor.stripQuotes(neqMatch[2].trim());
      const leftVal = this.resolveValue(left, context, executor);
      const rightVal = this.resolveValue(right, context, executor);
      return String(leftVal) !== String(rightVal);
    }
    
    // Handle > operator
    const gtMatch = condition.match(/^(.+?)\s*>\s*(.+)$/);
    if (gtMatch) {
      const left = executor.stripQuotes(gtMatch[1].trim());
      const right = executor.stripQuotes(gtMatch[2].trim());
      const leftVal = this.resolveValue(left, context, executor);
      const rightVal = this.resolveValue(right, context, executor);
      return Number(leftVal) > Number(rightVal);
    }
    
    // Handle < operator
    const ltMatch = condition.match(/^(.+?)\s*<\s*(.+)$/);
    if (ltMatch) {
      const left = executor.stripQuotes(ltMatch[1].trim());
      const right = executor.stripQuotes(ltMatch[2].trim());
      const leftVal = this.resolveValue(left, context, executor);
      const rightVal = this.resolveValue(right, context, executor);
      return Number(leftVal) < Number(rightVal);
    }
    
    // Handle truthy check
    const value = this.resolveValue(condition, context, executor);
    return !!value;
  }
  
  private resolveValue(value: string, context: TestContext, executor: IStepExecutor): any {
    if (value.startsWith(String.fromCharCode(36))) {
      const varName = value.substring(1);
      return context.variables[varName];
    }
    return executor.parseValue(value, context);
  }
  
  private parseValue(value: string, context: TestContext): any {
    if (value.startsWith(String.fromCharCode(36))) {
      const varName = value.substring(1);
      return context.variables[varName];
    }
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 'null') return null;
    if (!isNaN(Number(value))) return Number(value);
    return value;
  }
}
