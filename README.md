# Hop - High-Performance BDD Automation Testing Framework

<p align="center">
  <a href="https://www.npmjs.com/package/hop-framework"><img src="https://img.shields.io/npm/v/hop-framework.svg" alt="NPM Version"></a>
  <a href="https://www.npmjs.com/package/hop-framework"><img src="https://img.shields.io/npm/l/hop-framework.svg" alt="License"></a>
  <a href="https://github.com/ahmad-ubaidillah/hop/actions"><img src="https://img.shields.io/github/actions/workflow/status/ahmad-ubaidillah/hop/test.yml" alt="Build Status"></a>
</p>

BDD Testing for Modern Web - API Testing, UI Testing, and Load Testing in one framework.

## Features

- **API Testing** - HTTP requests with response validation
- **UI Testing** - Browser automation with Playwright
- **Load Testing** - Generate k6 scripts from feature files
- **Premium Reports** - JSON, JUnit, HTML, Allure, Newman Dashboard

## Quick Start

```bash
# Install
bun add -g hop-framework

# Create project
hop init my-api-tests
cd my-api-tests

# Run tests
hop test
```

## Installation Options

| Method | Command |
|--------|---------|
| Bun (recommended) | `bun add -g hop-framework` |
| npm | `npm install -g hop-framework` |
| npx (no install) | `npx github:ahmad-ubaidillah/hop test` |

## Usage

```bash
# Run all tests
hop test

# Run with tags
hop test --tags "@smoke"

# Generate HTML report
hop test --format hop --report

# Generate JUnit XML (CI/CD)
hop test --format junit
```

## Configuration

Create `hop.config.ts`:

```typescript
export default {
  features: './features',
  steps: './steps',
  reports: './reports',
  format: ['console', 'hop'],
  timeout: 30000,
  retry: 0,
  parallel: 1,
};
```

## Example Feature

```gherkin
Feature: User API

  Scenario: Get user by ID
    Given url 'https://jsonplaceholder.typicode.com'
    Given path '/users/1'
    When method GET
    Then status 200
    And match response.id == 1
```

## Documentation

- [Philosophy & Architecture](docs/philosophy.md)
- [API Testing Patterns](docs/api-testing.md)
- [UI Testing with Playwright](docs/ui-testing.md)
- [Configuration Reference](docs/configuration.md)
- [Best Practices](docs/best-practices.md)
- [Migration from Cucumber](docs/migration-cucumber.md)
- [Migration from Karate](docs/migration-karate.md)

## CLI Options

| Option | Short | Description |
|--------|-------|-------------|
| `--features` | `-f` | Path to features directory |
| `--steps` | `-s` | Path to custom steps |
| `--tags` | `-t` | Filter by tags |
| `--env` | `-e` | Environment |
| `--format` | `-frm` | Output format |
| `--report` | `-r` | Generate HTML report |
| `--verbose` | `-v` | Verbose logging |
| `--parallel` | `-p` | Run in parallel |
| `--concurrency` | `-cn` | Concurrent tests |

## License

MIT - See [LICENSE](LICENSE)
