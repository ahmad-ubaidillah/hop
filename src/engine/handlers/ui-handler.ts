import type { Step, TestContext } from '../../types/index.js';
import type { StepHandler, IStepExecutor } from './types.js';
import { resolveEnvVariables as resolveEnv } from '../../utils/env-loader.js';
import { PlaywrightClient } from '../../ui/playwright-client.js';

export class UiHandler implements StepHandler {
  canHandle(text: string): boolean {
    return text.match(/^user opens browser/i) !== null ||
           text.match(/^user navigates to ['"]/i) !== null ||
           text.match(/^user clicks? ['"]/i) !== null ||
           text.match(/^user double clicks? ['"]/i) !== null ||
           text.match(/^user right clicks? ['"]/i) !== null ||
           text.match(/^user types? ['"](.+)['"] into ['"]/i) !== null ||
           text.match(/^user selects? ['"](.+)['"] from ['"]/i) !== null ||
           text.match(/^user checks? ['"]/i) !== null ||
           text.match(/^user unchecks? ['"]/i) !== null ||
           text.match(/^user hovers? over ['"]/i) !== null ||
           text.match(/^user scrolls? to ['"]/i) !== null ||
           text.match(/^user presses? /i) !== null ||
           text.match(/^user waits? for ['"]/i) !== null ||
           text.match(/^set viewport/i) !== null ||
           text.match(/^user should see element ['"]/i) !== null ||
           text.match(/^user should see text ['"]/i) !== null ||
           text.match(/^user should not see ['"]/i) !== null ||
           text.match(/^user refreshes page/i) !== null ||
           text.match(/^user sets cookie ['"](.+)['"] to ['"]/i) !== null ||
           text.match(/^user takes screenshot/i) !== null ||
           text.match(/^I open ['"]/i) !== null ||
           text.match(/^I visit ['"]/i) !== null ||
           text.match(/^I click ['"]/i) !== null ||
           text.match(/^I fill ['"]/i) !== null ||
           text.match(/^I type ['"]/i) !== null ||
           text.match(/^I should see ['"]/i) !== null ||
           text.match(/^I should not see ['"]/i) !== null ||
           text.match(/^I wait for ['"]/i) !== null ||
           text.match(/^I select ['"]/i) !== null;
  }

  async handle(text: string, step: Step, context: TestContext, executor: IStepExecutor): Promise<void> {
    if (text.match(/^user opens browser/i)) {
      let playwright = executor.getPlaywright();
      if (!playwright) {
        playwright = new PlaywrightClient({
          headless: true,
          timeout: executor.getOptions().timeout,
          video: executor.getOptions().video,
        });
        executor.setPlaywright(playwright);
      }
      await playwright.launch();
      context.variables['__playwright'] = playwright;
      return;
    }
    
    const navigateMatch = text.match(/^user navigates to ['"](.+)['"]/i);
    if (navigateMatch) {
      const pw = executor.getPlaywright(context);
      if (!pw) throw new Error('Browser not opened. Use "user opens browser" first.');
      
      const url = resolveEnv(navigateMatch[1], executor.getEnvConfig());
      const resolvedUrl = executor.resolveVariables(url, context);
      await pw.navigate(resolvedUrl);
      return;
    }
    
    const clickMatch = text.match(/^user clicks? ['"](.+)['"]/i);
    if (clickMatch) {
      const pw = executor.getPlaywright(context);
      if (!pw) throw new Error('Browser not opened. Use "user opens browser" first.');
      
      await pw.click(clickMatch[1]);
      return;
    }

    const dblClickMatch = text.match(/^user double clicks? ['"](.+)['"]/i);
    if (dblClickMatch) {
      const pw = executor.getPlaywright(context);
      if (!pw) throw new Error('Browser not opened. Use "user opens browser" first.');
      
      await pw.getPage()?.dblclick(dblClickMatch[1]);
      return;
    }

    const rightClickMatch = text.match(/^user right clicks? ['"](.+)['"]/i);
    if (rightClickMatch) {
      const pw = executor.getPlaywright(context);
      if (!pw) throw new Error('Browser not opened. Use "user opens browser" first.');
      
      await pw.getPage()?.click(rightClickMatch[1], { button: 'right' });
      return;
    }
    
    const typeMatch = text.match(/^user types? ['"](.+)['"] into ['"](.+)['"]/i);
    if (typeMatch) {
      const pw = executor.getPlaywright(context);
      if (!pw) throw new Error('Browser not opened. Use "user opens browser" first.');
      
      const resolvedText = executor.resolveVariables(typeMatch[1], context);
      await pw.type(typeMatch[2], resolvedText);
      return;
    }

    const selectMatch = text.match(/^user selects? ['"](.+)['"] from ['"](.+)['"]/i);
    if (selectMatch) {
      const pw = executor.getPlaywright(context);
      if (!pw) throw new Error('Browser not opened. Use "user opens browser" first.');
      
      await pw.getPage()?.selectOption(selectMatch[2], { label: selectMatch[1] });
      return;
    }

    const checkMatch = text.match(/^user checks? ['"](.+)['"]/i);
    if (checkMatch) {
      const pw = executor.getPlaywright(context);
      if (!pw) throw new Error('Browser not opened. Use "user opens browser" first.');
      
      await pw.getPage()?.check(checkMatch[1]);
      return;
    }

    const uncheckMatch = text.match(/^user unchecks? ['"](.+)['"]/i);
    if (uncheckMatch) {
      const pw = executor.getPlaywright(context);
      if (!pw) throw new Error('Browser not opened. Use "user opens browser" first.');
      
      await pw.getPage()?.uncheck(uncheckMatch[1]);
      return;
    }

    const hoverMatch = text.match(/^user hovers? over ['"](.+)['"]/i);
    if (hoverMatch) {
      const pw = executor.getPlaywright(context);
      if (!pw) throw new Error('Browser not opened. Use "user opens browser" first.');
      
      await pw.getPage()?.hover(hoverMatch[1]);
      return;
    }

    const scrollMatch = text.match(/^user scrolls? to ['"](.+)['"]/i);
    if (scrollMatch) {
      const pw = executor.getPlaywright(context);
      if (!pw) throw new Error('Browser not opened. Use "user opens browser" first.');
      
      await pw.getPage()?.locator(scrollMatch[1]).scrollIntoViewIfNeeded();
      return;
    }

    const pressMatch = text.match(/^user presses? (Enter|Escape|Tab|'[^']+')/i);
    if (pressMatch) {
      const pw = executor.getPlaywright(context);
      if (!pw) throw new Error('Browser not opened. Use "user opens browser" first.');
      
      const key = pressMatch[1];
      if (key === 'Enter') await pw.getPage()?.keyboard.press('Enter');
      else if (key === 'Escape') await pw.getPage()?.keyboard.press('Escape');
      else if (key === 'Tab') await pw.getPage()?.keyboard.press('Tab');
      else await pw.getPage()?.keyboard.press(key);
      return;
    }

    const waitMatch = text.match(/^user waits? for ['"](.+)['"] to be (visible|hidden|clickable)/i);
    if (waitMatch) {
      const pw = executor.getPlaywright(context);
      if (!pw) throw new Error('Browser not opened. Use "user opens browser" first.');
      
      const selector = waitMatch[1];
      const condition = waitMatch[2];
      const page = pw.getPage();
      
      if (condition === 'visible') {
        await page?.waitForSelector(selector, { state: 'visible', timeout: 30000 });
      } else if (condition === 'hidden') {
        await page?.waitForSelector(selector, { state: 'hidden', timeout: 30000 });
      } else if (condition === 'clickable') {
        await page?.waitForSelector(selector, { state: 'attached', timeout: 30000 });
      }
      return;
    }

    const viewportMatch = text.match(/^set viewport size (\d+) (\d+)/i);
    if (viewportMatch) {
      const pw = executor.getPlaywright(context);
      if (!pw) throw new Error('Browser not opened. Use "user opens browser" first.');
      
      const width = parseInt(viewportMatch[1]);
      const height = parseInt(viewportMatch[2]);
      await pw.getPage()?.setViewportSize({ width, height });
      return;
    }
    
    const shouldSeeMatch = text.match(/^user should see element ['"](.+)['"]/i);
    if (shouldSeeMatch) {
      const pw = executor.getPlaywright(context);
      if (!pw) throw new Error('Browser not opened. Use "user opens browser" first.');
      
      const isVisible = await pw.isVisible(shouldSeeMatch[1]);
      if (!isVisible) {
        throw new Error(`Element '${shouldSeeMatch[1]}' is not visible`);
      }
      return;
    }
    
    const shouldSeeTextMatch = text.match(/^user should see text ['"](.+)['"] in ['"](.+)['"]/i);
    if (shouldSeeTextMatch) {
      const pw = executor.getPlaywright(context);
      if (!pw) throw new Error('Browser not opened. Use "user opens browser" first.');
      
      const expectedText = executor.resolveVariables(shouldSeeTextMatch[1], context);
      const selector = shouldSeeTextMatch[2];
      const page = pw.getPage();
      
      const actualText = await page?.locator(selector).textContent();
      if (!actualText?.includes(expectedText)) {
        throw new Error(`Expected text '${expectedText}' but got '${actualText}'`);
      }
      return;
    }

    const shouldNotSeeMatch = text.match(/^user should not see ['"](.+)['"]/i);
    if (shouldNotSeeMatch) {
      const pw = executor.getPlaywright(context);
      if (!pw) throw new Error('Browser not opened. Use "user opens browser" first.');
      
      const isVisible = await pw.isVisible(shouldNotSeeMatch[1]);
      if (isVisible) {
        throw new Error(`Element '${shouldNotSeeMatch[1]}' should not be visible but it is`);
      }
      return;
    }
    
    if (text.match(/^user refreshes page/i)) {
      const pw = executor.getPlaywright(context);
      if (!pw) throw new Error('Browser not opened. Use "user opens browser" first.');
      
      await pw.refresh();
      return;
    }
    
    const cookieMatch = text.match(/^user sets cookie ['"](.+)['"] to ['"](.+)['"]/i);
    if (cookieMatch) {
      const pw = executor.getPlaywright(context);
      if (!pw) throw new Error('Browser not opened. Use "user opens browser" first.');
      
      const resolvedValue = executor.resolveVariables(cookieMatch[2], context);
      await pw.setCookie(cookieMatch[1], resolvedValue);
      return;
    }

    const screenshotMatch = text.match(/^user takes screenshot ['"](.+)['"]/i);
    if (screenshotMatch) {
      const pw = executor.getPlaywright(context);
      if (!pw) throw new Error('Browser not opened. Use "user opens browser" first.');
      
      const name = screenshotMatch[1];
      await executor.takeScreenshot(name, context);
      return;
    }

    const iOpenMatch = text.match(/^I (?:open|visit) ['"](.+)['"]/i);
    if (iOpenMatch) {
      let playwright = executor.getPlaywright();
      if (!playwright) {
        playwright = new PlaywrightClient({
          headless: true,
          timeout: executor.getOptions().timeout,
          video: executor.getOptions().video,
        });
        executor.setPlaywright(playwright);
      }
      await playwright.launch();
      const url = resolveEnv(iOpenMatch[1], executor.getEnvConfig());
      await playwright.navigate(url);
      context.variables['__playwright'] = playwright;
      return;
    }

    const iClickMatch = text.match(/^I click ['"](.+)['"]/i);
    if (iClickMatch) {
      const pw = executor.getPlaywright(context);
      if (!pw) throw new Error('Browser not opened. Use "I open \'url\'" first.');
      await pw.click(iClickMatch[1]);
      return;
    }

    const iFillMatch = text.match(/^I fill ['"](.+)['"] with ['"](.+)['"]/i);
    if (iFillMatch) {
      const pw = executor.getPlaywright(context);
      if (!pw) throw new Error('Browser not opened. Use "I open \'url\'" first.');
      const resolvedText = executor.resolveVariables(iFillMatch[2], context);
      await pw.type(iFillMatch[1], resolvedText);
      return;
    }

    const iTypeMatch = text.match(/^I type ['"](.+)['"] into ['"](.+)['"]/i);
    if (iTypeMatch) {
      const pw = executor.getPlaywright(context);
      if (!pw) throw new Error('Browser not opened. Use "I open \'url\'" first.');
      const resolvedText = executor.resolveVariables(iTypeMatch[1], context);
      await pw.type(iTypeMatch[2], resolvedText);
      return;
    }

    const iShouldSeeMatch = text.match(/^I should see ['"](.+)['"]/i);
    if (iShouldSeeMatch) {
      const pw = executor.getPlaywright(context);
      if (!pw) throw new Error('Browser not opened. Use "I open \'url\'" first.');
      const isVisible = await pw.isVisible(iShouldSeeMatch[1]);
      if (!isVisible) {
        throw new Error(`Expected to see element '${iShouldSeeMatch[1]}' but it's not visible`);
      }
      return;
    }

    const iShouldNotSeeMatch = text.match(/^I should not see ['"](.+)['"]/i);
    if (iShouldNotSeeMatch) {
      const pw = executor.getPlaywright(context);
      if (!pw) throw new Error('Browser not opened. Use "I open \'url\'" first.');
      const isVisible = await pw.isVisible(iShouldNotSeeMatch[1]);
      if (isVisible) {
        throw new Error(`Element '${iShouldNotSeeMatch[1]}' should not be visible but it is`);
      }
      return;
    }

    const iWaitMatch = text.match(/^I wait for ['"](.+)['"]/i);
    if (iWaitMatch) {
      const pw = executor.getPlaywright(context);
      if (!pw) throw new Error('Browser not opened. Use "I open \'url\'" first.');
      const page = pw.getPage();
      await page?.waitForSelector(iWaitMatch[1], { state: 'visible', timeout: 30000 });
      return;
    }

    const iSelectMatch = text.match(/^I select ['"](.+)['"] from ['"](.+)['"]/i);
    if (iSelectMatch) {
      const pw = executor.getPlaywright(context);
      if (!pw) throw new Error('Browser not opened. Use "I open \'url\'" first.');
      await pw.getPage()?.selectOption(iSelectMatch[2], { label: iSelectMatch[1] });
      return;
    }
  }
}
