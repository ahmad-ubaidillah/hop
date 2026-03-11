import type { Step, TestContext } from '../../types/index.js';
import type { StepHandler, IStepExecutor } from './types.js';

export class AssertionHandler implements StepHandler {
  canHandle(text: string): boolean {
    return text.match(/^(?:\*|Given|When|Then|And|But)?\s*status (\d+)/i) !== null ||
           text.match(/^(?:\*|Given|When|Then|And|But)?\s*match responseTime\s*(<|>|==|!=)\s*(\d+)/i) !== null ||
           text.match(/^(Given|When|Then|And|But|\*)?\s*match\s+(each\s+)?(.+?)\s+(==|contains|any)\s+(.+)$/i) !== null;
  }

  async handle(text: string, step: Step, context: TestContext, executor: IStepExecutor): Promise<void> {
    const validator = executor.getValidator();
    const logger = executor.getLogger();
    const options = executor.getOptions();

    const statusMatch = text.match(/^(?:\*|Given|When|Then|And|But)?\s*status (\d+)/i);
    if (statusMatch) {
      const expectedStatus = parseInt(statusMatch[1]);
      if (context.response?.status !== expectedStatus) {
        throw new Error(`Expected status ${expectedStatus}, but got ${context.response?.status}`);
      }
      return;
    }
    
    const responseTimeMatch = text.match(/^(?:\*|Given|When|Then|And|But)?\s*match responseTime\s*(<|>|==|!=)\s*(\d+)/i);
    if (responseTimeMatch) {
      const operator = responseTimeMatch[1];
      const expectedValue = parseInt(responseTimeMatch[2]);
      const actualTime = (context.response as any)?.responseTime || 0;
      
      let passed = false;
      switch (operator) {
        case '<':
          passed = actualTime < expectedValue;
          break;
        case '>':
          passed = actualTime > expectedValue;
          break;
        case '==':
          passed = actualTime === expectedValue;
          break;
        case '!=':
          passed = actualTime !== expectedValue;
          break;
      }
      
      if (!passed) {
        throw new Error(`Expected responseTime ${operator} ${expectedValue}ms, but got ${actualTime}ms`);
      }
      return;
    }
    
    const matchMatch = text.match(/^(Given|When|Then|And|But|\*)?\s*match\s+(each\s+)?(.+?)\s+(==|contains|any)\s+(.+)$/i);
    if (matchMatch) {
      const isEach = !!matchMatch[2];
      const target = (matchMatch[3] || '').trim();
      const operator = matchMatch[4].toLowerCase();
      let expected = (matchMatch[5] || '').trim();
      
      expected = executor.stripQuotes(expected);
      
      let actual: any;
      if (target === 'response') {
        actual = context.response?.body;
      } else if (target.startsWith('response.')) {
        actual = executor.getNestedValue(context.response?.body, target.substring(9));
      } else {
        const dotIndex = target.indexOf('.');
        const bracketIndex = target.indexOf('[');
        const splitIndex = (dotIndex > -1 && bracketIndex > -1) 
          ? Math.min(dotIndex, bracketIndex) 
          : (dotIndex > -1 ? dotIndex : bracketIndex);
          
        if (splitIndex > -1) {
          const varName = target.substring(0, splitIndex);
          const path = target.substring(splitIndex).startsWith('.') ? target.substring(splitIndex + 1) : target.substring(splitIndex);
          actual = executor.getNestedValue(context.variables[varName], path);
        } else {
          actual = context.variables[target];
        }
      }
      
      let expectedParsed: any;
      
      if ((expected.startsWith('{') && expected.endsWith('}')) || 
               (expected.startsWith('[') && expected.endsWith(']'))) {
        try {
          expectedParsed = JSON.parse(expected);
        } catch {
          expectedParsed = executor.parseGherkinJson(expected);
        }
      } else {
        expectedParsed = executor.parseValue(expected, context);
      }
      
      if (options.verbose) {
        logger.log(`🔍 Asserting: ${target} [${typeof actual}] ${operator} expected [${typeof expectedParsed}]`);
      }

      if (isEach) {
        if (!Array.isArray(actual)) {
          throw new Error(`'each' matcher expects an array, but got ${typeof actual}`);
        }
        
        for (let i = 0; i < actual.length; i++) {
          try {
            if (operator === 'contains') {
              validator.validateContains(actual[i], expectedParsed, context);
            } else if (operator === 'any') {
              validator.validateAny(actual[i], expectedParsed as any[], context);
            } else {
              validator.validate(actual[i], expectedParsed, context);
            }
          } catch (e) {
            throw new Error(`Array match failed at index ${i}: ${e instanceof Error ? e.message : String(e)}`);
          }
        }
      } else {
        if (operator === 'contains') {
          validator.validateContains(actual, expectedParsed, context);
        } else if (operator === 'any') {
          validator.validateAny(actual, expectedParsed as any[], context);
        } else {
          validator.validate(actual, expectedParsed, context);
        }
      }
      return;
    }
  }
}
