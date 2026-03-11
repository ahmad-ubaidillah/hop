import type { Step, TestContext } from '../../types/index.js';
import type { StepHandler, IStepExecutor } from './types.js';

export class AuthHandler implements StepHandler {
  canHandle(text: string): boolean {
    return text.match(/^save auth to ['"]/i) !== null ||
           text.match(/^load auth from ['"]/i) !== null ||
           text.match(/^clear auth/i) !== null;
  }

  async handle(text: string, step: Step, context: TestContext, executor: IStepExecutor): Promise<void> {
    const logger = executor.getLogger();
    const authManager = executor.getAuthManager();
    
    const saveAuthMatch = text.match(/^save auth to ['"](.+)['"]/i);
    if (saveAuthMatch) {
      if (!context.response) {
        throw new Error('No response available. Make an API call first.');
      }
      
      const filePath = saveAuthMatch[1];
      const auth = authManager.createAuthFromLogin(context.response);
      authManager.saveAuth(auth, filePath);
      
      context.variables['auth'] = auth;
      
      if (auth.token) {
        context.headers['Authorization'] = `Bearer ${auth.token}`;
      }
      if (auth.cookies) {
        context.cookies = { ...context.cookies, ...auth.cookies };
      }
      return;
    }
    
    const loadAuthMatch = text.match(/^load auth from ['"](.+)['"]/i);
    if (loadAuthMatch) {
      const filePath = loadAuthMatch[1];
      const auth = authManager.loadAuth(filePath);
      
      if (!auth) {
        throw new Error(`Failed to load auth from: ${filePath}`);
      }
      
      context.variables['auth'] = auth;
      
      if (auth.token) {
        context.headers['Authorization'] = `Bearer ${auth.token}`;
      }
      if (auth.cookies) {
        context.cookies = { ...context.cookies, ...auth.cookies };
      }
      
      logger.log(`🔐 Auth loaded and applied to requests`);
      return;
    }
    
    if (text.match(/^clear auth/i)) {
      authManager.clearAuth();
      
      delete context.variables['auth'];
      delete context.headers['Authorization'];
      
      logger.log(`🔐 Auth cleared`);
      return;
    }
  }
}
