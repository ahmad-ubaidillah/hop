export interface PlaywrightOptions {
  headless?: boolean;
  browser?: 'chromium' | 'firefox' | 'webkit';
  viewport?: { width: number; height: number };
  timeout?: number;
  video?: boolean | 'always' | 'on-failure' | 'never';
  screenshotOnFailure?: boolean;
  device?: string;
}

export interface ElementLocator {
  selector: string;
  type: 'css' | 'xpath' | 'text' | 'role';
}

export interface NetworkRequest {
  url: string;
  method: string;
  status?: number;
  response?: any;
  postData?: string;
}
