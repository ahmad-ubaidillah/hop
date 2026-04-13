# Hop - BDD Automation Testing Framework

<p align="center">
  <a href="https://www.npmjs.com/package/hop-framework"><img src="https://img.shields.io/npm/v/hop-framework.svg" alt="NPM Version"></a>
  <a href="https://www.npmjs.com/package/hop-framework"><img src="https://img.shields.io/npm/l/hop-framework.svg" alt="License"></a>
</p>

**Cypress-style testing + BDD/Gherkin = Hop**

Hybrid testing framework supporting **Gherkin BDD** and **Cypress-style** browser automation.

---

## 🚀 Features

### Browser Testing (Cypress-Style)
- **Auto-Wait** - Elements automatically wait before actions
- **Command Chain** - Chainable API like Cypress
- **Network Interception** - Mock, stub, and intercept API calls
- **Time Travel Debugging** - Snapshot every step with timeline viewer
- **GUI Mode** - Visual test runner with premium reports

### BDD/Gherkin
- **Gherkin BDD** - Natural language tests (.feature files)
- **Custom Steps** - Define your own step definitions
- **Parallel Execution** - Run tests in parallel
- **Hooks** - before, beforeEach, after, afterEach

### Security & Quality
- **No Hardcoded Secrets** - Environment variables support
- **Safe Expression Evaluation** - No eval() or dynamic Function()
- **Consistent Error Handling** - Clear error messages
- **TypeScript Support** - Full type safety

---

## 🎯 Quick Start

### Installation
```bash
npm install -g hop-framework
```

### Initialize Project
```bash
hop init my-tests
cd my-tests
```

### Run Tests
```bash
# Run all tests
hop test

# Run specific feature
hop test features/login.feature

# Generate HTML report
hop test --format html
```

### Open GUI
```bash
hop gui
```

---

## 📝 Browser Testing (Cypress-Style)

### Basic Actions
```gherkin
Feature: Login Test

  Scenario: User login
    Given I open 'https://example.com'
    When I fill '#email' with 'test@example.com'
    And I fill '#password' with 'secret123'
    And I click '#login-button'
    Then I should see '.dashboard'
```

### Auto-Wait (Implicit)
```gherkin
# No need to wait explicitly - auto-waits for elements!
When I click '#submit'        # Waits until visible & clickable
And I fill '#input' with 'x'  # Waits until visible
```

### Network Interception
```gherkin
# Mock API responses
When I mock '/api/users' with '{"users": [{"id": 1, "name": "John"}]}'
And I stub '/api/config' with '{"theme": "dark"}'

# Wait for network requests
And I wait for response to '/api/login'
```

### Time Travel Debugging
```gherkin
# Enable time travel to capture snapshots
When I enable time travel
And I click '#button'
And I take snapshot 'after-click'
# View timeline: reports/time-travel/timeline.html
```

---

## 🔗 Cypress-Style Command Chain API

```typescript
import { chain } from 'hop';

await chain(page)
  .visit('https://example.com')
  .get('#user').type('admin')
  .get('#pass').type('secret')
  .get('#login').click()
  .shouldSee('.dashboard')
  .end();
```

---

## 📊 Premium HTML Report

Hop generates beautiful HTML reports with:
- Dark/Light theme toggle
- Chart.js visualizations
- Screenshot lightbox
- Timeline history
- Pass/Fail breakdown

```bash
# Generate report
hop test --format html

# View report
hop report -p 9090
```

---

## 📚 Documentation

| Guide | Description |
|-------|-------------|
| [Getting Started](./docs/getting-started.md) | Quick start for new users |
| [Hop API Reference](./docs/hop-api.md) | Complete API methods |
| [Browser Steps](./docs/browser-steps.md) | Cypress-style browser testing |
| [Network Interception](./docs/network.md) | Mock API requests |
| [Custom Steps](./docs/custom-steps.md) | Define Gherkin steps |
| [Troubleshooting](./docs/troubleshooting.md) | Common issues |

---

## 🛠️ Commands

```bash
# Test commands
hop test                          # Run all tests
hop test features/login.feature   # Run specific feature
hop test --format html            # Generate HTML report
hop test --format json            # Generate JSON report
hop test --parallel               # Run in parallel
hop test --tags @smoke            # Filter by tags

# GUI
hop gui                           # Open visual test runner

# Utilities
hop init <name>                   # Initialize new project
hop parse features/               # Parse feature files
hop mock api.feature              # Start mock server
hop record -u https://example.com # Record browser actions
hop report -p 9090                # View reports
```

---

## 🔧 Configuration

### hop.config.ts
```typescript
export default {
  features: './features',
  steps: './steps',
  reports: './reports',
  timeout: 30000,
  retry: 2,
  parallel: 4,
  video: 'on-failure',
  headers: {
    'User-Agent': 'Hop/1.0'
  }
}
```

### Environment Variables
```bash
# .env
BASE_URL=https://api.example.com
API_KEY=your-api-key
```

---

## 🆚 Why Hop?

| Feature | Hop | Cypress | Playwright |
|---------|-----|---------|------------|
| BDD/Gherkin | ✅ | ❌ | ❌ |
| Auto-Wait | ✅ | ✅ | ✅ |
| Command Chain | ✅ | ✅ | ❌ |
| Network Intercept | ✅ | ✅ | ✅ |
| Time Travel | ✅ | ✅ | ❌ |
| GUI Mode | ✅ | ✅ | ✅ |
| HTML Report | ✅ Premium | ❌ | ❌ |
| TypeScript | ✅ | ⚠️ | ✅ |
| Open Source | ✅ | ✅ | ✅ |

---

## 📄 License

MIT

---

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)
