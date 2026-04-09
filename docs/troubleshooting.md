# Troubleshooting Guide

[← Back to Main README](../README.md) | [Getting Started](./getting-started.md)

Common issues and how to fix them.

---

## Browser Issues

### Browser not launching

```typescript
// Check if browser is installed
npx playwright install chromium

// Or try with headless: false to see what's happening
await hop.launch({ headless: false });
```

### Page not initializing

```typescript
// Error: "Page not initialized"
// Make sure to call launch() first
await hop.launch();
await hop.visit('https://example.com');

// Or use createHop() with auto-launch
const test = createHop({ autoLaunch: true });
```

---

## Element Issues

### Element not found

```typescript
// Try waiting for element
await hop.get('#element').waitFor();

// Or use force: true for hidden elements
await hop.get('#hidden-btn').click({ force: true });

// Or try different selector
await hop.getByTestId('my-button').click();
```

### Multiple elements found

```typescript
// Use first() or nth() or filter
await hop.get('.items').first().click();
await hop.get('.items').nth(2).click();
await hop.get('.items').filter({ hasText: 'Active' }).click();
```

### Stale element reference

```typescript
// Re-query the element
await hop.get('#dynamic').should('be.visible');
const text = await hop.get('#dynamic').getText();  // Re-get
```

---

## Timeout Issues

### Test timeout

```typescript
// Increase global timeout
setConfig({ timeout: 60000 });

// Or per-action timeout
await hop.get('#element').click({ timeout: 30000 });
```

### Wait timeout

```typescript
// Increase wait timeout
await hop.waitForLoadState('networkidle', { timeout: 30000 });
await hop.get('#element').waitFor({ timeout: 30000 });
```

---

## Network Issues

### Intercept not working

```typescript
// Make sure intercept is called before navigation
await hop.intercept('**/api/**', { status: 200, body: {} });
await hop.visit('https://example.com');  // After intercept

// Check URL pattern
await hop.intercept('https://api.example.com/**', { ... });
```

### waitForRequest/Response timeout

```typescript
// Increase timeout
await hop.waitForResponse('**/api/slow', 30000);

// Or check if request is being made
const request = await hop.waitForRequest('**/api/**').catch(() => null);
if (!request) {
  console.log('Request never made');
}
```

---

## Assertion Issues

### expect not working

```typescript
// Make sure you're importing expect correctly
import { expect, hop } from 'hop';

// Use hop.get() to get locator
await expect(hop.get('#element')).toBeVisible();

// For value assertions, pass the value directly
expect(1 + 1).toBe(2);
```

### should() vs expect()

```typescript
// should() - waits for condition
await hop.get('#loading').should('be.hidden');

// expect() - asserts immediately with retry
await expect(hop.get('#title')).toHaveText('Hello');
```

---

## Configuration Issues

### Config not loading

```typescript
// Make sure config file is named correctly
// hop.config.ts or hop.config.js

// Check config location
export default {
  // Must be in project root or specify path
  features: './tests/features',
  steps: './steps'
};
```

### Auto-await not working

```typescript
// Make sure autoAwait is enabled in config
// hop.config.ts
export default {
  autoAwait: true
};
```

---

## Common Error Messages

### "Page not initialized"

```typescript
// Solution: Call hop.launch() first
await hop.launch();
```

### "Element not found"

```typescript
// Solution: Wait for element or use different locator
await hop.get('#element').waitFor();
await hop.getByRole('button', { name: 'Submit' }).click();
```

### "Timeout exceeded"

```typescript
// Solution: Increase timeout or check element exists
await hop.get('#slow').waitFor({ timeout: 30000 });
```

---

## Getting Help

1. Check the [API Reference](./hop-api.md)
2. Review [Getting Started](./getting-started.md)
3. Run with verbose mode: `hop test --verbose`
4. Check browser console: `hop.onConsole(msg => console.log(msg))`

---

## See Also

- [Hop API Reference](./hop-api.md)
- [Getting Started](./getting-started.md)
- [Best Practices](./best-practices.md)