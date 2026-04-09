import { describe, it, expect } from 'bun:test';

describe('Hop Framework', () => {
  it('should export hop', async () => {
    const { hop, setConfig, getConfig } = await import('../src/hop.js');
    expect(hop).toBeDefined();
    expect(typeof setConfig).toBe('function');
    expect(typeof getConfig).toBe('function');
  });

  it('should have autoAwait config', async () => {
    const { setConfig, getConfig } = await import('../src/hop.js');
    setConfig({ autoAwait: true });
    expect(getConfig().autoAwait).toBe(true);
  });

  it('should have hooks', async () => {
    const { before, after, beforeEach, afterEach } = await import('../src/hop.js');
    expect(typeof before).toBe('function');
    expect(typeof after).toBe('function');
    expect(typeof beforeEach).toBe('function');
    expect(typeof afterEach).toBe('function');
  });

  it('should have test functions', async () => {
    const { describe, it, test, expect: exp } = await import('../src/hop.js');
    expect(typeof describe).toBe('function');
    expect(typeof it).toBe('function');
    expect(typeof test).toBe('function');
    expect(typeof exp).toBe('function');
  });

  it('should have HopConfig interface', async () => {
    const { HopConfig } = await import('../src/hop.js');
    const config: HopConfig = { browser: 'chromium', headless: true, autoAwait: false };
    expect(config.browser).toBe('chromium');
  });
});