import { describe, it, expect } from 'bun:test';

describe('Step Definitions', () => {
  it('should export defineStep functions', async () => {
    const { defineStep, defineGiven, defineWhen, defineThen, getStepRegistry, clearStepDefinitions } = await import('../src/define-step.js');
    expect(typeof defineStep).toBe('function');
    expect(typeof defineGiven).toBe('function');
    expect(typeof defineWhen).toBe('function');
    expect(typeof defineThen).toBe('function');
    expect(typeof getStepRegistry).toBe('function');
    expect(typeof clearStepDefinitions).toBe('function');
  });

  it('should define and retrieve steps', async () => {
    const { defineStep, getStepRegistry, clearStepDefinitions } = await import('../src/define-step.js');
    
    clearStepDefinitions();
    
    defineStep('I say {string}', async (text) => {
      console.log(text);
    });
    
    const registry = getStepRegistry();
    expect(registry).toBeDefined();
    // Registry should have find method
    expect(typeof registry.find).toBe('function');
  });
});