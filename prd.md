# Hop (formerly Bun-Rate)

> **Version:** 1.0  
> **Status:** In Development  
> **Last Updated:** 2026-03-10  
> **Author:** Product Team

---

## 1. Executive Summary

**Hop** is a high-performance **BDD (Behavior Driven Development)** automation testing framework for API & UI testing. It combines the simplicity of Gherkin syntax (inspired by Karate) with the extreme speed of **Bun** runtime, **ArkType** validation, and **Playwright** for browser automation.

### 🎯 Value Proposition

| Current Pain | Hop Solution |
|--------------|-------------------|
| Karate requires JVM (heavy, slow startup) | Zero-Java, pure TypeScript/Bun |
| Complex setup for API testing | Single `npx hop test` command |
| No built-in UI testing in Karate | Playwright integration out-of-the-box |
| Slow validation in JS frameworks | ArkType - fastest JSON schema validation |

---

## 2. Goals & Objectives

### 2.1 Primary Goals

- ⚡ **Performance First:** Test execution 3-5x faster than JVM-based frameworks (Karate)
- 🛠️ **Developer Experience:** Instant setup via `npm`/`npx`, no Java dependency
- 🌐 **Universal Testing:** One framework for API (Bun.fetch), UI (Playwright), and Performance (k6)
- 🧠 **Fuzzy Matching:** Intelligent JSON validation like Karate with TypeScript type performance

### 2.2 Success Metrics (KPIs)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Cold Start Time** | < 500ms | Time from CLI command to first test execution |
| **Test Execution Speed** | 3-5x faster than Karate | Compare同等 test suite runtime |
| **Bundle Size** | < 10MB (excluding Playwright browsers) | NPM package size |
| **Feature Coverage** | 100% Gherkin standard syntax | Parse all standard Gherkin constructs |
| **Cross-Platform** | Windows, Linux, macOS | CI/CD pipeline validation |

---

## 3. Core Features

### 3.1 BDD Engine (Gherkin Support)

| Feature | Description | Priority |
|---------|-------------|----------|
| `.feature` File Support | Parse standard Gherkin/Cucumber format | ✅ P0 |
| Pre-defined Steps | Built-in steps for API: `Given`, `When`, `Then`, `And`, `But` | ✅ P0 |
| Scenario Outline | Data-driven testing with Gherkin tables | ✅ P0 |
| Background | Shared steps before each scenario | ✅ P1 |
| DocString | Multi-line JSON/text payloads | ✅ P1 |
| Tags | Filter scenarios with `@tag` notation | ✅ P2 |

### 3.2 API Testing Engine ("Karate-Lite")

| Feature | Description | Priority |
|---------|-------------|----------|
| Zero-Dependency Client | Native `Bun.fetch` (no Axios/Fetch API polyfills) | ✅ P0 |
| Context Management | Store variables across steps (e.g., `token` from login) | ✅ P0 |
| HTTP Methods | GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS | ✅ P0 |
| Headers Management | Custom headers, auth tokens, content-type | ✅ P0 |
| Request Body | JSON, FormData, XML, Raw text | ✅ P1 |
| Response Handling | Status, body, headers, cookies | ✅ P0 |
| Fuzzy Validation | ArkType-powered schema validation | ✅ P0 |
| JSON Path | Extract values from response (e.g., `$.data.id`) | ✅ P1 |

### 3.3 UI Testing Integration

| Feature | Description | Priority |
|---------|-------------|----------|
| Playwright Wrapper | Simplified API over `playwright-core` | ✅ P1 |
| Headless Browser | Run browsers without GUI | ✅ P1 |
| Context Sharing | Share cookies/storage between API and UI | ✅ P1 |
| Element Locators | CSS, XPath, Text, Role-based selectors | ✅ P1 |
| Screenshot Capture | Take screenshots on failure/pass | ✅ P2 |
| Video Recording | Record browser sessions | ✅ P2 |

### 3.4 Performance Test Bridge (k6)

| Feature | Description | Priority |
|---------|-------------|----------|
| k6 Script Generator | Transpile Gherkin scenarios to k6 JS | ✅ P2 |
| Request Batching | Convert multiple API calls to VU iterations | ✅ P2 |
| Load Profile Config | Generate virtual users/duration from tags | ✅ P2 |

---

## 4. Technical Architecture

### 4.1 Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                      Hop Architecture                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────┐   │
│  │    CLI      │   │  Gherkin    │   │   Test Engine   │   │
│  │  (Commander)│◄──│   Parser    │◄──│   (TypeScript)  │   │
│  └─────────────┘   └─────────────┘   └────────┬────────┘   │
│                                                │             │
│  ┌─────────────┐   ┌─────────────┐   ┌────────▼────────┐   │
│  │   Report    │◄──│   ArkType   │◄──│   HTTP Client    │   │
│  │  (Eta/HTML) │   │  Validator  │   │  (Bun.fetch)    │   │
│  └─────────────┘   └─────────────┘   └─────────────────┘   │
│                                                │             │
│                                    ┌──────────▼────────┐    │
│                                    │    Playwright     │    │
│                                    │   (Optional)      │    │
│                                    └───────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Dependencies

| Package | Version | Purpose | Type |
|---------|---------|---------|------|
| `bun` | ≥1.0 | Runtime environment | Required |
| `typescript` | ^5.0 | Type safety | Required |
| `@cucumber/gherkin` | ^24.0 | Gherkin AST parsing | Required |
| `arktype` | ^1.0 | JSON schema validation | Required |
| `commander` | ^11.0 | CLI argument parsing | Required |
| `eta` | ^3.0 | HTML template engine | Required |
| `playwright-core` | ^1.40 | Browser automation | Optional |
| `bun-test-reporter` | custom | Custom reporter | Required |

---

## 5. User Journey

### 5.1 Quick Start Flow

```bash
# 1️⃣ Initialize project
npx hop init my-api-tests

# 2️⃣ Navigate to project
cd my-api-tests

# 3️⃣ Write test (features/login.feature)
# See syntax examples below

# 4️⃣ Run tests
npx hop test

# 5️⃣ View report
npx hop test --report
```

### 5.2 Project Structure

```
my-api-tests/
├── features/
│   ├── login.feature
│   └── user-management.feature
├── steps/
│   └── custom-steps.ts    # User-defined step definitions
├── hooks/
│   └── before-scenario.ts  # Hooks (before/after)
├── config/
│   └── hop.config.ts   # Configuration file
├── .env                    # Environment variables
└── package.json
```

---

## 6. Syntax Examples

### 6.1 Basic API Test

```gherkin
Feature: User Management API

  Background:
    Given url 'https://api.example.com'
    And header Content-Type = 'application/json'

  Scenario: Get User Details
    Given path '/users/1'
    When method GET
    Then status 200
    And match response == { id: '#number', name: '#string', email: '#email' }
```

### 6.2 Data-Driven Testing (Scenario Outline)

```gherkin
Feature: User Creation

  Scenario Outline: Create multiple users
    Given path '/users'
    And request { name: '<name>', email: '<email>' }
    When method POST
    Then status 201
    And match response == { id: '#number', name: '<name>' }

    Examples:
      | name          | email                  |
      | John Doe      | john@example.com       |
      | Jane Smith    | jane@example.com       |
```

### 6.3 API + UI Hybrid Test

```gherkin
Feature: Login Flow

  Scenario: Login via API, then verify UI
    # API Step
    Given url 'https://app.example.com'
    And path '/api/auth/login'
    And request { email: 'test@example.com', password: 'password123' }
    When method POST
    Then status 200
    And def token = response.token

    # UI Step (using shared context)
    Given user opens browser
    And user navigates to 'https://app.example.com/dashboard'
    And user sets cookie 'auth_token' to token
    And user refreshes page
    Then user should see element '.welcome-message'
```

---

## 7. Non-Functional Requirements (NFR)

### 7.1 Performance Requirements

| Requirement | Target | Acceptance Criteria |
|-------------|--------|---------------------|
| Cold Start | < 500ms | Time from CLI to first log output |
| Test Execution | 3-5x vs Karate | Same test suite, compare runtimes |
| Memory Usage | < 200MB idle | Baseline memory with 0 tests |
| Bundle Size | < 10MB | NPM publish size (excludes browsers) |

### 7.2 Compatibility

| Platform | Minimum Version | Support |
|----------|-----------------|---------|
| macOS | 10.15 (Catalina) | ✅ Full |
| Windows | Windows 10 | ✅ Full |
| Linux | Ubuntu 20.04+ | ✅ Full |
| Node.js | 18+ (fallback) | ✅ Full |
| Bun | 1.0+ | ✅ Full |

### 7.3 Security

- ✅ No sensitive data in logs (tokens masked by default)
- ✅ Support `.env` files with `.gitignore`
- ✅ HTTPS-only by default for all requests

---

## 8. Competitive Analysis

### 8.1 Comparison Matrix

| Feature | Hop | Karate | Jest + Supertest | Frisby.js |
|---------|----------|--------|------------------|-----------|
| Gherkin Syntax | ✅ | ✅ | ❌ | ❌ |
| No Java Required | ✅ | ❌ | ✅ | ✅ |
| Built-in UI Testing | ✅ (Playwright) | ❌ | ❌ | ❌ |
| k6 Integration | ✅ (Generator) | ❌ | ❌ | ❌ |
| TypeScript Native | ✅ | ❌ | ✅ | ❌ |
| Speed (Cold Start) | <500ms | ~3s | ~2s | ~2s |
| Schema Validation | ArkType | JSON-Unit | Jest Matchers | Jest |

### 8.2 Unique Selling Points

1. **Fastest BDD Framework** - Cold start under 500ms
2. **Multi-Modal Testing** - API + UI + Performance in one framework
3. **Type-Safe** - Full TypeScript with compile-time checks
4. **Developer Experience** - Single command to rule them all

---

## 9. Technical Solutions (Key Decisions)

### 9.1 Market Differentiation: The "No-JVM" Edge

**Challenge:** Competing with Karate's dominance.

**The Hop Proposition:**

- **Engine:** Unlike Karate (GraalVM/Java), **Hop** runs on **Bun (Zig/JavaScriptCore)**. This means ~10ms startup times vs. 2-3 seconds for JVM.
- **Dependency-Free:** A single `npx hop` command. No need to manage `JAVA_HOME` or Maven/Gradle dependencies.
- **The "Native" Advantage:** Users can import any NPM package (e.g., `faker`, `crypto-js`, `moment`) directly into their step definitions without "interop" overhead.

### 9.2 Gherkin Complexity: AST-to-Model Mapping

**Challenge:** Handling Scenario Outlines and Data Tables.

**Technical Approach:**

- **Step-by-Step Execution:** Use `@cucumber/gherkin` to produce a **Gherkin Document**.
- **Data Tables:** Implement a `Table` class that converts Gherkin rows into a `hashes()` array or `rowsHash()` object, making it easy to iterate in TypeScript.
- **Scenario Outlines:** **Hop** will treat each `Example` row as a distinct test iteration, dynamically injecting the variables into the step strings before execution.

### 9.3 Playwright Integration: The "Unified Context"

**Challenge:** Maintaining state between API and UI.

**Technical Solution:**

- **Shared State Store:** **Hop** will maintain a central `State` object.
- **Auth Bridge:** When a `When method POST` login step is called, **Hop** captures the `Set-Cookie` headers and stores them in the `State.cookies`.
- **Playwright Injection:** When a UI step like `Given user opens browser` is triggered, **Hop** initializes the Playwright context and automatically calls `browserContext.addCookies(State.cookies)`, enabling a seamless transition from API-auth to UI-action.

### 9.4 ArkType as Validator: The Protection Layer

**Challenge:** Protecting users from ArkType's evolving API.

**Strategy:**

- **Abstraction:** Users will never write `type({...})` directly. They will use the Gherkin keyword `match response == { id: 'number' }`.
- **The Adapter:** **Hop** will have a `ValidationAdapter`. If ArkType updates its API, we only update the adapter. If we ever need to switch to **Zod** or **Valibot** for better stability, the user's `.feature` files remain untouched.

### 9.5 k6 Bridge: The Transpiler Logic

**Challenge:** Mapping BDD to k6's Virtual User (VU) model.

**Technical Solution:**

- **Code Generation:** Instead of running the engine inside k6, `hop load-gen` will read the `.feature` file and output a `load-test.js` file compatible with k6.
- **Mapping Logic:**
  - `Scenario` -> `export default function()`
  - `Then status 200` -> `check(res, { 'status is 200': (r) => r.status === 200 })`
- **Limitation:** This bridge will support **API steps only**, as k6's browser support is a separate, heavier module.

---

## 10. Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| ArkType API changes | High | Medium | Abstract validation layer, version lock |
| Bun runtime instability | High | Low | Fallback to Node.js support |
| Playwright maintenance | Medium | Low | Use `playwright-core`, not full package |
| Gherkin parser bugs | Medium | Low | Extensive test coverage, community fixes |
| Market adoption | High | Unknown | Focus on DX, documentation, examples |

---

## 11. Development Roadmap

### 📦 Phase 1: MVP (Minimum Viable Product)

> **Timeline:** 5 Sprints  
> **Goal:** Core API testing with Gherkin
> **Status:** 🚧 In Progress (Sprints 1-4 Complete)

---

## 12. Sprint Breakdown & Tasks

### 🏃 Sprint 1: Core CLI & Gherkin Parser ✅ COMPLETE
**Duration:** 1 Week  
**Goal:** User can run `npx hop test` and see `.feature` files parsed

| ID | Task | Description | Estimate | Owner | Status |
|----|------|-------------|----------|-------|--------|
| **1.1** | Project Scaffolding | Initialize project with `bun init`, setup `package.json` with bin entry, configure `tsconfig.json` for Bun | 2h | - | ✅ |
| **1.2** | CLI Argument Parser | Create `bin/cli.ts` to parse commands (`test`, `init`, `--report`) using Commander | 4h | - | ✅ |
| **1.3** | Gherkin File Discovery | Implement recursive glob to find all `.feature` files in specified directory | 2h | - | ✅ |
| **1.4** | Gherkin Parser Integration | Integrate `@cucumber/gherkin` and convert `.feature` files to AST | 4h | - | ✅ |
| **1.5** | CLI Output Formatter | Display parsed Gherkin scenarios in terminal (feature name, scenarios list) | 2h | - | ✅ |
| **1.6** | Error Handling | Handle missing files, invalid Gherkin syntax, show helpful error messages | 2h | - | ✅ |
| **1.7** | Unit Tests | Write unit tests for CLI and parser modules (min 80% coverage) | 4h | - | ✅ |

**Deliverable:** `npx hop test` shows parsed scenarios in terminal ✅

---

### 🏃 Sprint 2: API Engine & Context Management ✅ COMPLETE
**Duration:** 1 Week  
**Goal:** Framework can execute HTTP requests and store context

| ID | Task | Description | Estimate | Owner | Status |
|----|------|-------------|----------|-------|--------|
| **2.1** | Step Definition Mapper | Create `matchStep()` function using Regex to map Gherkin steps to TypeScript functions | 4h | - | ✅ |
| **2.2** | Global Context Store | Implement `TestContext` class to store `baseUrl`, `headers`, `lastResponse`, `variables` | 2h | - | ✅ |
| **2.3** | "Given url" Step | Implement step to set base URL from Gherkin | 2h | - | ✅ |
| **2.4** | "And path" Step | Implement step to append path to URL | 1h | - | ✅ |
| **2.5** | "And header" Step | Implement custom header configuration | 2h | - | ✅ |
| **2.6** | "When method [METHOD]" Step | Implement HTTP client using `Bun.fetch` with all methods | 4h | - | ✅ |
| **2.7** | "And request" Step | Implement request body handling (JSON, text, form) | 3h | - | ✅ |
| **2.8** | "Then status" Step | Implement status code assertion | 1h | - | ✅ |
| **2.9** | Context Persistence | Ensure context persists across scenarios in same feature | 2h | - | ✅ |
| **2.10** | Integration Tests | Write integration tests for API flow | 4h | - | ✅ |

**Deliverable:** Basic API test execution works end-to-end ✅

---

### 🏃 Sprint 3: Fuzzy Matching with ArkType ✅ COMPLETE
**Duration:** 1 Week  
**Goal:** JSON validation with "Karate-like" fuzzy matching

| ID | Task | Description | Estimate | Owner | Status |
|----|------|-------------|----------|-------|--------|
| **3.1** | ArkType Integration | Install and configure `arktype` in project | 1h | - | ✅ |
| **3.2** | "match response ==" Step | Implement exact match validation using ArkType | 3h | - | ✅ |
| **3.3** | Keyword Mapping | Create helper to translate Gherkin keywords to ArkType: `#string`, `#number`, `#boolean`, `#regex`, `#email`, `#uuid` | 3h | - | ✅ |
| **3.4** | Fuzzy Match Support | Implement partial matching (`#notnull`, `#ignore`) | 2h | - | ✅ |
| **3.5** | DocString Support | Parse multi-line JSON from Gherkin DocString for complex schemas | 2h | - | ✅ |
| **3.6** | Custom Type Definition | Allow user-defined types in config | 2h | - | ✅ |
| **3.7** | Error Message Formatting | Human-readable error messages from ArkType validation failures | 2h | - | ✅ |
| **3.8** | Array Validation | Support array schema validation (`#array`, `#[]`) | 2h | - | ✅ |
| **3.9** | Unit Tests | Comprehensive tests for all validation scenarios | 4h | - | ✅ |

**Deliverable:** Full fuzzy matching validation works like Karate ✅

---

### 🏃 Sprint 4: Reporting & HTML Dashboard ✅ COMPLETE
**Duration:** 1 Week  
**Goal:** Beautiful test reports beyond console output

| ID | Task | Description | Estimate | Owner | Status |
|----|------|-------------|----------|-------|--------|
| **4.1** | Test Result Collector | Create `TestResult` class to collect Pass/Fail status, duration, error messages | 2h | - | ✅ |
| **4.2** | Console Reporter | Enhanced console output with colors, progress bar, summary | 2h | - | ✅ |
| **4.3** | JUnit XML Generator | Export test results to JUnit XML format for CI/CD | 3h | - | ✅ |
| **4.4** | HTML Template Setup | Configure `eta` template engine with HTML structure | 2h | - | ✅ |
| **4.5** | HTML Report Design | Create report template with: summary stats, scenario list, error details, duration chart | 4h | - | ✅ |
| **4.6** | "Auto-open Report" Feature | Add `--report` flag to automatically open HTML in browser | 1h | - | ✅ |
| **4.7** | JSON Reporter | Add JSON export for custom integrations | 2h | - | ✅ |
| **4.8** | Test Retry Logic | Add retry mechanism for flaky tests | 3h | - | ✅ |

**Deliverable:** HTML reports auto-generate after test run ✅

---

### 🏃 Sprint 5: Advanced Features & Polish 🚧 IN PROGRESS
**Duration:** 1 Week  
**Goal:** Polish MVP with advanced features

| ID | Task | Description | Estimate | Owner | Status |
|----|------|-------------|----------|-------|--------|
| **5.1** | Scenario Outline Support | Implement data-driven testing with Examples table | 4h | - | 🚧 |
| **5.2** | Background Support | Parse and execute Background steps before each Scenario | 2h | - | 🚧 |
| **5.3** | Tags & Filtering | Implement `@tag` filtering with `--tags` CLI flag | 3h | - | ⏳ |
| **5.4** | Hooks System | Implement `before`, `after`, `beforeStep`, `afterStep` hooks | 3h | - | ⏳ |
| **5.5** | Environment Variables | Support `--env` flag and `.env` file loading | 2h | - | ⏳ |
| **5.6** | Request/Response Logging | Add verbose mode (`--verbose`) for debugging | 2h | - | ⏳ |
| **5.7** | Configuration File | Create `hop.config.ts` for customizable settings | 2h | - | ⏳ |
| **5.8** | Performance Optimization | Profile and optimize cold start time | 2h | - | ⏳ |

**Deliverable:** Production-ready MVP with all essential features

---

### 🏃 Sprint 6-7: UI Testing (Playwright Integration)
**Duration:** 2 Weeks  
**Goal:** Add browser automation capabilities

| ID | Task | Description | Estimate | Owner |
|----|------|-------------|----------|-------|
| **6.1** | Playwright Setup | Install `playwright-core` as optional dependency | 2h | - |
| **6.2** | Browser Manager | Auto-download browsers on first use | 3h | - |
| **6.3** | "Given user opens browser" Step | Initialize Playwright browser/context | 2h | - |
| **6.4** | "When user navigates to" Step | Navigate to URL in browser | 1h | - |
| **6.5** | "When user clicks" Step | Click element by selector | 2h | - |
| **6.6** | "When user types" Step | Input text into element | 1h | - |
| **6.7** | "Then user should see" Step | Assert element visibility/text | 2h | - |
| **6.8** | Context Sharing | Share cookies/localStorage between API and UI | 4h | - |
| **6.9** | Screenshot on Failure | Auto-capture screenshot when UI test fails | 2h | - |
| **6.10** | Headless/Headed Mode | Support `--headed` flag for visible browser | 1h | - |
| **6.11** | UI Integration Tests | Test complete login flow (API → UI) | 4h | - |

**Deliverable:** Hybrid API+UI testing with shared context

---

### 🏃 Sprint 8: k6 Performance Bridge
**Duration:** 1 Week  
**Goal:** Generate k6 load test scripts from Gherkin

| ID | Task | Description | Estimate | Owner |
|----|------|-------------|----------|-------|
| **7.1** | k6 Script Generator | Create transpiler from recorded requests to k6 JS | 6h | - |
| **7.2** | Request Batching | Group requests into VU iterations | 3h | - |
| **7.3** | Load Profile Config | Generate k6 options (vus, duration, ramp) from tags | 3h | - |
| **7.4** | Assertions Mapping | Convert Gherkin assertions to k6 checks | 2h | - |
| **7.5** | Environment Variable Support | Pass environment configs to k6 | 2h | - |

**Deliverable:** `npx bun-rate gen-k6` generates runnable k6 script

---

### 🏃 Sprint 9-10: Documentation & Release
**Duration:** 2 Weeks  
**Goal:** Prepare for public release

| ID | Task | Description | Estimate | Owner |
|----|------|-------------|----------|-------|
| **8.1** | README Documentation | Comprehensive setup and usage guide | 4h | - |
| **8.2** | Website/Docs | Create documentation site (Docusaurus or similar) | 16h | - |
| **8.3** | Example Projects | Create 3-5 example test suites | 8h | - |
| **8.4** | CI/CD Templates | GitHub Actions, GitLab CI, Jenkins pipelines | 4h | - |
| **8.5** | NPM Publishing | Setup npm account, publish package | 2h | - |
| **8.6** | Version Management | Implement semantic versioning | 2h | - |
| **8.7** | Community Setup | Discord/Slack community, GitHub discussions | 4h | - |

**Deliverable:** Public release v1.0.0

---

## 12. Timeline Summary

| Phase | Sprint | Duration | Key Deliverable |
|-------|--------|----------|-----------------|
| **Phase 1** | Sprint 1-5 | 5 Weeks | MVP: Core API Testing |
| **Phase 2** | Sprint 6-7 | 2 Weeks | UI Testing (Playwright) |
| **Phase 3** | Sprint 8 | 1 Week | k6 Integration |
| **Phase 4** | Sprint 9-10 | 2 Weeks | Release & Documentation |
| | | **Total: 10 Weeks** | |

---

## 13. Out of Scope (Post-v1.0)

The following features are intentionally deferred to future versions:

- 🔮 GraphQL testing support
- 🔮 WebSocket testing
- 🔮 gRPC/Protobuf support
- 🔮 Visual regression testing
- 🔮 Test data factory/faker
- 🔮 Team collaboration features
- 🔮 Cloud execution grid

---

## 14. Appendix

### A. CLI Commands Reference

```bash
# Initialize new project
npx hop init <project-name>

# Run tests
npx hop test
npx hop test --features <path>
npx hop test --tags "@smoke"
npx hop test --env "staging"

# Generate reports
npx hop test --report
npx hop test --format json
npx hop test --format junit

# Generate k6 script
npx hop gen-k6 --output load-test.js

# Help
npx hop --help
```

### B. Configuration File Example

```typescript
// hop.config.ts
export default {
  features: './features',
  steps: './steps',
  reports: './reports',
  format: ['html', 'junit'],
  timeout: 30000,
  retry: 2,
  parallel: 4,
  tags: {
    include: ['@smoke'],
    exclude: ['@manual']
  },
  headers: {
    'User-Agent': 'Hop/1.0'
  }
}
```

---

## 15. Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | | | |
| Technical Lead | | | |
| QA Lead | | | |

---

*End of Document*
