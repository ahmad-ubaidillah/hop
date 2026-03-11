import type { Step, TestContext } from '../../types/index.js';
import type { StepHandler, IStepExecutor } from './types.js';
import { join } from 'path';
import { MockServer } from '../../mock/mock-server.js';

export class CoreHandler implements StepHandler {
  canHandle(text: string): boolean {
    return text.match(/^(?:Given|When|Then|And|But|\*)?\s*start\s+mock\s+['"]/i) !== null ||
           text.match(/^(\*|Given|When|Then|And|But)?\s*def\s+(\w+)\s*=\s*(.+)$/i) !== null ||
           text.match(/^(Given|When|Then|And|But)?\s*load\s+csv\s+['"](.+)['"]\s+into\s+(\w+)$/i) !== null ||
           text.match(/^(Given|When|Then|And|But)?\s*call\s+([\w\-\/]+)\.feature/i) !== null ||
           text.match(/^(Given|When|Then|And|But)?\s*print\s+(.+)$/i) !== null ||
           text.match(/^(Given|When|Then|And|But|\*)?\s*eval\s+(.+)$/i) !== null;
  }

  async handle(text: string, step: Step, context: TestContext, executor: IStepExecutor): Promise<void> {
    const logger = executor.getLogger();
    
    const mockMatch = text.match(/^(?:Given|When|Then|And|But|\*)?\s*start\s+mock\s+['"](.+)['"](?:\s+on\s+port\s+(\d+))?/i);
    if (mockMatch) {
      const featureName = mockMatch[1];
      const port = mockMatch[2] ? parseInt(mockMatch[2]) : 8080;
      const featurePath = featureName.endsWith('.feature') ? featureName : `${featureName}.feature`;
      const fullPath = join(executor.getOptions().featuresPath || '.', featurePath);
      
      const server = new MockServer(fullPath, port, executor.getOptions().verbose);
      await server.start();
      executor.addMockServer(server);
      return;
    }

    const setMatch = text.match(/^(\*|Given|When|Then|And|But)?\s*def\s+(\w+)\s*=\s*(.+)$/i);
    if (setMatch) {
      const varName = setMatch[2];
      const valuePart = setMatch[3].trim();
      const value = valuePart;
      
      if (value.startsWith('read(')) {
        const filePath = value.match(/read\(['"](.+)['"]\)/)?.[1];
        if (filePath) {
          context.variables[varName] = await context.read(filePath);
        }
      } else if (value.startsWith('response')) {
        if (value === 'response') {
          context.variables[varName] = context.response?.body;
        } else if (value.startsWith('response.')) {
          context.variables[varName] = executor.getNestedValue(context.response?.body, value.replace('response.', ''));
        } else if (value === 'response.status' || value === 'response.statusCode') {
          context.variables[varName] = context.response?.status;
        }
      } else if (value.startsWith("'") || value.startsWith('"')) {
        context.variables[varName] = executor.stripQuotes(value);
      } else {
        context.variables[varName] = executor.parseValue(value, context);
      }
      return;
    }
    
    const csvMatch = text.match(/^(Given|When|Then|And|But)?\s*load\s+csv\s+['"](.+)['"]\s+into\s+(\w+)$/i);
    if (csvMatch) {
      const csvPath = csvMatch[2];
      const varName = csvMatch[3];
      await executor.loadCsvFile(csvPath, varName, context);
      return;
    }
    
    const callWithArgsMatch = text.match(/^(Given|When|Then|And|But)?\s*call\s+([\w\-\/]+)\.feature\s+with\s+(\{[\s\S]+\})/i);
    if (callWithArgsMatch) {
      const featurePath = callWithArgsMatch[2];
      const argsJson = callWithArgsMatch[3];
      const args = JSON.parse(argsJson);
      await executor.handleCallFeature(featurePath, context, args);
      return;
    }
    
    const callBackgroundMatch = text.match(/^(Given|When|Then|And|But)?\s*call\s+([\w\-\/]+)\.feature\s+background/i);
    if (callBackgroundMatch) {
      const featurePath = callBackgroundMatch[2];
      await executor.handleCallFeature(featurePath, context, {}, true);
      return;
    }
    
    const callMatch = text.match(/^(Given|When|Then|And|But)?\s*call\s+([\w\-\/]+)\.feature/i);
    if (callMatch) {
      const featurePath = callMatch[2];
      await executor.handleCallFeature(featurePath, context);
      return;
    }
    
    const printMatch = text.match(/^(Given|When|Then|And|But)?\s*print\s+(.+)$/i);
    if (printMatch) {
      const message = printMatch[2];
      const resolvedMessage = executor.resolveVariables(message, context);
      logger.log(`📝 ${resolvedMessage}`);
      return;
    }
    
    const evalMatch = text.match(/^(Given|When|Then|And|But|\*)?\s*eval\s+(.+)$/i);
    if (evalMatch) {
      const expression = evalMatch[2];
      try {
        const fn = new Function(...Object.keys(context.variables), `return ${expression}`);
        fn(...Object.values(context.variables));
      } catch (e) {
        throw new Error(`Failed to evaluate expression: ${expression}. Error: ${e instanceof Error ? e.message : e}`);
      }
      return;
    }
  }
}
