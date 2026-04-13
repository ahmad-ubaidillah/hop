# Hop - BDD Automation Testing Framework

<p align="center">
  <a href="https://www.npmjs.com/package/hop-framework"><img src="https://img.shields.io/npm/v/hop-framework.svg" alt="NPM Version"></a>
  <a href="https://www.npmjs.com/package/hop-framework"><img src="https://img.shields.io/npm/l/hop-framework.svg" alt="License"></a>
</p>

Hybrid testing framework supporting **Gherkin BDD** and **Direct Code** testing.

## Features

- **Gherkin BDD** - Natural language tests (.feature files)
- **Direct Code** - Playwright-style API (hop.get, hop.visit)
- **Custom Steps** - Define your own step definitions
- **Auto-Await** - Optional automatic await
- **Mock API** - intercept(), waitForRequest(), waitForResponse()
- **Hooks** - before, beforeEach, after, afterEach
- **Security** - No hardcoded secrets, safe expression evaluation
- **Error Handling** - Consistent error messages, proper logging

## Documentation

| Guide | Description |
|-------|-------------|
| [Getting Started](./docs/getting-started.md) | Quick start for new users |
| [Hop API Reference](./docs/hop-api.md) | Complete API methods |
| [Assertions](./docs/assertions.md) | expect() and should() |
| [Locators](./docs/locators.md) | Finding elements |
| [Interactions](./docs/interactions.md) | Click, fill, drag, keyboard |
| [Network](./docs/network.md) | Mock API requests |
| [Custom Steps](./docs/custom-steps.md) | Define Gherkin steps |
| [Gherkin](./docs/gherkin.md) | Gherkin syntax |
| [Troubleshooting](./docs/troubleshooting.md) | Common issues |

## Quick Start

```bash
# Install
npm install -g hop-framework

# Run tests
hop test
```

## Environment Configuration

Hop uses environment variables for sensitive configuration. Create a `.env` file in your project root:

```bash
# .env
API_URL=https://api.example.com
ADMIN_USER=admin
ADMIN_PASS=your-secret-password
```

Or set them in your CI/CD pipeline:

```bash
export API_URL=https://api.example.com
export ADMIN_USER=admin
export ADMIN_PASS=your-secret-password
```

**Security Note:** Never commit `.env` files or hardcode secrets in `hop.config.ts`.

## Basic Usage

```typescript
import { hop, test, beforeEach, afterEach, expect } from 'hop';

beforeEach(async () => await hop.launch());
afterEach(async () => await hop.close());

test('login', async () => {
  await hop.visit('https://example.com');
  await hop.get('#email').fill('test@example.com');
  await hop.get('#login').click();
  await expect(hop.get('#dashboard')).toBeVisible();
});
```

## Gherkin Style

```gherkin
Feature: Login

  Scenario: User login
    Given I open "https://example.com"
    When I fill "#email" with "test@example.com"
    And I click "#login"
    Then I should see "#dashboard"
```

**Learn more:** See [docs/getting-started.md](./docs/getting-started.md)

## Recent Updates

### Security Improvements
- Removed hardcoded secrets from configuration
- Replaced `eval()` with safe script injection
- Replaced dynamic `Function()` with whitelist-based expression evaluation
- Added proper error logging for all catch blocks

### Error Handling
- Consistent error messages across all API methods
- All methods now throw `'Page not initialized'` when browser is not launched
- Improved error logging for debugging

### Type Safety
- Reduced `as any` usage for better TypeScript support
- Replaced `@ts-ignore` with `@ts-expect-error` with descriptions

---

**License:** MIT