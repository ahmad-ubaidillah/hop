import type { Step, TestContext } from '../../types/index.js';
import type { StepHandler, IStepExecutor } from './types.js';

export class DbHandler implements StepHandler {
  canHandle(text: string): boolean {
    return text.match(/^(?:Given|When|Then|And|But|\*)?\s*(?:def\s+\w+\s*=\s*)?db\./i) !== null;
  }

  async handle(text: string, step: Step, context: TestContext, executor: IStepExecutor): Promise<void> {
    const db = executor.getDbManager();
    const logger = executor.getLogger();
    const options = executor.getOptions();
    
    const connectMatch = text.match(/db\.connect\(\s*(.+)\s*\)/i);
    if (connectMatch) {
      const config = executor.parseValue(connectMatch[1].trim(), context);
      db.connect(config);
      return;
    }

    const executeMatch = text.match(/db\.execute\(\s*(['"])([\s\S]+?)\1\s*(?:,\s*(\[[\s\S]+?\]))?\s*\)/i);
    if (executeMatch) {
      const sql = executeMatch[2];
      const params = executeMatch[3] ? executor.parseValue(executeMatch[3].trim(), context) : [];
      db.execute(sql, params);
      return;
    }

    const queryMatch = text.match(/^(?:Given|When|Then|And|But|\*)?\s*(?:def\s+(\w+)\s*=\s*)?db\.query\(\s*(['"])([\s\S]+?)\2\s*(?:,\s*(\[[\s\S]+?\]))?\s*\)/i);
    if (queryMatch) {
      const varName = queryMatch[1];
      const sql = queryMatch[3];
      const params = queryMatch[4] ? executor.parseValue(queryMatch[4].trim(), context) : [];
      const result = db.query(sql, params);
      
      if (varName) {
        if (options.verbose) {
          logger.log(`📊 Storing result in variable '${varName}' (${Array.isArray(result) ? 'array' : typeof result}):`, JSON.stringify(result).substring(0, 100));
        }
        context.variables[varName] = result;
      }
      return;
    }
  }
}
