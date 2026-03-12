import { readFile } from 'fs/promises';
import { FeatureDiscovery } from './feature-discovery.js';
import { ScenarioMapper } from './scenario-mapper.js';
import type { Feature, Background } from '../types/index.js';

export class GherkinParser {
  private discovery: FeatureDiscovery;
  private mapper: ScenarioMapper;

  constructor() {
    this.discovery = new FeatureDiscovery();
    this.mapper = new ScenarioMapper();
  }

  async discoverFeatures(featuresPath: string): Promise<string[]> {
    return this.discovery.discover(featuresPath);
  }
  
  async parseFeatures(featureFiles: string[]): Promise<Feature[]> {
    const features: Feature[] = [];
    for (const filePath of featureFiles) {
      try {
        const content = await readFile(filePath, 'utf-8');
        features.push(await this.parse(content, filePath));
      } catch (error) {
        throw new Error(`Failed to parse feature file ${filePath}: ${error instanceof Error ? error.message : error}`);
      }
    }
    return features;
  }
  
  async parse(gherkinContent: string, filePath: string): Promise<Feature> {
    const { Parser, AstBuilder, GherkinClassicTokenMatcher } = await import('@cucumber/gherkin');
    const builder = new AstBuilder(() => crypto.randomUUID());
    const tokenMatcher = new GherkinClassicTokenMatcher();
    // @ts-ignore
    const parser = new Parser(builder, tokenMatcher);
    const doc = parser.parse(gherkinContent);
    if (!doc || !doc.feature) throw new Error('Invalid Gherkin document: no feature found');
    return await this.convertToFeature(doc, filePath);
  }
  
  private async convertToFeature(doc: any, filePath: string): Promise<Feature> {
    const feature = doc.feature;
    const result: Feature = {
      name: feature.name,
      description: feature.description,
      scenarios: [],
      tags: feature.tags?.map((t: any) => t.name.replace(/^@/, '')) || [],
      filePath,
    };
    
    for (const child of feature.children || []) {
      if (child.background) {
        result.background = { steps: child.background.steps.map((s: any) => this.mapper.convertStep(s)) };
      } else if (child.rule) {
        const rule = this.mapper.convertRule(child.rule, filePath);
        result.rules = result.rules || [];
        result.rules.push(rule);
        result.scenarios.push(...rule.scenarios);
      } else if (child.scenario) {
        result.scenarios.push(await this.mapper.convertScenario(child.scenario, child.scenario.keyword === 'Scenario Outline', filePath));
      }
    }
    return result;
  }

  async read(filePath: string, featureFilePath?: string): Promise<any> {
    const { DataTableParser } = await import('./data-table-parser.js');
    return DataTableParser.read(filePath, featureFilePath);
  }
}
