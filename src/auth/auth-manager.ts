/**
 * Auth Manager for Hop BDD Framework
 * Handles saving, loading, and managing authentication state
 */
import * as fs from 'fs';
import * as path from 'path';

export interface AuthData {
  token?: string;
  cookies?: Record<string, string>;
  headers?: Record<string, string>;
  expiresAt?: number; // Unix timestamp in ms
  createdAt: number;
  userId?: string;
  username?: string;
}

export interface AuthOptions {
  expiresIn?: number; // Duration in ms before auth expires
}

const DEFAULT_AUTH_FILE = '.hop/auth.json';

/**
 * AuthManager handles authentication state persistence
 */
export class AuthManager {
  private authDir: string = '.hop';
  private defaultAuthFile: string;
  
  constructor(authDir?: string) {
    this.authDir = authDir || this.authDir;
    this.defaultAuthFile = path.join(this.authDir, 'auth.json');
    
    // Ensure auth directory exists
    this.ensureAuthDir();
  }
  
  /**
   * Ensure auth directory exists
   */
  private ensureAuthDir(): void {
    if (!fs.existsSync(this.authDir)) {
      fs.mkdirSync(this.authDir, { recursive: true });
    }
  }
  
  /**
   * Save authentication data to file
   */
  saveAuth(auth: AuthData, filePath?: string): void {
    const targetPath = filePath || this.defaultAuthPath();
    
    // Ensure directory exists
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Add created timestamp if not present
    if (!auth.createdAt) {
      auth.createdAt = Date.now();
    }
    
    // Write auth data to file
    fs.writeFileSync(targetPath, JSON.stringify(auth, null, 2), 'utf-8');
    console.log(`🔐 Auth saved to: ${targetPath}`);
  }
  
  /**
   * Load authentication data from file
   */
  loadAuth(filePath?: string): AuthData | null {
    const targetPath = filePath || this.defaultAuthPath();
    
    if (!fs.existsSync(targetPath)) {
      console.log(`⚠️  Auth file not found: ${targetPath}`);
      return null;
    }
    
    try {
      const content = fs.readFileSync(targetPath, 'utf-8');
      const auth = JSON.parse(content) as AuthData;
      
      // Check if auth is expired
      if (auth.expiresAt && Date.now() > auth.expiresAt) {
        console.log('⚠️  Auth has expired');
        return null;
      }
      
      console.log(`🔐 Auth loaded from: ${targetPath}`);
      return auth;
    } catch (error) {
      console.error(`❌ Failed to load auth: ${error}`);
      return null;
    }
  }
  
  /**
   * Check if auth exists and is valid
   */
  hasValidAuth(filePath?: string): boolean {
    const auth = this.loadAuth(filePath);
    return auth !== null;
  }
  
  /**
   * Clear authentication data
   */
  clearAuth(filePath?: string): void {
    const targetPath = filePath || this.defaultAuthPath();
    
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
      console.log(`🔐 Auth cleared: ${targetPath}`);
    }
  }
  
  /**
   * Create auth data from response (login)
   */
  createAuthFromLogin(
    response: { headers?: Record<string, string>; body?: any },
    options: AuthOptions = {}
  ): AuthData {
    const auth: AuthData = {
      createdAt: Date.now(),
    };
    
    // Extract token from response headers
    if (response.headers) {
      // Check for common auth header names
      const tokenHeader = response.headers['authorization'] || 
                        response.headers['Authorization'] ||
                        response.headers['x-auth-token'];
      
      if (tokenHeader) {
        // Handle "Bearer <token>" format
        auth.token = tokenHeader.replace(/^Bearer\s+/i, '');
      }
      
      // Extract cookies
      const setCookie = response.headers['set-cookie'] || response.headers['Set-Cookie'];
      if (setCookie) {
        auth.cookies = this.parseCookies(setCookie);
      }
    }
    
    // Extract token from response body (common patterns)
    if (response.body) {
      if (typeof response.body === 'object') {
        auth.token = auth.token || 
                    response.body.token || 
                    response.body.access_token ||
                    response.body.authToken ||
                    response.body.jwt;
        
        auth.userId = response.body.userId || 
                     response.body.user_id || 
                     response.body.id;
        
        auth.username = response.body.username || 
                       response.body.email ||
                       response.body.name;
      }
    }
    
    // Set expiration if specified
    if (options.expiresIn) {
      auth.expiresAt = Date.now() + options.expiresIn;
    }
    
    return auth;
  }
  
  /**
   * Parse Set-Cookie header into key-value pairs
   */
  private parseCookies(setCookie: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    
    // Handle multiple cookies separated by comma
    const cookieParts = setCookie.split(',');
    
    for (const part of cookieParts) {
      const [nameValue] = part.split(';');
      const [name, value] = nameValue.split('=');
      if (name && value) {
        cookies[name.trim()] = value.trim();
      }
    }
    
    return cookies;
  }
  
  /**
   * Get default auth file path
   */
  private defaultAuthPath(): string {
    return this.defaultAuthFile;
  }
  
  /**
   * Set custom auth directory
   */
  setAuthDir(dir: string): void {
    this.authDir = dir;
    this.defaultAuthFile = path.join(dir, 'auth.json');
    this.ensureAuthDir();
  }
  
  /**
   * Get auth file path
   */
  getAuthPath(name?: string): string {
    if (name) {
      return path.join(this.authDir, `${name}.json`);
    }
    return this.defaultAuthFile;
  }
}
