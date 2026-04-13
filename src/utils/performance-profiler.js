/**
 * Performance Profiling for Hop Framework
 * Built-in timing metrics, performance reports, slow step detection
 */
export class PerformanceProfiler {
    metrics = new Map();
    stepTimings = [];
    scenarioTimings = new Map();
    startTime = 0;
    slowThresholds = {
        warning: 5000,
        critical: 10000,
    };
    /**
     * Start profiling
     */
    start() {
        this.startTime = Date.now();
        this.metrics.clear();
        this.stepTimings = [];
        this.scenarioTimings.clear();
    }
    /**
     * Start timing a named operation
     */
    startTimer(name, metadata) {
        this.metrics.set(name, {
            name,
            startTime: Date.now(),
            endTime: 0,
            duration: 0,
            metadata,
        });
    }
    /**
     * End timing a named operation
     */
    endTimer(name) {
        const metric = this.metrics.get(name);
        if (!metric)
            return undefined;
        metric.endTime = Date.now();
        metric.duration = metric.endTime - metric.startTime;
        return metric.duration;
    }
    /**
     * Record step timing
     */
    recordStep(stepText, keyword, duration, status) {
        this.stepTimings.push({
            stepText,
            keyword,
            duration,
            status,
        });
        // Check for slow steps
        if (duration > this.slowThresholds.warning) {
            this.logSlowStep(stepText, duration);
        }
    }
    /**
     * Record scenario timing
     */
    recordScenario(name, duration) {
        this.scenarioTimings.set(name, duration);
    }
    /**
     * Set slow step thresholds
     */
    setThresholds(warning, critical) {
        this.slowThresholds = { warning, critical };
    }
    /**
     * Get all step timings
     */
    getStepTimings() {
        return this.stepTimings;
    }
    /**
     * Get slowest steps
     */
    getSlowestSteps(limit = 10) {
        return [...this.stepTimings]
            .sort((a, b) => b.duration - a.duration)
            .slice(0, limit);
    }
    /**
     * Get slow steps (above warning threshold)
     */
    getSlowSteps() {
        return this.stepTimings.filter(s => s.duration > this.slowThresholds.warning);
    }
    /**
     * Generate performance report
     */
    generateReport() {
        const totalDuration = Date.now() - this.startTime;
        const scenarioPerformance = Array.from(this.scenarioTimings.entries()).map(([name, duration]) => ({
            name,
            duration,
            status: 'pass',
            stepCount: 0,
        }));
        // Group step timings by pattern
        const stepGroups = new Map();
        for (const timing of this.stepTimings) {
            const pattern = this.extractPattern(timing.stepText);
            if (!stepGroups.has(pattern)) {
                stepGroups.set(pattern, []);
            }
            stepGroups.get(pattern).push(timing);
        }
        const stepSummaries = Array.from(stepGroups.entries()).map(([pattern, timings]) => {
            const durations = timings.map(t => t.duration);
            return {
                pattern,
                averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
                minDuration: Math.min(...durations),
                maxDuration: Math.max(...durations),
                callCount: durations.length,
            };
        });
        const avgDuration = this.stepTimings.length > 0
            ? this.stepTimings.reduce((sum, s) => sum + s.duration, 0) / this.stepTimings.length
            : 0;
        return {
            totalDuration,
            scenarios: scenarioPerformance,
            steps: stepSummaries,
            slowestSteps: this.getSlowestSteps(),
            averageDuration: avgDuration,
            timestamp: new Date().toISOString(),
        };
    }
    /**
     * Generate markdown report
     */
    generateMarkdownReport() {
        const report = this.generateReport();
        const lines = [];
        lines.push('# Performance Report');
        lines.push('');
        lines.push(`**Total Duration:** ${(report.totalDuration / 1000).toFixed(2)}s`);
        lines.push(`**Average Step Duration:** ${report.averageDuration.toFixed(2)}ms`);
        lines.push(`**Total Steps:** ${this.stepTimings.length}`);
        lines.push('');
        lines.push('## Slowest Steps');
        lines.push('');
        lines.push('| Step | Duration | Status |');
        lines.push('|------|----------|--------|');
        for (const step of report.slowestSteps) {
            const status = step.duration > this.slowThresholds.critical ? '🔴' :
                step.duration > this.slowThresholds.warning ? '🟡' : '🟢';
            lines.push(`| ${step.stepText.substring(0, 50)}... | ${step.duration.toFixed(2)}ms | ${status} |`);
        }
        lines.push('');
        lines.push('## Step Performance Summary');
        lines.push('');
        lines.push('| Pattern | Avg | Min | Max | Calls |');
        lines.push('|---------|-----|-----|-----|-------|');
        for (const step of report.steps.sort((a, b) => b.averageDuration - a.averageDuration).slice(0, 10)) {
            lines.push(`| ${step.pattern.substring(0, 30)} | ${step.averageDuration.toFixed(2)}ms | ${step.minDuration.toFixed(2)}ms | ${step.maxDuration.toFixed(2)}ms | ${step.callCount} |`);
        }
        return lines.join('\n');
    }
    /**
     * Extract pattern from step text (replace variables with placeholder)
     */
    extractPattern(stepText) {
        return stepText
            .replace(/<[^>]+>/g, '<*>')
            .replace(/\{[^}]+\}/g, '{*}')
            .replace(/\d+/g, '#');
    }
    /**
     * Log slow step warning
     */
    logSlowStep(stepText, duration) {
        const threshold = duration > this.slowThresholds.critical ? 'CRITICAL' : 'WARNING';
        console.warn(`[PERF ${threshold}] Slow step detected: ${stepText} took ${duration.toFixed(2)}ms`);
    }
    /**
     * Reset profiler
     */
    reset() {
        this.metrics.clear();
        this.stepTimings = [];
        this.scenarioTimings.clear();
        this.startTime = 0;
    }
    /**
     * Export metrics for external analysis
     */
    exportMetrics() {
        return JSON.stringify({
            metrics: Array.from(this.metrics.values()),
            stepTimings: this.stepTimings,
            scenarios: Array.from(this.scenarioTimings.entries()),
            report: this.generateReport(),
        }, null, 2);
    }
}
/**
 * Create performance profiler
 */
export function createPerformanceProfiler() {
    return new PerformanceProfiler();
}
/**
 * Step timing decorator for performance tracking
 */
export function timed(profiler, stepName) {
    return function (...args) {
        profiler.startTimer(stepName);
        try {
            const result = args[0].apply(this, args.slice(1));
            profiler.endTimer(stepName);
            return result;
        }
        catch (error) {
            profiler.endTimer(stepName);
            throw error;
        }
    };
}
/**
 * Async step timing decorator
 */
export async function timedAsync(profiler, stepName, fn) {
    profiler.startTimer(stepName);
    try {
        const result = await fn();
        profiler.endTimer(stepName);
        return result;
    }
    catch (error) {
        profiler.endTimer(stepName);
        throw error;
    }
}
