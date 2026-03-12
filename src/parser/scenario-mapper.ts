import type { Scenario, Step, DataTable, Example, Rule } from '../types/index.js';
import { DataTableParser } from './data-table-parser.js';

export class ScenarioMapper {
  public convertStep(step: any): Step {
    const keyword = this.mapKeyword(step.keyword);
    const result: Step = {
      keyword,
      text: step.text,
      line: step.location?.line || 0,
    };
    if (step.docString) result.docString = step.docString.content;
    if (step.dataTable) result.dataTable = this.convertDataTable(step.dataTable);
    return result;
  }

  public convertDataTable(table: any): DataTable {
    const headers = table.rows?.[0]?.cells?.map((c: any) => c.value) || [];
    const rows = table.rows?.slice(1).map((row: any) => row.cells.map((c: any) => c.value)) || [];
    return { headers, rows };
  }

  public async convertScenario(scenario: any, isOutline: boolean, filePath: string): Promise<Scenario> {
    const result: Scenario = {
      name: scenario.name,
      steps: scenario.steps.map((s: any) => this.convertStep(s)),
      tags: scenario.tags?.map((t: any) => t.name.replace(/^@/, '')) || [],
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
        } else {
          result.examples.push({
            name: exampleName,
            table: {
              headers: ex.tableHeader?.cells?.map((c: any) => c.value) || [],
              rows: ex.tableBody?.map((row: any) => row.cells.map((c: any) => c.value)) || [],
            },
          });
        }
      }
    }
    return result;
  }

  public convertRule(rule: any, filePath: string): Rule {
    const scenarios: Scenario[] = [];
    for (const child of rule.children || []) {
      if (child.scenario) {
        scenarios.push(this.convertScenarioSync(child.scenario, child.scenario.keyword === 'Scenario Outline', filePath));
      }
    }
    return {
      name: rule.name,
      description: rule.description,
      scenarios,
      tags: rule.tags?.map((t: any) => t.name.replace(/^@/, '')) || [],
    };
  }

  private convertScenarioSync(scenario: any, isOutline: boolean, filePath: string): Scenario {
    const result: Scenario = {
      name: scenario.name,
      steps: scenario.steps.map((s: any) => this.convertStep(s)),
      tags: scenario.tags?.map((t: any) => t.name.replace(/^@/, '')) || [],
      outline: isOutline,
    };
    if (isOutline && scenario.examples?.length > 0) {
      result.examples = scenario.examples.map((ex: any) => ({
        name: ex.name || 'Examples',
        table: {
          headers: ex.tableHeader?.cells?.map((c: any) => c.value) || [],
          rows: ex.tableBody?.map((row: any) => row.cells.map((c: any) => c.value)) || [],
        },
      }));
    }
    return result;
  }

  private mapKeyword(keyword: string): Step['keyword'] {
    const kw = keyword.trim().charAt(0).toUpperCase() + keyword.trim().slice(1).toLowerCase();
    const allowed = ['Given', 'When', 'Then', 'And', 'But'];
    return (allowed.includes(kw) ? kw : 'Given') as Step['keyword'];
  }
}
