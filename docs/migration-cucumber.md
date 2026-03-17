# Migration Guide: Cucumber.js to Hop Framework

## Overview

This guide helps you migrate your existing Cucumber.js tests to the Hop Framework. Hop is designed to be largely compatible with Cucumber.js while offering additional features and improvements.

## Key Differences

### 1. Project Structure

**Cucumber.js:**
```javascript
// cucumber.js
module.exports = {
  default: {
    format: ['progress-bar', 'summary'],
    paths: ['features/**/*.feature'],
    require: ['steps/**/*.js']
  }
}
```

**Hop Framework:**
```typescript
// hop.config.ts
import { defineConfig } from 'hop-framework';

export default defineConfig({
  features: 'features/**/*.feature',
  steps: 'steps/**/*.ts',
  reporters: ['console', 'html'],
  parallel: 4
});
```

### 2. Step Definitions

**Cucumber.js:**
```javascript
// steps/login.js
const { Given, When, Then } = require('@cucumber/cucumber');

Given('I am on the login page', async function() {
  await page.goto('/login');
});

When('I enter {string} and {string}', async function(username, password) {
  await page.fill('#username', username);
  await page.fill('#password', password);
});

Then('I should see the dashboard', async function() {
  await expect(page).toHaveURL('/dashboard');
});
```

**Hop Framework:**
```typescript
// steps/login.ts
import { Given, When, Then } from 'hop-framework';

Given('I am on the login page', async ({ page }) => {
  await page.goto('/login');
});

When('I enter {string} and {string}', async ({ page }, username: string, password: string) => {
  await page.fill('#username', username);
  await page.fill('#password', password);
});

Then('I should see the dashboard', async ({ page }) => {
  await expect(page).toHaveURL('/dashboard');
});
```

### 3. Hooks

**Cucumber.js:**
```javascript
// hooks/hooks.js
const { Before, After, BeforeAll, AfterAll } = require('@cucumber/cucumber');

Before(async function() {
  this.driver = await new Builder().forBrowser('chrome').build();
});

After(async function() {
  await this.driver.quit();
});
```

**Hop Framework:**
```typescript
// hooks/before-scenario.ts
import { BeforeScenario, AfterScenario, BeforeAll, AfterAll } from 'hop-framework';

BeforeScenario(async ({ context, browser }) => {
  context.driver = await browser.launch();
});

AfterScenario(async ({ context }) => {
  await context.driver?.quit();
});
```

### 4. Data Tables

**Cucumber.js:**
```gherkin
Scenario: Add multiple users
  Given the following users:
    | name | email | role |
    | John | john@test.com | admin |
    | Jane | jane@test.com | user |
```

```javascript
Given('the following users:', async function(table) {
  for (const row of table.rows()) {
    await createUser({ name: row[0], email: row[1], role: row[2] });
  }
});
```

**Hop Framework:**
```typescript
Given('the following users:', async ({ context }, table: DataTable) => {
  for (const row of table.rows()) {
    await createUser({ 
      name: row.name, 
      email: row.email, 
      role: row.role 
    });
  }
});
```

### 5. Backgrounds

Both frameworks support Background sections identically:

```gherkin
Feature: User Management
  Background:
    Given I am logged in as admin
    And I navigate to user management

  Scenario: Create new user
    When I create a new user
    Then the user should be created
```

### 6. Scenario Outlines

Both frameworks support Scenario Outlines with Examples:

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

### 7. Tags and Filtering

**Cucumber.js:**
```bash
cucumber.js --tags "@smoke"
```

**Hop Framework:**
```bash
hop test --tags "@smoke"
```

### 8. Hooks for Tags

**Cucumber.js:**
```javascript
Before('@smoke', async function() {
  // Setup for smoke tests
});
```

**Hop Framework:**
```typescript
// In hooks/before-scenario.ts
Before({ tags: '@smoke' }, async ({ context }) => {
  // Setup for smoke tests
});
```

## Migration Steps

### Step 1: Install Hop Framework

```bash
npm install hop-framework
# or
bun add hop-framework
```

### Step 2: Create Configuration

Create `hop.config.ts`:

```typescript
import { defineConfig } from 'hop-framework';

export default defineConfig({
  features: 'features/**/*.feature',
  steps: 'steps/**/*.ts',
  hooks: 'hooks/**/*.ts',
  reporters: ['console', 'html'],
  parallel: 4
});
```

### Step 3: Convert Step Definitions

1. Rename `.js` files to `.ts`
2. Add TypeScript types
3. Replace `this` with context parameter

### Step 4: Convert Hooks

1. Move hooks to `hooks/` directory
2. Use the new hook signatures
3. Access context via dependency injection

### Step 5: Update Test Scripts

Update your `package.json`:

```json
{
  "scripts": {
    "test": "hop test",
    "test:parallel": "hop test --parallel",
    "test:ui": "hop test --ui"
  }
}
```

### Step 6: Run Tests

```bash
# Run all tests
hop test

# Run with specific tags
hop test --tags "@smoke"

# Run in parallel
hop test --parallel

# Generate HTML report
hop report --format html
```

## Feature Comparison

| Feature | Cucumber.js | Hop Framework |
|---------|-------------|---------------|
| Gherkin Syntax | ✅ | ✅ |
| TypeScript Support | ⚠️ External | ✅ Native |
| Parallel Execution | ⚠️ Limited | ✅ Built-in |
| Built-in HTTP Steps | ❌ | ✅ |
| Built-in DB Steps | ❌ | ✅ |
| Visual Regression | ⚠️ External | ✅ Built-in |
| Contract Testing | ❌ | ✅ |
| Load Testing | ❌ | ✅ |

## Common Issues

### Issue 1: Module Resolution

If you have issues with module resolution, add to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "esModuleInterop": true
  }
}
```

### Issue 2: Context Not Available

Make sure you're using the context parameter:

```typescript
// Wrong
Given('I am logged in', async function() {
  this.user = 'admin'; // ❌
});

// Correct
Given('I am logged in', async ({ context }) => {
  context.user = 'admin'; // ✅
});
```

## Support

For issues and questions, please visit:
- GitHub: https://github.com/hop-framework/hop
- Discord: https://discord.gg/hop-framework
