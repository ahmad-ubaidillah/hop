// Hooks for Hop BDD Framework
// Add before/after hooks here
export const beforeScenario = async (scenario, context) => {
    // Runs before each scenario
    console.log(`Starting scenario: ${scenario.name}`);
};
export const afterScenario = async (scenario, context, result) => {
    // Runs after each scenario
    console.log(`Finished scenario: ${scenario.name} - Status: ${result.status}`);
};
export const beforeStep = async (step, context) => {
    // Runs before each step
};
export const afterStep = async (step, context, result) => {
    // Runs after each step
};
export const beforeAll = async () => {
    // Runs once before all tests
    console.log('Test suite starting...');
};
export const afterAll = async () => {
    // Runs once after all tests
    console.log('Test suite completed.');
};
