#!/usr/bin/env bun
import { Command } from 'commander';
import { parseArgs } from 'util';
import { GherkinParser } from '../src/parser/gherkin-parser.js';
import { TestEngine } from '../src/engine/test-engine.js';
import { ConsoleReporter } from '../src/reporter/console-reporter.js';
import { TestResultCollector } from '../src/engine/test-result-collector.js';
import { loadConfig, mergeOptions } from '../src/config/config-loader.js';
import * as path from 'path';

const program = new Command();

// Load configuration from hop.config.ts
const config = loadConfig();

program
  .name('hop')
  .description('High-performance BDD automation testing framework')
  .version('1.0.0');

// Test command
program
  .command('test')
  .description('Run BDD tests')
  .option('-f, --features <path>', 'Path to features directory', config.features)
  .option('-s, --steps <path>', 'Path to custom steps directory', config.steps)
  .option('-t, --tags <tags>', 'Filter scenarios by tags', '')
  .option('-e, --env <env>', 'Environment to use', 'test')
  .option('-r, --report', 'Generate HTML report', false)
  .option('-v, --verbose', 'Verbose output', false)
  .option('-frm, --format <format>', 'Output format (console, json, junit, allure, html, hop)', 'console')
  .option('--retry <count>', 'Number of retries for failed tests', config.retry.toString())
  .option('--timeout <ms>', 'Test timeout in milliseconds', config.timeout.toString())
  .option('-p, --parallel', 'Run tests in parallel', false)
  .option('-cn, --concurrency <count>', 'Maximum concurrent tests', '4')
  .option('-c, --config <path>', 'Path to config file')
  .option('--report-dir <path>', 'Directory to save reports', './reports')
  .action(async (options) => {
    try {
      // Load custom config if provided
      const customConfig = options.config ? loadConfig(options.config) : config;
      const mergedOptions = mergeOptions(customConfig, options);
      
      console.log('🔷 Hop - BDD Testing Framework');
      console.log('================================\n');
      
      // Show config info in verbose mode
      if (mergedOptions.verbose) {
        console.log('📋 Using config:');
        console.log(`   Features: ${mergedOptions.features}`);
        console.log(`   Steps: ${mergedOptions.steps}`);
        console.log(`   Environment: ${mergedOptions.env}`);
        console.log('');
      }
      
      const featuresPath = path.resolve(mergedOptions.features);
      const stepsPath = path.resolve(mergedOptions.steps);
      
      // Discover and parse feature files
      const parser = new GherkinParser();
      const featureFiles = await parser.discoverFeatures(featuresPath);
      
      if (featureFiles.length === 0) {
        console.log('⚠️  No .feature files found in', featuresPath);
        process.exit(0);
      }
      
      console.log(`📁 Found ${featureFiles.length} feature file(s)\n`);
      
      // Parse all feature files
      const parsedFeatures = await parser.parseFeatures(featureFiles);
      
      // Display parsed scenarios
      const reporter = new ConsoleReporter();
      reporter.printFeatures(parsedFeatures);
      
      // Run test engine
      const engine = new TestEngine({
        featuresPath,
        stepsPath,
        tags: mergedOptions.tags,
        env: mergedOptions.env,
        verbose: mergedOptions.verbose,
        timeout: mergedOptions.timeout,
        retry: mergedOptions.retry,
        parallel: mergedOptions.parallel || false,
        concurrency: Number(mergedOptions.concurrency) || 4,
        report: mergedOptions.report ? 'html' : undefined,
        reportDir: mergedOptions.reportDir || './reports',
      });
      
      const collector = new TestResultCollector();
      const results = await engine.run(parsedFeatures, collector);
      
      // Print results
      reporter.printResults(results);
      
      // Generate report if requested
      const formats = (mergedOptions.format || 'console').split(',').map((f: string) => f.trim());
      const reportDir = mergedOptions.reportDir || './reports';
      
      for (const format of formats) {
        if (format === 'html' || (mergedOptions.report && format === 'console')) {
          const { HtmlReporter } = await import('../src/reporter/html-reporter.js');
          const htmlReporter = new HtmlReporter(reportDir);
          await htmlReporter.generate(results, collector);
        }
        
        if (format === 'json') {
          const { JsonReporter } = await import('../src/reporter/json-reporter.js');
          const jsonReporter = new JsonReporter(reportDir);
          const jsonPath = await jsonReporter.generate(results);
          console.log(`📊 JSON report generated: ${jsonPath}`);
        }
        
        if (format === 'junit') {
          const { JunitReporter } = await import('../src/reporter/junit-reporter.js');
          const junitReporter = new JunitReporter(reportDir);
          const junitPath = await junitReporter.generate(results);
          console.log(`📊 JUnit XML report generated: ${junitPath}`);
        }
        
        if (format === 'allure') {
          const { AllureReporter } = await import('../src/reporter/allure-reporter.js');
          const allureReporter = new AllureReporter();
          const allurePath = await allureReporter.generate(results);
          console.log(`\n📊 Allure results generated: ${allurePath}`);
        }
        
        if (format === 'hop') {
          const { HopReporter } = await import('../src/reporter/hop-reporter.js');
          const hopReporter = new HopReporter();
          const hopPath = await hopReporter.generate(results);
          console.log(`\n📊 Hop report generated: ${hopPath}`);
        }
      }
      
      // Exit with appropriate code
      const failed = results.filter(r => r.status === 'failed').length;
      process.exit(failed > 0 ? 1 : 0);
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Init command
program
  .command('init <project-name>')
  .description('Initialize a new Hop project')
  .action(async (projectName) => {
    const { HopInitializer } = await import('../src/cli/hop-initializer.js');
    const initializer = new HopInitializer();
    await initializer.init(projectName);
  });

// Generate k6 script command
program
  .command('gen-k6')
  .description('Generate k6 load test script from features')
  .option('-o, --output <path>', 'Output file path', './load-test.js')
  .option('-f, --features <path>', 'Path to features directory', './features')
  .action(async (options) => {
    const { K6Generator } = await import('../src/generators/k6-generator.js');
    const generator = new K6Generator();
    await generator.generate(options.features, options.output);
  });

// Parse command (for debugging)
program
  .command('parse')
  .description('Parse feature files without running tests')
  .option('-f, --features <path>', 'Path to features directory', './features')
  .action(async (options) => {
    try {
      const parser = new GherkinParser();
      const featuresPath = path.resolve(options.features);
      const featureFiles = await parser.discoverFeatures(featuresPath);
      const parsedFeatures = await parser.parseFeatures(featureFiles);
      
      const reporter = new ConsoleReporter();
      reporter.printFeatures(parsedFeatures);
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Mock command
program
  .command('mock')
  .description('Start a mock API server from a feature file')
  .option('-f, --feature <path>', 'Path to mock feature file')
  .option('-p, --port <port>', 'Port number', '8080')
  .option('-v, --verbose', 'Verbose output', false)
  .action(async (options) => {
    try {
      if (!options.feature) {
        console.error('❌ Error: Path to mock feature file is required (-f, --feature)');
        process.exit(1);
      }
      const { MockServer } = await import('../src/mock/mock-server.js');
      const server = new MockServer(path.resolve(options.feature), parseInt(options.port), options.verbose);
      await server.start();
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Report command - start local report server
program
  .command('report')
  .description('Start local server to view Hop reports')
  .option('-p, --port <port>', 'Port number', '9090')
  .action(async (options) => {
    try {
      const { HopReporter } = await import('../src/reporter/hop-reporter.js');
      const reporter = new HopReporter();
      await reporter.serve(parseInt(options.port));
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
