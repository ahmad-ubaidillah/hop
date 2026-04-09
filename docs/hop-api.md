# Hop API Reference

[← Back to Main README](../README.md) | [Getting Started](./getting-started.md)

This document covers all available methods in the `hop` object.

---

## Core Methods

### Browser Control

| Method | Description | Example |
|--------|-------------|---------|
| `hop.launch()` | Launch browser | `await hop.launch()` |
| `hop.close()` | Close browser | `await hop.close()` |
| `hop.newPage()` | Create new page | `await hop.newPage()` |

### Navigation

| Method | Description | Example |
|--------|-------------|---------|
| `hop.visit(url)` | Navigate to URL | `await hop.visit('https://example.com')` |
| `hop.reload()` | Reload page | `await hop.reload()` |
| `hop.goBack()` | Go back in history | `await hop.goBack()` |
| `hop.goForward()` | Go forward | `await hop.goForward()` |

### Page Info

| Method | Description | Example |
|--------|-------------|---------|
| `hop.title()` | Get page title | `const title = await hop.title()` |
| `hop.url()` | Get current URL | `const url = hop.url()` |

### Waits

| Method | Description | Example |
|--------|-------------|---------|
| `hop.wait(ms)` | Wait milliseconds | `await hop.wait(1000)` |
| `hop.waitForLoadState(state)` | Wait for load state | `await hop.waitForLoadState('networkidle')` |
| `hop.waitForURL(url)` | Wait for URL | `await hop.waitForURL('/dashboard')` |

---

## Locators

### Finding Elements

```typescript
// CSS Selector
hop.get('#button')
hop.get('.menu-item')
hop.get('div.container')

// jQuery-style
hop.$('#button')           // First element
hop.$$('.items')           // All elements

// Semantic Locators
hop.getByRole('button', { name: 'Submit' })
hop.getByLabel('Email')
hop.getByPlaceholder('Enter email')
hop.getByText('Click here')
hop.getByTestId('submit-btn')
hop.getByAltText('image description')
hop.getByTitle('Modal Title')

// Evaluate
hop.$eval('#el', el => el.textContent)
hop.$$eval('.items', els => els.map(e => e.textContent))

// Element Chains
hop.first('.item')
hop.last('.item')
hop.nth('.item', 2)
hop.filter('.item', { hasText: 'active' })
```

---

## Interactions

### Click

```typescript
await hop.get('#btn').click()
await hop.get('#btn').click({ force: true })
await hop.get('#btn').click({ position: { x: 10, y: 5 } })
await hop.get('#btn').dblclick()
await hop.get('#btn').rightclick()
await hop.get('#btn').rightClick()
await hop.get('#btn').clickWithShift()
await hop.get('#btn').clickWithControl()
await hop.get('#btn').clickWithMeta()
```

### Input

```typescript
await hop.get('#input').fill('text')
await hop.get('#input').type('text', { delay: 50 })
await hop.get('#input').clear()
await hop.get('#input').fillAndEnter('query')
await hop.get('#select').select('value')
await hop.get('#select').select(['val1', 'val2'])
```

### Checkbox/Radio

```typescript
await hop.get('#checkbox').check()
await hop.get('#checkbox').uncheck()
```

### Keyboard

```typescript
await hop.get('#input').press('Enter')
await hop.get('#input').press('Tab')
await hop.get('#input').pressKey('Enter')
await hop.get('#input').focus()
await hop.get('#input').blur()
```

### Text Selection

```typescript
await hop.get('#text').selectAll()
await hop.get('#text').cut()
await hop.get('#text').copy()
await hop.get('#text').paste()
```

### Drag & Drop

```typescript
await hop.get('#draggable').dragTo('#dropzone')
await hop.get('#draggable').dragToAndDrop('#dropzone')
```

### Mouse

```typescript
await hop.get('#el').hover()
await hop.get('#el').scrollIntoView()
await hop.get('#carousel').swipe('left')
await hop.get('#carousel').swipe('right', 300)
```

### File Upload

```typescript
await hop.get('#file').selectFile('path/to/file.txt')
await hop.get('#file').selectFile(['file1.txt', 'file2.txt'])
```

### Custom Events

```typescript
await hop.get('#el').trigger('click')
await hop.get('#el').trigger('custom-event', { detail: { data: 'value' } })
```

---

## Get Element Data

```typescript
const text = await hop.get('#el').getText()
const html = await hop.get('#el').getInnerHTML()
const value = await hop.get('#input').getValue()
const href = await hop.get('#link').getAttribute('href')
const count = await hop.get('.items').count()
```

---

## Check Element State

```typescript
const visible = await hop.get('#el').isVisible()
const hidden = await hop.get('#el').isHidden()
const enabled = await hop.get('#el').isEnabled()
const disabled = await hop.get('#el').isDisabled()
const checked = await hop.get('#el').isChecked()
```

---

## Assertions

### Using should()

```typescript
await hop.get('#el').should('be.visible')
await hop.get('#el').should('be.hidden')
await hop.get('#el').should('be.enabled')
await hop.get('#el').should('be.disabled')
await hop.get('#el').should('be.checked')
await hop.get('#el').should('exist')
```

### Using expect()

```typescript
import { expect } from 'hop'

await expect(hop.get('#btn')).toBeVisible()
await expect(hop.get('#title')).toHaveText('Hello')
await expect(hop.get('.items')).toHaveCount(5)
await expect(hop.get('#input')).toHaveValue('test')
await expect(hop.get('#link')).toHaveAttribute('href', 'https://...')
await expect(hop.get('#el')).toHaveCSS('color', 'rgb(255,0,0)')

expect(1 + 1).toBe(2)
expect({a:1}).toEqual({a:1})
```

---

## Network

### Intercept

```typescript
await hop.intercept('**/api/**', {
  status: 200,
  body: { message: 'Mocked!' }
})
```

### Wait

```typescript
const request = await hop.waitForRequest('**/api/users')
const response = await hop.waitForResponse('**/api/users')
```

---

## Storage

### LocalStorage

```typescript
await hop.setLocalStorage('key', 'value')
const value = await hop.getLocalStorage('key')
await hop.clearLocalStorage()
```

### Cookies

```typescript
await hop.setCookie('session', 'abc123', { path: '/' })
const cookie = await hop.getCookie('session')
await hop.clearCookies()
```

---

## Page Operations

```typescript
await hop.screenshot()
await hop.screenshot({ path: 'screenshot.png', fullPage: true })
await hop.evaluate(() => document.title)
await hop.setViewportSize(1920, 1080)
await hop.addScriptTag('window.custom = true')
await hop.addStyleTag('body { background: red }')
```

---

## See Also

- [Getting Started](./getting-started.md)
- [Assertions](./assertions.md)
- [Locators](./locators.md)
- [Interactions](./interactions.md)
- [Network](./network.md)