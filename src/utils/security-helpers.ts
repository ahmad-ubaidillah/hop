/**
 * Security Testing Helpers for Hop Framework
 * SQL injection, XSS, CSRF token handling utilities
 */

export interface SecurityTestResult {
  vulnerable: boolean;
  payload: string;
  evidence?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface CSRFTokenInfo {
  name: string;
  value: string;
  found: boolean;
  location: 'header' | 'body' | 'cookie' | 'meta';
}

/**
 * SQL Injection Tester
 */
export class SQLInjectionTester {
  private static readonly SQL_PAYLOADS = [
    "' OR '1'='1",
    "' OR '1'='1' --",
    "' OR '1'='1' /*",
    "'; DROP TABLE users; --",
    "' UNION SELECT NULL--",
    "' UNION SELECT NULL, NULL--",
    "' OR 1=1--",
    "admin' --",
    "admin' #",
    "' OR 'x'='x",
    "' OR 1=1 LIMIT 1;--",
    "1' AND '1'='1",
    "1' AND '1'='1' --",
    "' OR ''='",
    "' OR '1'='1' OR ''='",
    "' OR 1=1--",
    "1=1",
    "' OR 'a'='a",
    "' OR 1=1#",
    "') OR ('1'='1",
  ];
  
  private static readonly BLIND_PAYLOADS = [
    "' AND 1=1--",
    "' AND 1=2--",
    "' AND SLEEP(5)--",
    "' AND BENCHMARK(1000000,MD5('X'))--",
    "' WAITFOR DELAY '00:00:05'--",
  ];
  
  /**
   * Test for SQL injection vulnerabilities
   */
  static async testSQLInjection(
    testFn: (payload: string) => Promise<{ success: boolean; error?: string; time?: number }>
  ): Promise<SecurityTestResult[]> {
    const results: SecurityTestResult[] = [];
    
    for (const payload of this.SQL_PAYLOADS) {
      try {
        const result = await testFn(payload);
        
        // Check for SQL errors in response
        const sqlErrors = [
          'sql syntax',
          'mysql',
          'postgresql',
          'sqlite',
          'ora-',
          'microsoft sql',
          'odbc',
          'sqlserver',
          'unterminated',
          'quoted string not properly terminated',
          'sql command not properly ended',
        ];
        
        const errorLower = (result.error || '').toLowerCase();
        const hasSQLError = sqlErrors.some(err => errorLower.includes(err));
        
        // Check for time-based blind injection
        const isBlindInjection = result.time && result.time > 3000;
        
        if (hasSQLError || isBlindInjection || result.success) {
          results.push({
            vulnerable: true,
            payload,
            evidence: result.error || `Time: ${result.time}ms`,
            severity: hasSQLError ? 'critical' : isBlindInjection ? 'high' : 'medium',
          });
        }
      } catch (error) {
        // Continue testing
      }
    }
    
    return results;
  }
  
  /**
   * Test for blind SQL injection
   */
  static async testBlindSQLInjection(
    testFn: (payload: string) => Promise<boolean>
  ): Promise<boolean> {
    for (const payload of this.BLIND_PAYLOADS) {
      try {
        const result = await testFn(payload);
        if (result) {
          return true;
        }
      } catch {
        // Continue testing
      }
    }
    return false;
  }
  
  /**
   * Generate SQL injection test data for data tables
   */
  static generateTestData(): string[] {
    return [...this.SQL_PAYLOADS];
  }
}

/**
 * XSS Tester
 */
export class XSSTester {
  private static readonly XSS_PAYLOADS = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    '<svg onload=alert("XSS")>',
    '<iframe src="javascript:alert(1)">',
    '<body onload=alert(1)>',
    '<input onfocus=alert(1) autofocus>',
    '<select onfocus=alert(1) autofocus>',
    '<textarea onfocus=alert(1) autofocus>',
    '<keygen onfocus=alert(1) autofocus>',
    '<video><source onerror="alert(1)">',
    '<audio src=x onerror=alert(1)>',
    '<details open ontoggle=alert(1)>',
    '<marquee onstart=alert(1)>',
    '<object data="javascript:alert(1)">',
    '<embed src="javascript:alert(1)">',
    '<link rel="import" href="javascript:alert(1)">',
    '<base href="javascript:alert(1)//">',
    '<meta http-equiv="refresh" content="0;javascript:alert(1)">',
    '<svg><animate onbegin=alert(1) attributeName=x>',
    '<div onclick="alert(1)">click</div>',
    '<a href="javascript:alert(1)">link</a>',
    '"><script>alert(1)</script>',
    "'><script>alert(1)</script>",
    '<script>eval(atob("YWxlcnQoMSk="))</script>',
    '<img src="x" onerror="&#97;&#108;&#101;&#114;&#116;&#40;&#49;&#41;">',
  ];
  
  /**
   * Test for XSS vulnerabilities
   */
  static async testXSS(
    testFn: (payload: string) => Promise<{ html: string; reflected: boolean }>
  ): Promise<SecurityTestResult[]> {
    const results: SecurityTestResult[] = [];
    
    for (const payload of this.XSS_PAYLOADS) {
      try {
        const result = await testFn(payload);
        
        // Check if payload is reflected without escaping
        const isReflected = result.reflected && 
          (result.html.includes('<script') || 
           result.html.includes('onerror=') ||
           result.html.includes('onload=') ||
           result.html.includes('javascript:'));
        
        if (isReflected) {
          results.push({
            vulnerable: true,
            payload,
            evidence: 'Payload reflected without escaping',
            severity: 'critical',
          });
        }
      } catch {
        // Continue testing
      }
    }
    
    return results;
  }
  
  /**
   * Test for stored XSS
   */
  static async testStoredXSS(
    storeFn: (payload: string) => Promise<void>,
    retrieveFn: () => Promise<string>
  ): Promise<SecurityTestResult | null> {
    const testPayload = '<script>alert("XSS")</script>';
    
    try {
      await storeFn(testPayload);
      const retrieved = await retrieveFn();
      
      if (retrieved.includes('<script>') || retrieved.includes('onerror=')) {
        return {
          vulnerable: true,
          payload: testPayload,
          evidence: 'XSS payload stored and retrieved without sanitization',
          severity: 'critical',
        };
      }
    } catch {
      // Continue testing
    }
    
    return null;
  }
  
  /**
   * Generate XSS test data for data tables
   */
  static generateTestData(): string[] {
    return [...this.XSS_PAYLOADS];
  }
  
  /**
   * Encode payload for testing
   */
  static encodePayload(payload: string, encoding: 'html' | 'url' | 'base64'): string {
    switch (encoding) {
      case 'html':
        return payload
          .replace(/&/g, '&')
          .replace(/</g, '<')
          .replace(/>/g, '>')
          .replace(/"/g, '"')
          .replace(/'/g, '&#x27;');
      case 'url':
        return encodeURIComponent(payload);
      case 'base64':
        return Buffer.from(payload).toString('base64');
      default:
        return payload;
    }
  }
}

/**
 * CSRF Token Handler
 */
export class CSRFTokenHandler {
  /**
   * Extract CSRF token from response
   */
  static extractFromHTML(html: string): CSRFTokenInfo | null {
    // Check meta tags
    const metaMatch = html.match(/<meta[^>]*name=["']csrf-token["'][^>]*content=["']([^"']+)["']/i);
    if (metaMatch) {
      return {
        name: 'csrf-token',
        value: metaMatch[1],
        found: true,
        location: 'meta',
      };
    }
    
    // Check hidden form fields
    const formMatch = html.match(/<input[^>]*name=["']csrf[^>]*value=["']([^"']+)["']/i);
    if (formMatch) {
      return {
        name: 'csrf',
        value: formMatch[1],
        found: true,
        location: 'body',
      };
    }
    
    // Check data attributes
    const dataMatch = html.match(/data-csrf=["']([^"']+)["']/i);
    if (dataMatch) {
      return {
        name: 'csrf',
        value: dataMatch[1],
        found: true,
        location: 'body',
      };
    }
    
    return null;
  }
  
  /**
   * Extract CSRF token from cookies
   */
  static extractFromCookies(cookies: string[]): CSRFTokenInfo | null {
    for (const cookie of cookies) {
      const match = cookie.match(/csrf[^=]*=([^;]+)/i);
      if (match) {
        return {
          name: 'csrf',
          value: match[1],
          found: true,
          location: 'cookie',
        };
      }
    }
    return null;
  }
  
  /**
   * Extract CSRF token from headers
   */
  static extractFromHeaders(headers: Record<string, string>): CSRFTokenInfo | null {
    const csrfHeader = headers['x-csrf-token'] || 
                       headers['x-xsrf-token'] ||
                       headers['x-csrf'];
    
    if (csrfHeader) {
      return {
        name: 'csrf',
        value: csrfHeader,
        found: true,
        location: 'header',
      };
    }
    
    return null;
  }
  
  /**
   * Validate CSRF token exists
   */
  static validate(response: {
    html?: string;
    cookies?: string[];
    headers?: Record<string, string>;
  }): CSRFTokenInfo {
    if (response.html) {
      const fromHTML = this.extractFromHTML(response.html);
      if (fromHTML) return fromHTML;
    }
    
    if (response.cookies) {
      const fromCookies = this.extractFromCookies(response.cookies);
      if (fromCookies) return fromCookies;
    }
    
    if (response.headers) {
      const fromHeaders = this.extractFromHeaders(response.headers);
      if (fromHeaders) return fromHeaders;
    }
    
    return {
      name: 'csrf',
      value: '',
      found: false,
      location: 'header',
    };
  }
}

/**
 * Security Headers Validator
 */
export class SecurityHeadersValidator {
  private static readonly REQUIRED_HEADERS = [
    'content-security-policy',
    'x-content-type-options',
    'x-frame-options',
    'x-xss-protection',
  ];
  
  private static readonly RECOMMENDED_HEADERS = [
    'strict-transport-security',
    'referrer-policy',
    'permissions-policy',
    'cross-origin-opener-policy',
    'cross-origin-embedder-policy',
    'cross-origin-resource-policy',
  ];
  
  /**
   * Validate security headers
   */
  static validate(headers: Record<string, string>): {
    required: Record<string, string | null>;
    recommended: Record<string, string | null>;
  } {
    const required: Record<string, string | null> = {};
    const recommended: Record<string, string | null> = {};
    
    for (const header of this.REQUIRED_HEADERS) {
      required[header] = headers[header] || null;
    }
    
    for (const header of this.RECOMMENDED_HEADERS) {
      recommended[header] = headers[header] || null;
    }
    
    return { required, recommended };
  }
  
  /**
   * Check specific security header
   */
  static checkHeader(headers: Record<string, string>, headerName: string): boolean {
    return !!headers[headerName.toLowerCase()];
  }
  
  /**
   * Validate X-Frame-Options
   */
  static validateXFrameOptions(headers: Record<string, string>): boolean {
    const value = headers['x-frame-options'];
    return value === 'DENY' || value === 'SAMEORIGIN';
  }
  
  /**
   * Validate Content-Security-Policy
   */
  static validateCSP(headers: Record<string, string>): boolean {
    const csp = headers['content-security-policy'];
    return !!csp && !csp.includes('unsafe-inline') && !csp.includes('unsafe-eval');
  }
}

/**
 * Create SQL injection tester
 */
export function createSQLInjectionTester(): typeof SQLInjectionTester {
  return SQLInjectionTester;
}

/**
 * Create XSS tester
 */
export function createXSSTester(): typeof XSSTester {
  return XSSTester;
}

/**
 * Create CSRF token handler
 */
export function createCSRFTokenHandler(): typeof CSRFTokenHandler {
  return CSRFTokenHandler;
}

/**
 * Create security headers validator
 */
export function createSecurityHeadersValidator(): typeof SecurityHeadersValidator {
  return SecurityHeadersValidator;
}
