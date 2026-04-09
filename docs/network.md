# Network Guide

[← Back to Main README](../README.md) | [Getting Started](./getting-started.md)

Learn how to intercept, mock, and wait for network requests.

---

## Intercept (Mock API Responses)

### Basic Mock

```typescript
await hop.intercept('**/api/users', {
  status: 200,
  body: {
    users: [
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' }
    ]
  }
});
```

### Mock with Headers

```typescript
await hop.intercept('**/api/**', {
  status: 201,
  body: { message: 'Created' },
  headers: {
    'X-Custom-Header': 'value',
    'Content-Type': 'application/json'
  }
});
```

### Mock with Delay

```typescript
await hop.intercept('**/api/**', {
  status: 200,
  body: { data: 'delayed' }
}, 2000); // 2 second delay
```

### Mock by Method

```typescript
await hop.intercept('**/api/users', {
  status: 200,
  body: { users: [] }
}, 0, 'GET'); // Only mock GET requests
```

### Abort Request

```typescript
await hop.abortRequest('**/analytics/**', 'failed')
```

---

## Wait for Request/Response

### Wait for Request

```typescript
const request = await hop.waitForRequest('**/api/users');
console.log('URL:', request.url());
console.log('Method:', request.method());
console.log('Post Data:', request.postData());
```

### Wait for Response

```typescript
const response = await hop.waitForResponse('**/api/users');
console.log('Status:', response.status());
const json = await response.json();
console.log('Data:', json);
```

### Wait for Response and Continue

```typescript
// Wait for the response to complete, then continue with real request
await hop.waitForResponse('**/api/**');

// Now make the actual call
await hop.visit('https://example.com');
```

### Wait with Custom Timeout

```typescript
try {
  const response = await hop.waitForResponse('**/api/slow', 30000);
} catch (e) {
  console.log('Timeout waiting for response');
}
```

---

## Real Request Passthrough

When you want to capture but not mock:

```typescript
// Capture but don't modify
await hop.waitForResponse('**/api/**');

// Continue with original response
const data = await fetch('/api/data');
```

---

## Network Events

```typescript
page.on('request', request => {
  console.log('Request:', request.url());
});

page.on('response', response => {
  console.log('Response:', response.status());
});
```

---

## Use Cases

### Test Loading States

```typescript
await hop.intercept('**/api/data', { status: 200, body: {} }, 5000);

await hop.visit('/page');
await expect(hop.get('.loading')).toBeVisible();

await hop.waitForResponse('**/api/data');
await expect(hop.get('.loading')).toBeHidden();
```

### Test Error States

```typescript
await hop.intercept('**/api/**', {
  status: 500,
  body: { error: 'Internal Server Error' }
});

await hop.visit('/page');
await expect(hop.get('.error')).toContain('Internal Server Error');
```

### Test Different Responses

```typescript
test('show correct data', async () => {
  await hop.intercept('**/api/users', { status: 200, body: { users: [{ name: 'John' }] }});
  await hop.visit('/users');
  await expect(hop.get('.user-name')).toHaveText('John');
});
```

---

## See Also

- [Hop API Reference](./hop-api.md)
- [Getting Started](./getting-started.md)