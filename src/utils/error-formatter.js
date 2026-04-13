export class HopError extends Error {
    step;
    context;
    featureName;
    scenarioName;
    featurePath;
    expected;
    actual;
    suggestions;
    constructor(message, options) {
        super(message);
        this.name = 'HopError';
        this.step = options?.step;
        this.context = options?.context;
        this.featureName = options?.featureName;
        this.scenarioName = options?.scenarioName;
        this.featurePath = options?.featurePath;
        this.expected = options?.expected;
        this.actual = options?.actual;
        this.suggestions = options?.suggestions || [];
    }
    getDetailedMessage() {
        let output = '';
        if (this.featureName || this.scenarioName) {
            output += `\n📍 Location:\n`;
            if (this.featureName)
                output += `   Feature: ${this.featureName}\n`;
            if (this.scenarioName)
                output += `   Scenario: ${this.scenarioName}\n`;
            if (this.featurePath)
                output += `   File: ${this.featurePath}\n`;
        }
        if (this.step) {
            output += `\n🔹 Failed Step:\n`;
            output += `   ${this.step.keyword} ${this.step.text}\n`;
        }
        if (this.expected !== undefined || this.actual !== undefined) {
            output += `\n📊 Comparison:\n`;
            if (this.expected !== undefined) {
                output += `   Expected: ${formatValue(this.expected)}\n`;
            }
            if (this.actual !== undefined) {
                output += `   Actual:   ${formatValue(this.actual)}\n`;
            }
            if (this.expected !== undefined && this.actual !== undefined) {
                const diff = generateDiff(this.expected, this.actual);
                if (diff) {
                    output += `\n🔍 Difference:\n${diff}`;
                }
            }
        }
        if (this.suggestions.length > 0) {
            output += `\n💡 Suggestions:\n`;
            for (const suggestion of this.suggestions) {
                output += `   • ${suggestion}\n`;
            }
        }
        return output;
    }
    toString() {
        return `${this.message}${this.getDetailedMessage()}`;
    }
}
export function formatValue(value, maxLength = 200) {
    if (value === null)
        return 'null';
    if (value === undefined)
        return 'undefined';
    if (typeof value === 'object') {
        const json = JSON.stringify(value, null, 2);
        if (json.length > maxLength) {
            return json.substring(0, maxLength) + '\n   ... (truncated)';
        }
        return json;
    }
    return String(value);
}
export function generateDiff(expected, actual) {
    if (typeof expected !== 'object' || typeof actual !== 'object') {
        return null;
    }
    const diff = [];
    const expectedKeys = new Set(Object.keys(expected || {}));
    const actualKeys = new Set(Object.keys(actual || {}));
    for (const key of expectedKeys) {
        if (!actualKeys.has(key)) {
            diff.push(`   - ${key}: ${formatValue(expected[key], 80).split('\n').join('\n   ')} (missing in actual)`);
        }
    }
    for (const key of actualKeys) {
        if (!expectedKeys.has(key)) {
            diff.push(`   + ${key}: ${formatValue(actual[key], 80).split('\n').join('\n   ')} (extra in actual)`);
        }
    }
    for (const key of expectedKeys) {
        if (actualKeys.has(key)) {
            const exp = expected[key];
            const act = actual[key];
            if (typeof exp === 'object' && typeof act === 'object' && exp !== null && act !== null) {
                const nestedDiff = generateDiff(exp, act);
                if (nestedDiff) {
                    diff.push(`   ✎ ${key}:`);
                    diff.push(nestedDiff.split('\n').map(l => '   ' + l).join('\n'));
                }
            }
            else if (exp !== act) {
                diff.push(`   ≠ ${key}: expected ${formatValue(exp, 50)}, got ${formatValue(act, 50)}`);
            }
        }
    }
    return diff.length > 0 ? diff.join('\n') : null;
}
export function generateStepSuggestion(stepText) {
    const suggestions = [];
    const lowerText = stepText.toLowerCase();
    if (lowerText.includes('navigates')) {
        suggestions.push('Make sure you have "Given user opens browser" before navigating', 'Check if the URL is correct and accessible');
    }
    if (lowerText.includes('clicks')) {
        suggestions.push('Ensure the element exists and is visible before clicking', 'Try adding wait step: "And user waits for \'selector\' to be clickable"', 'Check if the element selector is correct');
    }
    if (lowerText.includes('types')) {
        suggestions.push('Make sure the input field is visible and enabled', 'Check if the selector targets the correct input element');
    }
    if (lowerText.includes('status')) {
        suggestions.push('Check the API endpoint URL and method', 'Verify the server is running and accessible', 'Check authentication/authorization if applicable');
    }
    if (lowerText.includes('match response')) {
        suggestions.push('Verify the response structure matches your assertion', 'Use "And match response != null" to check if response exists first', 'Check for typos in the JSON path (e.g., response.data.user.name)');
    }
    if (lowerText.includes('connect to database')) {
        suggestions.push('Verify database connection string is correct', 'Make sure the database server is running', 'Check credentials and permissions');
    }
    return suggestions;
}
export function createErrorFromStep(step, error, context) {
    const suggestions = generateStepSuggestion(step.text);
    const options = {
        step,
        context,
        suggestions,
    };
    if (error.message.includes('Expected') && error.message.includes('but got')) {
        const match = error.message.match(/Expected\s+(.+?),\s+but\s+got\s+(.+)/i);
        if (match) {
            try {
                options.expected = JSON.parse(match[1]);
                options.actual = JSON.parse(match[2]);
            }
            catch {
                options.expected = match[1];
                options.actual = match[2];
            }
        }
    }
    return new HopError(error.message, options);
}
export function isUndefinedStepError(error) {
    return error?.cause?.isUndefinedStep === true;
}
