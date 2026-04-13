/**
 * Flaky Test Detection for Hop Framework
 * Identifies tests that fail intermittently
 */
const DEFAULT_CONFIG = {
    minRuns: 5,
    passRateThreshold: 0.9,
    confidenceThreshold: 0.7,
    timeWindow: 7 * 24 * 60 * 60 * 1000, // 7 days
};
export class FlakyTestDetector {
    results = new Map();
    config;
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    /**
     * Record a test run result
     */
    recordResult(testId, testName, status, duration, error) {
        const key = testId || testName;
        const result = {
            timestamp: Date.now(),
            duration,
            status,
            error: error ?? undefined,
        };
        if (!this.results.has(key)) {
            this.results.set(key, []);
        }
        const history = this.results.get(key);
        history.push(result);
        // Prune old results based on time window
        if (this.config.timeWindow) {
            const cutoff = Date.now() - this.config.timeWindow;
            const filtered = history.filter(r => r.timestamp > cutoff);
            this.results.set(key, filtered);
        }
    }
    /**
     * Analyze results and identify flaky tests
     */
    analyze() {
        const flakyTests = [];
        for (const [testId, history] of this.results) {
            if (history.length < this.config.minRuns) {
                continue;
            }
            const passCount = history.filter(r => r.status === 'pass').length;
            const failCount = history.filter(r => r.status === 'fail').length;
            const totalRuns = history.length;
            const passRate = passCount / totalRuns;
            // Check if flaky
            const flaky = passRate < this.config.passRateThreshold && failCount > 0;
            // Calculate confidence based on number of runs
            const confidence = Math.min(1, totalRuns / 10);
            // Calculate suggested retries
            const suggestedRetries = this.calculateSuggestedRetries(passRate, totalRuns);
            flakyTests.push({
                testId,
                testName: testId,
                totalRuns,
                passCount,
                failCount,
                passRate,
                flaky,
                confidence,
                history,
                suggestedRetries: flaky ? suggestedRetries : undefined,
            });
        }
        return flakyTests.sort((a, b) => a.passRate - b.passRate);
    }
    /**
     * Get flaky tests only
     */
    getFlakyTests() {
        return this.analyze().filter(t => t.flaky);
    }
    /**
     * Get test history
     */
    getHistory(testId) {
        return this.results.get(testId) || [];
    }
    /**
     * Check if a specific test is flaky
     */
    isFlaky(testId) {
        const history = this.results.get(testId);
        if (!history || history.length < this.config.minRuns) {
            return false;
        }
        const passCount = history.filter(r => r.status === 'pass').length;
        const passRate = passCount / history.length;
        return passRate < this.config.passRateThreshold;
    }
    /**
     * Get stability score for a test (0-100)
     */
    getStabilityScore(testId) {
        const history = this.results.get(testId);
        if (!history || history.length === 0) {
            return 100; // No data = assume stable
        }
        const passCount = history.filter(r => r.status === 'pass').length;
        return Math.round((passCount / history.length) * 100);
    }
    /**
     * Calculate suggested retry count
     */
    calculateSuggestedRetries(passRate, totalRuns) {
        if (passRate >= 0.8)
            return 1;
        if (passRate >= 0.6)
            return 2;
        if (passRate >= 0.4)
            return 3;
        return 5;
    }
    /**
     * Clear history
     */
    clear() {
        this.results.clear();
    }
    /**
     * Get summary statistics
     */
    getSummary() {
        const analysis = this.analyze();
        const flakyTests = analysis.filter(t => t.flaky);
        const stableTests = analysis.filter(t => !t.flaky);
        const avgPassRate = analysis.length > 0
            ? analysis.reduce((sum, t) => sum + t.passRate, 0) / analysis.length
            : 1;
        return {
            totalTests: analysis.length,
            flakyTests: flakyTests.length,
            stableTests: stableTests.length,
            avgPassRate: Math.round(avgPassRate * 100) / 100,
        };
    }
    /**
     * Export results for persistence
     */
    exportResults() {
        return JSON.stringify({
            config: this.config,
            results: Array.from(this.results.entries()),
            exportedAt: Date.now(),
        }, null, 2);
    }
    /**
     * Import results from persistence
     */
    importResults(data) {
        try {
            const parsed = JSON.parse(data);
            this.results = new Map(parsed.results);
            if (parsed.config) {
                this.config = { ...DEFAULT_CONFIG, ...parsed.config };
            }
        }
        catch {
            console.error('Failed to import flaky test results');
        }
    }
}
/**
 * Create a flaky test detector
 */
export function createFlakyTestDetector(config) {
    return new FlakyTestDetector(config);
}
/**
 * Decorator to mark a test as potentially flaky
 */
export function flaky(reason) {
    return function (_target, _propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            let lastError;
            const maxRetries = 3;
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    return await originalMethod.apply(this, args);
                }
                catch (error) {
                    lastError = error;
                    if (attempt < maxRetries) {
                        console.warn(`Flaky test retry ${attempt}/${maxRetries}: ${reason || ''}`);
                        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                    }
                }
            }
            throw lastError;
        };
        return descriptor;
    };
}
