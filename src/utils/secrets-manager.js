/**
 * Secrets Management for Hop Framework
 * Priority 4: Secrets encryption and management
 */
import * as crypto from 'crypto';
/**
 * Secrets Manager
 */
export class SecretsManager {
    secrets = new Map();
    encryptionKey = null;
    config;
    constructor(config = {}) {
        this.config = {
            keyEnvVar: 'HOP_ENCRYPTION_KEY',
            provider: 'env',
            ...config,
        };
        // Load encryption key from env if available
        const envKey = process.env[this.config.keyEnvVar || 'HOP_ENCRYPTION_KEY'];
        if (envKey) {
            this.encryptionKey = Buffer.from(envKey, 'hex');
        }
        else if (config.encryptionKey) {
            this.encryptionKey = Buffer.from(config.encryptionKey, 'hex');
        }
    }
    /**
     * Set a secret
     */
    set(key, value, encrypt = false) {
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
    get(key, decrypt = false) {
        const secret = this.secrets.get(key);
        if (!secret)
            return undefined;
        if (decrypt && secret.encrypted && this.encryptionKey) {
            return this.decrypt(secret.value);
        }
        return secret.value;
    }
    /**
     * Get all secrets (decrypted)
     */
    getAll(decrypt = false) {
        const result = {};
        for (const [key, secret] of this.secrets) {
            if (decrypt && secret.encrypted && this.encryptionKey) {
                result[key] = this.decrypt(secret.value);
            }
            else {
                result[key] = secret.value;
            }
        }
        return result;
    }
    /**
     * Load secrets from environment
     */
    loadFromEnv(prefix = 'HOP_SECRET_') {
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
    encrypt(value) {
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
    decrypt(encryptedValue) {
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
    static generateKey() {
        return crypto.randomBytes(32).toString('hex');
    }
    /**
     * Delete a secret
     */
    delete(key) {
        this.secrets.delete(key);
    }
    /**
     * Clear all secrets
     */
    clear() {
        this.secrets.clear();
    }
    /**
     * List secret keys (not values)
     */
    listKeys() {
        return Array.from(this.secrets.keys());
    }
    /**
     * Check if secret exists
     */
    has(key) {
        return this.secrets.has(key);
    }
    /**
     * Import secrets from JSON
     */
    importFromJson(json, encrypt = false) {
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
    exportToJson(encrypt = true) {
        const data = {};
        for (const [key, secret] of this.secrets) {
            if (encrypt) {
                data[key] = this.encrypt(secret.value);
            }
            else {
                data[key] = secret.value;
            }
        }
        return JSON.stringify(data, null, 2);
    }
}
/**
 * Create secrets manager
 */
export function createSecretsManager(config) {
    return new SecretsManager(config);
}
/**
 * Secret decorator for class properties
 */
export function secret(key, decrypt = true) {
    return function (target, propertyKey) {
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
export function loadSecretsFromEnv(prefix = 'HOP_SECRET_') {
    const result = {};
    for (const [key, value] of Object.entries(process.env)) {
        if (key.startsWith(prefix) && value) {
            const secretKey = key.substring(prefix.length).toLowerCase();
            result[secretKey] = value;
        }
    }
    return result;
}
