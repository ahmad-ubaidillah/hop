import type { Step, TestContext, IStepHandler } from '../../types/index.js';
import type { IStepExecutor } from './types.js';
import { ComponentTester, createComponentTester } from '../../ui/component-tester.js';
import type { ComponentTestOptions, Framework } from '../../ui/component-tester.js';
import { HopError } from '../../utils/error-formatter.js';

export class ComponentTesterHandler implements IStepHandler {
  private testers: Map<string, ComponentTester> = new Map();

  canHandle(text: string): boolean {
    return text.startsWith('Given component tester') ||
           text.startsWith('When I mount') ||
           text.startsWith('And I mount') ||
           text.startsWith('Then I query') ||
           text.startsWith('And I query') ||
           text.startsWith('When I get prop') ||
           text.startsWith('And I get prop') ||
           text.startsWith('When I trigger') ||
           text.startsWith('And I trigger') ||
           text.startsWith('When I type') ||
           text.startsWith('And I type') ||
           text.startsWith('When I click') ||
           text.startsWith('And I click') ||
           text.startsWith('When I wait for') ||
           text.startsWith('And I wait for');
  }

  async handle(text: string, step: Step, context: TestContext, executor: IStepExecutor): Promise<void> {
    if (text.startsWith('Given component tester')) {
      await this.handleGivenComponentTester(text, step, context, executor);
    } else if (text.startsWith('When I mount') || text.startsWith('And I mount')) {
      await this.handleWhenIMount(text, step, context, executor);
    } else if (text.startsWith('Then I query') || text.startsWith('And I query')) {
      await this.handleThenIQuery(text, step, context, executor);
    } else if (text.startsWith('When I get prop') || text.startsWith('And I get prop')) {
      await this.handleWhenIGetProp(text, step, context, executor);
    } else if (text.startsWith('When I trigger') || text.startsWith('And I trigger')) {
      await this.handleWhenITrigger(text, step, context, executor);
    } else if (text.startsWith('When I type') || text.startsWith('And I type')) {
      await this.handleWhenIType(text, step, context, executor);
    } else if (text.startsWith('When I click') || text.startsWith('And I click')) {
      await this.handleWhenIClick(text, step, context, executor);
    } else if (text.startsWith('When I wait for') || text.startsWith('And I wait for')) {
      await this.handleWhenIWaitFor(text, step, context, executor);
    }
  }

  private async handleGivenComponentTester(text: string, step: Step, context: TestContext, executor: IStepExecutor): Promise<void> {
    // Given component tester for react with rootDir "./src" and devServerUrl "http://localhost:3000"
    const match = text.match(/Given component tester for (\w+) with rootDir "([^"]*)"(?: and devServerUrl "([^"]*)")?/);
    if (!match) {
      throw new HopError(`Invalid component tester syntax: ${text}`);
    }

    const [, frameworkStr, rootDir, devServerUrl] = match;
    const framework = frameworkStr as Framework;
    
    const options: ComponentTestOptions = {
      framework,
      rootDir,
      ...(devServerUrl && { devServerUrl }),
    };

    const testerId = `${framework}-${rootDir}`;
    if (!this.testers.has(testerId)) {
      const tester = createComponentTester(options);
      this.testers.set(testerId, tester);
      context.variables['__component_tester'] = tester;
    }
  }

  private async handleWhenIMount(text: string, step: Step, context: TestContext, executor: IStepExecutor): Promise<void> {
    // When I mount "./components/Button.jsx" with props {{ "label": "Click me" }}
    const match = text.match(/When I mount "([^"]*)"(?: with props ({.*}))?/);
    if (!match) {
      throw new HopError(`Invalid mount syntax: ${text}`);
    }

    const [, componentPath, propsStr] = match;
    const tester = context.variables['__component_tester'] as ComponentTester;
    if (!tester) {
      throw new HopError('Component tester not initialized. Use "Given component tester" first.');
    }

    const props = propsStr ? JSON.parse(propsStr) : {};
    await tester.mount(componentPath, { props });
  }

  private async handleThenIQuery(text: string, step: Step, context: TestContext, executor: IStepExecutor): Promise<void> {
    // Then I query "button" should have text "Click me"
    const match = text.match(/Then I query "([^"]*)" should have text "([^"]*)"/);
    if (!match) {
      throw new HopError(`Invalid query syntax: ${text}`);
    }

    const [, selector, expectedText] = match;
    const tester = context.variables['__component_tester'] as ComponentTester;
    if (!tester) {
      throw new HopError('Component tester not initialized.');
    }

    const result = await tester.query(selector);
    if (!result.found) {
      throw new HopError(`Element not found: ${selector}`);
    }
    if (result.text !== expectedText) {
      throw new HopError(`Expected text "${expectedText}" but got "${result.text}"`);
    }
  }

  private async handleWhenIGetProp(text: string, step: Step, context: TestContext, executor: IStepExecutor): Promise<void> {
    // When I get prop "label" and store it as buttonLabel
    const match = text.match(/When I get prop "([^"]*)" and store it as (\w+)/);
    if (!match) {
      throw new HopError(`Invalid get prop syntax: ${text}`);
    }

    const [, propName, varName] = match;
    const tester = context.variables['__component_tester'] as ComponentTester;
    if (!tester) {
      throw new HopError('Component tester not initialized.');
    }

    const value = await tester.getProp(propName);
    context.variables[varName] = value;
  }

  private async handleWhenITrigger(text: string, step: Step, context: TestContext, executor: IStepExecutor): Promise<void> {
    // When I trigger "click" on "button"
    const match = text.match(/When I trigger "([^"]*)" on "([^"]*)"/);
    if (!match) {
      throw new HopError(`Invalid trigger syntax: ${text}`);
    }

    const [, event, selector] = match;
    const tester = context.variables['__component_tester'] as ComponentTester;
    if (!tester) {
      throw new HopError('Component tester not initialized.');
    }

    await tester.trigger(event, selector);
  }

  private async handleWhenIType(text: string, step: Step, context: TestContext, executor: IStepExecutor): Promise<void> {
    // When I type "Hello World" into "input"
    const match = text.match(/When I type "([^"]*)" into "([^"]*)"/);
    if (!match) {
      throw new HopError(`Invalid type syntax: ${text}`);
    }

    const [, value, selector] = match;
    const tester = context.variables['__component_tester'] as ComponentTester;
    if (!tester) {
      throw new HopError('Component tester not initialized.');
    }

    await tester.type(selector, value);
  }

  private async handleWhenIClick(text: string, step: Step, context: TestContext, executor: IStepExecutor): Promise<void> {
    // When I click "button"
    const match = text.match(/When I click "([^"]*)"/);
    if (!match) {
      throw new HopError(`Invalid click syntax: ${text}`);
    }

    const [, selector] = match;
    const tester = context.variables['__component_tester'] as ComponentTester;
    if (!tester) {
      throw new HopError('Component tester not initialized.');
    }

    await tester.click(selector);
  }

  private async handleWhenIWaitFor(text: string, step: Step, context: TestContext, executor: IStepExecutor): Promise<void> {
    // When I wait for "button" for 5000 ms
    const match = text.match(/When I wait for "([^"]*)" for (\d+) ms/);
    if (!match) {
      throw new HopError(`Invalid wait for syntax: ${text}`);
    }

    const [, selector, timeoutStr] = match;
    const timeout = parseInt(timeoutStr, 10);
    const tester = context.variables['__component_tester'] as ComponentTester;
    if (!tester) {
      throw new HopError('Component tester not initialized.');
    }

    await tester.waitForSelector(selector, timeout);
  }
}