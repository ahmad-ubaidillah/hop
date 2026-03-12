export class JsonParser {
  public extractJsonBody(text: string): any {
    const match = text.match(/^(?:(?:Given|When|Then|And|But)\s+)?request\s+(\{[\s\S]*\})/i);
    if (!match) return undefined;

    const content = match[1];
    try {
      return JSON.parse(content);
    } catch {
      try {
        const processed = content
          .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
          .replace(/'/g, '"');
        return JSON.parse(processed);
      } catch {
        return content;
      }
    }
  }

  public parseGherkinJson(jsonStr: string): any {
    const trimmed = jsonStr.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const result: any = {};
      const inner = trimmed.slice(1, -1);
      const pairs = this.splitByComma(inner);
      for (const pair of pairs) {
        const colonIndex = pair.indexOf(':');
        if (colonIndex === -1) continue;
        let key = pair.substring(0, colonIndex).trim().replace(/^['"]|['"]$/g, '');
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
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }
    if (value.startsWith('{') || value.startsWith('[')) {
      return this.parseGherkinJson(value);
    }
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 'null') return null;
    if (!isNaN(Number(value)) && !value.includes('-') && !value.includes(':')) return Number(value);
    return value;
  }

  private splitByComma(str: string): string[] {
    const result: string[] = [];
    let current = '';
    let depth = 0;
    let inString = false;
    let stringChar = '';
    for (const char of str) {
      if ((char === '"' || char === "'") && !inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar && inString) {
        inString = false;
      } else if (!inString && (char === '{' || char === '[')) {
        depth++;
      } else if (!inString && (char === '}' || char === ']')) {
        depth--;
      } else if (char === ',' && depth === 0 && !inString) {
        result.push(current);
        current = '';
        continue;
      }
      current += char;
    }
    if (current) result.push(current);
    return result;
  }
}
