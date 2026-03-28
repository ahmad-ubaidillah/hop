/**
 * API Testing Step Definitions
 * Steps for testing REST APIs using Hop Framework
 */

import { Given, When, Then, Before } from '../../../src/engine/step-registry';
import type { TestContext } from '../../../src/types';

Before(async function(this: TestContext) {
  // Initialize context for API testing
  this.variables = this.variables || {};
});

// =====================================================
// URL Configuration Steps
// =====================================================

Given('url {string}', function(this: TestContext, url: string) {
  this.baseUrl = url;
});

Given('path {string}', function(this: TestContext, path: string) {
  this.path = path;
});

Given('path {string} with param {string} = {string}', function(this: TestContext, path: string, _key: string, value: string) {
  this.path = path.replace(`{${_key}}`, value);
});

// =====================================================
// HTTP Method Steps
// =====================================================

When('method GET', async function(this: TestContext) {
  const response = await this.http.get(`${this.baseUrl}${this.path}`);
  this.response = response;
  this.variables.response = response;
});

When('method POST', async function(this: TestContext) {
  const response = await this.http.post(`${this.baseUrl}${this.path}`, this.requestBody);
  this.response = response;
  this.variables.response = response;
});

When('method PUT', async function(this: TestContext) {
  const response = await this.http.put(`${this.baseUrl}${this.path}`, this.requestBody);
  this.response = response;
  this.variables.response = response;
});

When('method PATCH', async function(this: TestContext) {
  const response = await this.http.patch(`${this.baseUrl}${this.path}`, this.requestBody);
  this.response = response;
  this.variables.response = response;
});

When('method DELETE', async function(this: TestContext) {
  const response = await this.http.delete(`${this.baseUrl}${this.path}`);
  this.response = response;
  this.variables.response = response;
});

// =====================================================
// Request Body Steps
// =====================================================

Given('request', function(this: TestContext, body: string) {
  try {
    this.requestBody = JSON.parse(body);
  } catch {
    this.requestBody = body;
  }
});

Given('request {string}', function(this: TestContext, body: string) {
  try {
    this.requestBody = JSON.parse(body);
  } catch {
    this.requestBody = body;
  }
});

Given('header {string} = {string}', function(this: TestContext, name: string, value: string) {
  this.headers = this.headers || {};
  this.headers[name] = value;
});

// =====================================================
// Response Validation Steps
// =====================================================

Then('status {int}', function(this: TestContext, expectedStatus: number) {
  if (this.response.status !== expectedStatus) {
    throw new Error(`Expected status ${expectedStatus} but got ${this.response.status}`);
  }
});

Then('match response == {string}', function(this: TestContext, expected: string) {
  const expectedValue = JSON.parse(expected);
  if (JSON.stringify(this.response.body) !== JSON.stringify(expectedValue)) {
    throw new Error(`Response does not match expected value`);
  }
});

Then('match response.{string} == {string}', function(this: TestContext, path: string, expected: string) {
  const value = path.split('.').reduce((obj: any, key) => obj?.[key], this.response.body);
  const expectedValue = JSON.parse(expected);
  if (value !== expectedValue) {
    throw new Error(`Expected ${path} to be ${expectedValue} but got ${value}`);
  }
});

Then('match response.{string} == {int}', function(this: TestContext, path: string, expected: number) {
  const value = path.split('.').reduce((obj: any, key) => obj?.[key], this.response.body);
  if (value !== expected) {
    throw new Error(`Expected ${path} to be ${expected} but got ${value}`);
  }
});

Then('match response.{string} != null', function(this: TestContext, path: string) {
  const value = path.split('.').reduce((obj: any, key) => obj?.[key], this.response.body);
  if (value === null || value === undefined) {
    throw new Error(`Expected ${path} to not be null`);
  }
});

Then('match response.{string} contains {string}', function(this: TestContext, path: string, expected: string) {
  const value = path.split('.').reduce((obj: any, key) => obj?.[key], this.response.body);
  if (!value || !value.includes(expected)) {
    throw new Error(`Expected ${path} to contain "${expected}"`);
  }
});

Then('match response contains {string}', function(this: TestContext, key: string) {
  if (!(key in this.response.body)) {
    throw new Error(`Expected response to contain key "${key}"`);
  }
});

Then('match response.{string} is array', function(this: TestContext, path: string) {
  const value = path.split('.').reduce((obj: any, key) => obj?.[key], this.response.body);
  if (!Array.isArray(value)) {
    throw new Error(`Expected ${path} to be an array`);
  }
});

Then('match response.{string} length == {int}', function(this: TestContext, path: string, expected: number) {
  const value = path.split('.').reduce((obj: any, key) => obj?.[key], this.response.body);
  if (value.length !== expected) {
    throw new Error(`Expected ${path} length to be ${expected} but got ${value.length}`);
  }
});

// =====================================================
// Fuzzy Type Validation Steps
// =====================================================

Then('match response.{string} == #string', function(this: TestContext, path: string) {
  const value = path.split('.').reduce((obj: any, key) => obj?.[key], this.response.body);
  if (typeof value !== 'string') {
    throw new Error(`Expected ${path} to be a string`);
  }
});

Then('match response.{string} == #number', function(this: TestContext, path: string) {
  const value = path.split('.').reduce((obj: any, key) => obj?.[key], this.response.body);
  if (typeof value !== 'number') {
    throw new Error(`Expected ${path} to be a number`);
  }
});

Then('match response.{string} == #boolean', function(this: TestContext, path: string) {
  const value = path.split('.').reduce((obj: any, key) => obj?.[key], this.response.body);
  if (typeof value !== 'boolean') {
    throw new Error(`Expected ${path} to be a boolean`);
  }
});

Then('match response.{string} == #array', function(this: TestContext, path: string) {
  const value = path.split('.').reduce((obj: any, key) => obj?.[key], this.response.body);
  if (!Array.isArray(value)) {
    throw new Error(`Expected ${path} to be an array`);
  }
});

Then('match response.{string} == #object', function(this: TestContext, path: string) {
  const value = path.split('.').reduce((obj: any, key) => obj?.[key], this.response.body);
  if (typeof value !== 'object' || Array.isArray(value) || value === null) {
    throw new Error(`Expected ${path} to be an object`);
  }
});

Then('match response.{string} == #uuid', function(this: TestContext, path: string) {
  const value = path.split('.').reduce((obj: any, key) => obj?.[key], this.response.body);
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new Error(`Expected ${path} to be a valid UUID`);
  }
});

Then('match response.{string} == #email', function(this: TestContext, path: string) {
  const value = path.split('.').reduce((obj: any, key) => obj?.[key], this.response.body);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    throw new Error(`Expected ${path} to be a valid email`);
  }
});

// =====================================================
// Response Time Validation
// =====================================================

Then('response time < {int}', function(this: TestContext, maxMs: number) {
  if (this.response.responseTime >= maxMs) {
    throw new Error(`Response time ${this.response.responseTime}ms exceeded ${maxMs}ms`);
  }
});

Then('response time < {int}ms', function(this: TestContext, maxMs: number) {
  if (this.response.responseTime >= maxMs) {
    throw new Error(`Response time ${this.response.responseTime}ms exceeded ${maxMs}ms`);
  }
});

// =====================================================
// Variable Storage Steps
// =====================================================

Then('store response.{string} as {string}', function(this: TestContext, path: string, varName: string) {
  const value = path.split('.').reduce((obj: any, key) => obj?.[key], this.response.body);
  this.variables[varName] = value;
});

Given('set {string} = {string}', function(this: TestContext, varName: string, value: string) {
  this.variables[varName] = value;
});

Given('set {string} = {int}', function(this: TestContext, varName: string, value: number) {
  this.variables[varName] = value;
});
