import readline from 'readline';
import { StepExecutor } from '../engine/step-executor.js';
export class InteractiveDebugger {
    rl;
    executor;
    state;
    stepHistory = [];
    constructor(executor) {
        this.executor = executor;
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: 'hop:debug> ',
        });
        this.state = {
            currentFeature: null,
            currentScenario: null,
            currentStepIndex: 0,
            context: this.createDebugContext(),
            isRunning: false,
            breakpoints: [],
            variables: {},
        };
    }
    createDebugContext() {
        return {
            baseUrl: '',
            path: '',
            method: 'GET',
            headers: {},
            queryParams: {},
            body: undefined,
            variables: {},
            cookies: {},
            read: async () => '',
            logger: console,
        };
    }
    async start(features, scenarioName) {
        console.log('\n🛠️  Hop Interactive Debugger');
        console.log('═══════════════════════════════════════════════════');
        console.log('Commands:');
        console.log('  run         - Run all remaining steps');
        console.log('  next        - Execute next step');
        console.log('  step        - Step into (same as next)');
        console.log('  continue    - Continue until breakpoint');
        console.log('  break <text> - Set breakpoint on step containing text');
        console.log('  vars        - Show current variables');
        console.log('  set <k>=<v> - Set variable');
        console.log('  print <expr> - Print expression result');
        console.log('  history     - Show step history');
        console.log('  context     - Show current context (url, method, etc.)');
        console.log('  quit/exit   - Exit debugger');
        console.log('═══════════════════════════════════════════════════\n');
        const targetFeature = features[0];
        const targetScenario = scenarioName
            ? targetFeature.scenarios.find((s) => s.name === scenarioName)
            : targetFeature.scenarios[0];
        if (!targetScenario) {
            console.log('❌ Scenario not found');
            return;
        }
        this.state.currentFeature = targetFeature;
        this.state.currentScenario = targetScenario;
        this.state.isRunning = true;
        console.log(`📍 Debugging: ${targetFeature.name}`);
        console.log(`   Scenario: ${targetScenario.name}\n`);
        await this.runDebugLoop();
    }
    async runDebugLoop() {
        while (this.state.isRunning && this.state.currentStepIndex < this.state.currentScenario.steps.length) {
            const step = this.state.currentScenario.steps[this.state.currentStepIndex];
            this.stepHistory.push(step);
            console.log(`\n🔹 Step ${this.state.currentStepIndex + 1}/${this.state.currentScenario.steps.length}`);
            console.log(`   ${step.keyword} ${step.text}`);
            if (this.shouldBreakAtStep(step)) {
                console.log('   💥 Breakpoint hit!');
            }
            await this.promptCommand();
        }
        if (this.state.currentStepIndex >= this.state.currentScenario.steps.length) {
            console.log('\n✅ Scenario completed');
        }
    }
    shouldBreakAtStep(step) {
        for (const bp of this.state.breakpoints) {
            if (step.text.toLowerCase().includes(bp.toLowerCase())) {
                return true;
            }
        }
        return false;
    }
    async promptCommand() {
        return new Promise((resolve) => {
            this.rl.question('', async (cmd) => {
                const parts = cmd.trim().split(/\s+/);
                const command = parts[0]?.toLowerCase();
                const args = parts.slice(1).join(' ');
                switch (command) {
                    case 'next':
                    case 'step':
                        await this.executeNextStep();
                        break;
                    case 'run':
                    case 'continue':
                        await this.runRemainingSteps();
                        break;
                    case 'break':
                        this.addBreakpoint(args);
                        break;
                    case 'vars':
                        this.showVariables();
                        break;
                    case 'set':
                        this.setVariable(args);
                        break;
                    case 'print':
                        this.printExpression(args);
                        break;
                    case 'history':
                        this.showHistory();
                        break;
                    case 'context':
                        this.showContext();
                        break;
                    case 'quit':
                    case 'exit':
                        this.state.isRunning = false;
                        console.log('👋 Goodbye!');
                        break;
                    case 'help':
                        this.showHelp();
                        break;
                    default:
                        console.log(`Unknown command: ${command}. Type 'help' for available commands.`);
                }
                resolve();
            });
        });
    }
    async executeNextStep() {
        const step = this.state.currentScenario.steps[this.state.currentStepIndex];
        try {
            await this.executor.executeStep(step, this.state.context);
            console.log(`   ✅ Passed`);
            this.state.currentStepIndex++;
        }
        catch (error) {
            console.log(`   ❌ Failed: ${error instanceof Error ? error.message : error}`);
            this.state.isRunning = false;
        }
    }
    async runRemainingSteps() {
        console.log('   Running...\n');
        while (this.state.isRunning && this.state.currentStepIndex < this.state.currentScenario.steps.length) {
            const step = this.state.currentScenario.steps[this.state.currentStepIndex];
            if (this.shouldBreakAtStep(step)) {
                console.log(`   💥 Breakpoint hit at step ${this.state.currentStepIndex + 1}`);
                break;
            }
            try {
                await this.executor.executeStep(step, this.state.context);
                this.state.currentStepIndex++;
            }
            catch (error) {
                console.log(`   ❌ Failed at step ${this.state.currentStepIndex + 1}: ${error instanceof Error ? error.message : error}`);
                this.state.isRunning = false;
                break;
            }
        }
        if (this.state.currentStepIndex >= this.state.currentScenario.steps.length) {
            console.log('✅ Scenario completed');
        }
    }
    addBreakpoint(text) {
        if (!text) {
            console.log(`   Breakpoints: ${this.state.breakpoints.join(', ') || '(none)'}`);
        }
        else {
            this.state.breakpoints.push(text);
            console.log(`   ✅ Breakpoint added: "${text}"`);
        }
    }
    showVariables() {
        console.log('\n📦 Variables:');
        const vars = { ...this.state.context.variables, ...this.state.variables };
        if (Object.keys(vars).length === 0) {
            console.log('   (empty)');
        }
        else {
            for (const [key, value] of Object.entries(vars)) {
                console.log(`   ${key} = ${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}`);
            }
        }
        console.log('');
    }
    setVariable(expr) {
        const match = expr.match(/^(\w+)=(.+)$/);
        if (match) {
            const [, key, value] = match;
            try {
                this.state.variables[key] = JSON.parse(value);
                console.log(`   ✅ Set ${key} = ${value}`);
            }
            catch {
                this.state.variables[key] = value;
                console.log(`   ✅ Set ${key} = "${value}"`);
            }
        }
        else {
            console.log('   Usage: set <key>=<value>');
        }
    }
    printExpression(expr) {
        try {
            const result = this.executor.resolveVariables(`#(${expr})`, this.state.context);
            console.log(`   => ${JSON.stringify(result, null, 2)}`);
        }
        catch (error) {
            console.log(`   ❌ Error: ${error instanceof Error ? error.message : error}`);
        }
    }
    showHistory() {
        console.log('\n📜 Step History:');
        for (let i = 0; i < this.stepHistory.length; i++) {
            const step = this.stepHistory[i];
            const marker = i === this.state.currentStepIndex ? '👉 ' : '   ';
            console.log(`   ${marker}${i + 1}. ${step.keyword} ${step.text}`);
        }
        console.log('');
    }
    showContext() {
        const ctx = this.state.context;
        console.log('\n🔍 Current Context:');
        console.log(`   URL: ${ctx.baseUrl}${ctx.path}`);
        console.log(`   Method: ${ctx.method}`);
        console.log(`   Headers: ${JSON.stringify(ctx.headers)}`);
        console.log(`   Query: ${JSON.stringify(ctx.queryParams)}`);
        if (ctx.body)
            console.log(`   Body: ${JSON.stringify(ctx.body)}`);
        console.log('');
    }
    showHelp() {
        console.log('\n📖 Available Commands:');
        console.log('  run         - Run all remaining steps');
        console.log('  next        - Execute next step');
        console.log('  step        - Step into (same as next)');
        console.log('  continue    - Continue until breakpoint');
        console.log('  break <text> - Set/list breakpoints');
        console.log('  vars        - Show current variables');
        console.log('  set <k>=<v> - Set variable');
        console.log('  print <expr> - Print expression result');
        console.log('  history     - Show step history');
        console.log('  context     - Show current context');
        console.log('  quit/exit   - Exit debugger');
        console.log('');
    }
    close() {
        this.rl.close();
    }
}
export async function startDebugMode(features, scenarioName, executor) {
    if (!executor) {
        executor = new StepExecutor({
            stepsPath: './steps',
            env: 'test',
            verbose: true,
            timeout: 30000,
        });
    }
    const debugger_ = new InteractiveDebugger(executor);
    await debugger_.start(features, scenarioName);
    debugger_.close();
}
