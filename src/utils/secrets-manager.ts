/**
 * Secrets Management for Hop Framework
 * Priority 4: Secrets encryption and management
 */

import * as crypto from 'crypto';

export interface SecretConfig {
  encryptionKey?: string;
  keyEnvVar?: string;
  provider?: 'env' | 'vault' | 'aws-secrets' | 'azure-keyvault';
}

export interface Secret {
  key: string;
  value: string;
  encrypted: boolean;
}

/**
 * Secrets Manager
 */
export class SecretsManager {
  private secrets: Map<string, Secret> = new Map();
  private encryptionKey: Buffer | null = null;
  private config: SecretConfig;

  constructor(config: SecretConfig = {}) {
    this.config = {
      keyEnvVar: 'HOP_ENCRYPTION_KEY',
      provider: 'env',
      ...config,
    };

    // Load encryption key from env if available
    const envKey = process.env[this.config.keyEnvVar || 'HOP_ENCRYPTION_KEY'];
    if (envKey) {
      this.encryptionKey = Buffer.from(envKey, 'hex');
    } else if (config.encryptionKey) {
      this.encryptionKey = Buffer.from(config.encryptionKey, 'hex');
    }
  }

  /**
   * Set a secret
   */
  set(key: string, value: string, encrypt: boolean = false): void {
    let finalValue = value;
    
    if (encrypt && this.encryptionKey) {
      finalValue = this.encrypt(value);
    }

    this.secrets.set(key, {
      key,
      value: finalValue,
      encrypted: encrypt,
    });
  }

  /**
   * Get a secret
   */
  get(key: string, decrypt: boolean = false): string | undefined {
    const secret = this.secrets.get(key);
    if (!secret) return undefined;

    if (decrypt && secret.encrypted && this.encryptionKey) {
      return this.decrypt(secret.value);
    }

    return secret.value;
  }

  /**
   * Get all secrets (decrypted)
   */
  getAll(decrypt: boolean = false): Record<string, string> {
    const result: Record<string, string> = {};

    for (const [key, secret] of this.secrets) {
      if (decrypt && secret.encrypted && this.encryptionKey) {
        result[key] = this.decrypt(secret.value);
      } else {
        result[key] = secret.value;
      }
    }

    return result;
  }

  /**
   * Load secrets from environment
   */
  loadFromEnv(prefix: string = 'HOP_SECRET_'): void {
    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith(prefix) && value) {
        const secretKey = key.substring(prefix.length).toLowerCase();
        this.set(secretKey, value, false);
      }
    }
  }

  /**
   * Encrypt value
   */
  encrypt(value: string): string {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not configured');
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);

    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt value
   */
  decrypt(encryptedValue: string): string {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not configured');
    }

    const [ivHex, authTagHex, encrypted] = encryptedValue.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Generate encryption key
   */
  static generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Delete a secret
   */
  delete(key: string): void {
    this.secrets.delete(key);
  }

  /**
   * Clear all secrets
   */
  clear(): void {
    this.secrets.clear();
  }

  /**
   * List secret keys (not values)
   */
  listKeys(): string[] {
    return Array.from(this.secrets.keys());
  }

  /**
   * Check if secret exists
   */
  has(key: string): boolean {
    return this.secrets.has(key);
  }

  /**
   * Import secrets from JSON
   */
  importFromJson(json: string, encrypt: boolean = false): void {
    const data = JSON.parse(json);
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        this.set(key, value, encrypt);
      }
    }
  }

  /**
   * Export secrets to JSON (encrypted)
   */
  exportToJson(encrypt: boolean = true): string {
    const data: Record<string, string> = {};
    
    for (const [key, secret] of this.secrets) {
      if (encrypt) {
        data[key] = this.encrypt(secret.value);
      } else {
        data[key] = secret.value;
      }
    }

    return JSON.stringify(data, null, 2);
  }
}

/**
 * Create secrets manager
 */
export function createSecretsManager(config?: SecretConfig): SecretsManager {
  return new SecretsManager(config);
}

/**
 * Secret decorator for class properties
 */
export function secret(key: string, decrypt: boolean = true) {
  return function (target: any, propertyKey: string) {
    Object.defineProperty(target, propertyKey, {
      get: function () {
        const manager = new SecretsManager();
        return manager.get(key, decrypt);
      },
    });
  };
}

/**
 * Environment variable secret loader
 */
export function loadSecretsFromEnv(prefix: string = 'HOP_SECRET_'): Record<string, string> {
  const result: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith(prefix) && value) {
      const secretKey = key.substring(prefix.length).toLowerCase();
      result[secretKey] = value;
    }
  }
  
  return result;
}
