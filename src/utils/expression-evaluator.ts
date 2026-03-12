import type { TestContext } from '../types/index.js';

export class ExpressionEvaluator {
  public evaluate(expression: string, context: TestContext): any {
    try {
      if (expression.startsWith("'") || expression.startsWith('"')) {
        return this.stripQuotes(expression);
      }

      // Simple numeric optimization
      if (expression && !isNaN(Number(expression)) && !expression.includes('-') && !expression.includes(':')) {
        return Number(expression);
      }

      // Evaluate as JS expression
      const keys = Object.keys(context.variables);
      const values = Object.values(context.variables);
      const fn = new Function(...keys, `return ${expression}`);
      return fn(...values);
    } catch {
      return expression;
    }
  }

  private stripQuotes(value: string): string {
    if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
      return value.slice(1, -1);
    }
    return value;
  }
}
