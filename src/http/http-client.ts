import type { HttpMethod, Response } from '../types/index.js';

interface RequestOptions {
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  verbose?: boolean;
}

export class HttpClient {
  private timeout: number;
  private verbose: boolean;
  
  constructor(options: { timeout?: number; verbose?: boolean } = {}) {
    this.timeout = options.timeout || 30000;
    this.verbose = options.verbose || false;
  }
  
  /**
   * Execute HTTP request using Bun.fetch
   */
  async request(options: RequestOptions): Promise<Response> {
    const { method, url, headers = {}, body, verbose } = options;
    const isVerbose = verbose || this.verbose;
    
    const requestHeaders: Record<string, string> = {
      ...headers,
    };
    
    // Set default content-type if body is present and not set
    if (body && !requestHeaders['Content-Type']) {
      if (typeof body === 'object') {
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
      if (typeof body === 'object') {
        fetchOptions.body = JSON.stringify(body);
      } else {
        fetchOptions.body = body;
      }
    }
    
    // Log request in verbose mode
    if (isVerbose) {
      console.log('\n📤 HTTP Request:');
      console.log(`   ${method} ${url}`);
      console.log('   Headers:', JSON.stringify(requestHeaders, null, 2));
      if (body) {
        console.log('   Body:', typeof body === 'string' ? body : JSON.stringify(body, null, 2));
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
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        try {
          responseBody = await response.json();
        } catch {
          responseBody = await response.text();
        }
      } else {
        responseBody = await response.text();
        
        // Try to parse as JSON anyway
        try {
          responseBody = JSON.parse(responseBody);
        } catch {}
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
      
      // Log response in verbose mode
      if (isVerbose) {
        console.log('\n📥 HTTP Response:');
        console.log(`   Status: ${response.status} ${response.statusText}`);
        console.log(`   Duration: ${duration}ms`);
        console.log('   Headers:', JSON.stringify(responseHeaders, null, 2));
        console.log('   Body:', JSON.stringify(responseBody, null, 2));
      }
      
      return {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseBody,
        cookies,
      };
    } catch (error) {
      throw new Error(`HTTP request failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  setVerbose(verbose: boolean): void {
    this.verbose = verbose;
  }
  
  /**
   * GET request
   */
  async get(url: string, options?: { headers?: Record<string, string> }): Promise<Response> {
    return this.request({ method: 'GET', url, ...options });
  }
  
  /**
   * POST request
   */
  async post(url: string, body?: any, options?: { headers?: Record<string, string> }): Promise<Response> {
    return this.request({ method: 'POST', url, body, ...options });
  }
  
  /**
   * PUT request
   */
  async put(url: string, body?: any, options?: { headers?: Record<string, string> }): Promise<Response> {
    return this.request({ method: 'PUT', url, body, ...options });
  }
  
  /**
   * PATCH request
   */
  async patch(url: string, body?: any, options?: { headers?: Record<string, string> }): Promise<Response> {
    return this.request({ method: 'PATCH', url, body, ...options });
  }
  
  /**
   * DELETE request
   */
  async delete(url: string, options?: { headers?: Record<string, string> }): Promise<Response> {
    return this.request({ method: 'DELETE', url, ...options });
  }
  
  /**
   * HEAD request
   */
  async head(url: string, options?: { headers?: Record<string, string> }): Promise<Response> {
    return this.request({ method: 'HEAD', url, ...options });
  }
  
  /**
   * OPTIONS request
   */
  async options(url: string, options?: { headers?: Record<string, string> }): Promise<Response> {
    return this.request({ method: 'OPTIONS', url, ...options });
  }
}
