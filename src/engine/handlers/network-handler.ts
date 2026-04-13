import type { Step, TestContext } from '../../types/index.js';
import type { StepHandler, IStepExecutor } from './types.js';
import { NetworkInterceptor, createNetworkInterceptor } from '../../http/network-interceptor.js';

export class NetworkHandler implements StepHandler {
  private interceptors: Map<string, NetworkInterceptor> = new Map();

  canHandle(text: string): boolean {
    return text.match(/^(Given|When|Then|And|But)?\s*mock (api|network|http)/i) !== null ||
           text.match(/^(Given|When|Then|And|But)?\s*block (url|api|network)/i) !== null ||
           text.match(/^(Given|When|Then|And|But)?\s*wait for network/i) !== null ||
           text.match(/^(Given|When|Then|And|But)?\s*verify (network|api) call/i) !== null ||
           text.match(/^(Given|When|Then|And|But)?\s*intercept/i) !== null ||
           text.match(/^I intercept/i) !== null ||
           text.match(/^I mock/i) !== null ||
           text.match(/^I wait for (request|response)/i) !== null ||
           text.match(/^I stub/i) !== null;
  }

  async handle(text: string, step: Step, context: TestContext, executor: IStepExecutor): Promise<void> {
    const mockApiMatch = text.match(/^.*mock (api|network|http) ['"]([^'"]+)['"]/i);
    const mockResponseMatch = text.match(/^.*mock (api|network|http) response/i);
    const blockMatch = text.match(/^.*block (url|api|network) ['"]([^'"]+)['"]/i);
    const waitNetworkMatch = text.match(/^.*wait for network (idle|request)/i);
    const verifyCallMatch = text.match(/^.*verify (network|api) call/i);
    const interceptMatch = text.match(/^.*intercept/i);

    let interceptor = context.variables['__network_interceptor'] as NetworkInterceptor;
    if (!interceptor) {
      interceptor = createNetworkInterceptor();
      context.variables['__network_interceptor'] = interceptor;
    }

    if (mockApiMatch) {
      const urlPattern = mockApiMatch[2];
      const statusMatch = text.match(/status (\d+)/i);
      const bodyMatch = text.match(/response\s*(\{[\s\S]*\})/i);
      const delayMatch = text.match(/delay (\d+)/i);

      interceptor.addMock({
        urlPattern,
        status: statusMatch ? parseInt(statusMatch[1]) : 200,
        body: bodyMatch ? JSON.parse(bodyMatch[1]) : { success: true },
        delay: delayMatch ? parseInt(delayMatch[1]) : 0,
      });

      console.log(`🎭 Mock added for: ${urlPattern}`);
      return;
    }

    if (blockMatch) {
      const urlPattern = blockMatch[2];
      interceptor.blockUrl(urlPattern);
      console.log(`🚫 URL blocked: ${urlPattern}`);
      return;
    }

    if (waitNetworkMatch) {
      const condition = waitNetworkMatch[1];
      const pw = executor.getPlaywright(context);
      const page = pw?.getPage();

      if (page) {
        if (condition === 'idle') {
          await page.waitForLoadState('networkidle', { timeout: 30000 });
        } else {
          await page.waitForLoadState('domcontentloaded');
        }
        console.log(`⏳ Waited for network ${condition}`);
      }
      return;
    }

    if (verifyCallMatch) {
      const urlMatch = text.match(/url ['"]([^'"]+)['"]/i);
      const methodMatch = text.match(/method (\w+)/i);
      const statusMatch = text.match(/status (\d+)/i);

      const calls = interceptor.getCalls();
      const matchingCall = calls.find((c) => {
        const urlMatch_ = urlMatch ? c.url.includes(urlMatch[1]) : true;
        const methodMatch_ = methodMatch ? c.method === methodMatch[1].toUpperCase() : true;
        return urlMatch_ && methodMatch_;
      });

      if (!matchingCall) {
        throw new Error(`No network call found matching criteria`);
      }

      if (statusMatch && matchingCall.status !== parseInt(statusMatch[1])) {
        throw new Error(`Expected status ${statusMatch[1]}, got ${matchingCall.status}`);
      }

      context.variables['__last_network_call'] = matchingCall;
      console.log(`✅ Network call verified: ${matchingCall.method} ${matchingCall.url}`);
      return;
    }

    if (interceptMatch) {
      const urlMatch = text.match(/intercept ['"]([^'"]+)['"]/i);
      if (urlMatch) {
        console.log(`🔀 Intercept configured for: ${urlMatch[1]}`);
      }
      return;
    }

    const iInterceptMatch = text.match(/^I intercept (?:GET|POST|PUT|DELETE|PATCH)?\s*['"]([^'"]+)['"](?:\s*with\s*(.+))?$/i);
    if (iInterceptMatch) {
      const urlPattern = iInterceptMatch[1];
      const responseData = iInterceptMatch[2];

      let response;
      let status = 200;

      if (responseData) {
        try {
          response = JSON.parse(responseData);
        } catch {
          response = responseData.replace(/^['"]|['"]$/g, '');
        }
      }

      const pw = executor.getPlaywright(context);
      const ctx = pw?.getContext();
      
      if (ctx) {
        await ctx.route(urlPattern, async (route) => {
          if (response !== undefined) {
            await route.fulfill({
              status,
              body: typeof response === 'object' ? JSON.stringify(response) : response,
              headers: { 'Content-Type': 'application/json' },
            });
          } else {
            await route.continue();
          }
        });
      }

      console.log(`   🔀 Intercepting: ${urlPattern}`);
      return;
    }

    const iMockMatch = text.match(/^I mock ['"]([^'"]+)['"]\s*with\s*(.+)$/i);
    if (iMockMatch) {
      const urlPattern = iMockMatch[1];
      let responseData;

      try {
        responseData = JSON.parse(iMockMatch[2]);
      } catch {
        responseData = iMockMatch[2].replace(/^['"]|['"]$/g, '');
      }

      const pw = executor.getPlaywright(context);
      const ctx = pw?.getContext();
      
      if (ctx) {
        await ctx.route(urlPattern, async (route) => {
          await route.fulfill({
            status: 200,
            body: typeof responseData === 'object' ? JSON.stringify(responseData) : responseData,
            headers: { 'Content-Type': 'application/json' },
          });
        });
      }

      console.log(`   🎭 Mocking: ${urlPattern}`);
      return;
    }

    const iWaitMatch = text.match(/^I wait for (request|response)\s*(?:to|from)\s*['"]([^'"]+)['"]$/i);
    if (iWaitMatch) {
      const type = iWaitMatch[1].toLowerCase();
      const urlPattern = iWaitMatch[2];

      const pw = executor.getPlaywright(context);
      const page = pw?.getPage();
      
      if (page) {
        const waitFor = type === 'request' 
          ? page.waitForRequest(urlPattern)
          : page.waitForResponse(urlPattern);

        await waitFor;
        console.log(`   ⏳ Waited for ${type}: ${urlPattern}`);
      }
      return;
    }

    const iStubMatch = text.match(/^I stub ['"]([^'"]+)['"]\s*with\s*(.+)$/i);
    if (iStubMatch) {
      const urlPattern = iStubMatch[1];
      let responseData;

      try {
        responseData = JSON.parse(iStubMatch[2]);
      } catch {
        responseData = iStubMatch[2].replace(/^['"]|['"]$/g, '');
      }

      const pw = executor.getPlaywright(context);
      const ctx = pw?.getContext();
      
      if (ctx) {
        await ctx.route(urlPattern, async (route) => {
          await route.fulfill({
            status: 200,
            body: typeof responseData === 'object' ? JSON.stringify(responseData) : responseData,
            headers: { 'Content-Type': 'application/json' },
          });
        });
      }

      console.log(`   📌 Stubbed: ${urlPattern}`);
      return;
    }
  }
}