# Assertions Guide

[← Back to Main README](../README.md) | [Getting Started](./getting-started.md)

Hop provides two ways to make assertions: `should()` on locators and `expect()` function.

---

## Using should() Method

The `should()` method is available on every locator and waits for the condition.

```typescript
const element = hop.get('#element');

// State assertions
await element.should('be.visible')
await element.should('be.hidden')
await element.should('be.enabled')
await element.should('be.disabled')
await element.should('be.checked')
await element.should('exist')

// With custom timeout
await element.should('be.visible', 10000) // 10 seconds
```

---

## Using expect() Function

The `expect()` function provides more readable assertions similar to Jest/Playwright.

```typescript
import { expect } from 'hop'
```

### Element Assertions

```typescript
// Visibility
await expect(hop.get('#btn')).toBeVisible()
await expect(hop.get('#btn')).toBeHidden()

// Enabled/Disabled
await expect(hop.get('#input')).toBeEnabled()
await expect(hop.get('#input')).toBeDisabled()

// Checked
await expect(hop.get('#checkbox')).toBeChecked()
```

### Text Assertions

```typescript
// Exact text
await expect(hop.get('#title')).toHaveText('Hello World')

// Regex pattern
await expect(hop.get('#title')).toHaveText(/Hello/)

// Contains
await expect(hop.get('#desc')).toContain('partial text')
```

### Value Assertions

```typescript
await expect(hop.get('#input')).toHaveValue('test value')
await expect(hop.get('#input')).toHaveValue(/test/)
```

### Count Assertions

```typescript
await expect(hop.get('.items')).toHaveCount(5)
```

### Attribute Assertions

```typescript
await expect(hop.get('#link')).toHaveAttribute('href', 'https://example.com')
await expect(hop.get('#link')).toHaveAttribute('class', /active/)
```

### CSS Assertions

```typescript
await expect(hop.get('#el')).toHaveCSS('color', 'rgb(255, 0, 0)')
await expect(hop.get('#el')).toHaveCSS('display', 'flex')
```

---

## Value Assertions

```typescript
import { expect } from 'hop'

expect(1 + 1).toBe(2)
expect('hello').toBe('hello')
expect(true).toBe(true)

expect({ a: 1 }).toEqual({ a: 1 })
expect([1, 2, 3]).toEqual([1, 2, 3])
```

---

## Negation

Use `.not()` to negate assertions:

```typescript
await expect(hop.get('#btn')).not().toBeVisible()
await expect(hop.get('#input')).not().toHaveValue('wrong')
await expect(5).not().toBe(10)
```

---

## Timeout

All assertions have built-in retry logic. Default timeout is 5 seconds.

```typescript
// Custom timeout
await expect(hop.get('#slow')).toBeVisible(10000)
await expect(hop.get('#slow')).toHaveText('Ready', 30000)
```

---

## Best Practices

### ✅ Do

```typescript
// Use expect for clearer error messages
await expect(hop.get('#submit')).toBeVisible()

// Use should when you just need a wait
await hop.get('#loading').should('be.hidden')
```

### ❌ Don't

```typescript
// Don't mix styles
const el = hop.get('#btn')
await el.should('be.visible') // unclear if this is assertion or wait

// Use expect consistently
await expect(hop.get('#btn')).toBeVisible() // clearer
```

---

## See Also

- [Hop API Reference](./hop-api.md)
- [Locators Guide](./locators.md)
- [Getting Started](./getting-started.md)