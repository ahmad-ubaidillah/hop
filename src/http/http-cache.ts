/**
 * HTTP Cache - Caches HTTP responses for improved performance
 */

export interface CacheOptions {
  enabled?: boolean;
  maxAge?: number; // milliseconds
  maxEntries?: number;
}

export interface CacheEntry {
  key: string;
  response: any;
  timestamp: number;
  expiresAt: number;
}

export interface CachedResponse {
  body: any;
  status: number;
  headers: Record<string, string>;
  fromCache: boolean;
  responseTime?: number;
}

export class HttpCache {
  private cache: Map<string, CacheEntry> = new Map();
  private options: Required<CacheOptions>;
  private hits = 0;
  private misses = 0;
  
  constructor(options: CacheOptions = {}) {
    this.options = {
      enabled: options.enabled ?? false,
      maxAge: options.maxAge ?? 5 * 60 * 1000, // 5 minutes default
      maxEntries: options.maxEntries ?? 100,
    };
  }
  
  /**
   * Generate cache key from request
   */
  private generateKey(method: string, url: string, headers?: Record<string, string>, body?: any): string {
    const authToken = headers?.['Authorization'] || headers?.['authorization'];
    return `${method}:${url}:${authToken || 'none'}:${JSON.stringify(body || {})}`;
  }
  
  /**
   * Get a cached response
   */
  get(method: string, url: string, headers?: Record<string, string>, body?: any): CachedResponse | null {
    if (!this.options.enabled) return null;
    
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
  set(method: string, url: string, response: any, headers?: Record<string, string>, body?: any): void {
    if (!this.options.enabled) return;
    
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
  invalidate(urlPattern?: string): number {
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
  has(method: string, url: string, headers?: Record<string, string>, body?: any): boolean {
    const key = this.generateKey(method, url, headers, body);
    const entry = this.cache.get(key);
    
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  /**
   * Get cache statistics
   */
  getStats(): { hits: number; misses: number; size: number; hitRate: number } {
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
  setEnabled(enabled: boolean): void {
    this.options.enabled = enabled;
  }
  
  /**
   * Update cache options
   */
  updateOptions(options: Partial<CacheOptions>): void {
    if (options.enabled !== undefined) this.options.enabled = options.enabled;
    if (options.maxAge !== undefined) this.options.maxAge = options.maxAge;
    if (options.maxEntries !== undefined) this.options.maxEntries = options.maxEntries;
  }
  
  /**
   * Clear the cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }
}

/**
 * Create HTTP cache with options
 */
export function createHttpCache(options?: CacheOptions): HttpCache {
  return new HttpCache(options);
}
