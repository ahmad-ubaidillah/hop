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
  // OAuth specific
  refreshToken?: string;
  oauthTokenType?: string;
  // JWT specific
  jwtPayload?: Record<string, any>;
  jwtExpiresAt?: number;
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
    
    // Handle multiple cookies separated by comma (but not commas in values)
    // Split on comma that is followed by a space and cookie attribute
    const cookieParts = setCookie.split(/,(?=\s*(?:Path|Domain|Expires|Secure|HttpOnly|SameSite|[A-Z])[=])/i);
    
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
  
  // ==================== JWT Support ====================
  
  /**
   * Decode JWT token (without verification - for testing purposes)
   */
  decodeJWT(token: string): { payload: Record<string, any>; header: Record<string, any> } | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const decode = (str: string): any => {
        const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(Buffer.from(base64, 'base64').toString());
      };
      
      return {
        header: decode(parts[0]),
        payload: decode(parts[1]),
      };
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Check if JWT token is expired or about to expire
   */
  isJWTExpiringSoon(auth: AuthData, bufferSeconds: number = 60): boolean {
    if (!auth.jwtExpiresAt) return false;
    const bufferMs = bufferSeconds * 1000;
    return Date.now() + bufferMs >= auth.jwtExpiresAt;
  }
  
  /**
   * Create auth from JWT token
   */
  createAuthFromJWT(token: string, refreshToken?: string): AuthData {
    const decoded = this.decodeJWT(token);
    const auth: AuthData = {
      token,
      createdAt: Date.now(),
      refreshToken,
    };
    
    if (decoded?.payload) {
      auth.jwtPayload = decoded.payload;
      // Handle exp claim
      if (decoded.payload.exp) {
        auth.jwtExpiresAt = decoded.payload.exp * 1000;
        auth.expiresAt = auth.jwtExpiresAt;
      }
      // Handle iat claim
      if (decoded.payload.iat) {
        auth.createdAt = decoded.payload.iat * 1000;
      }
    }
    
    return auth;
  }
  
  /**
   * Auto-refresh JWT token if expiring soon
   */
  async refreshJWTIfNeeded(
    auth: AuthData,
    refreshFn: () => Promise<{ token: string; refreshToken?: string }>
  ): Promise<AuthData> {
    if (!this.isJWTExpiringSoon(auth)) {
      return auth;
    }
    
    if (!auth.refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const newTokens = await refreshFn();
    return this.createAuthFromJWT(newTokens.token, newTokens.refreshToken || auth.refreshToken);
  }
  
  // ==================== OAuth Support ====================
  
  /**
   * OAuth 2.0 configuration
   */
  async performOAuth2Flow(config: {
    authorizationUrl: string;
    tokenUrl: string;
    clientId: string;
    clientSecret?: string;
    redirectUri: string;
    scope?: string;
    code: string;
  }): Promise<AuthData> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.clientId,
      client_secret: config.clientSecret || '',
      code: config.code,
      redirect_uri: config.redirectUri,
    });
    
    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: params.toString(),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OAuth token exchange failed: ${error}`);
    }
    
    const tokens = await response.json() as {
      access_token: string;
      refresh_token?: string;
      token_type?: string;
      expires_in?: number;
    };
    
    return {
      token: tokens.access_token,
      refreshToken: tokens.refresh_token,
      oauthTokenType: tokens.token_type || 'Bearer',
      expiresAt: tokens.expires_in ? Date.now() + (tokens.expires_in * 1000) : undefined,
      createdAt: Date.now(),
    };
  }
  
  /**
   * Refresh OAuth 2.0 token
   */
  async refreshOAuth2Token(
    tokenUrl: string,
    clientId: string,
    refreshToken: string,
    clientSecret?: string
  ): Promise<AuthData> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      refresh_token: refreshToken,
    });
    
    if (clientSecret) {
      params.append('client_secret', clientSecret);
    }
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: params.toString(),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OAuth token refresh failed: ${error}`);
    }
    
    const tokens = await response.json() as {
      access_token: string;
      refresh_token?: string;
      token_type?: string;
      expires_in?: number;
    };
    
    return {
      token: tokens.access_token,
      refreshToken: tokens.refresh_token || refreshToken,
      oauthTokenType: tokens.token_type || 'Bearer',
      expiresAt: tokens.expires_in ? Date.now() + (tokens.expires_in * 1000) : undefined,
      createdAt: Date.now(),
    };
  }
}
