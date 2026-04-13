/**
 * Step Definitions Snippet Generator for Hop BDD Framework
 * Generates boilerplate code for undefined steps
 */
import { parseCucumberExpression } from './cucumber-expression.js';
import { SnippetBuilder } from './snippet-builder.js';
/**
 * Generate a step definition snippet for an undefined step
 */
export function generateSnippet(options) {
    const { keyword, stepText, fileName = 'custom-steps.ts' } = options;
    // Try to parse as Cucumber expression first
    const hasParameters = /\{[^}]+\}/.test(stepText);
    let pattern;
    let params = [];
    if (hasParameters) {
        // Extract parameter names from Cucumber expression
        const parsed = parseCucumberExpression(stepText);
        params = parsed.parameterNames;
        pattern = stepText;
    }
    else {
        // Use the exact text as pattern (for backward compatibility)
        pattern = stepText;
    }
    // Generate TypeScript code
    const code = SnippetBuilder.generateTypeScriptCode(keyword, pattern, params, hasParameters);
    return {
        code,
        filePath: `./steps/${fileName}`,
        pattern,
    };
}
/**
 * Export other functions by delegating to SnippetBuilder
 */
export function generateStepDefinitionsFile(steps) {
    return SnippetBuilder.generateStepDefinitionsFile(steps);
}
export function generateUndefinedStepMessage(steps) {
    return SnippetBuilder.generateUndefinedStepMessage(steps);
}
