/**
 * Built-in Steps for Loops - Priority 2
 * "And repeat until" functionality
 */

export interface LoopOptions {
  maxIterations?: number;
  delayMs?: number;
  breakCondition?: string;
}

export interface LoopContext {
  iterations: number;
  currentValue?: any;
  index?: number;
  shouldBreak: boolean;
}

/**
 * Loop Runner
 */
export class LoopRunner {
  private maxIterations: number = 100;
  private delayMs: number = 0;

  /**
   * Set max iterations
   */
  setMaxIterations(max: number): void {
    this.maxIterations = max;
  }

  /**
   * Set delay between iterations
   */
  setDelay(ms: number): void {
    this.delayMs = ms;
  }

  /**
   * Run loop with array
   */
  async runForEach<T>(
    items: T[],
    callback: (item: T, index: number, context: LoopContext) => Promise<void> | void
  ): Promise<LoopContext[]> {
    const results: LoopContext[] = [];

    for (let i = 0; i < items.length; i++) {
      const context: LoopContext = {
        iterations: i + 1,
        currentValue: items[i],
        index: i,
        shouldBreak: false,
      };

      await callback(items[i], i, context);
      results.push(context);

      if (context.shouldBreak) {
        break;
      }

      if (this.delayMs > 0) {
        await this.delay(this.delayMs);
      }
    }

    return results;
  }

  /**
   * Run loop with condition
   */
  async runWhile(
    condition: () => boolean | Promise<boolean>,
    callback: (context: LoopContext) => Promise<void> | void
  ): Promise<LoopContext[]> {
    const results: LoopContext[] = [];
    let iterations = 0;

    while ((await condition()) && iterations < this.maxIterations) {
      const context: LoopContext = {
        iterations: iterations + 1,
        shouldBreak: false,
      };

      await callback(context);
      results.push(context);

      if (context.shouldBreak) {
        break;
      }

      iterations++;

      if (this.delayMs > 0) {
        await this.delay(this.delayMs);
      }
    }

    return results;
  }

  /**
   * Run loop with count
   */
  async runTimes(
    count: number,
    callback: (context: LoopContext) => Promise<void> | void
  ): Promise<LoopContext[]> {
    const results: LoopContext[] = [];

    for (let i = 0; i < count; i++) {
      const context: LoopContext = {
        iterations: i + 1,
        index: i,
        shouldBreak: false,
      };

      await callback(context);
      results.push(context);

      if (context.shouldBreak) {
        break;
      }

      if (this.delayMs > 0) {
        await this.delay(this.delayMs);
      }
    }

    return results;
  }

  /**
   * Repeat until condition is met
   */
  async repeatUntil(
    callback: (context: LoopContext) => Promise<boolean>,
    maxIterations?: number
  ): Promise<{ success: boolean; iterations: number }> {
    const limit = maxIterations || this.maxIterations;

    for (let i = 0; i < limit; i++) {
      const context: LoopContext = {
        iterations: i + 1,
        index: i,
        shouldBreak: false,
      };

      const result = await callback(context);

      if (result) {
        return { success: true, iterations: i + 1 };
      }

      if (this.delayMs > 0) {
        await this.delay(this.delayMs);
      }
    }

    return { success: false, iterations: limit };
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create loop runner
 */
export function createLoopRunner(): LoopRunner {
  return new LoopRunner();
}

/**
 * Loop handler for step executor
 */
export function createLoopSteps(): Record<string, Function> {
  const runner = new LoopRunner();

  return {
    /**
     * Repeat for each item in list
     */
    'repeat for each': async function (this: any, items: any[], callback: (item: any, index: number, context: LoopContext) => Promise<void> | void) {
      return runner.runForEach(items, callback);
    },

    /**
     * Repeat N times
     */
    'repeat': async function (this: any, count: number, callback: (context: LoopContext) => Promise<void> | void) {
      return runner.runTimes(count, callback);
    },

    /**
     * Repeat until condition is true
     */
    'repeat until': async function (this: any, condition: () => Promise<boolean>, callback: (context: LoopContext) => Promise<void> | void) {
      return runner.repeatUntil(async () => await condition());
    },

    /**
     * Break from loop
     */
    'break': function (this: any, context: LoopContext) {
      context.shouldBreak = true;
    },
  };
}
