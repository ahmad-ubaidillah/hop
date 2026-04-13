import { readFile } from 'fs/promises';
import { FeatureDiscovery } from './feature-discovery.js';
import { ScenarioMapper } from './scenario-mapper.js';
export class GherkinParser {
    discovery;
    mapper;
    constructor() {
        this.discovery = new FeatureDiscovery();
        this.mapper = new ScenarioMapper();
    }
    async discoverFeatures(featuresPath) {
        return this.discovery.discover(featuresPath);
    }
    async parseFeatures(featureFiles) {
        const features = [];
        for (const filePath of featureFiles) {
            try {
                const content = await readFile(filePath, 'utf-8');
                features.push(await this.parse(content, filePath));
            }
            catch (error) {
                throw new Error(`Failed to parse feature file ${filePath}: ${error instanceof Error ? error.message : error}`);
            }
        }
        return features;
    }
    async parse(gherkinContent, filePath) {
        const { Parser, AstBuilder, GherkinClassicTokenMatcher } = await import('@cucumber/gherkin');
        const builder = new AstBuilder(() => crypto.randomUUID());
        const tokenMatcher = new GherkinClassicTokenMatcher();
        const parser = new Parser(builder, tokenMatcher);
        const doc = parser.parse(gherkinContent);
        if (!doc || !doc.feature)
            throw new Error('Invalid Gherkin document: no feature found');
        return await this.convertToFeature(doc, filePath);
    }
    async convertToFeature(doc, filePath) {
        const feature = doc.feature;
        const result = {
            name: feature.name,
            description: feature.description,
            scenarios: [],
            tags: feature.tags?.map((t) => t.name.replace(/^@/, '')) || [],
            filePath,
        };
        for (const child of feature.children || []) {
            if (child.background) {
                result.background = { steps: child.background.steps.map((s) => this.mapper.convertStep(s)) };
            }
            else if (child.rule) {
                const rule = this.mapper.convertRule(child.rule, filePath);
                result.rules = result.rules || [];
                result.rules.push(rule);
                result.scenarios.push(...rule.scenarios);
            }
            else if (child.scenario) {
                result.scenarios.push(await this.mapper.convertScenario(child.scenario, child.scenario.keyword === 'Scenario Outline', filePath));
            }
        }
        return result;
    }
    async read(filePath, featureFilePath) {
        const { DataTableParser } = await import('./data-table-parser.js');
        return DataTableParser.read(filePath, featureFilePath);
    }
}
