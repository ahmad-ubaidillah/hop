import type { Step, TestContext } from '../../types/index.js';
import type { StepHandler, IStepExecutor } from './types.js';
import { resolveEnvVariables as resolveEnv } from '../../utils/env-loader.js';
import { PlaywrightClient } from '../../ui/playwright-client.js';

export class UiHandler implements StepHandler {
  canHandle(text: string): boolean {
    return text.match(/^user opens browser/i) !== null ||
           text.match(/^user navigates to ['"]/i) !== null ||
           text.match(/^user clicks? ['"]/i) !== null ||
           text.match(/^user types? ['"](.+)['"] into ['"]/i) !== null ||
           text.match(/^user should see element ['"]/i) !== null ||
           text.match(/^user should see text ['"]/i) !== null ||
           text.match(/^user refreshes page/i) !== null ||
           text.match(/^user sets cookie ['"](.+)['"] to ['"]/i) !== null;
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
    
    const typeMatch = text.match(/^user types? ['"](.+)['"] into ['"](.+)['"]/i);
    if (typeMatch) {
      const pw = executor.getPlaywright(context);
      if (!pw) throw new Error('Browser not opened. Use "user opens browser" first.');
      
      const resolvedText = executor.resolveVariables(typeMatch[1], context);
      await pw.type(typeMatch[2], resolvedText);
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
    
    const shouldSeeTextMatch = text.match(/^user should see text ['"](.+)['"]/i);
    if (shouldSeeTextMatch) {
      const pw = executor.getPlaywright(context);
      if (!pw) throw new Error('Browser not opened. Use "user opens browser" first.');
      
      const resolvedText = executor.resolveVariables(shouldSeeTextMatch[1], context);
      const page = pw.getPage();
      if (!page) throw new Error('Page not available');
      
      const content = await page.content();
      if (!content.includes(resolvedText)) {
        throw new Error(`Text '${resolvedText}' not found on page`);
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
  }
}
