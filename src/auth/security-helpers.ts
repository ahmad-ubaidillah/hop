import type { TestContext } from '../types/index.js';

export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  authUrl: string;
  tokenUrl: string;
  redirectUri: string;
  scope?: string[];
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export interface JwtPayload {
  sub: string;
  iss: string;
  aud: string | string[];
  exp: number;
  iat: number;
  [key: string]: any;
}

export class OAuth2Helper {
  private config: OAuth2Config;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: OAuth2Config) {
    this.config = config;
  }

  async getAccessToken(httpClient: any, context: TestContext): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    if (this.refreshToken) {
      return this.refreshAccessToken(httpClient);
    }

    return this.requestNewToken(httpClient);
  }

  private async requestNewToken(httpClient: any): Promise<string> {
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope?.join(' ') || 'openid profile',
    });

    const response = await httpClient.request('POST', this.config.tokenUrl, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const tokenData: TokenResponse = response.body;
    this.accessToken = tokenData.access_token;
    this.refreshToken = tokenData.refresh_token || null;
    this.tokenExpiry = Date.now() + (tokenData.expires_in - 60) * 1000;

    return this.accessToken;
  }

  private async refreshAccessToken(httpClient: any): Promise<string> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: this.refreshToken!,
    });

    const response = await httpClient.request('POST', this.config.tokenUrl, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const tokenData: TokenResponse = response.body;
    this.accessToken = tokenData.access_token;
    this.refreshToken = tokenData.refresh_token || this.refreshToken;
    this.tokenExpiry = Date.now() + (tokenData.expires_in - 60) * 1000;

    return this.accessToken;
  }

  getAuthHeader(): Record<string, string> {
    if (!this.accessToken) {
      throw new Error('No access token available. Call getAccessToken() first.');
    }
    return { Authorization: `Bearer ${this.accessToken}` };
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = 0;
  }
}

export class JwtHelper {
  static decode(token: string): JwtPayload {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  }

  static isExpired(token: string): boolean {
    const payload = JwtHelper.decode(token);
    return Date.now() >= payload.exp * 1000;
  }

  static getExpiry(token: string): Date {
    const payload = JwtHelper.decode(token);
    return new Date(payload.exp * 1000);
  }

  static getSubject(token: string): string {
    const payload = JwtHelper.decode(token);
    return payload.sub;
  }

  static async refreshIfExpired(
    token: string,
    refreshToken: string,
    tokenUrl: string,
    httpClient: any
  ): Promise<string> {
    if (!JwtHelper.isExpired(token)) {
      return token;
    }

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    const response = await httpClient.request('POST', tokenUrl, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    return response.body.access_token;
  }
}

export class SecurityScanner {
  static checkForSecrets(text: string): { found: boolean; patterns: string[] } {
    const patterns = [
      { regex: /api[_-]?key["']?\s*[:=]\s*["']?[a-zA-Z0-9]{20,}/i, name: 'API Key' },
      { regex: /password["']?\s*[:=]\s*["']?[^\s"']+/i, name: 'Password' },
      { regex: /secret["']?\s*[:=]\s*["']?[^\s"']+/i, name: 'Secret' },
      { regex: /bearer\s+[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+/i, name: 'Bearer Token' },
      { regex: /ghp_[a-zA-Z0-9]{36}/i, name: 'GitHub Token' },
      { regex: /AKIA[0-9A-Z]{16}/i, name: 'AWS Access Key' },
      { regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i, name: 'Private Key' },
    ];

    const found: string[] = [];
    for (const pattern of patterns) {
      if (pattern.regex.test(text)) {
        found.push(pattern.name);
      }
    }

    return { found: found.length > 0, patterns: found };
  }

  static sanitizeForLogging(data: any): any {
    const sanitized = { ...data };
    const sensitiveKeys = ['password', 'secret', 'token', 'key', 'auth', 'credential'];

    for (const key of Object.keys(sanitized)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some((sk) => lowerKey.includes(sk))) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = SecurityScanner.sanitizeForLogging(sanitized[key]);
      }
    }

    return sanitized;
  }
}

export class ApiKeyManager {
  private keys: Map<string, { key: string; expires?: Date; scopes?: string[] }> = new Map();

  add(name: string, key: string, expires?: Date, scopes?: string[]): void {
    this.keys.set(name, { key, expires, scopes });
  }

  get(name: string): string | null {
    const keyData = this.keys.get(name);
    if (!keyData) return null;

    if (keyData.expires && keyData.expires < new Date()) {
      this.keys.delete(name);
      return null;
    }

    return keyData.key;
  }

  getHeader(name: string): Record<string, string> | null {
    const key = this.get(name);
    return key ? { 'X-API-Key': key } : null;
  }

  has(name: string): boolean {
    return this.get(name) !== null;
  }

  list(): string[] {
    return Array.from(this.keys.keys());
  }

  remove(name: string): void {
    this.keys.delete(name);
  }
}