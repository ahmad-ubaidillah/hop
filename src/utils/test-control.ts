/**
 * Test Control Flow for Hop Framework
 * Priority 15: Test dependencies, skip logic, categories
 */

export interface TestDependency {
  testId: string;
  dependsOn: string[];
  condition: 'passed' | 'failed' | 'skipped' | 'any';
}

export interface TestCategory {
  name: string;
  tags: string[];
  priority?: number;
}

export interface TestResult {
  testId: string;
  status: 'passed' | 'failed' | 'skipped' | 'pending';
  duration?: number;
  error?: string;
}

/**
 * Test Dependency Manager
 */
export class TestDependencyManager {
  private dependencies: Map<string, TestDependency> = new Map();
  private results: Map<string, TestResult> = new Map();

  /**
   * Register a test dependency
   */
  register(dependency: TestDependency): void {
    this.dependencies.set(dependency.testId, dependency);
  }

  /**
   * Record test result
   */
  recordResult(result: TestResult): void {
    this.results.set(result.testId, result);
  }

  /**
   * Check if test should run
   */
  shouldRun(testId: string): boolean {
    const dependency = this.dependencies.get(testId);
    if (!dependency) return true;

    // Check all dependencies
    for (const depId of dependency.dependsOn) {
      const depResult = this.results.get(depId);
      
      if (!depResult) {
        // Dependency hasn't run yet
        return false;
      }

      const shouldSkip = this.checkCondition(depResult, dependency.condition);
      if (shouldSkip) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check condition
   */
  private checkCondition(result: TestResult, condition: string): boolean {
    switch (condition) {
      case 'passed':
        return result.status !== 'passed';
      case 'failed':
        return result.status !== 'failed';
      case 'skipped':
        return result.status !== 'skipped';
      case 'any':
        return false;
      default:
        return false;
    }
  }

  /**
   * Get execution order
   */
  getExecutionOrder(): string[] {
    const order: string[] = [];
    const visited = new Set<string>();

    const visit = (testId: string) => {
      if (visited.has(testId)) return;
      
      const dependency = this.dependencies.get(testId);
      if (dependency) {
        for (const depId of dependency.dependsOn) {
          visit(depId);
        }
      }

      visited.add(testId);
      order.push(testId);
    };

    for (const testId of this.dependencies.keys()) {
      visit(testId);
    }

    return order;
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.dependencies.clear();
    this.results.clear();
  }
}

/**
 * Test Category Manager
 */
export class TestCategoryManager {
  private categories: Map<string, TestCategory> = new Map();

  /**
   * Register a category
   */
  register(category: TestCategory): void {
    this.categories.set(category.name, category);
  }

  /**
   * Get category by tag
   */
  getByTag(tag: string): TestCategory | undefined {
    for (const category of this.categories.values()) {
      if (category.tags.includes(tag)) {
        return category;
      }
    }
    return undefined;
  }

  /**
   * Filter tests by category
   */
  filterByCategory(tests: string[], categoryName: string): string[] {
    const category = this.categories.get(categoryName);
    if (!category) return tests;
    
    return tests.filter(test => {
      // Simple filtering - in real impl, check tags
      return true;
    });
  }

  /**
   * Get priority
   */
  getPriority(categoryName: string): number {
    const category = this.categories.get(categoryName);
    return category?.priority || 0;
  }
}

/**
 * Test Prioritizer
 */
export class TestPrioritizer {
  private priorities: Map<string, number> = new Map();

  /**
   * Set priority for test
   */
  setPriority(testId: string, priority: number): void {
    this.priorities.set(testId, priority);
  }

  /**
   * Sort tests by priority
   */
  sort(tests: string[]): string[] {
    return tests.sort((a, b) => {
      const priorityA = this.priorities.get(a) || 0;
      const priorityB = this.priorities.get(b) || 0;
      return priorityB - priorityA; // Higher priority first
    });
  }

  /**
   * Get priority
   */
  getPriority(testId: string): number {
    return this.priorities.get(testId) || 0;
  }
}

/**
 * Skip Logic Manager
 */
export class SkipLogicManager {
  private skipConditions: Map<string, () => boolean> = new Map();

  /**
   * Register skip condition
   */
  registerSkipCondition(testId: string, condition: () => boolean): void {
    this.skipConditions.set(testId, condition);
  }

  /**
   * Should skip test
   */
  shouldSkip(testId: string): boolean {
    const condition = this.skipConditions.get(testId);
    if (!condition) return false;
    
    try {
      return condition();
    } catch {
      return false;
    }
  }

  /**
   * Skip based on previous results
   */
  skipBasedOnResults(
    testId: string,
    previousResults: Map<string, TestResult>,
    condition: 'any-failed' | 'all-passed' | 'any-passed'
  ): boolean {
    const results = Array.from(previousResults.values());
    
    switch (condition) {
      case 'any-failed':
        return results.some(r => r.status === 'failed');
      case 'all-passed':
        return results.length > 0 && results.every(r => r.status === 'passed');
      case 'any-passed':
        return results.some(r => r.status === 'passed');
      default:
        return false;
    }
  }
}

/**
 * Create test dependency manager
 */
export function createTestDependencyManager(): TestDependencyManager {
  return new TestDependencyManager();
}

/**
 * Create test category manager
 */
export function createTestCategoryManager(): TestCategoryManager {
  return new TestCategoryManager();
}

/**
 * Create test prioritizer
 */
export function createTestPrioritizer(): TestPrioritizer {
  return new TestPrioritizer();
}

/**
 * Create skip logic manager
 */
export function createSkipLogicManager(): SkipLogicManager {
  return new SkipLogicManager();
}
