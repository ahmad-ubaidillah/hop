// Core types for Hop BDD Framework

export interface Feature {
  name: string;
  description?: string;
  scenarios: Scenario[];
  background?: Background;
  tags: string[];
  filePath: string;
  rules?: Rule[];
}

export interface Rule {
  name: string;
  description?: string;
  scenarios: Scenario[];
  tags: string[];
}

export interface Background {
  steps: Step[];
}

export interface Scenario {
  name: string;
  steps: Step[];
  tags: string[];
  examples?: Example[];
  outline?: boolean;
}

export interface Example {
  name?: string;
  table: DataTable;
}

export interface DataTable {
  headers: string[];
  rows: string[][];
}

export interface Step {
  keyword: 'Given' | 'When' | 'Then' | 'And' | 'But';
  text: string;
  docString?: string;
  dataTable?: DataTable;
  line: number;
}

export interface Logger {
  log: (...args: any[]) => void;
  error: (...args: any[]) => void;
  warn: (...args: any[]) => void;
}

export interface TestContext {
  baseUrl: string;
  path: string;
  method: HttpMethod;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  body: any;
  formData?: Record<string, any>;
  variables: Record<string, any>;
  read: (filePath: string) => Promise<any>;
  response?: Response;
  cookies: Record<string, string>;
  logger: Logger;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface Response {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  cookies: Record<string, string>;
  responseTime?: number;
}

export interface TestResult {
  featureName: string;
  scenarioName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  steps: StepResult[];
  tags: string[];
  screenshotPath?: string;
}

export interface StepResult {
  step: Step;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  screenshotPath?: string;
}

export interface HopConfig {
  features: string;
  steps: string;
  reports: string;
  format: string[];
  timeout: number;
  retry: number;
  parallel: number;
  tags: {
    include: string[];
    exclude: string[];
  };
  headers: Record<string, string>;
}

export interface EngineOptions {
  featuresPath: string;
  stepsPath: string;
  tags: string;
  env: string;
  verbose: boolean;
  timeout: number;
  retry: number;
  parallel: boolean;
  concurrency: number;
  report?: 'html' | 'json' | 'junit';
  reportDir?: string;
}
