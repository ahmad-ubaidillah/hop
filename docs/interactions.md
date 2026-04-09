# Interactions Guide

[← Back to Main README](../README.md) | [Getting Started](./getting-started.md)

Learn how to interact with elements on the page.

---

## Click Interactions

### Basic Click

```typescript
await hop.get('#button').click()
await hop.get('#button').click({ force: true })
await hop.get('#button').click({ position: { x: 10, y: 5 } })
```

### Special Clicks

```typescript
await hop.get('#btn').dblclick()           // Double click
await hop.get('#btn').rightclick()          // Right click
await hop.get('#btn').rightClick()          // Right click (alt)
await hop.get('#btn').clickWithShift()      // Shift + click
await hop.get('#btn').clickWithControl()    // Ctrl + click
await hop.get('#btn').clickWithMeta()        // Cmd + click (Mac)
```

---

## Input Interactions

### Fill

```typescript
await hop.get('#input').fill('Hello World')
await hop.get('#input').fill('')  // Clears and fills
```

### Type (with delay)

```typescript
await hop.get('#input').type('Hello', { delay: 100 })
```

### Clear

```typescript
await hop.get('#input').clear()
```

### Fill and Submit

```typescript
await hop.get('#search').fillAndEnter('query')
```

### Select Dropdown

```typescript
await hop.get('#select').select('option-value')
await hop.get('#select').select(['value1', 'value2'])  // Multi-select
```

---

## Checkbox & Radio

```typescript
await hop.get('#checkbox').check()
await hop.get('#checkbox').uncheck()
```

---

## Keyboard Interactions

### Press Key on Element

```typescript
await hop.get('#input').press('Enter')
await hop.get('#input').press('Tab')
await hop.get('#input').press('Escape')
await hop.get('#input').pressKey('Enter')
await hop.get('#input').pressKey('ArrowDown')
```

### Focus & Blur

```typescript
await hop.get('#input').focus()
await hop.get('#input').blur()
```

---

## Text Selection

```typescript
await hop.get('#textarea').selectAll()  // Ctrl+A
await hop.get('#textarea').cut()         // Ctrl+X
await hop.get('#textarea').copy()        // Ctrl+C
await hop.get('#textarea').paste()       // Ctrl+V
```

---

## Drag & Drop

```typescript
await hop.get('#draggable').dragTo('#dropzone')
await hop.get('#draggable').dragToAndDrop('#dropzone')
```

---

## Mouse Interactions

### Hover

```typescript
await hop.get('#menu-item').hover()
```

### Scroll

```typescript
await hop.get('#element').scrollIntoView()
```

### Swipe (for touch devices)

```typescript
await hop.get('#carousel').swipe('left')
await hop.get('#carousel').swipe('right')
await hop.get('#carousel').swipe('up')
await hop.get('#carousel').swipe('down', 300)  // Custom distance
```

---

## File Upload

```typescript
await hop.get('#file-input').selectFile('path/to/file.txt')
await hop.get('#file-input').selectFile(['file1.txt', 'file2.txt'])
await hop.get('#file-input').selectFile({
  name: 'document.pdf',
  mimeType: 'application/pdf'
})
```

---

## Trigger Custom Events

```typescript
await hop.get('#element').trigger('click')
await hop.get('#element').trigger('custom-event')
await hop.get('#element').trigger('custom-event', { detail: { data: 'value' } })
```

---

## API Summary

| Category | Methods |
|----------|---------|
| Click | `click`, `dblclick`, `rightclick`, `rightClick`, `clickWithShift`, `clickWithControl`, `clickWithMeta` |
| Input | `fill`, `type`, `clear`, `fillAndEnter`, `select` |
| Check | `check`, `uncheck` |
| Keyboard | `press`, `pressKey`, `focus`, `blur` |
| Text | `selectAll`, `cut`, `copy`, `paste` |
| Drag | `dragTo`, `dragToAndDrop` |
| Mouse | `hover`, `scrollIntoView`, `swipe` |
| File | `selectFile` |
| Events | `trigger` |

---

## See Also

- [Hop API Reference](./hop-api.md)
- [Locators](./locators.md)
- [Getting Started](./getting-started.md)