import type { HttpMethod, Response, Logger } from '../types/index.js';

interface RequestOptions {
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  verbose?: boolean;
  retry?: RetryOptions;
  formData?: Record<string, any>;
}

interface RetryOptions {
  maxRetries: number;
  delay: number;
  backoff?: 'linear' | 'exponential';
  retriesOnStatus?: number[];
}

interface Interceptor {
  request?: (options: RequestOptions) => RequestOptions | Promise<RequestOptions>;
  response?: (response: ExtendedResponse, options: RequestOptions) => ExtendedResponse | Promise<ExtendedResponse>;
  error?: (error: Error, options: RequestOptions) => Error | Promise<Error>;
}

// Enhanced Response type to include response time
export interface ExtendedResponse extends Response {
  responseTime: number;
}

export class HttpClient {
  private timeout: number;
  private verbose: boolean;
  private interceptors: Interceptor[] = [];
  private defaultRetry?: RetryOptions;
  private logger: Logger;
  
  constructor(options: { timeout?: number; verbose?: boolean; retry?: RetryOptions; logger?: Logger } = {}) {
    this.timeout = options.timeout || 30000;
    this.verbose = options.verbose || false;
    this.defaultRetry = options.retry;
    this.logger = options.logger || console;
  }
  
  /**
   * Add an interceptor for request/response/error handling
   */
  addInterceptor(interceptor: Interceptor): void {
    this.interceptors.push(interceptor);
  }
  
  /**
   * Remove an interceptor
   */
  removeInterceptor(interceptor: Interceptor): void {
    const index = this.interceptors.indexOf(interceptor);
    if (index > -1) {
      this.interceptors.splice(index, 1);
    }
  }
  
  /**
   * Set default retry options for all requests
   */
  setDefaultRetry(retry: RetryOptions): void {
    this.defaultRetry = retry;
  }
  
  /**
   * Convert object to form-urlencoded format
   */
  private toFormUrlEncoded(data: Record<string, any>): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, String(v)));
      } else {
        params.append(key, String(value));
      }
    }
    return params.toString();
  }
  
  /**
   * Build FormData for multipart/form-data
   */
  private toFormData(data: Record<string, any>): FormData {
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
      if (value instanceof Blob) {
        formData.append(key, value);
      } else if (value instanceof File) {
        formData.append(key, value);
      } else if (Array.isArray(value)) {
        value.forEach(v => formData.append(key, String(v)));
      } else {
        formData.append(key, String(value));
      }
    }
    return formData;
  }
  
  /**
   * Execute HTTP request with retry logic
   */
  async request(options: RequestOptions): Promise<ExtendedResponse> {
    const retryOptions = options.retry || this.defaultRetry;
    let lastError: Error | null = null;
    let attempt = 0;
    const maxAttempts = retryOptions ? retryOptions.maxRetries + 1 : 1;
    
    while (attempt < maxAttempts) {
      try {
        const result = await this.executeRequest(options, attempt);
        
        // Check if we should retry based on status code
        if (retryOptions?.retriesOnStatus && retryOptions.retriesOnStatus.includes(result.status)) {
          attempt++;
          lastError = new Error(`Received retryable status: ${result.status}`);
          await this.delay(this.calculateRetryDelay(retryOptions, attempt));
          continue;
        }
        
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Apply error interceptors
        for (const interceptor of this.interceptors) {
          if (interceptor.error) {
            lastError = await interceptor.error(lastError, options) as Error;
          }
        }
        
        // If retries are exhausted or it's not a network error, throw
        if (attempt >= maxAttempts - 1 || !this.isRetryableError(lastError)) {
          throw lastError;
        }
        
        attempt++;
        
        if (retryOptions) {
          await this.delay(this.calculateRetryDelay(retryOptions, attempt));
        }
      }
    }
    
    throw lastError;
  }
  
  /**
   * Calculate retry delay based on backoff strategy
   */
  private calculateRetryDelay(retryOptions: RetryOptions, attempt: number): number {
    const baseDelay = retryOptions.delay;
    const backoff = retryOptions.backoff || 'exponential';
    
    if (backoff === 'exponential') {
      return baseDelay * Math.pow(2, attempt - 1);
    }
    
    return baseDelay * attempt;
  }
  
  /**
   * Check if error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('econnreset') ||
      message.includes('econnrefused') ||
      message.includes('socket')
    );
  }
  
  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Execute the actual HTTP request
   */
  private async executeRequest(options: RequestOptions, attempt: number): Promise<ExtendedResponse> {
    // Apply request interceptors
    let processedOptions = { ...options };
    for (const interceptor of this.interceptors) {
      if (interceptor.request) {
        processedOptions = await interceptor.request(processedOptions);
      }
    }
    
    const { method, url, headers = {}, body, verbose, formData } = processedOptions;
    const isVerbose = verbose || this.verbose;
    
    const requestHeaders: Record<string, string> = {
      ...headers,
    };
    
    // Handle form-urlencoded content type
    const isFormUrlEncoded = requestHeaders['Content-Type'] === 'application/x-www-form-urlencoded';
    
    // Handle multipart/form-data
    const isMultipart = requestHeaders['Content-Type']?.includes('multipart/form-data');
    
    // Set default content-type if body is present and not set
    if ((body || formData) && !requestHeaders['Content-Type']) {
      if (isFormUrlEncoded) {
        requestHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
      } else if (isMultipart) {
        // Don't set Content-Type for multipart - browser will set with boundary
        delete requestHeaders['Content-Type'];
      } else if (typeof body === 'object') {
        requestHeaders['Content-Type'] = 'application/json';
      } else {
        requestHeaders['Content-Type'] = 'text/plain';
      }
    }
    
    // Build fetch options
    const fetchOptions: RequestInit = {
      method,
      headers: requestHeaders,
    };
    
    // Add body for non-GET requests
    if (body && method !== 'GET' && method !== 'HEAD') {
      if (isFormUrlEncoded && typeof body === 'object') {
        fetchOptions.body = this.toFormUrlEncoded(body);
      } else if (typeof body === 'object') {
        fetchOptions.body = JSON.stringify(body);
      } else {
        fetchOptions.body = body;
      }
    }
    
    // Handle FormData for file uploads
    if (formData && method !== 'GET' && method !== 'HEAD') {
      fetchOptions.body = this.toFormData(formData);
    }
    
    // Log request in verbose mode
    if (isVerbose) {
      this.logger.log('\n📤 HTTP Request:');
      this.logger.log(`   ${method} ${url}`);
      this.logger.log('   Headers:', JSON.stringify(requestHeaders, null, 2));
      if (body) {
        this.logger.log('   Body:', typeof body === 'string' ? body : JSON.stringify(body, null, 2));
      }
      if (formData) {
        this.logger.log('   FormData:', Object.keys(formData));
      }
    }
    
    try {
      const startTime = Date.now();
      const response = await fetch(url, fetchOptions);
      const duration = Date.now() - startTime;
      
      // Get response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      
      // Parse response body
      let responseBody: any;
      const responseText = await response.text();
      
      try {
        responseBody = JSON.parse(responseText);
      } catch {
        responseBody = responseText;
      }
      
      // Get cookies from Set-Cookie header
      const cookies: Record<string, string> = {};
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        const cookieParts = setCookie.split(';');
        if (cookieParts.length > 0) {
          const [name, value] = cookieParts[0].split('=');
          cookies[name] = value;
        }
      }
      
      // Build response object
      let result: ExtendedResponse = {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseBody,
        cookies,
        responseTime: duration,
      };
      
      // Log response in verbose mode
      if (isVerbose) {
        this.logger.log('\n📥 HTTP Response:');
        this.logger.log(`   Status: ${response.status} ${response.statusText}`);
        this.logger.log(`   Duration: ${duration}ms`);
        this.logger.log('   Headers:', JSON.stringify(responseHeaders, null, 2));
        this.logger.log('   Body:', JSON.stringify(responseBody, null, 2));
      }
      
      // Apply response interceptors
      for (const interceptor of this.interceptors) {
        if (interceptor.response) {
          result = await interceptor.response(result, processedOptions);
        }
      }
      
      return result;
    } catch (error) {
      throw new Error(`HTTP request failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  setVerbose(verbose: boolean): void {
    this.verbose = verbose;
  }

  setLogger(logger: Logger): void {
    this.logger = logger;
  }
  
  /**
   * GET request
   */
  async get(url: string, options?: { headers?: Record<string, string>; retry?: RetryOptions }): Promise<ExtendedResponse> {
    return this.request({ method: 'GET', url, ...options });
  }
  
  /**
   * POST request
   */
  async post(url: string, body?: any, options?: { headers?: Record<string, string>; retry?: RetryOptions; formData?: Record<string, any> }): Promise<ExtendedResponse> {
    return this.request({ method: 'POST', url, body, ...options });
  }
  
  /**
   * PUT request
   */
  async put(url: string, body?: any, options?: { headers?: Record<string, string>; retry?: RetryOptions; formData?: Record<string, any> }): Promise<ExtendedResponse> {
    return this.request({ method: 'PUT', url, body, ...options });
  }
  
  /**
   * PATCH request
   */
  async patch(url: string, body?: any, options?: { headers?: Record<string, string>; retry?: RetryOptions; formData?: Record<string, any> }): Promise<ExtendedResponse> {
    return this.request({ method: 'PATCH', url, body, ...options });
  }
  
  /**
   * DELETE request
   */
  async delete(url: string, options?: { headers?: Record<string, string>; retry?: RetryOptions }): Promise<ExtendedResponse> {
    return this.request({ method: 'DELETE', url, ...options });
  }
  
  /**
   * HEAD request
   */
  async head(url: string, options?: { headers?: Record<string, string>; retry?: RetryOptions }): Promise<ExtendedResponse> {
    return this.request({ method: 'HEAD', url, ...options });
  }
  
  /**
   * OPTIONS request
   */
  async options(url: string, options?: { headers?: Record<string, string>; retry?: RetryOptions }): Promise<ExtendedResponse> {
    return this.request({ method: 'OPTIONS', url, ...options });
  }
}
