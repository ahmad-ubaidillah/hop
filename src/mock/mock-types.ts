import type { HttpMethod } from '../types/index.js';

export interface MockRequest {
  path: string;
  method: HttpMethod;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  body: any;
}

export interface MockResponse {
  status: number;
  headers: Record<string, string>;
  body: any;
}

export interface MockOptions {
  featurePath: string;
  port: number;
  verbose: boolean;
}
