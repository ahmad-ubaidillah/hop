import { defineStep, defineGiven, defineWhen, defineThen } from 'hop';
defineGiven('the page is loaded', async () => {
    await hop.waitForLoadState('domcontentloaded');
});
defineGiven('I am authenticated as {string}', async (username) => {
    await hop.visit('https://demo.playwright.dev/todomvc');
    await hop.setLocalStorage('auth_user', username);
    await hop.setLocalStorage('auth_token', 'mock-token-12345');
    await hop.reload();
});
defineWhen('I fill in {string} with {string}', async (field, value) => {
    const selector = field.startsWith('#') || field.startsWith('.')
        ? field
        : `[data-testid="${field}"], [name="${field}"], #${field}`;
    await hop.get(selector).fill(value);
});
defineWhen('I submit the form', async () => {
    await hop.get('button[type="submit"]').click();
});
defineWhen('I wait for {int} seconds', async (seconds) => {
    await hop.wait(seconds * 1000);
});
defineWhen('I press {string}', async (key) => {
    await hop.press(key);
});
defineWhen('I scroll to bottom', async () => {
    await hop.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
});
defineWhen('I clear the input {string}', async (field) => {
    await hop.get(`#${field}`).clear();
});
defineWhen('I select {string} from {string}', async (value, field) => {
    await hop.get(`#${field}`).select(value);
});
defineThen('the URL should contain {string}', async (partialUrl) => {
    const url = hop.url();
    if (!url.includes(partialUrl)) {
        throw new Error(`Expected URL to contain "${partialUrl}", got "${url}"`);
    }
});
defineThen('the page title should be {string}', async (title) => {
    const actualTitle = await hop.title();
    if (actualTitle !== title) {
        throw new Error(`Expected title "${title}", got "${actualTitle}"`);
    }
});
defineThen('the element {string} should have attribute {string}', async (selector, attr) => {
    const value = await hop.get(selector).getAttribute(attr);
    if (value === null) {
        throw new Error(`Element "${selector}" does not have attribute "${attr}"`);
    }
});
defineThen('the element {string} should contain {string}', async (selector, text) => {
    const actualText = await hop.get(selector).getText();
    if (!actualText.includes(text)) {
        throw new Error(`Expected element to contain "${text}", got "${actualText}"`);
    }
});
defineThen('the page should have {int} elements matching {string}', async (count, selector) => {
    const actualCount = await hop.get(selector).count();
    if (actualCount !== count) {
        throw new Error(`Expected ${count} elements, found ${actualCount}`);
    }
});
console.log('✅ Custom step definitions loaded');
