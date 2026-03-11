export class CsvParser {
  /**
   * Parse CSV content into headers and rows
   */
  public parseCsvContent(content: string): { headers: string[]; rows: string[][] } {
    const lines = content.trim().split(/\r?\n/);
    
    if (lines.length === 0) {
      return { headers: [], rows: [] };
    }
    
    // Detect delimiter (comma or semicolon)
    const firstLine = lines[0];
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    const delimiter = semicolonCount > commaCount ? ';' : ',';
    
    const headers = this.parseCsvLine(lines[0], delimiter);
    const rows: string[][] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        rows.push(this.parseCsvLine(line, delimiter));
      }
    }
    
    return { headers, rows };
  }

  /**
   * Parse a single CSV line handling quoted values
   */
  private parseCsvLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }
}
