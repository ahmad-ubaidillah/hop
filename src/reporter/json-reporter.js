import { writeFile } from 'fs/promises';
import { join } from 'path';
/**
 * JSON Report Generator
 * Generates machine-readable JSON report for dashboard integration
 */
export class JsonReporter {
    outputPath;
    constructor(outputPath = './reports') {
        this.outputPath = outputPath;
    }
    /**
     * Generate JSON report from test results
     */
    async generate(results) {
        const report = this.buildReport(results);
        const json = JSON.stringify(report, null, 2);
        const filename = `json-report-${Date.now()}.json`;
        const filepath = join(this.outputPath, filename);
        await writeFile(filepath, json, 'utf-8');
        return filepath;
    }
    /**
     * Build JSON report structure
     */
    buildReport(results) {
        const summary = this.buildSummary(results);
        const features = this.groupByFeature(results);
        return {
            framework: 'Hop BDD',
            version: '1.0.0',
            generatedAt: new Date().toISOString(),
            summary,
            features,
            results: results.map(r => this.transformResult(r))
        };
    }
    buildSummary(results) {
        const passed = results.filter(r => r.status === 'passed').length;
        const failed = results.filter(r => r.status === 'failed').length;
        const skipped = results.filter(r => r.status === 'skipped').length;
        const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
        return {
            total: results.length,
            passed,
            failed,
            skipped,
            duration: totalDuration,
            passRate: results.length > 0 ? ((passed / results.length) * 100).toFixed(2) + '%' : '0%'
        };
    }
    groupByFeature(results) {
        const grouped = {};
        for (const result of results) {
            if (!grouped[result.featureName]) {
                grouped[result.featureName] = [];
            }
            grouped[result.featureName].push(result);
        }
        const featureSummary = {};
        for (const [name, featureResults] of Object.entries(grouped)) {
            const passed = featureResults.filter(r => r.status === 'passed').length;
            const failed = featureResults.filter(r => r.status === 'failed').length;
            featureSummary[name] = {
                scenarios: featureResults.length,
                passed,
                failed,
                results: featureResults.map(r => ({
                    name: r.scenarioName,
                    status: r.status,
                    duration: r.duration,
                    error: r.error
                }))
            };
        }
        return featureSummary;
    }
    transformResult(result) {
        return {
            feature: result.featureName,
            scenario: result.scenarioName,
            status: result.status,
            duration: result.duration,
            tags: result.tags,
            error: result.error,
            steps: result.steps.map(s => ({
                keyword: s.step.keyword,
                text: s.step.text,
                status: s.status,
                duration: s.duration,
                error: s.error
            }))
        };
    }
}
