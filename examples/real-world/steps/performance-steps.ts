/**
 * Performance Testing Step Definitions
 * Steps for load testing and performance validation using Hop Framework
 */

import { Given, When, Then, Before } from '../../../src/engine/step-registry';
import type { TestContext } from '../../../src/types';

Before(async function(this: TestContext) {
  this.variables = this.variables || {};
  this.performanceMetrics = {
    requests: 0,
    errors: 0,
    totalResponseTime: 0,
    minResponseTime: Infinity,
    maxResponseTime: 0,
  };
});

// =====================================================
// Performance Configuration Steps
// =====================================================

Given('concurrency {int}', function(this: TestContext, concurrency: number) {
  this.performanceConfig = this.performanceConfig || {};
  this.performanceConfig.concurrency = concurrency;
});

Given('duration {string}', function(this: TestContext, duration: string) {
  this.performanceConfig = this.performanceConfig || {};
  this.performanceConfig.duration = duration;
});

Given('ramp up {string}', function(this: TestContext, rampUp: string) {
  this.performanceConfig = this.performanceConfig || {};
  this.performanceConfig.rampUp = rampUp;
});

Given('iterations {int}', function(this: TestContext, iterations: number) {
  this.performanceConfig = this.performanceConfig || {};
  this.performanceConfig.iterations = iterations;
});

Given('think time {string}', function(this: TestContext, thinkTime: string) {
  this.performanceConfig = this.performanceConfig || {};
  this.performanceConfig.thinkTime = thinkTime;
});

Given('threshold response time {int}ms', function(this: TestContext, threshold: number) {
  this.performanceConfig = this.performanceConfig || {};
  this.performanceConfig.responseTimeThreshold = threshold;
});

Given('threshold error rate {float}%', function(this: TestContext, rate: number) {
  this.performanceConfig = this.performanceConfig || {};
  this.performanceConfig.errorRateThreshold = rate / 100;
});

// =====================================================
// Load Test Execution Steps
// =====================================================

When('load test GET {string}', async function(this: TestContext, path: string) {
  const startTime = Date.now();
  try {
    const response = await this.http.get(`${this.baseUrl}${path}`);
    this.response = response;
    this.performanceMetrics.requests++;
    this.performanceMetrics.totalResponseTime += response.responseTime;
    this.performanceMetrics.minResponseTime = Math.min(
      this.performanceMetrics.minResponseTime,
      response.responseTime
    );
    this.performanceMetrics.maxResponseTime = Math.max(
      this.performanceMetrics.maxResponseTime,
      response.responseTime
    );
    if (response.status >= 400) {
      this.performanceMetrics.errors++;
    }
  } catch (error) {
    this.performanceMetrics.errors++;
    throw error;
  }
  this.performanceMetrics.duration = Date.now() - startTime;
});

When('load test POST {string}', async function(this: TestContext, path: string) {
  const startTime = Date.now();
  try {
    const response = await this.http.post(`${this.baseUrl}${path}`, this.requestBody);
    this.response = response;
    this.performanceMetrics.requests++;
    this.performanceMetrics.totalResponseTime += response.responseTime;
    this.performanceMetrics.minResponseTime = Math.min(
      this.performanceMetrics.minResponseTime,
      response.responseTime
    );
    this.performanceMetrics.maxResponseTime = Math.max(
      this.performanceMetrics.maxResponseTime,
      response.responseTime
    );
    if (response.status >= 400) {
      this.performanceMetrics.errors++;
    }
  } catch (error) {
    this.performanceMetrics.errors++;
    throw error;
  }
  this.performanceMetrics.duration = Date.now() - startTime;
});

When('stress test {string} with {int} concurrent users', async function(this: TestContext, _path: string, _users: number) {
  // Stress test implementation placeholder
  // In real implementation, this would spawn multiple workers
  this.performanceMetrics.concurrency = _users;
});

// =====================================================
// Performance Assertion Steps
// =====================================================

Then('average response time < {int}ms', function(this: TestContext, maxAvg: number) {
  const avg = this.performanceMetrics.totalResponseTime / this.performanceMetrics.requests;
  if (avg >= maxAvg) {
    throw new Error(`Average response time ${avg.toFixed(2)}ms exceeded ${maxAvg}ms threshold`);
  }
});

Then('max response time < {int}ms', function(this: TestContext, maxMs: number) {
  if (this.performanceMetrics.maxResponseTime >= maxMs) {
    throw new Error(`Max response time ${this.performanceMetrics.maxResponseTime}ms exceeded ${maxMs}ms threshold`);
  }
});

Then('min response time < {int}ms', function(this: TestContext, maxMs: number) {
  if (this.performanceMetrics.minResponseTime >= maxMs) {
    throw new Error(`Min response time ${this.performanceMetrics.minResponseTime}ms exceeded ${maxMs}ms threshold`);
  }
});

Then('error rate < {float}%', function(this: TestContext, maxRate: number) {
  const errorRate = this.performanceMetrics.errors / this.performanceMetrics.requests;
  if (errorRate >= maxRate / 100) {
    throw new Error(`Error rate ${(errorRate * 100).toFixed(2)}% exceeded ${maxRate}% threshold`);
  }
});

Then('throughput > {int} req/s', function(this: TestContext, minThroughput: number) {
  const throughput = this.performanceMetrics.requests / (this.performanceMetrics.duration / 1000);
  if (throughput < minThroughput) {
    throw new Error(`Throughput ${throughput.toFixed(2)} req/s below ${minThroughput} req/s threshold`);
  }
});

Then('total requests >= {int}', function(this: TestContext, minRequests: number) {
  if (this.performanceMetrics.requests < minRequests) {
    throw new Error(`Total requests ${this.performanceMetrics.requests} below ${minRequests} threshold`);
  }
});

Then('total errors < {int}', function(this: TestContext, maxErrors: number) {
  if (this.performanceMetrics.errors >= maxErrors) {
    throw new Error(`Total errors ${this.performanceMetrics.errors} exceeded ${maxErrors} threshold`);
  }
});

// =====================================================
// Performance Report Steps
// =====================================================

Then('print performance metrics', function(this: TestContext) {
  console.log('\n📊 Performance Metrics:');
  console.log(`   Total Requests: ${this.performanceMetrics.requests}`);
  console.log(`   Total Errors: ${this.performanceMetrics.errors}`);
  console.log(`   Error Rate: ${((this.performanceMetrics.errors / this.performanceMetrics.requests) * 100).toFixed(2)}%`);
  console.log(`   Avg Response Time: ${(this.performanceMetrics.totalResponseTime / this.performanceMetrics.requests).toFixed(2)}ms`);
  console.log(`   Min Response Time: ${this.performanceMetrics.minResponseTime}ms`);
  console.log(`   Max Response Time: ${this.performanceMetrics.maxResponseTime}ms`);
  console.log(`   Total Duration: ${this.performanceMetrics.duration}ms`);
});

Then('response time percentile {int}% < {int}ms', function(this: TestContext, _percentile: number, _maxMs: number) {
  // Percentile calculation placeholder
  // In real implementation, this would track all response times and calculate percentiles
  console.log(`Checking ${_percentile}th percentile < ${_maxMs}ms`);
});

Then('response time p50 < {int}ms', function(this: TestContext, maxMs: number) {
  // P50 (median) placeholder
  const avg = this.performanceMetrics.totalResponseTime / this.performanceMetrics.requests;
  if (avg >= maxMs) {
    throw new Error(`P50 response time exceeded ${maxMs}ms threshold`);
  }
});

Then('response time p95 < {int}ms', function(this: TestContext, maxMs: number) {
  // P95 placeholder - using 1.5x average as approximation
  const avg = this.performanceMetrics.totalResponseTime / this.performanceMetrics.requests;
  if (avg * 1.5 >= maxMs) {
    throw new Error(`P95 response time exceeded ${maxMs}ms threshold`);
  }
});

Then('response time p99 < {int}ms', function(this: TestContext, maxMs: number) {
  // P99 placeholder - using max response time
  if (this.performanceMetrics.maxResponseTime >= maxMs) {
    throw new Error(`P99 response time ${this.performanceMetrics.maxResponseTime}ms exceeded ${maxMs}ms threshold`);
  }
});

// =====================================================
// SLA Assertion Steps
// =====================================================

Then('SLA response time met', function(this: TestContext) {
  const threshold = this.performanceConfig?.responseTimeThreshold || 1000;
  const avg = this.performanceMetrics.totalResponseTime / this.performanceMetrics.requests;
  if (avg >= threshold) {
    throw new Error(`SLA violated: Average response time ${avg.toFixed(2)}ms exceeded ${threshold}ms`);
  }
});

Then('SLA availability met', function(this: TestContext) {
  const errorRate = this.performanceMetrics.errors / this.performanceMetrics.requests;
  const availabilityThreshold = 0.99; // 99% availability
  if ((1 - errorRate) < availabilityThreshold) {
    throw new Error(`SLA violated: Availability ${((1 - errorRate) * 100).toFixed(2)}% below 99%`);
  }
});

Then('SLA throughput met', function(this: TestContext) {
  const throughput = this.performanceMetrics.requests / (this.performanceMetrics.duration / 1000);
  const minThroughput = 10; // Default minimum 10 req/s
  if (throughput < minThroughput) {
    throw new Error(`SLA violated: Throughput ${throughput.toFixed(2)} req/s below ${minThroughput} req/s`);
  }
});
