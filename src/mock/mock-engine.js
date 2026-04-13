import { GherkinParser } from '../parser/gherkin-parser.js';
import { StepExecutor } from '../engine/step-executor.js';
export class MockEngine {
    feature = null;
    state = {};
    stepExecutor;
    verbose;
    constructor(verbose = false) {
        this.verbose = verbose;
        this.stepExecutor = new StepExecutor({
            stepsPath: '',
            env: '',
            verbose: this.verbose,
            timeout: 5000,
            envConfig: {},
        });
    }
    async loadFeature(filePath) {
        const parser = new GherkinParser();
        const features = await parser.parseFeatures([filePath]);
        if (features.length === 0) {
            throw new Error(`Could not parse mock feature at ${filePath}`);
        }
        this.feature = features[0];
        // Initialize state from Background steps if any
        if (this.feature?.background) {
            const context = this.createInitialContext();
            for (const step of this.feature.background.steps) {
                await this.stepExecutor.executeStep(step, context);
            }
            this.state = context.variables;
        }
    }
    async handleRequest(req) {
        if (!this.feature) {
            throw new Error('Mock feature not loaded');
        }
        // Find first matching scenario
        for (const scenario of this.feature.scenarios) {
            if (this.matches(scenario, req)) {
                if (this.verbose) {
                    console.log(`🎯 Matched scenario: ${scenario.name}`);
                }
                return await this.executeScenario(scenario, req);
            }
        }
        // Default 404 if no scenario matches
        return {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
            body: { error: 'No matching mock scenario found', path: req.path, method: req.method },
        };
    }
    matches(scenario, req) {
        const name = scenario.name.trim();
        try {
            const sandbox = {
                pathMatches: (p) => req.path === p || req.path.startsWith(p),
                methodIs: (m) => req.method.toUpperCase() === m.toUpperCase(),
                headerContains: (h, v) => req.headers[h.toLowerCase()]?.includes(v),
                bodyPath: (p) => true,
                request: req.body,
                method: req.method,
                path: req.path,
            };
            if (name.includes('pathMatches') || name.includes('methodIs') || name.includes('&&')) {
                return this.evaluateExpression(name, sandbox);
            }
            return name.includes(req.path) && name.toLowerCase().includes(req.method.toLowerCase());
        }
        catch (e) {
            if (this.verbose) {
                console.error(`❌ Error matching scenario "${name}":`, e);
            }
            return false;
        }
    }
    evaluateExpression(expr, sandbox) {
        const allowedFunctions = ['pathMatches', 'methodIs', 'headerContains', 'bodyPath'];
        const allowedVariables = Object.keys(sandbox);
        const tokens = expr.split(/(\s+|&&|\|\||\(|\)|,|'[^']*'|"[^"]*")/).filter(t => t.trim());
        let result = true;
        let currentOp = '&&';
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i].trim();
            if (token === '&&' || token === '||') {
                currentOp = token;
                continue;
            }
            if (token === '(' || token === ')')
                continue;
            let value;
            if (allowedFunctions.some(f => token.startsWith(f + '('))) {
                const funcName = token.split('(')[0];
                const argsMatch = token.match(/\(([^)]*)\)/);
                const args = argsMatch ? argsMatch[1].split(',').map(a => a.trim().replace(/^['"]|['"]$/g, '')) : [];
                if (funcName === 'pathMatches' && args.length > 0) {
                    value = sandbox.pathMatches(args[0]);
                }
                else if (funcName === 'methodIs' && args.length > 0) {
                    value = sandbox.methodIs(args[0]);
                }
                else if (funcName === 'headerContains' && args.length > 1) {
                    value = sandbox.headerContains(args[0], args[1]);
                }
                else if (funcName === 'bodyPath') {
                    value = sandbox.bodyPath(args[0] || '');
                }
                else {
                    value = false;
                }
            }
            else if (token.startsWith("'") || token.startsWith('"')) {
                continue;
            }
            else if (allowedVariables.includes(token)) {
                value = !!sandbox[token];
            }
            else {
                value = false;
            }
            if (currentOp === '&&') {
                result = result && value;
            }
            else {
                result = result || value;
            }
        }
        return result;
    }
    async executeScenario(scenario, req) {
        const context = this.createInitialContext(req);
        // Inject state
        context.variables = { ...this.state };
        // Inject request globals
        context.variables['request'] = req.body;
        context.variables['requestHeaders'] = req.headers;
        context.variables['requestParams'] = req.queryParams;
        context.variables['requestMethod'] = req.method;
        context.variables['requestPath'] = req.path;
        // Execute steps
        for (const step of scenario.steps) {
            await this.stepExecutor.executeStep(step, context);
        }
        // Update global state with any changes made in this scenario
        this.state = { ...context.variables };
        // Extract response details from context
        const responseStatus = context.variables['responseStatus'] || 200;
        const responseHeaders = context.variables['responseHeaders'] || { 'Content-Type': 'application/json' };
        const responseBody = context.variables['response'];
        return {
            status: Number(responseStatus),
            headers: responseHeaders,
            body: responseBody,
        };
    }
    createInitialContext(req) {
        return {
            baseUrl: '',
            path: req?.path || '',
            method: req?.method || 'GET',
            headers: req?.headers || {},
            queryParams: req?.queryParams || {},
            body: req?.body,
            variables: {},
            cookies: {},
            read: async (filePath) => {
                const parser = new GherkinParser();
                // Resolve relative to feature if possible, for now use current dir
                return await parser.read(filePath, this.feature?.filePath);
            },
            logger: this.verbose ? console : {
                log: () => { },
                error: console.error,
                warn: console.warn,
            },
        };
    }
}
