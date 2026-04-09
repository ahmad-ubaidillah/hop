# Custom Steps Guide

[← Back to Main README](../README.md) | [Getting Started](./getting-started.md)

Define your own step definitions to use in Gherkin scenarios.

---

## Basic Syntax

```typescript
import { defineStep, defineGiven, defineWhen, defineThen } from 'hop';
```

### defineGiven - Setup steps

```typescript
defineGiven('I am on the homepage', async () => {
  await hop.visit('https://example.com');
});
```

### defineWhen - Action steps

```typescript
defineWhen('I login with {string}', async (username: string) => {
  await hop.get('#username').fill(username);
  await hop.get('#password').fill('secret');
  await hop.get('#login').click();
});
```

### defineThen - Verification steps

```typescript
defineThen('I should see my profile', async () => {
  await expect(hop.get('#profile')).toBeVisible();
});
```

### defineStep - Generic step

```typescript
defineStep('I wait for {int} seconds', async (seconds: number) => {
  await hop.wait(seconds * 1000);
});
```

---

## Using Parameters

### String Parameters

```typescript
defineWhen('I fill {string} with {string}', async (field: string, value: string) => {
  await hop.get(field).fill(value);
});

// Usage in Gherkin:
// When I fill "#email" with "test@example.com"
```

### Integer Parameters

```typescript
defineThen('I should see {int} items', async (count: number) => {
  await expect(hop.get('.item')).toHaveCount(count);
});

// Usage:
// Then I should see 5 items
```

### Regular Expressions

```typescript
defineThen(/the page title should contain "(.+)"/, async (title: string) => {
  const pageTitle = await hop.title();
  if (!pageTitle.includes(title)) {
    throw new Error(`Expected title to contain "${title}"`);
  }
});
```

---

## Data Table Support

```typescript
defineWhen('I fill in the following:', async (table: any) => {
  for (const row of table) {
    await hop.get(row.field).fill(row.value);
  }
});

// Usage:
// When I fill in the following:
//   | field    | value       |
//   | #email   | test@test.com |
//   | #name    | John        |
```

---

## Reusing Step Definitions

### In test file

```typescript
// tests/my-test.spec.ts
import { hop, defineStep } from 'hop';
import './steps/common-steps';

defineStep('I am logged in', async () => {
  await hop.visit('/login');
  await hop.get('#username').fill('admin');
  await hop.get('#password').fill('secret');
  await hop.get('#login').click();
});
```

### In steps directory

Create `steps/common-steps.ts`:

```typescript
import { defineGiven, defineWhen, defineThen } from 'hop';

defineGiven('the page is loaded', async () => {
  await hop.waitForLoadState('domcontentloaded');
});

defineWhen('I fill {string} with {string}', async (selector: string, value: string) => {
  await hop.get(selector).fill(value);
});

defineThen('I should see {string} in the list', async (text: string) => {
  await expect(hop.get(`.item:has-text("${text}")`)).toBeVisible();
});
```

---

## Configuration

In `hop.config.ts`:

```typescript
export default {
  stepsDir: './steps'
};
```

---

## Best Practices

### ✅ Do

```typescript
// Use descriptive names
defineGiven('I am logged in as {string}', async (role) => { ... });

// Keep steps focused
defineGiven('I am on the login page', async () => { ... });
defineWhen('I enter credentials', async () => { ... });

// Use semantic locators
defineWhen('I click the submit button', async () => {
  await hop.getByRole('button', { name: 'Submit' }).click();
});
```

### ❌ Don't

```typescript
// Don't repeat complex logic
defineWhen('I do everything', async () => { /* 100 lines */ });

// Don't use brittle selectors
defineGiven('I am on the page', async () => {
  await hop.visit('/page-123'); // brittle!
});
```

---

## See Also

- [Hop API Reference](./hop-api.md)
- [Getting Started](./getting-started.md)
- [Gherkin Guide](./gherkin.md)