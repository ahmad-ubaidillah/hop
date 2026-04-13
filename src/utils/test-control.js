/**
 * Test Control Flow for Hop Framework
 * Priority 15: Test dependencies, skip logic, categories
 */
/**
 * Test Dependency Manager
 */
export class TestDependencyManager {
    dependencies = new Map();
    results = new Map();
    /**
     * Register a test dependency
     */
    register(dependency) {
        this.dependencies.set(dependency.testId, dependency);
    }
    /**
     * Record test result
     */
    recordResult(result) {
        this.results.set(result.testId, result);
    }
    /**
     * Check if test should run
     */
    shouldRun(testId) {
        const dependency = this.dependencies.get(testId);
        if (!dependency)
            return true;
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
    checkCondition(result, condition) {
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
    getExecutionOrder() {
        const order = [];
        const visited = new Set();
        const visit = (testId) => {
            if (visited.has(testId))
                return;
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
    clear() {
        this.dependencies.clear();
        this.results.clear();
    }
}
/**
 * Test Category Manager
 */
export class TestCategoryManager {
    categories = new Map();
    /**
     * Register a category
     */
    register(category) {
        this.categories.set(category.name, category);
    }
    /**
     * Get category by tag
     */
    getByTag(tag) {
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
    filterByCategory(tests, categoryName) {
        const category = this.categories.get(categoryName);
        if (!category)
            return tests;
        return tests.filter(test => {
            // Simple filtering - in real impl, check tags
            return true;
        });
    }
    /**
     * Get priority
     */
    getPriority(categoryName) {
        const category = this.categories.get(categoryName);
        return category?.priority || 0;
    }
}
/**
 * Test Prioritizer
 */
export class TestPrioritizer {
    priorities = new Map();
    /**
     * Set priority for test
     */
    setPriority(testId, priority) {
        this.priorities.set(testId, priority);
    }
    /**
     * Sort tests by priority
     */
    sort(tests) {
        return tests.sort((a, b) => {
            const priorityA = this.priorities.get(a) || 0;
            const priorityB = this.priorities.get(b) || 0;
            return priorityB - priorityA; // Higher priority first
        });
    }
    /**
     * Get priority
     */
    getPriority(testId) {
        return this.priorities.get(testId) || 0;
    }
}
/**
 * Skip Logic Manager
 */
export class SkipLogicManager {
    skipConditions = new Map();
    /**
     * Register skip condition
     */
    registerSkipCondition(testId, condition) {
        this.skipConditions.set(testId, condition);
    }
    /**
     * Should skip test
     */
    shouldSkip(testId) {
        const condition = this.skipConditions.get(testId);
        if (!condition)
            return false;
        try {
            return condition();
        }
        catch {
            return false;
        }
    }
    /**
     * Skip based on previous results
     */
    skipBasedOnResults(testId, previousResults, condition) {
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
export function createTestDependencyManager() {
    return new TestDependencyManager();
}
/**
 * Create test category manager
 */
export function createTestCategoryManager() {
    return new TestCategoryManager();
}
/**
 * Create test prioritizer
 */
export function createTestPrioritizer() {
    return new TestPrioritizer();
}
/**
 * Create skip logic manager
 */
export function createSkipLogicManager() {
    return new SkipLogicManager();
}
