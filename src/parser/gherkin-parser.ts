import { readdir, readFile } from 'fs/promises';
import { join, extname, dirname } from 'path';
import type { Feature, Scenario, Step, Background, DataTable, Example } from '../types/index.js';

export class GherkinParser {
  /**
   * Discover all .feature files in a directory
   */
  async discoverFeatures(featuresPath: string): Promise<string[]> {
    const featureFiles: string[] = [];
    
    try {
      const entries = await readdir(featuresPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(featuresPath, entry.name);
        
        if (entry.isDirectory()) {
          // Recursively search subdirectories
          const subFiles = await this.discoverFeatures(fullPath);
          featureFiles.push(...subFiles);
        } else if (entry.isFile() && extname(entry.name) === '.feature') {
          featureFiles.push(fullPath);
        }
      }
    } catch (error) {
      throw new Error(`Failed to read features directory: ${featuresPath}`);
    }
    
    return featureFiles;
  }
  
  /**
   * Parse all feature files
   */
  async parseFeatures(featureFiles: string[]): Promise<Feature[]> {
    const features: Feature[] = [];
    
    for (const filePath of featureFiles) {
      try {
        const content = await readFile(filePath, 'utf-8');
        const parsed = await this.parse(content, filePath);
        features.push(parsed);
      } catch (error) {
        throw new Error(`Failed to parse feature file ${filePath}: ${error instanceof Error ? error.message : error}`);
      }
    }
    
    return features;
  }
  
  /**
   * Parse a single Gherkin feature string
   */
  async parse(gherkinContent: string, filePath: string): Promise<Feature> {
    // Use @cucumber/gherkin Parser API
    const { Parser, AstBuilder, GherkinClassicTokenMatcher } = await import('@cucumber/gherkin');
    
    // Create a simple ID generator
    const newId = () => crypto.randomUUID();
    const builder = new AstBuilder(newId);
    const tokenMatcher = new GherkinClassicTokenMatcher();
    // @ts-ignore - TypeScript types are incorrect
    const parser = new Parser(builder, tokenMatcher);
    
    const doc = parser.parse(gherkinContent);
    
    if (!doc || !doc.feature) {
      throw new Error('Invalid Gherkin document: no feature found');
    }
    
    return await this.convertToFeature(doc, filePath);
  }
  
  /**
   * Convert Gherkin AST to Hop Feature type
   */
  private async convertToFeature(doc: any, filePath: string): Promise<Feature> {
    const feature = doc.feature;
    
    const featureResult: Feature = {
      name: feature.name,
      description: feature.description,
      scenarios: [],
      tags: feature.tags?.map((t: any) => t.name.replace(/^@/, '')) || [],
      filePath,
    };
    
    // Process children (Background and Scenarios)
    for (const child of feature.children || []) {
      // Handle Background
      if (child.background) {
        featureResult.background = this.convertBackground(child.background);
      }
      // Handle Scenario or ScenarioOutline
      else if (child.scenario) {
        // Check if it's a Scenario Outline by examining the keyword
        const isOutline = child.scenario.keyword === 'Scenario Outline';
        const scenario = await this.convertScenario(child.scenario, isOutline, filePath);
        featureResult.scenarios.push(scenario);
      }
    }
    
    return featureResult;
  }
  
  private convertBackground(bg: any): Background {
    return {
      steps: bg.steps.map((s: any) => this.convertStep(s)),
    };
  }
  
  private async convertScenario(scenario: any, isOutline: boolean, filePath: string): Promise<Scenario> {
    const result: Scenario = {
      name: scenario.name,
      steps: scenario.steps.map((s: any) => this.convertStep(s)),
      tags: scenario.tags?.map((t: any) => t.name.replace(/^@/, '')) || [],
      outline: isOutline,
    };
    
    // Handle Scenario Outline examples
    if (isOutline && scenario.examples && scenario.examples.length > 0) {
      result.examples = [];
      for (const ex of scenario.examples) {
        const example = await this.convertExample(ex, filePath);
        result.examples.push(example);
      }
    }
    
    return result;
  }
  
  private async convertExample(examples: any, filePath: string): Promise<Example> {
    // Check if examples uses @file() syntax to load CSV
    const exampleName = examples.name || 'Examples';
    const fileMatch = exampleName.match(/^@file\((.+)\)$/);
    
    if (fileMatch) {
      // Load data from CSV file
      const csvPath = fileMatch[1].trim();
      const table = await this.parseCsvFile(csvPath, filePath);
      return {
        name: `Examples from ${csvPath}`,
        table,
      };
    }
    
    // Standard inline table
    const headers = examples.tableHeader?.cells?.map((c: any) => c.value) || [];
    const rows = examples.tableBody?.map((row: any) => row.cells.map((c: any) => c.value)) || [];
    
    return {
      name: exampleName,
      table: { headers, rows },
    };
  }
  
  private convertStep(step: any): Step {
    const keyword = this.mapKeyword(step.keyword);
    
    const result: Step = {
      keyword,
      text: step.text,
      line: step.location?.line || 0,
    };
    
    if (step.docString) {
      result.docString = step.docString.content;
    }
    
    if (step.dataTable) {
      result.dataTable = this.convertDataTable(step.dataTable);
    }
    
    return result;
  }
  
  private convertDataTable(table: any): DataTable {
    const headers = table.rows?.[0]?.cells?.map((c: any) => c.value) || [];
    const rows = table.rows?.slice(1).map((row: any) => row.cells.map((c: any) => c.value)) || [];
    
    return { headers, rows };
  }
  
  private mapKeyword(keyword: string): Step['keyword'] {
    const mapping: Record<string, Step['keyword']> = {
      'Given': 'Given',
      'When': 'When',
      'Then': 'Then',
      'And': 'And',
      'But': 'But',
      'given': 'Given',
      'when': 'When',
      'then': 'Then',
      'and': 'And',
      'but': 'But',
    };
    
    return mapping[keyword] || 'Given';
  }
  
  /**
   * Parse a CSV file and return DataTable
   * Supports both comma and semicolon delimiters
   */
  private async parseCsvFile(filePath: string, featureFilePath: string): Promise<DataTable> {
    // Resolve relative path from feature file directory
    const baseDir = dirname(featureFilePath);
    const fullPath = join(baseDir, filePath);
    
    try {
      const content = await readFile(fullPath, 'utf-8');
      return this.parseCsvContent(content);
    } catch (error) {
      throw new Error(`Failed to read CSV file '${filePath}': ${error instanceof Error ? error.message : error}`);
    }
  }
  
  /**
   * Parse CSV content into DataTable
   */
  private parseCsvContent(content: string): DataTable {
    const lines = content.trim().split(/\r?\n/);
    
    if (lines.length === 0) {
      return { headers: [], rows: [] };
    }
    
    // Detect delimiter (comma or semicolon) based on first line
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
