import type { Response } from '../types/index.js';

/**
 * GraphQL client for Hop testing framework
 */
export class GraphQLClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  
  constructor(baseUrl: string, headers: Record<string, string> = {}) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };
  }
  
  /**
   * Execute a GraphQL query
   */
  async query(query: string, variables?: Record<string, any>, operationName?: string): Promise<Response & { data?: any; errors?: any[] }> {
    const body: Record<string, any> = { query };
    
    if (variables) {
      body.variables = variables;
    }
    
    if (operationName) {
      body.operationName = operationName;
    }
    
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify(body),
    });
    
    const responseBody: any = await response.json();
    
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
    
    // Get response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    
    return {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
      cookies,
      data: responseBody.data,
      errors: responseBody.errors,
    };
  }
  
  /**
   * Execute a GraphQL mutation
   */
  async mutation(mutation: string, variables?: Record<string, any>, operationName?: string): Promise<Response & { data?: any; errors?: any[] }> {
    return this.query(mutation, variables, operationName);
  }
  
  /**
   * Execute a GraphQL subscription (via WebSocket)
   */
  async *subscribe(query: string, variables?: Record<string, any>): AsyncGenerator<any> {
    const wsUrl = this.baseUrl.replace(/^http/, 'ws');
    const ws = new WebSocket(wsUrl);
    
    // Wait for connection
    await new Promise<void>((resolve, reject) => {
      ws.onopen = () => resolve();
      ws.onerror = (error) => reject(error);
    });
    
    // Send subscription query
    ws.send(JSON.stringify({
      query,
      variables,
    }));
    
    // Yield each message
    while (true) {
      const message = await new Promise<any>((resolve) => {
        ws.onmessage = (event) => resolve(JSON.parse(event.data));
      });
      
      if (message.errors) {
        throw new Error(`GraphQL subscription errors: ${JSON.stringify(message.errors)}`);
      }
      
      if (message.data) {
        yield message.data;
      }
    }
  }
  
  /**
   * Set authorization header
   */
  setAuthorization(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  /**
   * Set custom headers
   */
  setHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }
  
  /**
   * Build a GraphQL query string from template
   */
  static buildQuery(queryName: string, fields: string[], variables?: Record<string, string>): string {
    const fieldsStr = fields.join('\n');
    const varDefs = variables 
      ? `(${(Object.keys(variables).map(k => `${k}: ${variables[k]}`)).join(', ')})`
      : '';
    
    return `query ${queryName}${varDefs} {
  ${fieldsStr}
}`;
  }
  
  /**
   * Build a GraphQL mutation string from template
   */
  static buildMutation(mutationName: string, inputFields: Record<string, string>, returnFields: string[]): string {
    const inputStr = `{${Object.entries(inputFields).map(([k, v]) => `${k}: ${v}`).join(', ')}}`;
    const fieldsStr = returnFields.join('\n');
    
    return `mutation ${mutationName}($input: ${mutationName}Input!) {
  ${mutationName}(input: $input) {
    ${fieldsStr}
  }
}`;
  }
}
