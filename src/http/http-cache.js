/**
 * HTTP Cache - Caches HTTP responses for improved performance
 */
export class HttpCache {
    cache = new Map();
    options;
    hits = 0;
    misses = 0;
    constructor(options = {}) {
        this.options = {
            enabled: options.enabled ?? false,
            maxAge: options.maxAge ?? 5 * 60 * 1000, // 5 minutes default
            maxEntries: options.maxEntries ?? 100,
        };
    }
    /**
     * Generate cache key from request
     */
    generateKey(method, url, headers, body) {
        const authToken = headers?.['Authorization'] || headers?.['authorization'];
        return `${method}:${url}:${authToken || 'none'}:${JSON.stringify(body || {})}`;
    }
    /**
     * Get a cached response
     */
    get(method, url, headers, body) {
        if (!this.options.enabled)
            return null;
        const key = this.generateKey(method, url, headers, body);
        const entry = this.cache.get(key);
        if (!entry) {
            this.misses++;
            return null;
        }
        // Check if expired
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            this.misses++;
            return null;
        }
        this.hits++;
        return {
            ...entry.response,
            fromCache: true,
        };
    }
    /**
     * Store a response in cache
     */
    set(method, url, response, headers, body) {
        if (!this.options.enabled)
            return;
        // Evict oldest if at max capacity
        if (this.cache.size >= this.options.maxEntries) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) {
                this.cache.delete(oldestKey);
            }
        }
        const key = this.generateKey(method, url, headers, body);
        const now = Date.now();
        this.cache.set(key, {
            key,
            response,
            timestamp: now,
            expiresAt: now + this.options.maxAge,
        });
    }
    /**
     * Invalidate cache entries matching a URL pattern
     */
    invalidate(urlPattern) {
        if (!urlPattern) {
            const count = this.cache.size;
            this.cache.clear();
            return count;
        }
        let count = 0;
        const regex = new RegExp(urlPattern);
        for (const [key, entry] of this.cache) {
            if (regex.test(entry.key)) {
                this.cache.delete(key);
                count++;
            }
        }
        return count;
    }
    /**
     * Check if a URL is cached
     */
    has(method, url, headers, body) {
        const key = this.generateKey(method, url, headers, body);
        const entry = this.cache.get(key);
        if (!entry)
            return false;
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }
    /**
     * Get cache statistics
     */
    getStats() {
        const total = this.hits + this.misses;
        return {
            hits: this.hits,
            misses: this.misses,
            size: this.cache.size,
            hitRate: total > 0 ? this.hits / total : 0,
        };
    }
    /**
     * Enable/disable cache
     */
    setEnabled(enabled) {
        this.options.enabled = enabled;
    }
    /**
     * Update cache options
     */
    updateOptions(options) {
        if (options.enabled !== undefined)
            this.options.enabled = options.enabled;
        if (options.maxAge !== undefined)
            this.options.maxAge = options.maxAge;
        if (options.maxEntries !== undefined)
            this.options.maxEntries = options.maxEntries;
    }
    /**
     * Clear the cache
     */
    clear() {
        this.cache.clear();
        this.hits = 0;
        this.misses = 0;
    }
}
/**
 * Create HTTP cache with options
 */
export function createHttpCache(options) {
    return new HttpCache(options);
}
