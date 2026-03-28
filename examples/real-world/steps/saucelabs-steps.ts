/**
 * Step Definitions for Real-World Testing Examples
 * 
 * This file contains step definitions for:
 * - Sauce Labs demo UI testing
 * - JSONPlaceholder API testing
 * - ReqRes API testing
 * - Performance testing
 */

import { Given, When, Then, Before, After } from '../../src/engine/step-registry';

// ============================================
// Sauce Labs Demo - UI Testing Steps
// ============================================

Before({ tags: '@ui' }, async function() {
  // Setup browser for UI tests
  this.browser = await this.createBrowser();
});

After({ tags: '@ui' }, async function() {
  // Cleanup browser after UI tests
  if (this.browser) {
    await this.browser.close();
  }
});

Given('I open browser to {string}', async function(url: string) {
  await this.browser.goto(url);
});

Given('I maximize the window', async function() {
  await this.browser.setViewportSize({ width: 1280, height: 720 });
});

Given('I set viewport size to {int}x{int}', async function(width: number, height: number) {
  await this.browser.setViewportSize({ width, height });
});

Given('I am on the login page', async function() {
  await this.browser.waitForSelector('#login-button', { timeout: 5000 });
});

Given('I login as {string}', async function(username: string) {
  const passwords: Record<string, string> = {
    'standard_user': 'secret_sauce',
    'problem_user': 'secret_sauce',
    'performance_glitch_user': 'secret_sauce',
    'locked_out_user': 'secret_sauce',
  };
  
  await this.browser.fill('#user-name', username);
  await this.browser.fill('#password', passwords[username] || 'secret_sauce');
  await this.browser.click('#login-button');
  await this.browser.waitForSelector('.inventory_list', { timeout: 5000 });
});

When('I enter {string} in {string}', async function(value: string, selector: string) {
  await this.browser.fill(selector, value);
});

When('I click {string}', async function(selector: string) {
  await this.browser.click(selector);
});

Then('I should see {string}', async function(selector: string) {
  await this.browser.waitForSelector(selector, { visible: true, timeout: 5000 });
});

Then('the URL should contain {string}', async function(text: string) {
  const url = this.browser.url();
  if (!url.includes(text)) {
    throw new Error(`Expected URL to contain "${text}", but got "${url}"`);
  }
});

Then('the element {string} should be visible', async function(selector: string) {
  const visible = await this.browser.isVisible(selector);
  if (!visible) {
    throw new Error(`Element "${selector}" is not visible`);
  }
});

Then('the element {string} should contain {string}', async function(selector: string, text: string) {
  const content = await this.browser.textContent(selector);
  if (!content.includes(text)) {
    throw new Error(`Element "${selector}" does not contain "${text}". Got: "${content}"`);
  }
});

Then('the input {string} should have type {string}', async function(selector: string, expectedType: string) {
  const type = await this.browser.getAttribute(selector, 'type');
  if (type !== expectedType) {
    throw new Error(`Expected input type "${expectedType}", got "${type}"`);
  }
});

// Cart steps
When('I add {string} to cart', async function(productName: string) {
  const normalizedName = productName.toLowerCase().replace(/\s+/g, '-');
  const addToCartBtn = `button[id*="add-to-cart"][data-test*="${normalizedName}"]`;
  await this.browser.click(addToCartBtn);
});

When('I go to cart', async function() {
  await this.browser.click('.shopping_cart_link');
  await this.browser.waitForSelector('.cart_list', { timeout: 5000 });
});

When('I proceed to checkout', async function() {
  await this.browser.click('#checkout');
  await this.browser.waitForSelector('.checkout_info', { timeout: 5000 });
});

When('I fill checkout information:', async function(dataTable: any) {
  const rows = dataTable.rows();
  for (const row of rows) {
    const [field, value] = row;
    await this.browser.fill(`#${field}`, value);
  }
});

When('I continue checkout', async function() {
  await this.browser.click('#continue');
  await this.browser.waitForSelector('.checkout_summary_container', { timeout: 5000 });
});

When('I finish checkout', async function() {
  await this.browser.click('#finish');
  await this.browser.waitForSelector('.checkout_complete_container', { timeout: 5000 });
});

Then('I should see checkout complete message', async function() {
  await this.browser.waitForSelector('.complete-header', { timeout: 5000 });
});

Then('the order should be confirmed', async function() {
  const header = await this.browser.textContent('.complete-header');
  if (!header.includes('THANK YOU')) {
    throw new Error('Order was not confirmed');
  }
});

Then('I should see {string}', async function(text: string) {
  const body = await this.browser.textContent('body');
  if (!body.includes(text)) {
    throw new Error(`Page does not contain text "${text}"`);
  }
});

Then('the cart badge should show {string}', async function(count: string) {
  const badge = await this.browser.textContent('.shopping_cart_badge');
  if (badge !== count) {
    throw new Error(`Expected cart badge to show "${count}", got "${badge}"`);
  }
});

// ============================================
// API Testing Steps
// ============================================

Given('url {string}', function(baseUrl: string) {
  this.baseUrl = baseUrl;
});

Given('path {string}', function(path: string) {
  this.path = path;
});

Given('header {string} = {string}', function(name: string, value: string) {
  this.headers = this.headers || {};
  this.headers[name] = value;
});

Given('param {string} = {}', function(name: string, value: any) {
  this.queryParams = this.queryParams || {};
  this.queryParams[name] = value;
});

Given('request', function(body: string) {
  this.requestBody = JSON.parse(body);
});

When('method GET', async function() {
  const response = await this.http.get(this.baseUrl + this.path, {
    headers: this.headers,
    params: this.queryParams,
  });
  this.response = response;
});

When('method POST', async function() {
  const response = await this.http.post(this.baseUrl + this.path, this.requestBody, {
    headers: this.headers,
  });
  this.response = response;
});

When('method PUT', async function() {
  const response = await this.http.put(this.baseUrl + this.path, this.requestBody, {
    headers: this.headers,
  });
  this.response = response;
});

When('method PATCH', async function() {
  const response = await this.http.patch(this.baseUrl + this.path, this.requestBody, {
    headers: this.headers,
  });
  this.response = response;
});

When('method DELETE', async function() {
  const response = await this.http.delete(this.baseUrl + this.path, {
    headers: this.headers,
  });
  this.response = response;
});

Then('status {int}', function(expectedStatus: number) {
  if (this.response.status !== expectedStatus) {
    throw new Error(`Expected status ${expectedStatus}, got ${this.response.status}`);
  }
});

Then('match response == {string}', function(expected: string) {
  const value = expected === '#array' ? Array.isArray(this.response.data) :
                expected === '#object' ? typeof this.response.data === 'object' :
                expected === '#string' ? typeof this.response.data === 'string' :
                expected === '#number' ? typeof this.response.data === 'number' :
                expected === '#boolean' ? typeof this.response.data === 'boolean' :
                this.response.data === JSON.parse(expected);
  
  if (!value) {
    throw new Error(`Response does not match expected type/value: ${expected}`);
  }
});

Then('match response contains {string}', function(key: string) {
  if (!(key in this.response.data)) {
    throw new Error(`Response does not contain key "${key}"`);
  }
});

Then('match response.{string} == {}', function(path: string, expected: any) {
  const value = path.split('.').reduce((obj, key) => obj?.[key], this.response.data);
  if (value !== expected) {
    throw new Error(`Expected response.${path} to be ${expected}, got ${value}`);
  }
});

Then('match each response[*].{string} == {string}', function(key: string, expected: string) {
  for (const item of this.response.data) {
    const actualValue = item[key];
    const expectedValue = expected === '#string' ? typeof actualValue === 'string' :
                          expected === '#number' ? typeof actualValue === 'number' :
                          expected === '#boolean' ? typeof actualValue === 'boolean' :
                          actualValue === expected;
    
    if (!expectedValue) {
      throw new Error(`Expected response[*].${key} to be ${expected}, got ${actualValue}`);
    }
  }
});

Then('response time < {int}ms', function(maxTime: number) {
  if (this.response.duration >= maxTime) {
    throw new Error(`Response time ${this.response.duration}ms exceeded ${maxTime}ms`);
  }
});

// ============================================
// Performance Testing Steps
// ============================================

Then('response time > {int}ms', function(minTime: number) {
  if (this.response.duration <= minTime) {
    throw new Error(`Response time ${this.response.duration}ms was not greater than ${minTime}ms`);
  }
});

Then('match response.length == {int}', function(expectedLength: number) {
  if (this.response.data.length !== expectedLength) {
    throw new Error(`Expected response length ${expectedLength}, got ${this.response.data.length}`);
  }
});
