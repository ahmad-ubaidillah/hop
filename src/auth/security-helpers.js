export class OAuth2Helper {
    config;
    accessToken = null;
    refreshToken = null;
    tokenExpiry = 0;
    constructor(config) {
        this.config = config;
    }
    async getAccessToken(httpClient, context) {
        if (this.accessToken && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }
        if (this.refreshToken) {
            return this.refreshAccessToken(httpClient);
        }
        return this.requestNewToken(httpClient);
    }
    async requestNewToken(httpClient) {
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
        const tokenData = response.body;
        this.accessToken = tokenData.access_token;
        this.refreshToken = tokenData.refresh_token || null;
        this.tokenExpiry = Date.now() + (tokenData.expires_in - 60) * 1000;
        return this.accessToken;
    }
    async refreshAccessToken(httpClient) {
        const params = new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
            refresh_token: this.refreshToken,
        });
        const response = await httpClient.request('POST', this.config.tokenUrl, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        });
        const tokenData = response.body;
        this.accessToken = tokenData.access_token;
        this.refreshToken = tokenData.refresh_token || this.refreshToken;
        this.tokenExpiry = Date.now() + (tokenData.expires_in - 60) * 1000;
        return this.accessToken;
    }
    getAuthHeader() {
        if (!this.accessToken) {
            throw new Error('No access token available. Call getAccessToken() first.');
        }
        return { Authorization: `Bearer ${this.accessToken}` };
    }
    clearTokens() {
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiry = 0;
    }
}
export class JwtHelper {
    static decode(token) {
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid JWT format');
        }
        const payload = parts[1];
        const decoded = Buffer.from(payload, 'base64').toString('utf-8');
        return JSON.parse(decoded);
    }
    static isExpired(token) {
        const payload = JwtHelper.decode(token);
        return Date.now() >= payload.exp * 1000;
    }
    static getExpiry(token) {
        const payload = JwtHelper.decode(token);
        return new Date(payload.exp * 1000);
    }
    static getSubject(token) {
        const payload = JwtHelper.decode(token);
        return payload.sub;
    }
    static async refreshIfExpired(token, refreshToken, tokenUrl, httpClient) {
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
    static checkForSecrets(text) {
        const patterns = [
            { regex: /api[_-]?key["']?\s*[:=]\s*["']?[a-zA-Z0-9]{20,}/i, name: 'API Key' },
            { regex: /password["']?\s*[:=]\s*["']?[^\s"']+/i, name: 'Password' },
            { regex: /secret["']?\s*[:=]\s*["']?[^\s"']+/i, name: 'Secret' },
            { regex: /bearer\s+[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+/i, name: 'Bearer Token' },
            { regex: /ghp_[a-zA-Z0-9]{36}/i, name: 'GitHub Token' },
            { regex: /AKIA[0-9A-Z]{16}/i, name: 'AWS Access Key' },
            { regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i, name: 'Private Key' },
        ];
        const found = [];
        for (const pattern of patterns) {
            if (pattern.regex.test(text)) {
                found.push(pattern.name);
            }
        }
        return { found: found.length > 0, patterns: found };
    }
    static sanitizeForLogging(data) {
        const sanitized = { ...data };
        const sensitiveKeys = ['password', 'secret', 'token', 'key', 'auth', 'credential'];
        for (const key of Object.keys(sanitized)) {
            const lowerKey = key.toLowerCase();
            if (sensitiveKeys.some((sk) => lowerKey.includes(sk))) {
                sanitized[key] = '***REDACTED***';
            }
            else if (typeof sanitized[key] === 'object') {
                sanitized[key] = SecurityScanner.sanitizeForLogging(sanitized[key]);
            }
        }
        return sanitized;
    }
}
export class ApiKeyManager {
    keys = new Map();
    add(name, key, expires, scopes) {
        this.keys.set(name, { key, expires, scopes });
    }
    get(name) {
        const keyData = this.keys.get(name);
        if (!keyData)
            return null;
        if (keyData.expires && keyData.expires < new Date()) {
            this.keys.delete(name);
            return null;
        }
        return keyData.key;
    }
    getHeader(name) {
        const key = this.get(name);
        return key ? { 'X-API-Key': key } : null;
    }
    has(name) {
        return this.get(name) !== null;
    }
    list() {
        return Array.from(this.keys.keys());
    }
    remove(name) {
        this.keys.delete(name);
    }
}
