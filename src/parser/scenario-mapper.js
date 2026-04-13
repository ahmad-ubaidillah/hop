import { DataTableParser } from './data-table-parser.js';
export class ScenarioMapper {
    convertStep(step) {
        const keyword = this.mapKeyword(step.keyword);
        const result = {
            keyword,
            text: step.text,
            line: step.location?.line || 0,
        };
        if (step.docString) {
            result.docString = step.docString.content;
            // Support Gherkin docString with content type: """application/json
            // or """application/xml
            if (step.docString.mediaType) {
                result.docStringContentType = step.docString.mediaType;
            }
            else if (step.docString.content?.trim().startsWith('{') || step.docString.content?.trim().startsWith('[')) {
                // Try to detect JSON content
                try {
                    JSON.parse(step.docString.content.trim());
                    result.docStringContentType = 'application/json';
                }
                catch { }
            }
            else if (step.docString.content?.trim().startsWith('<')) {
                // Try to detect XML content
                result.docStringContentType = 'application/xml';
            }
        }
        if (step.dataTable)
            result.dataTable = this.convertDataTable(step.dataTable);
        return result;
    }
    convertDataTable(table) {
        const headers = table.rows?.[0]?.cells?.map((c) => c.value) || [];
        const rows = table.rows?.slice(1).map((row) => row.cells.map((c) => c.value)) || [];
        return { headers, rows };
    }
    async convertScenario(scenario, isOutline, filePath) {
        const result = {
            name: scenario.name,
            steps: scenario.steps.map((s) => this.convertStep(s)),
            tags: scenario.tags?.map((t) => t.name.replace(/^@/, '')) || [],
            outline: isOutline,
        };
        if (isOutline && scenario.examples?.length > 0) {
            result.examples = [];
            for (const ex of scenario.examples) {
                const exampleName = ex.name || 'Examples';
                const fileMatch = exampleName.match(/^@file\((.+)\)$/);
                if (fileMatch) {
                    const dataFilePath = fileMatch[1].trim();
                    result.examples.push({
                        name: `Examples from ${dataFilePath}`,
                        table: await DataTableParser.parseDataFile(dataFilePath, filePath),
                    });
                }
                else {
                    result.examples.push({
                        name: exampleName,
                        table: {
                            headers: ex.tableHeader?.cells?.map((c) => c.value) || [],
                            rows: ex.tableBody?.map((row) => row.cells.map((c) => c.value)) || [],
                        },
                    });
                }
            }
        }
        return result;
    }
    convertRule(rule, filePath) {
        const scenarios = [];
        for (const child of rule.children || []) {
            if (child.scenario) {
                scenarios.push(this.convertScenarioSync(child.scenario, child.scenario.keyword === 'Scenario Outline', filePath));
            }
        }
        return {
            name: rule.name,
            description: rule.description,
            scenarios,
            tags: rule.tags?.map((t) => t.name.replace(/^@/, '')) || [],
        };
    }
    convertScenarioSync(scenario, isOutline, filePath) {
        const result = {
            name: scenario.name,
            steps: scenario.steps.map((s) => this.convertStep(s)),
            tags: scenario.tags?.map((t) => t.name.replace(/^@/, '')) || [],
            outline: isOutline,
        };
        if (isOutline && scenario.examples?.length > 0) {
            result.examples = scenario.examples.map((ex) => ({
                name: ex.name || 'Examples',
                table: {
                    headers: ex.tableHeader?.cells?.map((c) => c.value) || [],
                    rows: ex.tableBody?.map((row) => row.cells.map((c) => c.value)) || [],
                },
            }));
        }
        return result;
    }
    mapKeyword(keyword) {
        const kw = keyword.trim().charAt(0).toUpperCase() + keyword.trim().slice(1).toLowerCase();
        const allowed = ['Given', 'When', 'Then', 'And', 'But'];
        return (allowed.includes(kw) ? kw : 'Given');
    }
}
