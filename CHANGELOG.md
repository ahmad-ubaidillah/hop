# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-03-28

### Added
- Initial release of Hop Framework
- BDD testing with Gherkin syntax support
- API testing capabilities with HTTP client
- UI testing with Playwright integration
- Load testing with K6 script generation
- Multiple reporters (HTML, JSON, JUnit, Allure, Newman)
- Cucumber expressions support ({int}, {string}, etc.)
- Custom type transformers
- Feature calling (like Karate)
- Parallel test execution
- Hooks system (beforeAll, afterAll, beforeScenario, afterScenario, beforeStep, afterStep)
- Screenshot on failure for UI tests
- Premium HTML reporter with glassmorphism UI
- GraphQL client support
- WebSocket client support
- HTTP caching and interceptors
- Retry mechanism with configurable backoff
- Mock server for API mocking
- CSV and JSON data file support
- Environment variable support
- Tag-based test filtering

### Changed
- N/A (Initial release)

### Deprecated
- N/A (Initial release)

### Removed
- N/A (Initial release)

### Fixed
- TypeScript type errors in reporters and validators
- Implicit 'any' type issues

### Security
- N/A (Initial release)

---

## [Unreleased]

### Added
- Unit tests for schema validator (56 tests)
- Unit tests for HTTP client (29 tests)
- Unit tests for retry manager (21 tests)
- Unit tests for data table parser (22 tests)
- Unit tests for console reporter (20 tests)
- Code coverage configuration
- Release workflow for npm publishing
- CI workflow with Codecov integration

### Changed
- Improved test coverage from 6 test files to 11 test files
