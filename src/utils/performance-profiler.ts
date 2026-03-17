/**
 * Performance Profiling for Hop Framework
 * Built-in timing metrics, performance reports, slow step detection
 */

export interface TimingMetric {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  metadata?: Record<string, any>;
}

export interface StepTiming {
  stepText: string;
  keyword: string;
  duration: number;
  status: 'pass' | 'fail' | 'skip';
}

export interface PerformanceReport {
  totalDuration: number;
  scenarios: ScenarioPerformance[];
  steps: StepPerformanceSummary[];
  slowestSteps: StepTiming[];
  averageDuration: number;
  timestamp: string;
}

export interface ScenarioPerformance {
  name: string;
  duration: number;
  status: 'pass' | 'fail' | 'skip';
  stepCount: number;
}

export interface StepPerformanceSummary {
  pattern: string;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  callCount: number;
}

export interface SlowStepThreshold {
  warning: number;  // ms
  critical: number; // ms
}

export class PerformanceProfiler {
  private metrics: Map<string, TimingMetric> = new Map();
  private stepTimings: StepTiming[] = [];
  private scenarioTimings: Map<string, number> = new Map();
  private startTime: number = 0;
  private slowThresholds: SlowStepThreshold = {
    warning: 5000,
    critical: 10000,
  };

  /**
   * Start profiling
   */
  start(): void {
    this.startTime = Date.now();
    this.metrics.clear();
    this.stepTimings = [];
    this.scenarioTimings.clear();
  }

  /**
   * Start timing a named operation
   */
  startTimer(name: string, metadata?: Record<string, any>): void {
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
  endTimer(name: string): number | undefined {
    const metric = this.metrics.get(name);
    if (!metric) return undefined;

    metric.endTime = Date.now();
    metric.duration = metric.endTime - metric.startTime;
    
    return metric.duration;
  }

  /**
   * Record step timing
   */
  recordStep(stepText: string, keyword: string, duration: number, status: 'pass' | 'fail' | 'skip'): void {
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
  recordScenario(name: string, duration: number): void {
    this.scenarioTimings.set(name, duration);
  }

  /**
   * Set slow step thresholds
   */
  setThresholds(warning: number, critical: number): void {
    this.slowThresholds = { warning, critical };
  }

  /**
   * Get all step timings
   */
  getStepTimings(): StepTiming[] {
    return this.stepTimings;
  }

  /**
   * Get slowest steps
   */
  getSlowestSteps(limit: number = 10): StepTiming[] {
    return [...this.stepTimings]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Get slow steps (above warning threshold)
   */
  getSlowSteps(): StepTiming[] {
    return this.stepTimings.filter(s => s.duration > this.slowThresholds.warning);
  }

  /**
   * Generate performance report
   */
  generateReport(): PerformanceReport {
    const totalDuration = Date.now() - this.startTime;
    
    const scenarioPerformance: ScenarioPerformance[] = Array.from(this.scenarioTimings.entries()).map(
      ([name, duration]) => ({
        name,
        duration,
        status: 'pass' as const,
        stepCount: 0,
      })
    );

    // Group step timings by pattern
    const stepGroups = new Map<string, StepTiming[]>();
    for (const timing of this.stepTimings) {
      const pattern = this.extractPattern(timing.stepText);
      if (!stepGroups.has(pattern)) {
        stepGroups.set(pattern, []);
      }
      stepGroups.get(pattern)!.push(timing);
    }

    const stepSummaries: StepPerformanceSummary[] = Array.from(stepGroups.entries()).map(
      ([pattern, timings]) => {
        const durations = timings.map(t => t.duration);
        return {
          pattern,
          averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
          minDuration: Math.min(...durations),
          maxDuration: Math.max(...durations),
          callCount: durations.length,
        };
      }
    );

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
  generateMarkdownReport(): string {
    const report = this.generateReport();
    
    const lines: string[] = [];
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
  private extractPattern(stepText: string): string {
    return stepText
      .replace(/<[^>]+>/g, '<*>')
      .replace(/\{[^}]+\}/g, '{*}')
      .replace(/\d+/g, '#');
  }

  /**
   * Log slow step warning
   */
  private logSlowStep(stepText: string, duration: number): void {
    const threshold = duration > this.slowThresholds.critical ? 'CRITICAL' : 'WARNING';
    console.warn(`[PERF ${threshold}] Slow step detected: ${stepText} took ${duration.toFixed(2)}ms`);
  }

  /**
   * Reset profiler
   */
  reset(): void {
    this.metrics.clear();
    this.stepTimings = [];
    this.scenarioTimings.clear();
    this.startTime = 0;
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics(): string {
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
export function createPerformanceProfiler(): PerformanceProfiler {
  return new PerformanceProfiler();
}

/**
 * Step timing decorator for performance tracking
 */
export function timed<T extends (...args: any[]) => any>(
  profiler: PerformanceProfiler,
  stepName: string
): T {
  return function (this: any, ...args: any[]) {
    profiler.startTimer(stepName);
    try {
      const result = args[0].apply(this, args.slice(1));
      profiler.endTimer(stepName);
      return result;
    } catch (error) {
      profiler.endTimer(stepName);
      throw error;
    }
  } as T;
}

/**
 * Async step timing decorator
 */
export async function timedAsync<T>(
  profiler: PerformanceProfiler,
  stepName: string,
  fn: () => Promise<T>
): Promise<T> {
  profiler.startTimer(stepName);
  try {
    const result = await fn();
    profiler.endTimer(stepName);
    return result;
  } catch (error) {
    profiler.endTimer(stepName);
    throw error;
  }
}
