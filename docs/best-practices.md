# Hop Framework - Best Practices Guide

## Table of Contents

1. [Project Structure](#project-structure)
2. [Feature File Organization](#feature-file-organization)
3. [Step Definition Best Practices](#step-definition-best-practices)
4. [Hooks Usage](#hooks-usage)
5. [Data Management](#data-management)
6. [Parallel Execution](#parallel-execution)
7. [Reporting](#reporting)
8. [CI/CD Integration](#cicd-integration)

---

## Project Structure

### Recommended Directory Layout

```
project/
├── hop.config.ts              # Hop configuration
├── package.json
├── tsconfig.json
├── features/                  # Feature files
│   ├── api/                   # API test features
│   │   ├── user.feature
│   │   └── auth.feature
│   ├── ui/                    # UI test features
│   │   └── login.feature
│   └── integration/           # Integration tests
├── steps/                     # Step definitions
│   ├── api-steps.ts
│   ├── ui-steps.ts
│   └── common-steps.ts
├── hooks/                     # Hooks
│   ├── before-scenario.ts
│   ├── after-scenario.ts
│   └── hooks-setup.ts
├── config/                    # Configuration files
│   ├── hop.config.ts
│   └── environments/
│       ├── dev.env
│       └── staging.env
├── utils/                     # Utility functions
├── reports/                   # Test reports
└── tests/                     # Unit tests
```

### Configuration File

```typescript
// hop.config.ts
import { defineConfig } from 'hop-framework';

export default defineConfig({
  features: 'features/**/*.feature',
  steps: [
    'steps/common-steps.ts',
    'steps/api-steps.ts',
    'steps/ui-steps.ts'
  ],
  hooks: 'hooks/**/*.ts',
  reporters: ['console', 'html', 'json'],
  parallel: 4,
  retry: {
    count: 2,
    delay: 1000
  },
  timeout: {
    scenario: 60000,
    step: 30000
  }
});
```

---

## Feature File Organization

### 1. Use Descriptive Names

```gherkin
# Bad
Feature: Test1

# Good
Feature: User Authentication
```

### 2. Keep Features Focused

```gherkin
# Bad - Too many scenarios in one feature
Feature: User Management
  Scenario: Create user
  Scenario: Update user
  Scenario: Delete user
  Scenario: List users
  Scenario: Search users

# Good - Separate features for different concerns
Feature: User Creation
Feature: User Update
Feature: User Deletion
```

### 3. Use Background Effectively

```gherkin
Feature: User Management

  Background:
    Given I am logged in as admin
    And I navigate to user management page
```

### 4. Scenario Outline for Data-Driven Tests

```gherkin
Scenario Outline: Login with different credentials
  Given I am on the login page
  When I enter "<username>" and "<password>"
  Then I should see "<result>"

  Examples:
    | username | password | result |
    | admin    | admin123 | dashboard |
    | invalid  | wrong    | error message |
```

---

## Step Definition Best Practices

### 1. Use Regex/Cucumber Expressions

```typescript
// Good - Clear, readable expressions
Given('I am logged in as {string}', async ({ context }, role: string) => {
  await loginAs(role);
});

When('I click the {string} button', async ({ page }, buttonText: string) => {
  await page.click(`button:has-text("${buttonText}")`);
});

Then('the response should contain {string}', async ({ response }, expected: string) => {
  expect(response.body).toContain(expected);
});
```

### 2. Reuse Steps

```typescript
// Good - Reuse existing steps
Given('I am on the login page', async ({ page }) => {
  await page.goto('/login');
});

// Later in another feature
When('I attempt to login', async () => {
  // Call the step that navigates to login
  await step('I am on the login page');
  await step('I enter credentials');
});
```

### 3. Handle Async Properly

```typescript
// Good - Proper async handling
Given('I wait for the element', async ({ page }) => {
  await page.waitForSelector('#element', { timeout: 5000 });
});

// Good - Handle promises
Then('I should see the result', async ({ context }) => {
  const result = await fetchResult();
  context.result = result;
});
```

### 4. Use Context for State

```typescript
// Good - Using context
Given('I set user data', async ({ context }) => {
  context.user = {
    name: 'John',
    email: 'john@example.com'
  };
});

Then('the user should be created', async ({ context }) => {
  expect(context.response.id).toBeDefined();
  expect(context.user.name).toBe(context.response.name);
});
```

---

## Hooks Usage

### 1. Use Hooks for Setup/Teardown

```typescript
// hooks/before-scenario.ts
import { BeforeScenario } from 'hop-framework';

BeforeScenario(async ({ context, browser }) => {
  // Setup
  context.startTime = Date.now();
  context.user = await createTestUser();
});

AfterScenario(async ({ context, page }) => {
  // Cleanup
  await cleanupTestData(context.user?.id);
  await context.page?.close();
});
```

### 2. Conditional Hooks

```typescript
// Run only for specific tags
BeforeScenario({ tags: '@ui' }, async ({ page }) => {
  await page.goto('/');
});

BeforeScenario({ tags: '@api' }, async ({ request }) => {
  request.headers['Authorization'] = `Bearer ${process.env.TOKEN}`;
});
```

### 3. Environment-Specific Hooks

```typescript
BeforeScenario({ tags: '@slow' }, async ({ context }) => {
  if (process.env.CI) {
    context.timeout = 120000; // Longer timeout in CI
  }
});
```

---

## Data Management

### 1. Use Fixture Files

```typescript
// fixtures/users.json
[
  { "name": "John", "email": "john@example.com" },
  { "name": "Jane", "email": "jane@example.com" }
]
```

```typescript
// In steps
Given('I load user fixtures', async ({ context }) => {
  const users = await readJsonFile('fixtures/users.json');
  context.users = users;
});
```

### 2. Use Environment Variables

```typescript
// In feature
Given url '${BASE_URL}/api/users'

// In config
export default defineConfig({
  env: {
    BASE_URL: process.env.API_URL || 'http://localhost:3000'
  }
});
```

### 3. Use Tags for Test Data

```gherkin
@smoke
Scenario: Smoke test
  Given I am on the homepage

@regression
Scenario: Full regression test
  Given I am on the admin page
```

---

## Parallel Execution

### 1. Configure Parallel Workers

```typescript
// hop.config.ts
export default defineConfig({
  parallel: 4 // Run 4 scenarios in parallel
});
```

### 2. Use Tags to Split Tests

```bash
# Run API tests
hop test --tags @api

# Run UI tests
hop test --tags @ui
```

### 3. Avoid Shared State

```typescript
// Bad - Shared state
let globalUser: User;

BeforeScenario(async () => {
  globalUser = await createUser();
});

// Good - Isolated context
BeforeScenario(async ({ context }) => {
  context.user = await createUser();
});
```

---

## Reporting

### 1. Use Multiple Reporters

```typescript
export default defineConfig({
  reporters: [
    'console',
    { type: 'html', output: 'reports/html' },
    { type: 'json', output: 'reports/results.json' },
    { type: 'junit', output: 'reports/junit.xml' }
  ]
});
```

### 2. Capture Screenshots on Failure

```typescript
AfterScenario({ tags: '@ui' }, async ({ page, result }) => {
  if (result.status === 'failed') {
    await page.screenshot({ 
      path: `reports/screenshots/${Date.now()}.png` 
    });
  }
});
```

---

## CI/CD Integration

### 1. GitHub Actions

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun test
      - run: bun run report:html
```

### 2. Docker for CI

```dockerfile
FROM oven/bun:1-alpine
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
CMD ["bun", "test"]
```

---

## Performance Tips

### 1. Use Background for Common Steps

```gherkin
Feature: API Tests

  Background:
    Given url 'https://api.example.com'
    And header Content-Type = 'application/json'
```

### 2. Reuse Browser Context

```typescript
// In hooks
BeforeAll(async ({ browser }) => {
  // Create browser context once
  global.browserContext = await browser.newContext();
});

AfterAll(async () => {
  await global.browserContext?.close();
});
```

### 3. Use Test Data Factory

```typescript
// utils/test-data-factory.ts
export class TestDataFactory {
  static async createUser(overrides = {}) {
    return {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      ...overrides
    };
  }
}
```

---

## Security Best Practices

### 1. Never Commit Secrets

```bash
# .gitignore
.env
*.local
secrets/
credentials/
```

### 2. Use Environment Variables

```typescript
// Good
const token = process.env.API_TOKEN;

// Bad - Never do this
const token = 'hardcoded-token';
```

### 3. Sanitize Test Data

```typescript
AfterScenario(async ({ context }) => {
  // Remove sensitive data
  delete context.user?.password;
  delete context.user?.token;
});
```

---

## Troubleshooting

### 1. Debug Mode

```bash
hop test --debug
```

### 2. Verbose Output

```bash
hop test --verbose
```

### 3. Run Single Scenario

```bash
hop test features/login.feature:15
```
