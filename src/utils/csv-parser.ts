import { readFile } from 'fs/promises';

export interface CsvParseResult {
  headers: string[];
  rows: string[][];
}

export class CsvParser {
  parseCsvContent(content: string): CsvParseResult {
    const lines = content.trim().split('\n');
    if (lines.length === 0) {
      return { headers: [], rows: [] };
    }

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseLine(lines[0]);
    const rows = lines.slice(1).map(parseLine);

    return { headers, rows };
  }

  async parseCsvFile(filePath: string): Promise<CsvParseResult> {
    const content = await readFile(filePath, 'utf-8');
    return this.parseCsvContent(content);
  }
}
