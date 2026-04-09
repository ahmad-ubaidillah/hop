# Locators Guide

[← Back to Main README](../README.md) | [Getting Started](./getting-started.md)

Locators are used to find elements on the page. Hop provides multiple ways to locate elements.

---

## CSS Selectors

The simplest way to find elements:

```typescript
hop.get('#button')           // ID
hop.get('.menu-item')        // Class
hop.get('div.container')     // Tag + Class
hop.get('input[type="text"]') // Attribute
hop.get('ul > li')           // Child
hop.get('div:not(.hidden)')  // Not selector
```

---

## jQuery-Style Shortcuts

```typescript
hop.$('#button')     // First element matching selector
hop.$$('.items')     // Array of all matching elements
```

---

## Semantic Locators

Best for accessibility and maintainability:

### getByRole

```typescript
hop.getByRole('button', { name: 'Submit' })
hop.getByRole('checkbox', { checked: true })
hop.getByRole('textbox', { name: 'Email' })
hop.getByRole('heading', { level: 1 })
hop.getByRole('link', { href: '/about' })
```

### getByLabel

```typescript
hop.getByLabel('Email')
hop.getByLabel('Password', { exact: true })
hop.getByLabel(/Confirm/i)
```

### getByPlaceholder

```typescript
hop.getByPlaceholder('Enter your email')
hop.getByPlaceholder(/email/i)
```

### getByText

```typescript
hop.getByText('Click here')
hop.getByText(/Continue/)
```

### getByTestId

```typescript
hop.getByTestId('submit-button')
```

### getByAltText

```typescript
hop.getByAltText('Profile picture')
hop.getByAltText(/logo/i)
```

### getByTitle

```typescript
hop.getByTitle('Close modal')
```

---

## Evaluation Helpers

### $eval - Evaluate on first element

```typescript
const text = await hop.$eval('#el', el => el.textContent)
const value = await hop.$eval('input', el => el.value)
```

### $$eval - Evaluate on all elements

```typescript
const texts = await hop.$$eval('.items', els => els.map(e => e.textContent))
const values = await hop.$$eval('input', inputs => inputs.map(i => i.value))
```

---

## Element Chains

### first, last, nth

```typescript
hop.first('.item')      // First matching element
hop.last('.item')       // Last matching element
hop.nth('.item', 2)     // 3rd element (0-indexed)

// Also available on locator
hop.get('.item').first()
hop.get('.item').last()
hop.get('.item').nth(0)
```

### filter

```typescript
hop.filter('.item', { hasText: 'active' })
hop.get('.list').filter({ has: hop.get('.selected') })
```

---

## Finding in Locator

You can chain locators:

```typescript
hop.get('.container').get('.button')
hop.get('form').getByLabel('Email')
hop.get('table').locator('tr:nth-child(2)')
```

---

## Best Practices

### ✅ Use Semantic Locators

```typescript
// Good - accessible and stable
hop.getByLabel('Email')
hop.getByRole('button', { name: 'Submit' })
hop.getByTestId('submit-btn')
```

### ❌ Avoid Brittle Selectors

```typescript
// Bad - breaks easily
hop.get('div:nth-child(2) > .content > #btn-123')

// Better
hop.getByTestId('submit-button')
```

---

## Debugging Locators

```typescript
// Debug output
hop.get('#el').debug()

// Check if element exists
const exists = await hop.get('#el').isVisible()

// Get element info
const text = await hop.get('#el').getText()
const href = await hop.get('#el').getAttribute('href')
```

---

## See Also

- [Hop API Reference](./hop-api.md)
- [Assertions](./assertions.md)
- [Getting Started](./getting-started.md)