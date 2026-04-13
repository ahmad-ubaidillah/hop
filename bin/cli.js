#!/usr/bin/env node
import { Command } from 'commander';
import { parseArgs } from 'util';
import { GherkinParser } from '../src/parser/gherkin-parser.js';
import { TestEngine } from '../src/engine/test-engine.js';
import { ConsoleReporter } from '../src/reporter/console-reporter.js';
import { TestResultCollector } from '../src/engine/test-result-collector.js';
import { loadConfig, mergeOptions } from '../src/config/config-loader.js';
import * as path from 'path';
import { spawn } from 'child_process';
import { readdir, stat } from 'fs/promises';
const program = new Command();
// Load configuration from hop.config.ts
const config = loadConfig();
program
    .name('hop')
    .description('High-performance BDD automation testing framework')
    .version('1.0.0');
// Test command
program
    .command('test [path]')
    .description('Run BDD tests')
    .option('-f, --features <path>', 'Path to features directory', config.features)
    .option('-s, --steps <path>', 'Path to custom steps directory', config.steps)
    .option('-t, --tags <tags>', 'Filter scenarios by tags', '')
    .option('-e, --env <env>', 'Environment to use', 'test')
    .option('-r, --report', 'Generate Allure report', true)
    .option('-v, --verbose', 'Verbose output', false)
    .option('-d, --debug', 'Enable debug mode with detailed logging', false)
    .option('--breakpoint <step>', 'Set breakpoint on step containing this text', '')
    .option('-frm, --format <format>', 'Output format (console, json, junit, allure, html, hop, newman)', 'console,allure,hop')
    .option('--retry <count>', 'Number of retries for failed tests', config.retry.toString())
    .option('--timeout <ms>', 'Test timeout in milliseconds', config.timeout.toString())
    .option('-p, --parallel', 'Run tests in parallel', false)
    .option('-cn, --concurrency <count>', 'Maximum concurrent tests', '4')
    .option('--video <mode>', 'Video recording mode (always, on-failure, never)', 'on-failure')
    .option('--pause', 'Pause on failure for interactive debugging', false)
    .option('--hot-reload', 'Auto re-run tests when files change', false)
    .option('-c, --config <path>', 'Path to config file')
    .option('--report-dir <path>', 'Directory to save reports', './reports')
    .action(async (pathArg, options) => {
    try {
        // Ensure options is at least an empty object
        if (!options)
            options = {};
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + now.toTimeString().split(' ')[0].replace(/:/g, '-');
        const baseReportDir = options.reportDir || config.reportDir || './reports';
        const reportDir = path.join(baseReportDir, timestamp);
        const customConfig = options.config ? loadConfig(options.config) : config;
        const mergedOptions = mergeOptions(customConfig, { ...options, reportDir });
        if (pathArg) {
            mergedOptions.features = pathArg;
        }
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
            debug: mergedOptions.debug || false,
            breakpoint: mergedOptions.breakpoint,
            timeout: mergedOptions.timeout,
            retry: mergedOptions.retry,
            parallel: mergedOptions.parallel || false,
            concurrency: Number(mergedOptions.concurrency) || 4,
            video: mergedOptions.video || false,
            report: mergedOptions.report ? 'html' : undefined,
            reportDir: mergedOptions.reportDir || './reports',
        });
        const collector = new TestResultCollector();
        const results = await engine.run(parsedFeatures, collector);
        // Print results
        reporter.printResults(results);
        // Generate report if requested
        const formats = (mergedOptions.format || 'console').split(',').map((f) => f.trim());
        const finalReportDir = mergedOptions.reportDir || './reports';
        for (const format of formats) {
            if (format === 'json') {
                const { JsonReporter } = await import('../src/reporter/json-reporter.js');
                const jsonReporter = new JsonReporter(finalReportDir);
                const jsonPath = await jsonReporter.generate(results);
                console.log(`📊 JSON report generated: ${jsonPath}`);
            }
            if (format === 'junit') {
                const { JunitReporter } = await import('../src/reporter/junit-reporter.js');
                const junitReporter = new JunitReporter(finalReportDir);
                const junitPath = await junitReporter.generate(results);
                console.log(`📊 JUnit XML report generated: ${junitPath}`);
            }
            if (format === 'allure') {
                const { AllureReporter } = await import('../src/reporter/allure-reporter.js');
                const allureReporter = new AllureReporter();
                const allurePath = await allureReporter.generate(results);
                console.log(`\n📊 Allure results generated: ${allurePath}`);
            }
            if (format === 'hop' || format === 'html') {
                const { HopReporterV2 } = await import('../src/reporter/hop-reporter-v2.js');
                const hopReporter = new HopReporterV2(finalReportDir);
                const reportPath = await hopReporter.generate(results, collector);
                console.log(`\n✨ Premium Hop Report generated: ${reportPath}`);
            }
            if (format === 'newman') {
                const { NewmanReporter } = await import('../src/reporter/newman-reporter.js');
                const newmanReporter = new NewmanReporter(finalReportDir);
                const reportPath = await newmanReporter.generate(results, collector);
                console.log(`\n📊 Newman-style Report generated: ${reportPath}`);
            }
        }
        // Always save to history for report regeneration even if no format specified
        const { mkdir, writeFile } = await import('fs/promises');
        await mkdir(path.join(finalReportDir, 'history'), { recursive: true });
        await writeFile(path.join(finalReportDir, 'history', `${Date.now()}.json`), JSON.stringify(results, null, 2), 'utf-8');
        // Exit with appropriate code
        const totalRun = results.length;
        const failed = results.filter(r => r.status === 'failed').length;
        if (failed > 0) {
            console.log(`\n❌ Test run failed with ${failed} failure(s) out of ${totalRun} scenario(s).`);
            process.exit(1);
        }
        else {
            console.log(`\n✅ Test run passed! ${totalRun} scenario(s) executed successfully.`);
            process.exit(0);
        }
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('❌ Error:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
});
// Report command - View the official Allure or Hop Premium report
program
    .command('report')
    .description('View the test reports (prioritizes Hop Premium)')
    .option('-p, --port <port>', 'Port number', '9090')
    .option('-a, --allure', 'Explicitly serve Allure report', false)
    .action(async (options) => {
    try {
        const baseReportDir = config.reports || './reports';
        if (options.allure) {
            const allureResultsDir = path.join(baseReportDir, 'allure-results');
            console.log(`\n🚀 Starting Allure Report server...`);
            console.log(`📂 Using results from: ${allureResultsDir}`);
            const allurePort = options.port === '9090' ? '9091' : options.port;
            spawn('npx', ['allure', 'serve', allureResultsDir, '-p', allurePort], {
                stdio: 'inherit',
                shell: true
            });
            return;
        }
        // Try to find Hop Premium Report
        console.log(`\n🔍 Searching for the latest Hop Premium Report...`);
        const dirs = await readdir(baseReportDir);
        const timestampedDirs = [];
        for (const dir of dirs) {
            if (dir === 'allure-results' || dir === 'history' || dir === 'screenshots' || dir === 'videos')
                continue;
            const fullPath = path.join(baseReportDir, dir);
            const s = await stat(fullPath);
            if (s.isDirectory()) {
                timestampedDirs.push({ name: dir, path: fullPath, mtime: s.mtime });
            }
        }
        if (timestampedDirs.length === 0) {
            console.error('❌ No Hop reports found. Run tests first with --format hop');
            process.exit(1);
        }
        // Sort by mtime descending
        timestampedDirs.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
        const latestReportDir = timestampedDirs[0].path;
        console.log(`\n✨ Found latest report: ${timestampedDirs[0].name}`);
        console.log(`📂 Serving report from: ${latestReportDir}`);
        // Check if index.html exists
        const { existsSync } = await import('fs');
        if (!existsSync(path.join(latestReportDir, 'index.html'))) {
            console.error('❌ index.html not found in the latest report directory.');
            process.exit(1);
        }
        console.log(`🔗 Access your report at: http://localhost:${options.port}`);
        const server = spawn('npx', ['-y', 'serve', latestReportDir, '-l', options.port], {
            stdio: 'inherit',
            shell: true
        });
        server.on('error', (err) => {
            console.error('❌ Failed to start report server:', err.message);
        });
    }
    catch (error) {
        console.error('❌ Error:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
});
program
    .command('record')
    .description('Record browser actions and generate feature file')
    .option('-o, --output <path>', 'Output feature file path', './features/recorded.feature')
    .option('-s, --steps <path>', 'Output step definitions path', './steps/recorded.steps.ts')
    .option('-b, --browser <browser>', 'Browser to use (chromium, firefox, webkit)', 'chromium')
    .option('-u, --url <url>', 'Initial URL to open')
    .option('--headless', 'Run browser in headless mode', false)
    .option('--slow-mo <ms>', 'Slow down operations by ms', '50')
    .option('--no-steps', 'Do not generate step definitions', false)
    .action(async (options) => {
    try {
        const { Recorder } = await import('../src/recorder/recorder.js');
        const recorder = new Recorder({
            outputPath: options.output,
            stepPath: options.steps,
            browser: options.browser,
            headless: options.headless,
            slowMo: parseInt(options.slowMo),
            baseURL: options.url,
            generateSteps: options.steps !== false,
        });
        console.log('🎬 Hop Recorder - Starting browser...');
        console.log('');
        await recorder.start();
        console.log('\n📊 Recording Summary:');
        for (const { type, count } of recorder.getSummary()) {
            console.log(`   ${type}: ${count}`);
        }
        console.log('');
        await recorder.save(options.output);
        console.log('');
        console.log('✨ Recording complete! You can now run:');
        console.log(`   hop test -f ${options.output}`);
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
});
program.parse();
program
    .command('import-openapi')
    .description('Import tests from OpenAPI/Swagger specification')
    .option('-i, --input <path>', 'OpenAPI spec file path (JSON or YAML)')
    .option('-o, --output <path>', 'Output feature file path', './features/openapi.feature')
    .option('-b, --base-url <url>', 'Base URL for API')
    .action(async (options) => {
    try {
        const { readFileSync } = await import('fs');
        const { OpenAPIImporter } = await import('../src/utils/openapi-importer.js');
        if (!options.input) {
            console.error('❌ Please specify input file with -i or --input');
            process.exit(1);
        }
        console.log(`📥 Importing from OpenAPI: ${options.input}`);
        const spec = JSON.parse(readFileSync(options.input, 'utf-8'));
        const importer = new OpenAPIImporter(spec, { baseUrl: options.baseUrl });
        const featureContent = importer.generateFeature();
        const { writeFile, mkdir } = await import('fs/promises');
        const dir = options.output.replace(/\/[^/]+$/, '');
        await mkdir(dir, { recursive: true });
        await writeFile(options.output, featureContent, 'utf-8');
        console.log(`✅ Generated feature file from OpenAPI`);
        console.log(`   Output: ${options.output}`);
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
});
program
    .command('import-postman')
    .description('Import tests from Postman collection')
    .option('-i, --input <path>', 'Postman collection file path (JSON)')
    .option('-o, --output <path>', 'Output feature file path', './features/postman.feature')
    .action(async (options) => {
    try {
        const { PostmanImporter } = await import('../src/utils/postman-importer.js');
        if (!options.input) {
            console.error('❌ Please specify input file with -i or --input');
            process.exit(1);
        }
        console.log(`📥 Importing from Postman: ${options.input}`);
        const outputDir = options.output.replace(/\/[^/]+$/, '');
        const importer = new PostmanImporter(options.input, outputDir);
        const files = importer.convert();
        console.log(`✅ Generated ${files.length} feature file(s)`);
        console.log(`   Output: ${options.output}`);
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
});
program
    .command('debug')
    .description('Debug tests in interactive mode')
    .option('-f, --feature <path>', 'Path to feature file')
    .option('-s, --scenario <name>', 'Scenario name to debug')
    .option('-f, --features <path>', 'Path to features directory', './features')
    .action(async (options) => {
    try {
        const { GherkinParser } = await import('../src/parser/gherkin-parser.js');
        const featuresPath = path.resolve(options.features || './features');
        const parser = new GherkinParser();
        const featureFiles = await parser.discoverFeatures(featuresPath);
        if (featureFiles.length === 0) {
            console.error('❌ No feature files found');
            process.exit(1);
        }
        const parsedFeatures = await parser.parseFeatures(featureFiles);
        const { startDebugMode } = await import('../src/cli/debugger.js');
        await startDebugMode(parsedFeatures, options.scenario);
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
});
program.parse();
