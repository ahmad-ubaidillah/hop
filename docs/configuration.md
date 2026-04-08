# Configuration Reference

## hop.config.ts

```typescript
export default {
  features: './features',
  steps: './steps',
  reports: './reports',
  format: ['console', 'hop'],
  timeout: 30000,
  retry: 0,
  parallel: 1,
  concurrency: 4,
  tags: {
    include: [],
    exclude: ['@ignore'],
  },
  headers: {
    'Content-Type': 'application/json',
  },
  env: {
    BASE_URL: 'https://api.example.com',
  },
};
```

## CLI Options

| Option | Short | Type | Default | Description |
|--------|-------|------|---------|-------------|
| `--features` | `-f` | string | `./features` | Features directory |
| `--steps` | `-s` | string | `./steps` | Custom steps directory |
| `--tags` | `-t` | string | `` | Tag filter |
| `--env` | `-e` | string | `test` | Environment |
| `--format` | `-frm` | string | `console,hop` | Output format |
| `--report` | `-r` | boolean | `true` | Generate HTML report |
| `--report-dir` | `-d` | string | `./reports` | Report output directory |
| `--verbose` | `-v` | boolean | `false` | Verbose logging |
| `--debug` | `-d` | boolean | `false` | Debug mode |
| `--parallel` | `-p` | boolean | `false` | Run parallel |
| `--concurrency` | `-cn` | number | `4` | Concurrent tests |
| `--retry` | | number | `0` | Retry failed tests |
| `--timeout` | | number | `30000` | Step timeout (ms) |
| `--video` | | boolean | `false` | Record UI test video |
| `--config` | `-c` | string | | Config file path |
| `--breakpoint` | | string | | Breakpoint step |

## Environment Variables

Create `.env` file:

```bash
BASE_URL=https://api.example.com
API_KEY=your-api-key
ADMIN_USER=admin
ADMIN_PASS=secret
```

Use in feature:

```gherkin
Scenario: Use env variables
  Given url '$BASE_URL'
  And header Authorization = 'Bearer $API_KEY'
```

## Output Formats

| Format | Description |
|--------|-------------|
| `console` | Terminal output |
| `json` | JSON file |
| `junit` | JUnit XML |
| `allure` | Allure results |
| `hop` | Premium HTML |
| `newman` | Postman-style |

## Tags

```gherkin
@smoke @api
Feature: Core API Tests

  @positive
  Scenario: Valid request
    ...

  @negative
  Scenario: Invalid request
    ...

  @ignore
  Scenario: Not implemented
    ...
```

Run specific tags:
```bash
hop test --tags "@smoke"
hop test --tags "@smoke,@positive"
hop test --tags "not @ignore"
```
