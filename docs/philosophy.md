# Philosophy & Architecture

## Core Philosophy

### Simplicity is Power
Good tests should be readable like human language. Gherkin isn't just a format - it's **business language everyone can understand**.

### Performance Without Compromise
Testing doesn't have to be slow. With the right architecture, we get speed without sacrificing quality.

### Developer Experience Matters
Developers should focus on **what to test**, not **how to test**. Hop removes unnecessary technical burden.

### One Framework, Multiple Purposes
One codebase for API testing, UI testing, and load testing. No need to switch between tools.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Hop CLI                               │
├─────────────────────────────────────────────────────────────┤
│  Parser    │  Engine    │  Executor  │  Reporters          │
│  (Gherkin) │  (Runner)  │  (Steps)   │  (Output)           │
├─────────────────────────────────────────────────────────────┤
│                    Step Registry                            │
├─────────────────────────────────────────────────────────────┤
│  HTTP Client  │  Playwright  │  Hooks  │  Feature Caller   │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### Parser
Parses Gherkin feature files into AST using @cucumber/gherkin.

### Engine
Manages test execution flow, tag filtering, and parallel execution.

### Executor
Executes each step with proper context handling and variable resolution.

### Handlers
- **HttpHandler** - HTTP requests and response validation
- **UiHandler** - Playwright browser automation
- **AuthHandler** - Authentication flows
- **AssertionHandler** - Response matching and validation

### Reporters
- ConsoleReporter - Terminal output
- JsonReporter - JSON format
- JunitReporter - JUnit XML for CI/CD
- HopReporterV2 - Premium HTML report
- AllureReporter - Allure integration
- NewmanReporter - Postman-style report

---

## Test Execution Flow

```
.feature file
      │
      ▼
┌─────────────┐
│   Parser    │  ← Parse Gherkin to AST
└─────────────┘
      │
      ▼
┌─────────────┐
│   Engine    │  ← Filter by tags, run Background
└─────────────┘
      │
      ▼
┌─────────────┐
│  Executor   │  ← Execute each step
└─────────────┘
      │
      ▼
┌─────────────┐
│  Reporters  │  ← Generate output
└─────────────┘
```

## Context Management

```typescript
interface TestContext {
  baseUrl: string;
  path: string;
  method: string;
  headers: object;
  queryParams: object;
  body: any;
  variables: object;
  response?: Response;
  cookies: object;
}
```
