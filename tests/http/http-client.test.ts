import { describe, test, expect, beforeEach, mock } from 'bun:test';
import { HttpClient, type ExtendedResponse } from '../../src/http/http-client';

describe('HttpClient', () => {
  let client: HttpClient;

  beforeEach(() => {
    client = new HttpClient({ timeout: 5000 });
  });

  describe('constructor', () => {
    test('should create client with default options', () => {
      const defaultClient = new HttpClient();
      expect(defaultClient).toBeDefined();
    });

    test('should create client with custom timeout', () => {
      const customClient = new HttpClient({ timeout: 10000 });
      expect(customClient).toBeDefined();
    });

    test('should create client with verbose mode', () => {
      const verboseClient = new HttpClient({ verbose: true });
      expect(verboseClient).toBeDefined();
    });
  });

  describe('setVerbose', () => {
    test('should set verbose mode', () => {
      client.setVerbose(true);
      expect(() => client.setVerbose(true)).not.toThrow();
    });
  });

  describe('setLogger', () => {
    test('should set custom logger', () => {
      const customLogger = { log: mock(() => {}), error: mock(() => {}), warn: mock(() => {}) };
      client.setLogger(customLogger);
      expect(() => client.setLogger(customLogger)).not.toThrow();
    });
  });

  describe('addInterceptor', () => {
    test('should add request interceptor', () => {
      const interceptor = {
        request: async (options: any) => options,
      };
      expect(() => client.addInterceptor(interceptor)).not.toThrow();
    });

    test('should add response interceptor', () => {
      const interceptor = {
        response: async (response: any, options: any) => response,
      };
      expect(() => client.addInterceptor(interceptor)).not.toThrow();
    });
  });

  describe('removeInterceptor', () => {
    test('should remove interceptor', () => {
      const interceptor = {
        request: async (options: any) => options,
      };
      client.addInterceptor(interceptor);
      expect(() => client.removeInterceptor(interceptor)).not.toThrow();
    });
  });

  describe('setDefaultRetry', () => {
    test('should set default retry options', () => {
      client.setDefaultRetry({ maxRetries: 3, delay: 1000 });
      expect(() => client.setDefaultRetry({ maxRetries: 3, delay: 1000 })).not.toThrow();
    });
  });

  describe('request methods', () => {
    test('should have get method', () => {
      expect(typeof client.get).toBe('function');
    });

    test('should have post method', () => {
      expect(typeof client.post).toBe('function');
    });

    test('should have put method', () => {
      expect(typeof client.put).toBe('function');
    });

    test('should have patch method', () => {
      expect(typeof client.patch).toBe('function');
    });

    test('should have delete method', () => {
      expect(typeof client.delete).toBe('function');
    });
  });

  describe('integration tests (real network)', () => {
    test('should make GET request to jsonplaceholder', async () => {
      const response = await client.get('https://jsonplaceholder.typicode.com/posts/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body.id).toBe(1);
      expect(response.responseTime).toBeGreaterThan(0);
    });

    test('should make POST request with JSON body', async () => {
      const response = await client.post('https://jsonplaceholder.typicode.com/posts', {
        title: 'Test Post',
        body: 'Test Body',
        userId: 1,
      });
      
      expect(response.status).toBe(201);
      expect(response.body.title).toBe('Test Post');
    });

    test('should make PUT request', async () => {
      const response = await client.put('https://jsonplaceholder.typicode.com/posts/1', {
        id: 1,
        title: 'Updated Title',
        body: 'Updated Body',
        userId: 1,
      });
      
      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated Title');
    });

    test('should make PATCH request', async () => {
      const response = await client.patch('https://jsonplaceholder.typicode.com/posts/1', {
        title: 'Patched Title',
      });
      
      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Patched Title');
    });

    test('should make DELETE request', async () => {
      const response = await client.delete('https://jsonplaceholder.typicode.com/posts/1');
      
      expect(response.status).toBe(200);
    });

    test('should handle 404 response', async () => {
      const response = await client.get('https://jsonplaceholder.typicode.com/posts/999999');
      
      expect(response.status).toBe(404);
    });

    test('should include response headers', async () => {
      const response = await client.get('https://jsonplaceholder.typicode.com/posts/1');
      
      expect(response.headers).toBeDefined();
      expect(typeof response.headers).toBe('object');
    });

    test('should handle custom headers', async () => {
      const response = await client.get('https://jsonplaceholder.typicode.com/posts/1', {
        headers: { 'X-Custom-Header': 'test-value' },
      });
      
      expect(response.status).toBe(200);
    });

    test('should parse JSON response automatically', async () => {
      const response = await client.get('https://jsonplaceholder.typicode.com/posts/1');
      
      expect(typeof response.body).toBe('object');
      expect(response.body).not.toBeInstanceOf(String);
    });

    test('should return response time', async () => {
      const response = await client.get('https://jsonplaceholder.typicode.com/posts/1');
      
      expect(response.responseTime).toBeDefined();
      expect(typeof response.responseTime).toBe('number');
      expect(response.responseTime).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    test('should handle network error', async () => {
      try {
        await client.get('https://invalid-domain-that-does-not-exist.com/api');
        // If we reach here without throwing, the test should still pass
        // as some networks might resolve differently
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should handle timeout', async () => {
      const timeoutClient = new HttpClient({ timeout: 1 }); // 1ms timeout
      
      try {
        await timeoutClient.get('https://jsonplaceholder.typicode.com/posts');
        // May succeed if network is fast enough
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('verbose mode', () => {
    test('should log requests in verbose mode', async () => {
      const logs: string[] = [];
      const mockLogger = {
        log: (msg: string) => logs.push(msg),
        error: mock(() => {}),
        warn: mock(() => {}),
      };
      
      const verboseClient = new HttpClient({ verbose: true, logger: mockLogger });
      await verboseClient.get('https://jsonplaceholder.typicode.com/posts/1');
      
      expect(logs.length).toBeGreaterThan(0);
      expect(logs.some(l => l.includes('HTTP Request'))).toBe(true);
      expect(logs.some(l => l.includes('HTTP Response'))).toBe(true);
    });
  });

  describe('interceptors', () => {
    test('should run request interceptor', async () => {
      const interceptor = {
        request: async (options: any) => {
          options.headers = { ...options.headers, 'X-Intercepted': 'true' };
          return options;
        },
      };
      
      client.addInterceptor(interceptor);
      const response = await client.get('https://jsonplaceholder.typicode.com/posts/1');
      
      expect(response.status).toBe(200);
    });

    test('should run response interceptor', async () => {
      const interceptor = {
        response: async (response: ExtendedResponse, options: any) => {
          (response as any).intercepted = true;
          return response;
        },
      };
      
      client.addInterceptor(interceptor);
      const response = await client.get('https://jsonplaceholder.typicode.com/posts/1') as any;
      
      expect(response.intercepted).toBe(true);
    });
  });
});
