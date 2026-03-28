# Real-World Testing Examples

This directory contains real-world testing examples using Hop framework. These examples demonstrate how to use Hop for testing actual applications and APIs.

## Directory Structure

```
real-world/
├── saucelabs-login.feature       # Sauce Labs login page tests
├── saucelabs-inventory.feature   # Sauce Labs inventory tests
├── saucelabs-checkout.feature    # Sauce Labs checkout flow tests
├── api-jsonplaceholder-posts.feature   # JSONPlaceholder posts API tests
├── api-jsonplaceholder-users.feature   # JSONPlaceholder users API tests
├── api-reqres-users.feature            # ReqRes API tests
├── performance-jsonplaceholder.feature # JSONPlaceholder performance tests
├── performance-reqres.feature          # ReqRes performance tests
├── load-test-config.json               # k6 load test configuration
├── steps/
│   └── saucelabs-steps.ts        # Step definitions
└── README.md                     # This file
```

## Test Categories

### 1. UI Testing (Sauce Labs Demo)

Sauce Labs provides a demo e-commerce application perfect for UI automation testing.

**Test Files:**
- `saucelabs-login.feature` - Login scenarios (valid, invalid, edge cases)
- `saucelabs-inventory.feature` - Product listing, sorting, cart operations
- `saucelabs-checkout.feature` - End-to-end checkout flow

**Target Application:** https://www.saucedemo.com

**Test Users:**
| Username | Password | Purpose |
|----------|----------|---------|
| `standard_user` | `secret_sauce` | Normal user |
| `locked_out_user` | `secret_sauce` | Locked account |
| `problem_user` | `secret_sauce` | UI issues |
| `performance_glitch_user` | `secret_sauce` | Slow responses |

**Run UI Tests:**
```bash
hop test --tags "@ui" --features examples/real-world
```

### 2. API Testing

#### JSONPlaceholder API

Free fake API for testing and prototyping.

**Test Files:**
- `api-jsonplaceholder-posts.feature` - Posts CRUD operations
- `api-jsonplaceholder-users.feature` - Users CRUD operations

**Base URL:** https://jsonplaceholder.typicode.com

**Available Endpoints:**
- `/posts` - 100 posts
- `/users` - 10 users
- `/comments` - 500 comments
- `/albums` - 100 albums
- `/photos` - 5000 photos
- `/todos` - 200 todos

**Run API Tests:**
```bash
hop test --tags "@api @jsonplaceholder" --features examples/real-world
```

#### ReqRes API

Hosted REST-API for testing AJAX requests.

**Test File:**
- `api-reqres-users.feature` - User management, authentication

**Base URL:** https://reqres.in/api

**Features:**
- User CRUD operations
- Registration and login
- Pagination support
- Delayed responses
- Error handling

**Run ReqRes Tests:**
```bash
hop test --tags "@api @reqres" --features examples/real-world
```

### 3. Performance Testing

Performance tests using k6-compatible syntax.

**Test Files:**
- `performance-jsonplaceholder.feature` - JSONPlaceholder performance
- `performance-reqres.feature` - ReqRes performance tests

**Configuration:**
- `load-test-config.json` - k6 load test scenarios

**Run Performance Tests:**
```bash
# Generate k6 script
hop generate k6 performance-jsonplaceholder.feature -o load-test.js

# Run with k6
k6 run load-test.js
```

**Load Test Scenarios:**
| Scenario | VUs | Duration | Purpose |
|----------|-----|----------|---------|
| Smoke | 1 | 1m | Verify system works |
| Load | 10 | 5m | Normal load |
| Stress | 100 | 10m | Find breaking point |
| Spike | 200 | 5m | Sudden load increase |
| Soak | 20 | 1h | Long-running stability |

## Running All Examples

```bash
# Run all real-world tests
hop test --features examples/real-world

# Run by tag
hop test --tags "@smoke"
hop test --tags "@api"
hop test --tags "@ui"
hop test --tags "@load"

# Run specific feature
hop test --features examples/real-world/saucelabs-login.feature

# Generate HTML report
hop test --features examples/real-world --report
```

## Test Tags Reference

| Tag | Category | Description |
|-----|----------|-------------|
| `@ui` | UI Testing | Browser-based tests |
| `@api` | API Testing | HTTP API tests |
| `@load` | Performance | Load/performance tests |
| `@smoke` | Priority | Critical path tests |
| `@e2e` | Type | End-to-end flows |
| `@crud` | Type | CRUD operations |
| `@negative` | Type | Negative test cases |
| `@validation` | Type | Validation tests |
| `@saucelabs` | Target | Sauce Labs demo |
| `@jsonplaceholder` | Target | JSONPlaceholder API |
| `@reqres` | Target | ReqRes API |

## Best Practices Demonstrated

### 1. Organized Feature Files
- Separate files by functionality
- Clear naming conventions
- Tagged scenarios for filtering

### 2. Background Reuse
- Common setup in Background section
- Shared configuration
- Reusable authentication

### 3. Data-Driven Testing
- Scenario Outline with Examples
- Multiple test cases in one scenario
- Parameterized values

### 4. Assertions
- Response status validation
- Response time checks
- Schema validation
- Fuzzy matching

### 5. Test Organization
- Tags for filtering
- Clear descriptions
- Categorized scenarios

## Contributing

To add new real-world examples:

1. Create a new `.feature` file
2. Add appropriate tags
3. Include clear descriptions
4. Follow existing patterns
5. Update this README

## External Resources

- [Sauce Labs Demo](https://www.saucedemo.com)
- [JSONPlaceholder](https://jsonplaceholder.typicode.com)
- [ReqRes](https://reqres.in)
- [k6 Documentation](https://k6.io/docs/)
