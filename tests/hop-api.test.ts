import { describe, it, expect } from 'bun:test';

describe('Hop Locator', () => {
  it('should have HopLocator class', async () => {
    const { createHop } = await import('../src/hop.js');
    const hop = createHop();
    expect(hop.get).toBeDefined();
  });

  it('should have get methods', async () => {
    const { createHop } = await import('../src/hop.js');
    const hop = createHop();
    expect(typeof hop.get).toBe('function');
    expect(typeof hop.getByRole).toBe('function');
    expect(typeof hop.getByLabel).toBe('function');
    expect(typeof hop.getByPlaceholder).toBe('function');
    expect(typeof hop.getByText).toBe('function');
    expect(typeof hop.getByTestId).toBe('function');
  });

  it('should have navigation methods', async () => {
    const { createHop } = await import('../src/hop.js');
    const hop = createHop();
    expect(typeof hop.visit).toBe('function');
    expect(typeof hop.reload).toBe('function');
    expect(typeof hop.goBack).toBe('function');
    expect(typeof hop.goForward).toBe('function');
    expect(typeof hop.wait).toBe('function');
  });

  it('should have intercept methods', async () => {
    const { createHop } = await import('../src/hop.js');
    const hop = createHop();
    expect(typeof hop.intercept).toBe('function');
    expect(typeof hop.waitForRequest).toBe('function');
    expect(typeof hop.waitForResponse).toBe('function');
  });

  it('should have storage methods', async () => {
    const { createHop } = await import('../src/hop.js');
    const hop = createHop();
    expect(typeof hop.setLocalStorage).toBe('function');
    expect(typeof hop.getLocalStorage).toBe('function');
    expect(typeof hop.setCookie).toBe('function');
    expect(typeof hop.getCookie).toBe('function');
  });

  it('should have page methods', async () => {
    const { createHop } = await import('../src/hop.js');
    const hop = createHop();
    expect(typeof hop.title).toBe('function');
    expect(typeof hop.url).toBe('function');
    expect(typeof hop.screenshot).toBe('function');
    expect(typeof hop.evaluate).toBe('function');
    expect(typeof hop.setViewportSize).toBe('function');
  });
});