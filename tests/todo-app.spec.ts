import { hop, defineStep, defineGiven, defineWhen, defineThen } from 'hop';

defineGiven('I am on the homepage', async () => {
  await hop.visit('https://demo.playwright.dev/todomvc');
});

defineGiven('a user {string} exists', async (name: string) => {
  await hop.visit('https://demo.playwright.dev/todomvc');
  await hop.get('.new-todo').fill(`Task for ${name}`);
  await hop.get('.new-todo').press('Enter');
});

defineWhen('I add a new todo {string}', async (task: string) => {
  await hop.get('.new-todo').fill(task);
  await hop.get('.new-todo').press('Enter');
});

defineWhen('I click the todo {string}', async (task: string) => {
  await hop.get(`.todo-list li:has-text("${task}") .toggle`).click();
});

defineThen('I should see {int} todos', async (count: number) => {
  await hop.expect('.todo-list li').toHaveCount(count);
});

defineThen('the todo {string} should be completed', async (task: string) => {
  const isCompleted = await hop.get(`.todo-list li:has-text("${task}") .completed`).isVisible();
  if (!isCompleted) throw new Error(`Todo "${task}" is not completed`);
});

defineThen('I should see {string} in the list', async (task: string) => {
  await hop.expect(`.todo-list li:has-text("${task}")`).toBeVisible();
});

defineThen('I should not see {string} in the list', async (task: string) => {
  await hop.get(`.todo-list li:has-text("${task}")`).waitFor({ state: 'hidden' }).catch(() => {});
  const visible = await hop.get(`.todo-list li:has-text("${task}")`).isVisible();
  if (visible) throw new Error(`Todo "${task}" should not be visible`);
});

describe('Todo App Tests', () => {
  beforeEach(async () => {
    await hop.launch();
  });

  afterEach(async () => {
    await hop.close();
  });

  it('should add a new todo', async () => {
    await hop.visit('https://demo.playwright.dev/todomvc');
    
    await hop.get('.new-todo').fill('Learn Hop');
    await hop.get('.new-todo').press('Enter');
    
    await hop.expect('.todo-list li').toHaveCount(1);
    await hop.expect('.todo-list li:has-text("Learn Hop")').toBeVisible();
  });

  it('should complete a todo', async () => {
    await hop.visit('https://demo.playwright.dev/todomvc');
    
    await hop.get('.new-todo').fill('Buy milk');
    await hop.get('.new-todo').press('Enter');
    
    await hop.get('.todo-list li .toggle').click({ force: true });
    
    await hop.expect('.todo-list li').toHaveCount(1);
  });

  it('should delete a todo', async () => {
    await hop.visit('https://demo.playwright.dev/todomvc');
    
    await hop.get('.new-todo').fill('Test task');
    await hop.get('.new-todo').press('Enter');
    
    await hop.get('.todo-list li .destroy').click({ force: true });
    
    await hop.expect('.todo-list li').toHaveCount(0);
  });

  it('should filter todos', async () => {
    await hop.visit('https://demo.playwright.dev/todomvc');
    
    await hop.get('.new-todo').fill('Active task');
    await hop.get('.new-todo').press('Enter');
    await hop.get('.new-todo').fill('Completed task');
    await hop.get('.new-todo').press('Enter');
    
    await hop.get('.todo-list li .toggle').first().click({ force: true });
    
    await hop.get('button:has-text("Completed")').click();
    
    await hop.expect('.todo-list li').toHaveCount(1);
  });

  it('should use semantic locators', async () => {
    await hop.visit('https://demo.playwright.dev/todomvc');
    
    await hop.getByPlaceholder('What needs to be done?').fill('Using getByPlaceholder');
    await hop.getByPlaceholder('What needs to be done?').press('Enter');
    
    await hop.getByText('Using getByPlaceholder').isVisible();
  });

  it('should handle network interception', async () => {
    await hop.visit('https://demo.playwright.dev/todomvc');
    
    await hop.intercept('**/todos', {
      status: 200,
      body: [
        { id: 1, title: 'Mocked todo 1', completed: false },
        { id: 2, title: 'Mocked todo 2', completed: true }
      ]
    });
    
    await hop.reload();
    
    await hop.waitForResponse('**/todos');
    await hop.expect('.todo-list li').toHaveCount(2);
  });

  it('should use force option', async () => {
    await hop.visit('https://demo.playwright.dev/todomvc');
    
    await hop.get('.new-todo').fill('Hidden button test');
    await hop.get('.new-todo').press('Enter');
    
    await hop.get('.todo-list li .toggle').click({ force: true });
  });

  it('should use position option', async () => {
    await hop.visit('https://demo.playwright.dev/todomvc');
    
    await hop.get('.new-todo').fill('Position test');
    await hop.get('.new-todo').press('Enter');
    
    await hop.get('.todo-list li .toggle').click({ position: { x: 10, y: 10 } });
  });

  it('should work with device emulation', async () => {
    const mobileHop = hop({
      device: 'iPhone 12',
      headless: true
    });
    
    await mobileHop.launch();
    await mobileHop.visit('https://demo.playwright.dev/todomvc');
    await mobileHop.get('.new-todo').isVisible();
    await mobileHop.close();
  });

  it('should handle localStorage', async () => {
    await hop.visit('https://demo.playwright.dev/todomvc');
    
    await hop.setLocalStorage('user', 'test-user');
    const user = await hop.getLocalStorage('user');
    
    expect(user).toBe('test-user');
  });

  it('should handle cookies', async () => {
    await hop.visit('https://demo.playwright.dev/todomvc');
    
    await hop.setCookie('session', 'abc123', { path: '/' });
    const cookie = await hop.getCookie('session');
    
    expect(cookie?.value).toBe('abc123');
  });
});