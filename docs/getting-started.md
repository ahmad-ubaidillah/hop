# Getting Started with Hop

[← Back to Main README](../README.md)

Hop is a **hybrid testing framework** that supports both **Gherkin BDD** and **Direct Code** testing for web applications.

## Installation

```bash
# Using Bun (recommended)
bun add -g hop-framework

# Using npm
npm install -g hop-framework

# Using npx (no install)
npx github:ahmad-ubaidillah/hop test
```

## Quick Start

### 1. Create a test file

```typescript
// tests/my-first-test.spec.ts
import { hop, test, beforeEach, afterEach, expect } from 'hop';

beforeEach(async () => {
  await hop.launch();
});

afterEach(async () => {
  await hop.close();
});

test('my first test', async () => {
  await hop.visit('https://example.com');
  await expect(hop.get('h1')).toBeVisible();
});
```

### 2. Run the test

```bash
hop test
```

---

## Your First Test

### Basic Structure

```typescript
import { hop, test, beforeEach, afterEach } from 'hop';

describe('My Test Suite', () => {
  beforeEach(async () => {
    await hop.launch();
  });

  afterEach(async () => {
    await hop.close();
  });

  it('should load the page', async () => {
    await hop.visit('https://example.com');
    const title = await hop.title();
    console.log('Page title:', title);
  });
});
```

### Using Hooks

```typescript
import { hop, before, beforeEach, after, afterEach, describe, it } from 'hop';

before(async () => {
  console.log('Runs once before all tests');
});

beforeEach(async () => {
  await hop.launch();
  await hop.visit('https://example.com');
});

afterEach(async () => {
  await hop.close();
});

after(async () => {
  console.log('Runs once after all tests');
});

describe('My Tests', () => {
  it('test 1', async () => {
    // test code
  });

  it('test 2', async () => {
    // test code
  });
});
```

---

## Running Tests

```bash
# Run all tests
hop test

# Run specific file
hop test ./tests/my-test.spec.ts

# Run with tags
hop test --tags "@smoke"

# Generate HTML report
hop test --report

# Verbose mode
hop test --verbose
```

---

## Next Steps

- [Hop API Reference](./hop-api.md) - All available methods
- [Assertions Guide](./assertions.md) - Learn about expect()
- [Locators Guide](./locators.md) - Finding elements
- [Interactions](./interactions.md) - Click, fill, drag, etc
- [Network](./network.md) - Mock API requests
- [Custom Steps](./custom-steps.md) - Define your own steps

---

**Need help?** Check the [Troubleshooting Guide](./troubleshooting.md)