# Migration Guide: Karate to Hop Framework

## Overview

This guide helps you migrate your existing Karate tests to the Hop Framework. While Karate is primarily focused on API testing, Hop provides a more comprehensive BDD solution with additional features.

## Key Differences

### 1. Project Structure

**Karate:**
```java
// karate-config.js
function fn() {
  var config = {
    baseUrl: 'https://api.example.com',
    token: karate.callSingle('classpath:auth/login.feature', config)
  };
  return config;
}
```

**Hop Framework:**
```typescript
// hop.config.ts
import { defineConfig } from 'hop-framework';

export default defineConfig({
  baseUrl: 'https://api.example.com',
  auth: {
    token: '${env.TOKEN}'
  },
  features: 'features/**/*.feature',
  steps: 'steps/**/*.ts'
});
```

### 2. API Testing Syntax

**Karate:**
```gherkin
Feature: User API

  Background:
    * url 'https://api.example.com'
    * header Authorization = 'Bearer token123'

  Scenario: Get user
    Given path '/users/1'
    When method GET
    Then status 200
    And match response == { id: 1, name: 'John' }
```

**Hop Framework:**
```gherkin
Feature: User API

  Background:
    Given url 'https://api.example.com'
    And header Authorization = 'Bearer token123'

  Scenario: Get user
    Given path '/users/1'
    When method GET
    Then status 200
    And match response == { id: 1, name: 'John' }
```

### 3. Variable Definition

**Karate:**
```gherkin
* def userId = 1
* def requestBody = { name: 'John', email: 'john@example.com' }
```

**Hop Framework:**
```gherkin
Given def userId = 1
And def requestBody = { name: 'John', email: 'john@example.com' }
```

### 4. JSON Manipulation

**Karate:**
```gherkin
* def users = [{name: 'John'}, {name: 'Jane'}]
* def names = karate.map(users, x => x.name)
* def filtered = karate.filter(users, x => x.name == 'John')
```

**Hop Framework:**
```gherkin
Given def users = [{name: 'John'}, {name: 'Jane'}]
And def names = users.map(x => x.name)
And def filtered = users.filter(x => x.name == 'John')
```

### 5. Conditional Logic

**Karate:**
```gherkin
* if (userId == 1) karate.set('response.status', 'admin')
* def role = response.isActive == true ? 'active' : 'inactive'
```

**Hop Framework:**
```gherkin
Given def role = if (userId == 1) 'admin' else 'user'
```

### 6. Loops

**Karate:**
```gherkin
* def users = [{name: 'John'}, {name: 'Jane'}]
* def fun = function(x) { return { name: x.name.toUpperCase() } }
* def transformed = karate.map(users, fun)
```

**Hop Framework:**
```gherkin
Given def users = [{name: 'John'}, {name: 'Jane'}]
And repeat for each user in users
```

### 7. Calling Other Features

**Karate:**
```gherkin
* def auth = call read('classpath:auth/login.feature')
```

**Hop Framework:**
```gherkin
Given call login.feature
And call setup.feature background
```

### 8. Data Tables

**Karate:**
```gherkin
Scenario Outline: Create multiple users
  Given path '/users'
  And request { name: '#(name)', email: '#(email)' }
  When method POST
  Then status 201

  Examples:
    | name | email |
    | John | john@test.com |
    | Jane | jane@test.com |
```

**Hop Framework:**
```gherkin
Scenario Outline: Create multiple users
  Given path '/users'
  And request { name: '<name>', email: '<email>' }
  When method POST
  Then status 201

  Examples:
    | name | email |
    | John | john@test.com |
    | Jane | jane@test.com |
```

### 9. Response Matching

**Karate:**
```gherkin
* match response.id == 1
* match response.name == '#string'
* match response.age == '#number'
* match response.email == '##string'
* match response == { id: 1, name: 'John' }
```

**Hop Framework:**
```gherkin
And match response.id == 1
And match response.name == '#string'
And match response.age == '#number'
And match response.email == '##string'
And match response == { id: 1, name: 'John' }
```

### 10. Schema Validation

**Karate:**
```gherkin
* def schema = { id: '#number', name: '#string' }
* match response == schema
```

**Hop Framework:**
```gherkin
And match response == schema
And match response contains required { id, name }
```

## Migration Steps

### Step 1: Install Hop Framework

```bash
npm install hop-framework
# or
bun add hop-framework
```

### Step 2: Create Configuration

Create `hop.config.ts`:

```typescript
import { defineConfig } from 'hop-framework';

export default defineConfig({
  features: 'features/**/*.feature',
  steps: 'steps/**/*.ts',
  baseUrl: process.env.BASE_URL || 'https://api.example.com',
  reporters: ['console', 'html', 'json']
});
```

### Step 3: Convert Feature Files

1. Copy `.feature` files to Hop's features directory
2. Update Background syntax if needed
3. Test basic execution

### Step 4: Add Custom Steps (if needed)

Create `steps/api-steps.ts` for custom API operations:

```typescript
import { Given, When, Then } from 'hop-framework';

Given('I set custom header {string} to {string}', async ({ request }, name: string, value: string) => {
  request.headers[name] = value;
});
```

### Step 5: Convert JavaScript Functions

**Karate:**
```javascript
function fn() {
  return {
    randomString: function() {
      return java.util.UUID.randomUUID().toString();
    }
  };
}
```

**Hop Framework:**
```typescript
// utils/helpers.ts
export function randomString(): string {
  return crypto.randomUUID();
}
```

### Step 6: Run Tests

```bash
# Run all tests
hop test

# Run specific feature
hop test features/api/users.feature

# Generate report
hop report
```

## Feature Comparison

| Feature | Karate | Hop Framework |
|----------|--------|---------------|
| API Testing | ✅ | ✅ |
| UI Testing | ❌ | ✅ |
| Database Testing | ❌ | ✅ |
| Gherkin Syntax | ✅ | ✅ |
| TypeScript Support | ❌ | ✅ |
| Parallel Execution | ✅ | ✅ |
| Visual Regression | ❌ | ✅ |
| Contract Testing | ✅ | ✅ |
| Load Testing | ✅ | ✅ |
| Mock Server | ❌ | ✅ |
| Built-in Reporting | ⚠️ Basic | ✅ Advanced |

## Common Issues

### Issue 1: Java API Not Available

Karate has direct Java interop. In Hop, use JavaScript/TypeScript equivalents:

**Karate:**
```gherkin
* def date = new java.util.Date()
* def formatted = new java.text.SimpleDateFormat('yyyy-MM-dd').format(date)
```

**Hop Framework:**
```gherkin
Given def date = new Date()
And def formatted = date.toISOString().split('T')[0]
```

### Issue 2: Karate's `call` vs Hop's `call`

**Karate:**
```gherkin
* def result = call read('feature.feature') { param: 'value' }
```

**Hop Framework:**
```gherkin
Given call feature.feature with { param: 'value' }
And def result = response
```

### Issue 3: XML Support

**Karate:**
```gherkin
* def xml = <user><name>John</name></user>
* def name = /user/name/text()
```

**Hop Framework:**
```gherkin
Given def xml = '<user><name>John</name></user>'
And def name = xml.name
```

### Issue 4: `match` vs `assert`

**Karate:**
```gherkin
* assert response.status == 200
```

**Hop Framework:**
```gherkin
Then assert response.status == 200
# or
And match response.status == 200
```

## Support

For issues and questions, please visit:
- GitHub: https://github.com/hop-framework/hop
- Discord: https://discord.gg/hop-framework
