import { StepExecutor } from './step-executor.js';
import { HooksRunner } from './hooks-runner.js';
import {} from './snippet-generator.js';
import { getDebugLogger } from '../utils/debug-logger.js';
export class StepExecutionHandler {
    hooksRunner;
    undefinedSteps;
    debugLogger = getDebugLogger();
    constructor(hooksRunner, undefinedSteps) {
        this.hooksRunner = hooksRunner;
        this.undefinedSteps = undefinedSteps;
    }
    async execute(step, context, scenarioName, executor) {
        const startTime = Date.now();
        // Debug: Log step execution
        this.debugLogger.logStep(step, context);
        // Check for breakpoint
        if (this.debugLogger.isBreakpoint(step.text)) {
            this.debugLogger.logBreakpoint(step);
        }
        await this.hooksRunner.beforeStep(step, context);
        try {
            await executor.executeStep(step, context);
            const result = { step, status: 'passed', duration: Date.now() - startTime };
            await this.hooksRunner.afterStep(step, context, { status: 'passed' });
            return result;
        }
        catch (error) {
            // Debug: Log error with context
            this.debugLogger.logError(error instanceof Error ? error : new Error(String(error)), context);
            // Format and display context on failure
            const errorMessage = error instanceof Error ? error.message : String(error);
            const contextInfo = this.debugLogger.formatContextForFailure(context, step, errorMessage);
            console.log(contextInfo);
            let screenshotPath;
            let videoPath;
            try {
                screenshotPath = await executor.takeScreenshot(scenarioName, context);
                // Capture video path if video recording is enabled
                const pw = executor.getPlaywright(context);
                const page = pw?.getPage();
                if (page) {
                    const video = page.video();
                    if (video) {
                        videoPath = await video.path();
                    }
                }
            }
            catch (mediaError) {
                executor.getLogger().error('Failed to capture media:', mediaError);
            }
            const result = {
                step,
                status: 'failed',
                duration: Date.now() - startTime,
                error: errorMessage,
                screenshotPath,
                videoPath,
            };
            this.trackUndefinedStep(step, error);
            await this.hooksRunner.afterStep(step, context, { status: 'failed', error });
            return result;
        }
    }
    trackUndefinedStep(step, error) {
        if (error instanceof Error && error.message.startsWith('Unknown step:')) {
            const stepKey = `${step.keyword} ${step.text}`;
            if (!this.undefinedSteps.some(s => `${s.keyword} ${s.stepText}` === stepKey)) {
                this.undefinedSteps.push({ keyword: step.keyword, stepText: step.text });
            }
        }
    }
}
