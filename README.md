# Hop - High-Performance BDD Automation Testing Framework

<p align="center">
  <a href="https://www.npmjs.com/package/hop-framework"><img src="https://img.shields.io/npm/v/hop-framework.svg" alt="NPM Version"></a>
  <a href="https://www.npmjs.com/package/hop-framework"><img src="https://img.shields.io/npm/l/hop-framework.svg" alt="License"></a>
  <a href="https://github.com/ahmad-ubaidillah/hop/actions"><img src="https://img.shields.io/github/actions/workflow/status/ahmad-ubaidillah/hop/test.yml" alt="Build Status"></a>
</p>

BDD Testing for Modern Web - API Testing, UI Testing, Database Testing, and Load Testing in one framework.

## Features

### Core Testing
- **API Testing** - HTTP/HTTPS, GraphQL, WebSocket support with response validation
- **UI Testing** - Browser automation with Playwright (click, type, wait, assert)
- **Database Testing** - Direct database queries and validation
- **Mock Server** - Built-in mock server for API simulation
- **Load Testing** - Generate k6 load test scripts from feature files

### Hybrid Testing (Gherkin + Direct Code)
- **Gherkin BDD** - Write tests in natural language (.feature files)
- **Direct Code** - Playwright-style API (hop.get, hop.visit, etc.)
- **Custom Steps** - Define your own step definitions
- **Auto-Await** - Optional automatic await for cleaner code

### Advanced Capabilities
- **Parallel Execution** - Run scenarios concurrently with configurable concurrency
- **Retry Mechanism** - Automatic retry for flaky tests
- **Hooks System** - Before/After hooks for setup and teardown
- **Tags & Filtering** - Run specific scenarios with tag filters
- **Environment Variables** - Multi-environment support (.env files)

### Import & Export
- **Postman Collection Importer** - Import Postman collections to feature files
- **OpenAPI/Swagger Importer** - Generate tests from API specs

### Validation & Matching
- **Response Validation** - JSON response matching and assertions
- **Schema Validation** - JSON Schema validation
- **Fuzzy Matching** - Partial matching for flexible assertions
- **Expression Evaluation** - Custom expression support in assertions

### Developer Experience
- **UI Mode** - Interactive test runner with live reload
- **Trace Viewer** - Debug with DOM snapshots and timeline
- **Visual Regression** - Screenshot comparison testing
- **Codegen** - Generate tests from browser interactions
- **Device Emulation** - Test on 100+ device configurations

### Reporting
- **Console Reporter** - Real-time test output
- **JSON Reporter** - Machine-readable results
- **JUnit XML** - CI/CD integration
- **HTML Report** - Beautiful visual reports
- **Allure Reporter** - Rich test analytics
- **Newman Dashboard** - Postman-style API report

### Utilities
- **Variable Resolution** - Reuse values across scenarios
- **Secret Management** - Secure credential handling
- **Plugin System** - Extend framework functionality
- **Fixture Manager** - Test data management
- **Test Data Factory** - Generate fake test data
- **CSV/JSON Data Support** - Data-driven testing

## Quick Start

```bash
# Install
bun add -g hop-framework

# Create project
hop init my-tests
cd my-tests

# Run tests
hop test
```

## Installation Options

| Method | Command |
|--------|---------|
| Bun (recommended) | `bun add -g hop-framework` |
| npm | `npm install -g hop-framework` |
| npx (no install) | `npx github:ahmad-ubaidillah/hop test` |

---

# Hybrid Testing Guide

Hop supports both **Gherkin BDD** and **Direct Code** testing in one framework.

## 1. Direct Code Testing (Playwright-Style)

### Basic Usage

```typescript
import { hop, test } from 'hop';

test('login flow', async () => {
  await hop.launch();
  await hop.visit('https://example.com');
  
  await hop.get('#email').fill('test@example.com');
  await hop.get('#password').fill('secret123');
  await hop.get('#login').click();
  
  await hop.get('#dashboard').should('be.visible');
  await hop.close();
});
```

### With Auto-Await

```typescript
// hop.config.ts
export default {
  autoAwait: true,
};

// Test file - no await needed
import { hop, test } from 'hop';

test('login flow', async () => {
  await hop.launch();
  await hop.visit('https://example.com');
  
  hop.get('#email').fill('test@example.com');
  hop.get('#login').click();
  hop.get('#dashboard').should('be.visible');
  
  await hop.close();
});
```

## 2. Gherkin BDD Testing

### Write in .feature files

```gherkin
# tests/features/login.feature
Feature: Login

  Scenario: User login successfully
    Given I open "https://example.com/login"
    When I fill "#email" with "test@example.com"
    And I fill "#password" with "secret123"
    And I click "#login-button"
    Then I should see "#dashboard"
```

### Custom Step Definitions

```typescript
// steps/custom-steps.ts
import { defineStep, defineGiven, defineWhen, defineThen } from 'hop';

defineGiven('I open {string}', async (url: string) => {
  await hop.visit(url);
});

defineWhen('I fill {string} with {string}', async (selector: string, value: string) => {
  await hop.get(selector).fill(value);
});

defineThen('I should see {string}', async (selector: string) => {
  await hop.get(selector).should('be.visible');
});
```

---

# hop.* API Reference

## Core Functions

| Function | Description |
|----------|-------------|
| `hop.launch()` | Launch browser |
| `hop.close()` | Close browser |
| `hop.visit(url)` | Navigate to URL |
| `hop.get(selector)` | Get element locator |
| `hop.getByRole(name, options)` | Get by ARIA role |
| `hop.getByLabel(text)` | Get by label text |
| `hop.getByPlaceholder(text)` | Get by placeholder |
| `hop.getByText(text)` | Get by element text |
| `hop.wait(ms)` | Wait for milliseconds |
| `hop.intercept(url, response)` | Mock network response |
| `hop.waitForRequest(url)` | Wait for API request |
| `hop.waitForResponse(url)` | Wait for API response |
| `hop.iframe` | Iframe handler |

---

## Element Locator Methods

### Getting Elements

```typescript
// CSS selector
hop.get('#button')
hop.get('.menu-item')
hop.get('div.container')

// Semantic locators
hop.getByRole('button', { name: 'Submit' })
hop.getByLabel('Email')
hop.getByPlaceholder('Enter email')
hop.getByText('Click here')
hop.getByAltText('image description')
```

### Click Interactions

```typescript
const btn = hop.get('#submit');

// Single click
await btn.click();
await btn.click({ force: true });
await btn.click({ position: { x: 10, y: 5 } });

// Double click
await btn.dblclick();
await btn.dblclick({ force: true });

// Right click
await btn.rightclick();
await btn.rightClick();

// With keyboard modifiers
await btn.clickWithShift();   // Shift+click
await btn.clickWithControl(); // Ctrl+click
await btn.clickWithMeta();    // Cmd+click (Mac)
```

### Input Interactions

```typescript
const input = hop.get('#email');

// Fill (clear + type)
await input.fill('test@example.com');

// Type (character by character with delay)
await input.type('text', { delay: 50 });

// Clear
await input.clear();

// Fill and submit
await input.fillAndEnter('search query');

// Select dropdown
await input.select('option-value');
await input.select(['option-1', 'option-2']); // multi-select
```

### Checkbox & Radio

```typescript
const checkbox = hop.get('#agree');

// Check/Uncheck
await checkbox.check();
await checkbox.uncheck();

// Toggle
if (await checkbox.isChecked()) {
  await checkbox.uncheck();
}
```

### File Upload

```typescript
// Single file
await hop.get('#file-input').selectFile('path/to/file.txt');

// Multiple files
await hop.get('#file-input').selectFile([
  'file1.txt',
  'file2.txt'
]);

// With options
await hop.get('#file-input').selectFile({
  name: 'document.pdf',
  mimeType: 'application/pdf'
});
```

### Drag & Drop

```typescript
// Simple drag and drop
await hop.get('#draggable').dragTo('#dropzone');
await hop.get('#draggable').dragToAndDrop('#dropzone');

// Drag with offset
const draggable = hop.get('#item');
await draggable.dragTo(hop.get('#zone'));
```

### Keyboard Interactions

```typescript
const input = hop.get('input');

// Press single key
await input.press('Enter');
await input.press('Tab');
await input.press('Escape');

// Press specific keys
await input.pressKey('Enter');
await input.pressKey('ArrowDown');
await input.pressKey('Backspace');

// Full keyboard control
await input.focus();
await hop.getPage().keyboard.press('Control+A');
await hop.getPage().keyboard.press('Control+C');
await hop.getPage().keyboard.press('Control+V');
```

### Text Selection

```typescript
const text = hop.get('#content');

// Select all
await text.selectAll();

// Cut/Copy/Paste
await text.cut();
await text.copy();
await text.paste();
```

### Mouse Interactions

```typescript
const element = hop.get('#element');

// Hover
await element.hover();

// Scroll into view
await element.scrollIntoView();

// Swipe (mobile)
await element.swipe('left');
await element.swipe('right');
await element.swipe('up');
await element.swipe('down', 300);
```

### Focus & Blur

```typescript
await hop.get('input').focus();
await hop.get('input').blur();
```

### Custom Events

```typescript
await hop.get('#button').trigger('click');
await hop.get('#element').trigger('custom-event', { detail: { data: 'value' } });
```

---

## Get Element Data

```typescript
const element = hop.get('#item');

// Text content
const text = await element.getText();

// HTML content
const html = await element.getInnerHTML();

// Input value
const value = await element.getValue();

// Attributes
const href = await element.getAttribute('href');
const className = await element.getAttribute('class');

// Check element state
const visible = await element.isVisible();
const hidden = await element.isHidden();
const enabled = await element.isEnabled();
const disabled = await element.isDisabled();
const checked = await element.isChecked();

// Count elements
const count = await element.count();
```

---

## Assertions

### Basic Assertions (Locator methods)

```typescript
const element = hop.get('#element');

// Wait for state
await element.should('be.visible');
await element.should('be.hidden');
await element.should('be.enabled');
await element.should('be.disabled');
await element.should('be.checked');
await element.should('exist');

// Text assertions
await element.shouldHave('Exact text');
await element.shouldHave(/Regex pattern/);
await element.shouldContain('Partial text');

// Value assertions
await element.shouldHaveValue('input value');
await element.shouldHaveValue(/pattern/);

// Attribute assertions
await element.shouldHaveAttribute('href', 'https://...');
await element.shouldHaveAttribute('class', /active/);

// Count assertions
await element.shouldHaveCount(5);
```

### expect() - Playwright-style Assertions

```typescript
import { expect } from 'hop';

// Assert element is visible
await expect(hop.get('#button')).toBeVisible();
await expect(hop.get('#button')).toBeHidden();
await expect(hop.get('#input')).toBeEnabled();
await expect(hop.get('#input')).toBeDisabled();
await expect(hop.get('#checkbox')).toBeChecked();

// Assert text
await expect(hop.get('#title')).toHaveText('Hello World');
await expect(hop.get('#title')).toHaveText(/Hello/);
await expect(hop.get('#desc')).toContain('partial text');

// Assert count
await expect(hop.get('.items')).toHaveCount(5);

// Assert value
await expect(hop.get('#input')).toHaveValue('test value');
await expect(hop.get('#input')).toHaveValue(/test/);

// Assert attributes
await expect(hop.get('#link')).toHaveAttribute('href', 'https://...');
await expect(hop.get('#link')).toHaveAttribute('class', /active/);

// Assert CSS
await expect(hop.get('#element')).toHaveCSS('color', 'rgb(255, 0, 0)');

// Assert value equality
expect(1 + 1).toBe(2);
expect({ a: 1 }).toEqual({ a: 1 });

// Negation
await expect(hop.get('#button')).not().toBeVisible();
```

### Web-First Assertions (Auto-Retry)

```typescript
// Built-in retry mechanism
await hop.get('#counter').shouldHaveText('10'); // retries until match

// With timeout
await element.waitFor({ state: 'visible', timeout: 10000 });
await element.waitFor({ state: 'attached' });
```

---

## Network & API

### Intercept (Mock)

```typescript
// Mock API response
await hop.intercept('**/api/users', {
  status: 200,
  body: {
    users: [
      { id: 1, name: 'John' }
    ]
  }
});

// Mock with headers
await hop.intercept('**/api/**', {
  status: 201,
  body: { message: 'Created' },
  headers: {
    'X-Custom-Header': 'value'
  }
});

// Mock with delay
await hop.intercept('**/api/**', {
  status: 200,
  body: { data: 'delayed' },
  headers: {}
}, 2000); // 2 second delay
```

### Wait for Request/Response

```typescript
// Wait for request
const request = await hop.waitForRequest('**/api/users');
console.log(request.url());
console.log(request.method());

// Wait for response
const response = await hop.waitForResponse('**/api/users');
console.log(response.status());
const json = await response.json();

// Wait and continue (pass through)
await hop.waitForResponse('**/api/**');
// API call will proceed normally after waiting
```

---

## Iframe Handling

```typescript
// Get iframe handler
hop.iframe.frame('#my-iframe').get('button').click();

// Get by URL
hop.iframe.getFrame('https://example.com');

// Count iframes
const count = await hop.iframe.count();

// Get all iframes
const frames = await hop.iframe.getAll();
```

---

## Device Emulation

```typescript
import { hop } from 'hop';

// Use preset devices
const mobile = hop({ device: 'iPhone 12' });
await mobile.launch();
await mobile.visit('https://example.com');

// Available presets:
// Apple: iPhone 12, iPhone 12 Pro, iPhone 13, iPad Pro, etc.
// Android: Pixel 5, Samsung Galaxy S21, etc.
// Desktop: Desktop Chrome, Desktop Firefox, etc.

// Custom device
await hop.launch({
  viewport: { width: 375, height: 812 },
  userAgent: 'Custom Agent',
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true
});
```

---

## Browser Configuration

```typescript
import { hop, setConfig } from 'hop';

// Set global config
setConfig({
  browser: 'chromium', // chromium, firefox, webkit
  headless: false,    // Show browser
  viewport: { width: 1920, height: 1080 },
  timeout: 30000,
  video: 'on-failure', // always, on-failure, never
  device: 'iPhone 12',
  autoAwait: true
});

// Or per-test
await hop.launch({
  browser: 'firefox',
  headless: true
});
```

---

## Page Operations

```typescript
// Navigate
await hop.visit('https://example.com');
await hop.goBack();
await hop.goForward();
await hop.reload();

// Get page info
const title = await hop.title();
const url = hop.url();

// Screenshot
await hop.screenshot();
await hop.screenshot({ path: 'screenshot.png' });

// PDF generation
const pdf = await hop.pdf();
await hop.pdf({ path: 'page.pdf', format: 'A4' });

// Evaluate JavaScript
const result = await hop.evaluate(() => {
  return document.title;
});

// Element queries (jQuery-style)
hop.$('#button');                  // First element
hop.$$('.items');                  // All elements (array)
hop.$eval('#button', el => el.textContent);  // Evaluate on first
hop.$$eval('.items', els => els.map(e => e.textContent)); // Evaluate on all

// Element chains
hop.first('.item');    // First matching
hop.last('.item');     // Last matching
hop.nth('.item', 2);   // 3rd element (0-indexed)
hop.filter('.item', { hasText: 'active' }); // Filter by text
```

---

## Direct Element Locator Methods

```typescript
// On hop.get() locator
const el = hop.get('#item');

el.first();      // First element
el.last();       // Last element  
el.nth(2);       // Nth element
el.debug();      // Debug output

// Also available directly on hop
hop.first('.item');
hop.last('.item');
hop.nth('.item', 2);
hop.filter('.item', { hasText: 'active' });
```

---

# Gherkin BDD Reference

## Built-in Steps

```gherkin
Feature: Example

  Scenario: API test
    Given url 'https://api.example.com'
    And path '/users/1'
    When method GET
    Then status 200
    And match response.id == 1

  Scenario: UI test
    Given open 'https://example.com'
    When type '#search' 'query'
    And click '#submit'
    Then wait for '#results'
    And assert text '#count' == '10'
```

## Custom Step Definitions

```typescript
import { defineStep, defineGiven, defineWhen, defineThen } from 'hop';

defineGiven('I am on the homepage', async () => {
  await hop.visit('https://example.com');
});

defineWhen('I login with {string} and {string}', async (username, password) => {
  await hop.get('#username').fill(username);
  await hop.get('#password').fill(password);
  await hop.get('#login').click();
});

defineThen('I should see my profile', async () => {
  await hop.get('#profile').should('be.visible');
});
```

---

# CLI Commands

```bash
# Run all tests
hop test

# Run with tags
hop test --tags "@smoke"
hop test --tags "@ui and not @slow"

# Run specific features
hop test ./features/login.feature

# Run specific environment
hop test --env staging

# Generate HTML report
hop test --format hop --report

# Generate JUnit XML
hop test --format junit --output ./reports/junit.xml

# Run in parallel
hop test --parallel --concurrency 5

# Verbose logging
hop test --verbose

# Retry failed tests
hop test --retry 3

# Custom timeout
hop test --timeout 60000
```

---

# Configuration

## hop.config.ts

```typescript
import { defineConfig } from 'hop';

export default defineConfig({
  // Test directories
  testDir: './tests',
  
  // Gherkin feature files
  gherkinPatterns: [
    '**/*.feature',
    '**/features/**/*.feature'
  ],
  
  // Direct code test files
  specPatterns: [
    '**/*.spec.ts',
    '**/*.spec.js',
    '**/*.test.ts',
    '**/*.test.js'
  ],
  
  // Custom step definitions
  stepsDir: './steps',
  
  // Timeout
  timeout: 30000,
  
  // Retry failed tests
  retries: {
    openMode: 0,
    runMode: 2
  },
  
  // Browser settings
  browser: {
    type: 'chromium', // chromium, firefox, webkit
    headless: true,
    viewport: {
      width: 1280,
      height: 720
    }
  },
  
  // Video & Screenshot
  video: 'on-failure', // always, on-failure, never
  screenshotOnFailure: true,
  
  // Reporters
  reporters: [
    'list',
    'json',
    'html'
  ],
  
  // Base URL for tests
  baseUrl: 'https://demo.playwright.dev',
  
  // Environment variables
  env: {
    API_URL: 'https://api.example.com',
    ADMIN_USER: 'admin',
    ADMIN_PASS: 'secret'
  },
  
  // Device emulation
  devices: [
    'iPhone 12',
    'iPad Pro 11',
    'Pixel 5'
  ]
});
```

## Auto-Await Configuration

```typescript
import { defineConfig } from 'hop';

export default defineConfig({
  // Enable auto-await (no need for await keyword)
  autoAwait: true
});
```
  viewport: { width: 1280, height: 720 },
  video: 'on-failure',

  // Output
  format: ['console', 'hop'],
  report: true,

  // Environment
  env: 'test',
};
```

---

# Utilities

## Import utilities from hop

```typescript
import { 
  // Data generation
  TestDataFactory,
  
  // Variable resolution
  VariableResolver,
  ValueParser,
  
  // Environment
  loadEnv,
  SecretsManager,
  
  // Testing utilities
  SnapshotTester,
  VisualRegressionTester,
  FlakyTestDetector,
  PerformanceProfiler,
  
  // Importers
  PostmanImporter,
  OpenAPIImporter,
  
  // Lifecycle
  TimeoutManager,
  FileWatcher,
  PluginManager,
  
  // Parsing
  JsonParser,
  CsvParser,
  ExpressionEvaluator,
  
  // Logging
  DebugLogger,
  BufferedLogger,
  ErrorFormatter
} from 'hop';
```

---

# Architecture

```
src/
├── hop.ts              # Main hop.* API
├── define-step.ts      # Custom step definitions
├── index.ts           # Main exports
├── ui/                # UI testing (Playwright)
│   ├── browser-manager.ts
│   ├── web-first-assertions.ts
│   ├── ui-mode.ts
│   ├── trace-viewer.ts
│   ├── visual-regression.ts
│   ├── codegen.ts
│   ├── semantic-locators.ts
│   ├── iframe-file-handler.ts
│   └── service-worker-handler.ts
├── engine/            # Test execution engine
│   └── handlers/     # Step handlers
├── http/              # HTTP, GraphQL clients
├── db/                # Database connectivity
├── mock/              # Mock server
├── parser/            # Gherkin parser
├── validation/        # Response & schema validation
└── utils/             # All utilities
```

---

# Example Projects

## 1. Direct Code Test (tests/todo-app.spec.ts)

```typescript
import { hop, defineStep, defineGiven, defineWhen, defineThen } from 'hop';

// Define custom steps for Gherkin
defineGiven('I am on the homepage', async () => {
  await hop.visit('https://demo.playwright.dev/todomvc');
});

defineGiven('a user {string} exists', async (name: string) => {
  await hop.visit('https://demo.playwright.dev/todomvc');
  await hop.get('.new-todo').fill(`Task for ${name}`);
  await hop.get('.new-todo').press('Enter');
});

defineWhen('I add a new todo {string}', async (task: string) => {
  await hop.get('.new-todo').fill(task);
  await hop.get('.new-todo').press('Enter');
});

defineWhen('I click the todo {string}', async (task: string) => {
  await hop.get(`.todo-list li:has-text("${task}") .toggle`).click();
});

defineThen('I should see {int} todos', async (count: number) => {
  await hop.expect('.todo-list li').toHaveCount(count);
});

defineThen('the todo {string} should be completed', async (task: string) => {
  const isCompleted = await hop.get(`.todo-list li:has-text("${task}") .completed`).isVisible();
  if (!isCompleted) throw new Error(`Todo "${task}" is not completed`);
});

defineThen('I should see {string} in the list', async (task: string) => {
  await hop.expect(`.todo-list li:has-text("${task}")`).toBeVisible();
});
```

---

## Test Hooks

```typescript
import { hop, before, beforeAll, after, afterAll, beforeEach, afterEach, describe, it, test, expect } from 'hop';

// Before all tests - runs once before any test runs
before(async () => {
  console.log('Setup - runs once before all tests');
});
beforeAll(async () => {
  console.log('Alternative syntax - same as before');
});

// Before each test - runs before every individual test
beforeEach(async () => {
  await hop.launch();
  await hop.visit('https://demo.playwright.dev/todomvc');
});

afterEach(async () => {
  await hop.close();
});

after(async () => {
  console.log('Cleanup - runs once after all tests');
});
afterAll(async () => {
  console.log('Alternative syntax - same as after');
});

// Test suite with describe/it
describe('Todo App Tests', () => {
  it('should add a new todo', async () => {
    await hop.get('.new-todo').fill('Learn Hop');
    await hop.get('.new-todo').press('Enter');
    await expect(hop.get('.todo-list li')).toHaveCount(1);
  });

  it('should complete a todo', async () => {
    await hop.get('.new-todo').fill('Buy milk');
    await hop.get('.new-todo').press('Enter');
    await hop.get('.todo-list li .toggle').click({ force: true });
  });
});

// Or use test() directly
test('standalone test', async () => {
  await hop.launch();
  await hop.visit('https://example.com');
  await hop.close();
});
```

### Hooks Execution Order

```
1. before / beforeAll      → Runs once at start
2. beforeEach (loop)       → Runs before each test
3. [Test 1]
4. afterEach (loop)        → Runs after each test
5. beforeEach (loop)       → Runs before each test
6. [Test 2]
7. afterEach (loop)        → Runs after each test
8. after / afterAll        → Runs once at end
```

### Multiple Hooks

You can register multiple hooks - they run in order:

```typescript
before(async () => {
  console.log('Hook 1');
});

before(async () => {
  console.log('Hook 2');
});

// Output: "Hook 1" then "Hook 2"
```
    
    await hop.get('.new-todo').fill('Learn Hop');
    await hop.get('.new-todo').press('Enter');
    
    await hop.expect('.todo-list li').toHaveCount(1);
    await hop.expect('.todo-list li:has-text("Learn Hop")').toBeVisible();
  });

  it('should complete a todo', async () => {
    await hop.visit('https://demo.playwright.dev/todomvc');
    
    await hop.get('.new-todo').fill('Buy milk');
    await hop.get('.new-todo').press('Enter');
    
    await hop.get('.todo-list li .toggle').click({ force: true });
    
    await hop.expect('.todo-list li').toHaveCount(1);
  });

  it('should delete a todo', async () => {
    await hop.visit('https://demo.playwright.dev/todomvc');
    
    await hop.get('.new-todo').fill('Test task');
    await hop.get('.new-todo').press('Enter');
    
    await hop.get('.todo-list li .destroy').click({ force: true });
    
    await hop.expect('.todo-list li').toHaveCount(0);
  });

  it('should filter todos', async () => {
    await hop.visit('https://demo.playwright.dev/todomvc');
    
    await hop.get('.new-todo').fill('Active task');
    await hop.get('.new-todo').press('Enter');
    await hop.get('.new-todo').fill('Completed task');
    await hop.get('.new-todo').press('Enter');
    
    await hop.get('.todo-list li .toggle').first().click({ force: true });
    
    await hop.get('button:has-text("Completed")').click();
    
    await hop.expect('.todo-list li').toHaveCount(1);
  });

  it('should use semantic locators', async () => {
    await hop.visit('https://demo.playwright.dev/todomvc');
    
    await hop.getByPlaceholder('What needs to be done?').fill('Using getByPlaceholder');
    await hop.getByPlaceholder('What needs to be done?').press('Enter');
    
    await hop.getByText('Using getByPlaceholder').isVisible();
  });

  it('should handle network interception', async () => {
    await hop.visit('https://demo.playwright.dev/todomvc');
    
    await hop.intercept('**/todos', {
      status: 200,
      body: [
        { id: 1, title: 'Mocked todo 1', completed: false },
        { id: 2, title: 'Mocked todo 2', completed: true }
      ]
    });
    
    await hop.reload();
    
    await hop.waitForResponse('**/todos');
    await hop.expect('.todo-list li').toHaveCount(2);
  });

  it('should use device emulation', async () => {
    const mobileHop = hop({
      device: 'iPhone 12',
      headless: true
    });
    
    await mobileHop.launch();
    await mobileHop.visit('https://demo.playwright.dev/todomvc');
    await mobileHop.get('.new-todo').isVisible();
    await mobileHop.close();
  });

  it('should handle localStorage', async () => {
    await hop.visit('https://demo.playwright.dev/todomvc');
    
    await hop.setLocalStorage('user', 'test-user');
    const user = await hop.getLocalStorage('user');
    
    expect(user).toBe('test-user');
  });

  it('should handle cookies', async () => {
    await hop.visit('https://demo.playwright.dev/todomvc');
    
    await hop.setCookie('session', 'abc123', { path: '/' });
    const cookie = await hop.getCookie('session');
    
    expect(cookie?.value).toBe('abc123');
  });
});
```

---

## 2. Gherkin Feature (tests/features/todo-hybrid.feature)

```gherkin
Feature: Todo Application - Hybrid Testing Demo

  This feature demonstrates mixing Gherkin with custom step definitions
  and direct hop.* API calls

  Background:
    Given the page is loaded

  @smoke
  Scenario: Add a new todo using custom steps
    Given I am on the homepage
    When I fill in ".new-todo" with "Buy groceries"
    And I press "Enter"
    Then I should see "Buy groceries" in the list
    And the page should have 1 elements matching ".todo-list li"

  @smoke
  Scenario: Complete a todo using direct hop.* API
    Given I am on the homepage
    When I fill in ".new-todo" with "Walk the dog"
    And I press "Enter"
    Then I should see "Walk the dog" in the list
    
    When I click the todo "Walk the dog"
    Then the todo "Walk the dog" should be completed

  @regression
  Scenario: Delete a todo
    Given I am on the homepage
    When I fill in ".new-todo" with "Task to delete"
    And I press "Enter"
    Then I should see "Task to delete" in the list
    
    When I wait for 1 seconds
    And I click ".todo-list li .destroy" with force
    Then the page should have 0 elements matching ".todo-list li"

  @regression
  Scenario: Filter todos by status
    Given I am on the homepage
    When I fill in ".new-todo" with "Active task"
    And I press "Enter"
    And I fill in ".new-todo" with "Completed task"
    And I press "Enter"
    And I click ".todo-list li .toggle" with force
    And I wait for 1 seconds
    
    When I click "button:has-text('Completed')"
    Then the page should have 1 elements matching ".todo-list li"

  @api
  Scenario: Mock API response
    Given I am on the homepage
    When I intercept "/api/todos" with status 200 and body:
      """
      [{"id": 1, "title": "Mocked todo", "completed": false}]
      """
    And I reload the page
    And I wait for response "/api/todos"
    Then I should see "Mocked todo" in the list
    And the page should have 1 elements matching ".todo-list li"

  @mobile
  Scenario: Test on mobile device
    Given I set viewport to "iPhone 12"
    When I am on the homepage
    Then I should see ".new-todo"
    And the element ".new-todo" should have attribute "placeholder"

  @storage
  Scenario: Handle localStorage
    Given I am on the homepage
    When I set localStorage "user" to "john.doe"
    And I reload the page
    Then localStorage "user" should be "john.doe"

  @cookies
  Scenario: Handle cookies
    Given I am on the homepage
    When I set cookie "session" to "abc123"
    And I reload the page
    Then cookie "session" should exist

  @position
  Scenario: Click at specific position
    Given I am on the homepage
    When I fill in ".new-todo" with "Position test"
    And I press "Enter"
    Then I click ".todo-list li .toggle" at position 5,5

  @viewport
  Scenario: Resize viewport
    Given I am on the homepage
    When I set viewport size to 800x600
    Then the element ".new-todo" should be visible

  @scroll
  Scenario: Scroll functionality
    Given I am on the homepage
    When I fill in ".new-todo" with "Scroll test"
    And I press "Enter"
    And I scroll to bottom
    Then I should see ".footer"

  @focus
  Scenario: Focus management
    Given I am on the homepage
    When I focus ".new-todo"
    Then the element ".new-todo" should be focused
```

---

## 3. Custom Step Definitions (steps/common-steps.ts)

```typescript
import { defineStep, defineGiven, defineWhen, defineThen } from 'hop';

// Given steps
defineGiven('the page is loaded', async () => {
  await hop.waitForLoadState('domcontentloaded');
});

defineGiven('I am authenticated as {string}', async (username: string) => {
  await hop.visit('https://demo.playwright.dev/todomvc');
  await hop.setLocalStorage('auth_user', username);
  await hop.setLocalStorage('auth_token', 'mock-token-12345');
  await hop.reload();
});

// When steps
defineWhen('I fill in {string} with {string}', async (field: string, value: string) => {
  const selector = field.startsWith('#') || field.startsWith('.') 
    ? field 
    : `[data-testid="${field}"], [name="${field}"], #${field}`;
  await hop.get(selector).fill(value);
});

defineWhen('I submit the form', async () => {
  await hop.get('button[type="submit"]').click();
});

defineWhen('I wait for {int} seconds', async (seconds: number) => {
  await hop.wait(seconds * 1000);
});

defineWhen('I press {string}', async (key: string) => {
  await hop.press(key);
});

defineWhen('I scroll to bottom', async () => {
  await hop.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
});

defineWhen('I clear the input {string}', async (field: string) => {
  await hop.get(`#${field}`).clear();
});

defineWhen('I select {string} from {string}', async (value: string, field: string) => {
  await hop.get(`#${field}`).select(value);
});

// Then steps
defineThen('the URL should contain {string}', async (partialUrl: string) => {
  const url = hop.url();
  if (!url.includes(partialUrl)) {
    throw new Error(`Expected URL to contain "${partialUrl}", got "${url}"`);
  }
});

defineThen('the page title should be {string}', async (title: string) => {
  const actualTitle = await hop.title();
  if (actualTitle !== title) {
    throw new Error(`Expected title "${title}", got "${actualTitle}"`);
  }
});

defineThen('the element {string} should have attribute {string}', async (selector: string, attr: string) => {
  const value = await hop.get(selector).getAttribute(attr);
  if (value === null) {
    throw new Error(`Element "${selector}" does not have attribute "${attr}"`);
  }
});

defineThen('the element {string} should contain {string}', async (selector: string, text: string) => {
  const actualText = await hop.get(selector).getText();
  if (!actualText.includes(text)) {
    throw new Error(`Expected element to contain "${text}", got "${actualText}"`);
  }
});

defineThen('the page should have {int} elements matching {string}', async (count: number, selector: string) => {
  const actualCount = await hop.get(selector).count();
  if (actualCount !== count) {
    throw new Error(`Expected ${count} elements, found ${actualCount}`);
  }
});

console.log('✅ Custom step definitions loaded');
```

---

# Advanced Features

## UI Mode (Interactive Test Runner)

```bash
hop test --ui
```

Features:
- Live reload on file changes
- Interactive element inspection
- Click to select locators
- Step-by-step debugging

## Trace Viewer

```bash
hop test --trace
```

View test traces with:
- DOM snapshots at each step
- Timeline of actions
- Network requests
- Console logs

## Visual Regression Testing

```typescript
import { hop, test } from 'hop';
import { VisualRegressionTester } from 'hop';

test('screenshot comparison', async () => {
  await hop.launch();
  await hop.visit('https://example.com');
  
  const tester = new VisualRegressionTester();
  await tester.assertMatch('homepage', await hop.screenshot());
  
  await hop.close();
});
```

## Codegen - Generate Tests from Browser

```bash
hop codegen --output ./tests
```

Records browser interactions and generates:
- Playwright-style code
- Gherkin scenarios
- Custom step definitions

---

# Troubleshooting

## Common Issues

### Browser not launching
```typescript
// Check browser installation
await hop.launch({ headless: false }); // See what's happening

// Or install browsers explicitly
npx playwright install chromium
```

### Element not found
```typescript
// Add waitFor
await hop.get('#element').waitFor({ state: 'visible' });

// Or use force
await hop.get('#element').click({ force: true });
```

### Timeout issues
```typescript
// Increase timeout
await hop.get('#element').click({ timeout: 30000 });

// Or set global config
setConfig({ timeout: 60000 });
```

---

# Migration Guides

## From Cypress

```typescript
// Cypress
cy.get('#button').click();
cy.contains('text').click();

// Hop
await hop.get('#button').click();
await hop.getByText('text').click();
```

## From Playwright

```typescript
// Playwright
await page.click('#button');
await expect(page.locator('#result')).toBeVisible();

// Hop
await hop.get('#button').click();
await hop.get('#result').should('be.visible');
```

## From Cucumber/Gherkin

```typescript
// Cucumber
Given('I am on the page', () => { ... });

// Hop
defineGiven('I am on the page', async () => { ... });
```

---

# License

MIT - See [LICENSE](LICENSE)