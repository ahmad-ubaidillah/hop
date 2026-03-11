# Hop - High-Performance BDD Automation Testing Framework

<p align="center">
  <img src="https://via.placeholder.com/200x60/6366f1/ffffff?text=Hop+Framework" alt="Hop Logo">
  <br>
  <em>BDD Testing for Modern Web</em>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/hop-framework"><img src="https://img.shields.io/npm/v/hop-framework.svg" alt="NPM Version"></a>
  <a href="https://www.npmjs.com/package/hop-framework"><img src="https://img.shields.io/npm/l/hop-framework.svg" alt="License"></a>
  <a href="https://github.com/hop-framework/hop/actions"><img src="https://github.com/hop-framework/hop/workflows/Test/badge.svg" alt="Build Status"></a>
</p>

---

## Table of Contents

1. [Philosophy](#1-philosophy)
2. [Description](#2-description)
3. [Problems Solved](#3-problems-solved)
4. [Solution](#4-solution)
5. [Methodology](#5-methodology)
6. [Tech Stack](#6-tech-stack)
7. [Advantages](#7-advantages)
8. [Competitor Comparison](#8-competitor-comparison)
9. [Installation](#9-installation)
10. [Usage](#10-usage)
11. [Patterns and Examples](#11-patterns-and-examples)
12. [First Coding](#12-first-coding)
13. [Get Started](#13-get-started)

---

## 1. Philosophy

**Hop** was born from direct experience facing limitations of existing BDD frameworks. We believe that:

### 1.1 Simplicity is Power
We believe good tests should be readable like human language. Gherkin isn't just a format - it's **business language everyone can understand**.

### 1.2 Performance Without Compromise
Testing doesn't have to be slow. With the right architecture, we can get speed without sacrificing quality.

### 1.3 Developer Experience Matters
Developers should focus on **what to test**, not **how to test**. Hop removes unnecessary technical burden.

### 1.4 One Framework, Multiple Purposes
One codebase for API testing, UI testing, and load testing. No need to switch between tools.

---

## 2. Description

**Hop** is a high-performance BDD (Behavior-Driven Development) automation testing framework built on Node.js/Bun. Hop combines the simplicity of Gherkin with the flexibility of custom steps and the power of Playwright for UI testing.

### 2.1 What is Hop?

```gherkin
Feature: User Management
  
  Scenario: Create new user
    Given url 'https://api.example.com'
    And path '/users'
    And request { name: 'John', email: 'john@example.com' }
    When method POST
    Then status 201
    And match response.id == '#number'
```

Hop executes the above quickly, generates clear reports, and integrates with CI/CD pipelines.

### 2.2 Main Functions

| Function | Description |
|----------|-------------|
| **API Testing** | HTTP requests with response validation |
| **UI Testing** | Browser automation with Playwright |
| **Load Testing** | Generate k6 scripts from feature files |
| **Report** | JSON, JUnit, Premium HTML (Glassmorphism), Allure |

---

## 3. Problems Solved

### 3.1 Problems with Existing Frameworks

| Problem | Impact |
|---------|--------|
| **Cucumber.js is slow** | Execution can be 10x slower than native |
| **Playwright without BDD** | No shared vocabulary across teams |
| **Karate is limited** | Java only, not suitable for JS/TS ecosystem |
| **Tool fragmentation** | API test ≠ UI test ≠ Load test |

### 3.2 Pain Points Felt by Developers

1. **Writing boilerplate code** - Too much setup for simple tests
2. **Data management** - Difficult to send complex data between steps
3. **State sharing** - Variables in Given can't be read in Then
4. **Feature reuse** - Can't call other features
5. **Step definitions** - Hard to generate snippets for new steps
6. **Custom types** - Can't create custom type transformers

---

## 4. Solution

### 4.1 Hop Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Hop CLI                               │
├─────────────────────────────────────────────────────────────┤
│  Parser    │  Engine    │  Executor  │  Reporters          │
│  (Gherkin) │  (Runner)  │  (Steps)   │  (Output)          │
├─────────────────────────────────────────────────────────────┤
│                    Step Registry                            │
├─────────────────────────────────────────────────────────────┤
│  HTTP Client  │  Playwright  │  Hooks  │  Feature Caller │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Key Features

| Feature | Solves |
|---------|--------|
| **Background** | Same setup for all scenarios |
| **Tags** | Filter tests with CLI |
| **DocStrings** | Large request body |
| **Cucumber Expressions** | Parameter typing {int}, {string} |
| **Custom Types** | Complex data transformation |
| **Feature Calling** | Reuse logic across features |
| **World Object** | State sharing between steps |

---

## 5. Methodology

### 5.1 Test Execution Flow

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

### 5.2 Step Execution Model

1. **Parse** - Extract URL, headers, body, params from step
2. **Resolve** - Replace variables with values from context
3. **Execute** - Run HTTP request or UI action
4. **Validate** - Assert response matches expectations
5. **Store** - Save response for next step

### 5.3 Context Management

```typescript
interface TestContext {
  baseUrl: string;       // Base URL from Background
  path: string;          // Endpoint path
  method: string;        // GET, POST, PUT, etc.
  headers: object;       // HTTP headers
  queryParams: object;   // Query parameters
  body: any;             // Request body
  variables: object;      // State sharing - World object
  response?: Response;   // Last response
  cookies: object;      // Cookie management
}
```

---

## 6. Tech Stack

### 6.1 Core Technologies

| Technology | Usage |
|------------|-------|
| **Bun** | Main runtime - fastest JavaScript |
| **TypeScript** | Type safety throughout |
| **@cucumber/gherkin** | Gherkin AST parser |
| **Playwright** | UI/Browser automation |
| **Commander** | CLI argument parsing |

### 6.2 Optional Dependencies

| Library | Usage |
|---------|-------|
| **Allure** | Advanced reporting |
| **ArcType** | Response validation |

### 6.3 Project Structure

```
hop-project/
├── features/              # .feature files
│   ├── login.feature
│   └── user-management.feature
├── steps/                 # Custom step definitions
│   └── custom-steps.ts
├── hooks/                 # Before/After hooks
│   └── hooks.ts
├── config/                # Configuration
│   └── hop.config.ts
├── reports/               # Generated reports
└── bin/
    └── cli.ts             # CLI entry point
```

---

## 7. Advantages

### 7.1 Performance

| Aspect | Hop | Cucumber.js |
|--------|-----|-------------|
| **Cold start** | ~50ms | ~200ms |
| **Step execution** | <1ms | ~5-10ms |
| **Memory usage** | Low | High |

### 7.2 Developer Experience

✅ **Zero boilerplate** - No complicated setup  
✅ **Smart snippets** - Auto-generate step definitions  
✅ **Hot reload** - Changes are felt immediately  
✅ **Clear errors** - Informative error messages  

### 7.3 Complete Features

✅ API Testing with fuzzy validation  
✅ UI Testing with Playwright  
✅ Load Testing - generate k6 script  
✅ Premium HTML reporting with glassmorphism and animations  
✅ Screenshots on failure for UI tests  
✅ Multiple reporters (JSON, JUnit, HTML, Allure)  
✅ Custom types and transformers  
✅ Feature calling (like Karate)  

### 7.4 Flexibility

- Custom step definitions with TypeScript
- Extendable reporters
- Plugin hooks system
- Environment variable support

---

## 8. Competitor Comparison

### 8.1 Framework Comparison

| Feature | Hop | Cucumber.js | Karate | Playwright |
|---------|-----|-------------|--------|------------|
| **Language** | TypeScript | Many | Java | TypeScript |
| **API Testing** | ✅ | ❌ | ✅ | ❌ |
| **UI Testing** | ✅ | ❌ | ❌ | ✅ |
| **Load Test Gen** | ✅ | ❌ | ✅ | ❌ |
| **Cucumber Expr** | ✅ | ✅ | ❌ | ❌ |
| **Feature Call** | ✅ | ❌ | ✅ | ❌ |
| **Performance** | High | Low | High | High |
| **Custom Types** | ✅ | ✅ | ❌ | ❌ |

### 8.2 When to Choose What

| Scenario | Recommendation |
|----------|-----------------|
| **JavaScript ecosystem** | **Hop** - Best fit |
| **Java backend** | Karate - Native Java |
| **Python team** | Behave - Python native |
| **Simple API only** | Supertest + Mocha |
| **Complex UI flows** | Playwright directly |

### 8.3 Hop vs Cucumber.js Advantages

| Aspect | Hop | Cucumber.js |
|--------|-----|-------------|
| **Parser** | @cucumber/gherkin | Custom |
| **Step matching** | Cucumber Expressions | Regex only |
| **Type support** | Built-in + Custom | Manual |
| **UI integration** | Native Playwright | External |
| **Performance** | Bun-optimized | Node.js |

---

## 9. Installation

### 9.1 Prerequisites

- **Bun** (recommended) - `curl -fsSL https://bun.sh/install | bash`
- Or **Node.js** 18+ - `nvm use 18`

### 9.2 Install Hop

```bash
# Using Bun (recommended)
bun add -g hop-framework

# Or using npm
npm install -g hop-framework
```

### 9.3 Initialize Project

```bash
# Create new Hop project
hop init my-api-tests

# Navigate to project
cd my-api-tests
```

### 9.4 Directory Structure

```
my-api-tests/
├── features/
│   ├── login.feature
│   └── user.feature
├── steps/
│   └── custom-steps.ts
├── hooks/
│   └── hooks.ts
├── config/
│   └── hop.config.ts
└── package.json
```

### 9.5 Configuration

Create `hop.config.ts` in project root:

```typescript
export default {
  features: './features',
  steps: './steps',
  reports: './reports',
  format: ['console', 'html'],
  timeout: 30000,
  retry: 0,
  parallel: 1,
  tags: {
    include: [],
    exclude: ['@ignore'],
  },
  headers: {
    'Content-Type': 'application/json',
  },
};
```

---

## 10. Usage

### 10.1 Basic CLI Commands

```bash
# Run all tests
hop test

# Run with specific tags
hop test --tags "@smoke"

# Run with environment
hop test --env staging

# Generate HTML report
hop test --report

# Generate JSON report
hop test --format json

# Generate JUnit XML (for CI/CD)
hop test --format junit

# Verbose output
hop test --verbose

# Custom config file
hop test -c my-config.ts
```

### 10.2 Available CLI Options

| Option | Short | Description |
|--------|-------|-------------|
| `--features` | `-f` | Path to features directory |
| `--steps` | `-s` | Path to custom steps |
| `--tags` | `-t` | Filter by tags |
| `--env` | `-e` | Environment (test, staging, prod) |
| `--report` | `-r` | Generate HTML report |
| `--format` | `-frm` | Output format |
| `--verbose` | `-v` | Verbose logging |
| `--retry` | - | Retry failed tests |
| `--timeout` | - | Step timeout in ms |
| `--report-dir` | `-d` | Custom report output directory |

### 10.3 Premium HTML Reporting

Hop features a state-of-the-art HTML reporter designed for high-end engineering teams.

- **Glassmorphism UI**: Modern aesthetic with blur effects and vibrant gradients.
- **Dynamic Animations**: Smooth transitions for better focus and flow.
- **Screenshots on Failure**: Instant visual feedback when UI tests fail.
- **Interactive Filters**: Filter by Passed, Failed, or Tags.
- **Micro-animations**: Hover effects and status pulses for enhanced UX.

To generate the premium report:
```bash
hop test --report
```
The report will be generated in `./reports/report.html`.

---

## 11. Patterns and Examples

### 11.1 API Testing Pattern

#### Basic API Call

```gherkin
Feature: User API

  Background:
    Given url 'https://jsonplaceholder.typicode.com'

  Scenario: Get user by ID
    Given path '/users/1'
    When method GET
    Then status 200
    And match response.id == 1
    And match response.name != null
```

#### POST with Request Body

```gherkin
Scenario: Create new user
  Given path '/posts'
  And request
    """
    {
      "title": "Test Post",
      "body": "Content here",
      "userId": 1
    }
    """
  When method POST
  Then status 201
  And match response.id == '#number'
  And match response.title == 'Test Post'
```

#### Using Data Tables

```gherkin
Scenario Outline: Create multiple users
  Given path '/users'
  And request
    """
    {
      "name": "<name>",
      "email": "<email>"
    }
    """
  When method POST
  Then status 201

  Examples:
    | name          | email                 |
    | John Doe      | john@example.com      |
    | Jane Smith    | jane@example.com      |
```

### 11.2 UI Testing Pattern

```gherkin
Feature: Login Page

  Scenario: User can login
    Given user opens browser
    And user navigates to 'https://example.com/login'
    And user types 'admin' into 'input[name="username"]'
    And user types 'password123' into 'input[name="password"]'
    And user clicks 'button[type="submit"]'
    Then user should see element '.dashboard'
    And user should see text 'Welcome'
```

### 11.3 Advanced Patterns

#### Using Variables

```gherkin
Scenario: Variable usage
  # Set variable
  Given def userId = '123'
  
  # Use in path
  Given path '/users/' + userId
  
  # Use in body
  And request { userId: '#(userId)', action: 'update' }
  
  # Store response
  When method GET
  Then status 200
  And def savedUser = response
```

#### Fuzzy Matching

```gherkin
Scenario: Validate response structure
  When method GET
  Then status 200
  And match response == 
    """
    {
      "id": '#number',
      "name": '#string',
      "email": '#string',
      "active": '#boolean'
    }
    """
```

#### Custom Type Parameters

```typescript
// steps/custom-types.ts
import { registerType } from 'hop-framework';

// Register custom type
registerType({
  name: 'user',
  pattern: '\\w+',
  converter: async (username) => {
    // Transform to user object
    return { username, role: 'user' };
  }
});
```

```gherkin
Scenario: Use custom type
  Given user {user} is active
  # 'admin' will be converted to { username: 'admin', role: 'user' }
```

#### Feature Calling

```gherkin
# features/main.feature
Feature: Main Flow

  Scenario: Complete user flow
    # Setup - call login feature
    Given call login.feature
    
    # Call with arguments
    And call create-user.feature with { name: 'John', email: 'john@example.com' }
    
    # Call background only
    And call setup-permissions.feature background
    
    # Continue with main flow
    When method GET
    Then status 200
```

```gherkin
# features/login.feature
Feature: Login Setup

  Background:
    Given url 'https://api.example.com'
    And path '/auth/login'
    And request { username: 'test', password: 'test123' }
    When method POST
    Then status 200
    And def token = response.token
```

### 11.4 Hooks Pattern

```typescript
// hooks/hooks.ts

export const beforeAll = async () => {
  console.log('🚀 Starting test suite');
};

export const afterAll = async () => {
  console.log('✅ Test suite completed');
};

export const beforeScenario = async (scenario, context) => {
  console.log(`📋 Starting: ${scenario.name}`);
  context.variables = {};
};

export const afterScenario = async (scenario, context, result) => {
  if (result.status === 'failed') {
    console.log(`❌ Failed: ${scenario.name}`);
  }
};

export const beforeStep = async (step, context) => {
  console.log(`▶️  ${step.keyword} ${step.text}`);
};
```

### 11.5 Tags Pattern

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
  Scenario: Not implemented yet
    ...
```

Run specific tags:
```bash
hop test --tags "@smoke"
hop test --tags "@smoke,@positive"
hop test --tags "not @ignore"
```

---

## 12. First Coding

### 12.1 First Feature File

Create file `features/hello-world.feature`:

```gherkin
Feature: Hello World API

  @smoke
  Scenario: Say hello
    Given url 'https://jsonplaceholder.typicode.com'
    Given path '/posts/1'
    When method GET
    Then status 200
    And match response.id == 1
```

Run:
```bash
hop test
```

### 12.2 First Custom Step

Create file `steps/custom-steps.ts`:

```typescript
import type { Step, TestContext } from '../types/index.js';

export const IAmOnHomePage = async (step: Step, context: TestContext) => {
  context.baseUrl = 'https://example.com';
  console.log('🌐 Navigating to home page');
};

// Register this step:
// {
//   'Given I am on home page': IAmOnHomePage,
// }
```

Update feature:
```gherkin
Scenario: Home page loads
  Given I am on home page
  When method GET
  Then status 200
```

### 12.3 First Custom Type

Create `steps/custom-types.ts`:

```typescript
import { registerType } from 'hop-framework';

// Email type - converts string to lowercase
registerType({
  name: 'email',
  pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
  converter: (value: string) => value.toLowerCase(),
  description: 'Email address (auto lowercase)',
});

// UUID type
registerType({
  name: 'uuid',
  pattern: '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',
  converter: (value: string) => value,
  description: 'UUID v4 format',
});
```

Use in feature:
```gherkin
Scenario: Validate user
  Given user 'User123' with email {email} exists
  And id is {uuid}
```

### 12.4 First Feature Call

Create `features/login.feature`:

```gherkin
Feature: Login Setup

  Background:
    Given url 'https://jsonplaceholder.typicode.com'
    And path '/posts'
    When method GET
    Then status 200
    And def posts = response
```

Use in `features/main.feature`:

```gherkin
Feature: Main Feature

  Scenario: Use login setup
    Given call login.feature
    And def users = posts
    Then match users == '#array'
```

---

## 13. Get Started

### 13.1 Quick Start (5 minutes)

```bash
# 1. Install Hop
bun add -g hop-framework

# 2. Initialize project
hop init my-first-tests
cd my-first-tests

# 3. Create first feature
cat > features/example.feature << 'EOF'
Feature: My First Test

  Scenario: API test
    Given url 'https://jsonplaceholder.typicode.com'
    Given path '/posts/1'
    When method GET
    Then status 200
EOF

# 4. Run tests
hop test

# 5. View report
hop report
```

### 13.2 Complete Example Project

```bash
# Clone example
git clone https://github.com/hop-framework/example.git
cd example

# Install dependencies
bun install

# Run tests
bun test

# Generate all reports
bun test --format html --format json --format junit --report
```

### 13.3 Environment Setup

Create `.env` file:

```bash
# .env
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
  Given def user = '$ADMIN_USER'
```

### 13.4 CI/CD Integration

#### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      
      - name: Install
        run: bun install
      
      - name: Run tests
        run: bun test --format junit --output ./reports/junit.xml
      
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: ./reports/
```

#### Jenkins

```groovy
// Jenkinsfile
pipeline {
    agent any
    
    stages {
        stage('Test') {
            steps {
                sh 'bun test --format junit --output reports/junit.xml'
            }
            post {
                junit 'reports/junit.xml'
            }
        }
    }
}
```

---

## Why Hop Doesn't Need Custom Step Definitions

You might notice that **Hop doesn't require custom step definitions** like Cucumber.js does. Here's why:

### The Difference

| Aspect | Cucumber.js | Hop |
|--------|-------------|-----|
| **Step matching** | Manual regex in step definitions | Built-in HTTP keywords |
| **Setup required** | Write code for every step | Works out of the box |
| **API testing** | Need custom steps | Native support |

### Built-in HTTP Steps

Hop provides **native support** for common HTTP operations:

```gherkin
# These work WITHOUT any custom step definitions!
Given url 'https://api.example.com'
And path '/users'
And header Authorization = 'Bearer token'
And request { name: 'John' }
When method POST
Then status 201
```

### When You DO Need Custom Steps

You only need custom steps for **domain-specific logic**:

```typescript
// Only create custom steps for YOUR business logic
export const IAmOnHomePage = async (step, context) => {
  // Your specific implementation
};
```

---

## Further References

- [Gherkin Syntax Reference](https://cucumber.io/docs/gherkin/)
- [Cucumber Expressions](https://cucumber.io/docs/cucumber/expressions/)
- [Playwright Documentation](https://playwright.dev/)

---

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a new branch
3. Submit a PR

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  Made with ❤️ by Hop Team
</p>
