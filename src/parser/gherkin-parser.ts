import { readdir, readFile, stat } from 'fs/promises';
import { join, extname } from 'path';
import { DataTableParser } from './data-table-parser.js';
import type { Feature, Scenario, Step, Background, DataTable, Example, Rule } from '../types/index.js';

export class GherkinParser {
  /**
   * Discover all .feature files in a directory
   */
  async discoverFeatures(featuresPath: string): Promise<string[]> {
    const featureFiles: string[] = [];
    
    try {
      const stats = await stat(featuresPath);
      
      if (stats.isFile()) {
        if (extname(featuresPath) === '.feature') {
          return [featuresPath];
        }
        return [];
      }
      
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
    
    // Process children (Background, Rules, and Scenarios)
    for (const child of feature.children || []) {
      // Handle Background
      if (child.background) {
        featureResult.background = this.convertBackground(child.background);
      }
      // Handle Rule (Gherkin 6+)
      else if (child.rule) {
        const rule = await this.convertRule(child.rule, filePath);
        if (rule) {
          featureResult.rules = featureResult.rules || [];
          featureResult.rules.push(rule);
          // Add rule scenarios to the feature's scenarios
          featureResult.scenarios.push(...rule.scenarios);
        }
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

  /**
   * Convert a Rule (Gherkin 6+) to Rule type
   */
  private convertRule(rule: any, filePath: string): Rule | null {
    const scenarios: Scenario[] = [];
    
    // Process rule children (scenarios)
    for (const child of rule.children || []) {
      if (child.scenario) {
        // Check if it's a Scenario Outline
        const isOutline = child.scenario.keyword === 'Scenario Outline';
        const scenario = this.convertScenarioSync(child.scenario, isOutline, filePath);
        scenarios.push(scenario);
      }
    }
    
    return {
      name: rule.name,
      description: rule.description,
      scenarios,
      tags: rule.tags?.map((t: any) => t.name.replace(/^@/, '')) || [],
    };
  }

  /**
   * Synchronous version of convertScenario for Rules
   */
  private convertScenarioSync(scenario: any, isOutline: boolean, filePath: string): Scenario {
    const result: Scenario = {
      name: scenario.name,
      steps: scenario.steps.map((s: any) => this.convertStep(s)),
      tags: scenario.tags?.map((t: any) => t.name.replace(/^@/, '')) || [],
      outline: isOutline,
    };
    
    // Handle Scenario Outline examples - just store the structure (data loaded lazily)
    if (isOutline && scenario.examples && scenario.examples.length > 0) {
      result.examples = [];
      for (const ex of scenario.examples) {
        const headers = ex.tableHeader?.cells?.map((c: any) => c.value) || [];
        const rows = ex.tableBody?.map((row: any) => row.cells.map((c: any) => c.value)) || [];
        
        result.examples.push({
          name: ex.name || 'Examples',
          table: { headers, rows },
        });
      }
    }
    
    return result;
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
        const exampleName = ex.name || 'Examples';
        const fileMatch = exampleName.match(/^@file\((.+)\)$/);
        
        if (fileMatch) {
          const dataFilePath = fileMatch[1].trim();
          const table = await this.parseDataFile(dataFilePath, filePath);
          result.examples.push({
            name: `Examples from ${dataFilePath}`,
            table,
          });
        } else {
          const example = await this.convertExample(ex, filePath);
          result.examples.push(example);
        }
      }
    }
    
    return result;
  }
  
  private async convertExample(examples: any, filePath: string): Promise<Example> {
    // Normal case: Convert inline table
    const headers = examples.tableHeader?.cells?.map((c: any) => c.value) || [];
    const rows = examples.tableBody?.map((row: any) => row.cells.map((c: any) => c.value)) || [];
    
    return {
      name: examples.name || 'Examples',
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
   * Parse a data file (CSV or JSON) and return DataTable
   */
  private async parseDataFile(filePath: string, featureFilePath: string): Promise<DataTable> {
    return DataTableParser.parseDataFile(filePath, featureFilePath);
  }

  /**
   * Read and parse a file (JSON, CSV, or text)
   * This is used for the read() function in feature files
   */
  async read(filePath: string, featureFilePath?: string): Promise<any> {
    return DataTableParser.read(filePath, featureFilePath);
  }
}
