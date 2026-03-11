import { readFile, stat } from 'fs/promises';
import { dirname, join, resolve, extname } from 'path';
import type { DataTable } from '../types/index.js';

export class DataTableParser {
  /**
   * Parse a CSV file and return DataTable
   * Supports both comma and semicolon delimiters
   */
  static async parseCsvFile(filePath: string, featureFilePath: string): Promise<DataTable> {
    // Resolve relative path from feature file directory
    const baseDir = dirname(featureFilePath);
    const fullPath = join(baseDir, filePath);
    
    try {
      const content = await readFile(fullPath, 'utf-8');
      return DataTableParser.parseCsvContent(content);
    } catch (error) {
      throw new Error(`Failed to read CSV file '${filePath}': ${error instanceof Error ? error.message : error}`);
    }
  }
  
  /**
   * Parse CSV content into DataTable
   */
  static parseCsvContent(content: string): DataTable {
    const lines = content.trim().split(/\r?\n/);
    
    if (lines.length === 0) {
      return { headers: [], rows: [] };
    }
    
    // Detect delimiter (comma or semicolon) based on first line
    const firstLine = lines[0];
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    const delimiter = semicolonCount > commaCount ? ';' : ',';
    
    const headers = DataTableParser.parseCsvLine(lines[0], delimiter);
    const rows: string[][] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        rows.push(DataTableParser.parseCsvLine(line, delimiter));
      }
    }
    
    return { headers, rows };
  }
  
  /**
   * Parse a single CSV line handling quoted values
   */
  private static parseCsvLine(line: string, delimiter: string): string[] {
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
  
  /**
   * Parse a data file (CSV or JSON) and return DataTable
   */
  static async parseDataFile(filePath: string, featureFilePath: string): Promise<DataTable> {
    const data = await DataTableParser.read(filePath, featureFilePath);
    
    if (Array.isArray(data)) {
      // JSON Array of objects
      if (data.length === 0) return { headers: [], rows: [] };
      const headers = Object.keys(data[0]);
      const rows = data.map((obj: any) => headers.map(h => String(obj[h] ?? '')));
      return { headers, rows };
    } else if (data && typeof data === 'object' && 'headers' in data && 'rows' in data) {
      // Already a DataTable structure (e.g. from parseCsvContent)
      return data;
    }
    
    throw new Error(`Unsupported data file format for '${filePath}'. Expected JSON array or CSV.`);
  }

  /**
   * Read and parse a file (JSON, CSV, or text)
   * This is used for the read() function in feature files
   */
  static async read(filePath: string, featureFilePath?: string): Promise<any> {
    // Resolve path relative to feature file if provided, otherwise CWD
    const baseDir = featureFilePath ? dirname(featureFilePath) : process.cwd();
    const fullPath = resolve(baseDir, filePath);
    
    try {
      const stats = await stat(fullPath);
      if (!stats.isFile()) {
        throw new Error(`Path is not a file: ${fullPath}`);
      }
      
      const content = await readFile(fullPath, 'utf-8');
      const ext = extname(filePath).toLowerCase();
      
      if (ext === '.json') {
        return JSON.parse(content);
      } else if (ext === '.csv') {
        return DataTableParser.parseCsvContent(content);
      } else if (ext === '.yml' || ext === '.yaml') {
        // Simple YAML parser if needed, or just return as text
        return content;
      }
      
      return content;
    } catch (error) {
      throw new Error(`Failed to read file '${filePath}': ${error instanceof Error ? error.message : error}`);
    }
  }
}
