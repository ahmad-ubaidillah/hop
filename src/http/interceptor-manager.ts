import type { ExtendedResponse } from './http-client.js';

export interface RequestOptions {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  verbose?: boolean;
  retry?: any;
  formData?: Record<string, any>;
}

export interface Interceptor {
  request?: (options: RequestOptions) => RequestOptions | Promise<RequestOptions>;
  response?: (response: ExtendedResponse, options: RequestOptions) => ExtendedResponse | Promise<ExtendedResponse>;
  error?: (error: Error, options: RequestOptions) => Error | Promise<Error>;
}

export class InterceptorManager {
  private interceptors: Interceptor[] = [];

  public add(interceptor: Interceptor): void {
    this.interceptors.push(interceptor);
  }

  public remove(interceptor: Interceptor): void {
    const index = this.interceptors.indexOf(interceptor);
    if (index > -1) this.interceptors.splice(index, 1);
  }

  public async runRequestInterceptors(options: RequestOptions): Promise<RequestOptions> {
    let processed = { ...options };
    for (const interceptor of this.interceptors) {
      if (interceptor.request) processed = await interceptor.request(processed);
    }
    return processed;
  }

  public async runResponseInterceptors(response: ExtendedResponse, options: RequestOptions): Promise<ExtendedResponse> {
    let result = response;
    for (const interceptor of this.interceptors) {
      if (interceptor.response) result = await interceptor.response(result, options);
    }
    return result;
  }

  public async runErrorInterceptors(error: Error, options: RequestOptions): Promise<Error> {
    let lastError = error;
    for (const interceptor of this.interceptors) {
      if (interceptor.error) lastError = await interceptor.error(lastError, options) as Error;
    }
    return lastError;
  }
}
