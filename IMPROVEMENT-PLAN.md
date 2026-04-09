# Hop Framework - Improvement Plan

## Overview
This document outlines the improvements needed to make Hop competitive with Playwright, Cypress, and Karate.

---

## Fase 1 - MVP Enhancement (Priority: HIGH)

### 1.1 Codegen (Record UI Actions) - ENHANCE EXISTING
**Status:** Basic exists, needs enhancement

**Current:** `src/recorder/recorder.ts`
- Records click, type, navigate only
- Basic selector generation
- Simple Gherkin output

**Needed:**
- [ ] Add wait action recording (visibility, clickability)
- [ ] Add assertion recording (text, value, visibility checks)
- [ ] Add select/dropdown handling
- [ ] Add hover and scroll actions
- [ ] Add keyboard shortcuts (Enter, Escape, etc.)
- [ ] Better selector generation (prioritize testid > aria > text)
- [ ] Add UI for start/stop recording
- [ ] Generate step definitions automatically

**Files to modify:**
- `src/recorder/recorder.ts` - Enhance event recording
- `src/recorder/codegen.ts` - NEW: Generate better Gherkin
- `bin/cli.ts` - Add `hop record` command

---

### 1.2 IDE Plugins (VSCode)
**Status:** Not started

**Needed:**
- [ ] VSCode extension with:
  - Gherkin syntax highlighting
  - Step definition autocomplete
  - Feature file validation
  - Jump to step definition
  - Run scenario from editor
  - Snippet generation

**Files to create:**
- `extensions/vscode/` - VSCode extension
- `extensions/vscode/package.json`
- `extensions/vscode/src/extension.ts`
- `extensions/vscode/syntaxes/gherkin.json`

---

### 1.3 Better Error Messages
**Status:** Basic exists, needs enhancement

**Current:** Basic error in `assertion-handler.ts` and `response-validator.ts`

**Needed:**
- [ ] Pretty print JSON diff on assertion failures
- [ ] Show context (feature, scenario, step)
- [ ] Suggest potential fixes for undefined steps
- [ ] Show expected vs actual with highlighting
- [ ] Include relevant code snippet in error

**Files to modify:**
- `src/engine/step-executor.ts` - Better error wrapping
- `src/validation/response-validator.ts` - JSON diff output
- `src/engine/snippet-generator.ts` - Better suggestions
- `src/reporter/console-reporter.ts` - Colored output

---

### 1.4 Video Recording on Failure
**Status:** Basic exists in browser-manager.ts

**Current:** Video recording enabled but only saves always

**Needed:**
- [ ] Only save video on failure (save storage)
- [ ] Attach video to HTML report
- [ ] Add video to console output on failure
- [ ] Configurable: always/never/on-failure

**Files to modify:**
- `src/ui/browser-manager.ts` - Conditional video save
- `src/engine/scenario-runner.ts` - Check failure before save
- `src/config/config-loader.ts` - Add video config
- `src/reporter/hop-reporter-v2.ts` - Include video in report

---

## Fase 2 - Feature Parity (Priority: HIGH)

### 2.1 Contract Testing
**Status:** Not started

**Needed:**
- [ ] Pact broker integration
- [ ] Consumer contract testing
- [ ] Provider verification
- [ ] Generate contract from HTTP calls

**Files to create:**
- `src/validation/contract-tester.ts` - Pact integration
- `src/generators/pact-generator.ts` - Generate contracts

---

### 2.2 Interactive UI Mode
**Status:** Not started

**Needed:**
- [ ] Step-by-step execution UI
- [ ] Debug mode with breakpoints
- [ ] Variable inspection during run
- [ ] Interactive repl for testing

**Files to create:**
- `src/ui/debug-ui.ts` - Interactive debug UI
- `bin/debug.ts` - Debug command

---

### 2.3 Cloud Dashboard
**Status:** Not started

**Needed:**
- [ ] Test history storage
- [ ] Flaky test tracking
- [ ] Trends visualization
- [ ] Slack/Teams notifications

**Files to create:**
- `src/reporter/cloud-reporter.ts` - Cloud integration
- `src/cli/dashboard-server.ts` - Local dashboard

---

### 2.4 gRPC Support
**Status:** Not started

**Needed:**
- [ ] gRPC client
- [ ] Proto file loading
- [ ] gRPC reflection
- [ ] Binary response handling

**Files to create:**
- `src/http/grpc-client.ts` - gRPC client
- `src/utils/proto-loader.ts` - Load proto files
- `src/engine/handlers/grpc-handler.ts` - gRPC steps

---

### 2.5 Network Interception
**Status:** Basic exists (interceptors)

**Needed:**
- [ ] Block specific requests
- [ ] Override responses
- [ ] Mock API responses
- [ ] Track all network calls

**Files to modify:**
- `src/http/interceptor-manager.ts` - Enhanced interception
- `src/ui/browser-manager.ts` - Browser-level interception

---

### 2.6 Auto-Wait Mechanism
**Status:** Partially exists

**Needed:**
- [ ] Wait for element visible
- [ ] Wait for element clickable
- [ ] Wait for network idle
- [ ] Configurable timeouts

**Files to modify:**
- `src/ui/playwright-client.ts` - Add auto-wait
- `src/ui/browser-assertions.ts` - Add wait assertions

---

## Fase 3 - Enterprise (Priority: MEDIUM)

### 3.1 Docker Support
**Status:** Not started

**Needed:**
- [ ] Official Docker image
- [ ] docker-compose templates
- [ ] Kubernetes test runner

**Files to create:**
- `Dockerfile`
- `docker-compose.yml`
- `kubernetes/test-runner.yaml`

---

### 3.2 CI/CD Templates
**Status:** Not started

**Needed:**
- [ ] GitHub Actions template
- [ ] GitLab CI template
- [ ] Jenkinsfile
- [ ] Azure DevOps template

**Files to create:**
- `.github/workflows/test.yml`
- `.gitlab-ci.yml`
- `Jenkinsfile`
- `azure-pipelines.yml`

---

### 3.3 Security Testing
**Status:** Not started

**Needed:**
- [ ] OAuth2/OIDC helper
- [ ] JWT refresh automation
- [ ] Basic auth helper
- [ ] API key management

**Files to create:**
- `src/auth/oauth-helper.ts`
- `src/auth/jwt-helper.ts`
- `src/utils/security-scanner.ts`

---

### 3.4 Performance Testing Enhancement
**Status:** Basic exists (k6 generator)

**Needed:**
- [ ] Load scenario configuration
- [ ] Think time simulation
- [ ] Test data parametrization
- [ ] Custom metrics

**Files to modify:**
- `src/generators/k6-generator.ts` - Enhanced
- `docs/load-testing.md` - Documentation

---

## Implementation Order

### Phase 1 (Weeks 1-4)
1. **Week 1-2:** Enhance recorder (add more actions, better output)
2. **Week 2:** Add video recording on failure only
3. **Week 3:** Better error messages with JSON diff
4. **Week 4:** Start VSCode extension basic structure

### Phase 2 (Weeks 5-8)
1. **Week 5-6:** Network interception & auto-wait
2. **Week 6-7:** Interactive debug mode
3. **Week 7-8:** gRPC support

### Phase 3 (Weeks 9-12)
1. **Week 9-10:** Docker & CI/CD templates
2. **Week 11:** Security helpers
3. **Week 12:** Performance enhancement

---

## Dependencies Needed

```json
{
  "newDependencies": [
    "@grpc/grpc-js",
    "@grpc/proto-loader",
    "@pact-foundation/pact-core",
    "diff",
    "cli-table3"
  ]
}
```