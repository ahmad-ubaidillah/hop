import { describe, it, expect } from 'bun:test';

describe('Hop Expect', () => {
  it('should export expect function', async () => {
    const { expect: hopExpect } = await import('../src/hop.js');
    expect(typeof hopExpect).toBe('function');
  });

  it('should create HopExpect instance', async () => {
    const { expect: hopExpect } = await import('../src/hop.js');
    const exp = hopExpect(123);
    expect(exp).toBeDefined();
  });
});