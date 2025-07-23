// Persistent cache service using localStorage
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheConfig {
  defaultTTL: number; // milliseconds
  maxSize: number; // maximum number of entries
  cleanupInterval: number; // milliseconds
}

export class PersistentCacheService {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private config: CacheConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private readonly STORAGE_KEY = 'zpool_persistent_cache';

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 30000, // 30 seconds default
      maxSize: 1000, // maximum 1000 entries
      cleanupInterval: 60000, // cleanup every minute
      ...config
    };
    
    this.loadFromStorage();
    this.startCleanupTimer();
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        const now = Date.now();
        
        // Filter out expired entries
        const validEntries = Object.entries(data).filter(([key, entry]: [string, any]) => {
          return (now - entry.timestamp) < entry.ttl;
        });
        
        // Load valid entries into memory cache
        validEntries.forEach(([key, entry]) => {
          this.memoryCache.set(key, entry as CacheEntry<any>);
        });
        
        console.log(`📦 Loaded ${validEntries.length} valid cache entries from localStorage`);
      }
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error);
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveToStorage(): void {
    try {
      const data: { [key: string]: CacheEntry<any> } = {};
      this.memoryCache.forEach((entry, key) => {
        data[key] = entry;
      });
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save cache to localStorage:', error);
    }
  }

  /**
   * Set a value in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const entryTTL = ttl || this.config.defaultTTL;
    
    // Remove oldest entries if cache is full
    if (this.memoryCache.size >= this.config.maxSize) {
      this.evictOldest();
    }
    
    this.memoryCache.set(key, {
      data,
      timestamp: now,
      ttl: entryTTL
    });
    
    // Save to localStorage
    this.saveToStorage();
    
    console.log(`📦 Cached: ${key} (TTL: ${entryTTL}ms)`);
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry) {
      return null;
    }
    
    const now = Date.now();
    const isExpired = (now - entry.timestamp) > entry.ttl;
    
    if (isExpired) {
      this.memoryCache.delete(key);
      this.saveToStorage();
      console.log(`⏰ Cache expired: ${key}`);
      return null;
    }
    
    console.log(`📦 Cache hit: ${key}`);
    return entry.data;
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete a specific key
   */
  delete(key: string): boolean {
    const deleted = this.memoryCache.delete(key);
    if (deleted) {
      this.saveToStorage();
      console.log(`🗑️ Cache deleted: ${key}`);
    }
    return deleted;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    console.log(`🗑️ Clearing all cache (${this.memoryCache.size} entries)`);
    this.memoryCache.clear();
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Clear cache entries matching a pattern
   */
  clearPattern(pattern: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.memoryCache.delete(key));
    
    if (keysToDelete.length > 0) {
      this.saveToStorage();
      console.log(`🗑️ Cleared ${keysToDelete.length} cache entries matching pattern: ${pattern}`);
    }
  }

  /**
   * Clear cache for a specific user
   */
  clearUserCache(userAddress: string): void {
    this.clearPattern(userAddress.toLowerCase());
  }

  /**
   * Clear cache for a specific token
   */
  clearTokenCache(tokenAddress: string): void {
    this.clearPattern(tokenAddress.toLowerCase());
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{ key: string; age: number; ttl: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.memoryCache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      ttl: entry.ttl
    }));
    
    return {
      size: this.memoryCache.size,
      maxSize: this.config.maxSize,
      hitRate: 0, // Would need to track hits/misses
      entries
    };
  }

  /**
   * Evict oldest entries when cache is full
   */
  private evictOldest(): void {
    const entries = Array.from(this.memoryCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove 10% of oldest entries
    const toRemove = Math.ceil(this.config.maxSize * 0.1);
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      this.memoryCache.delete(entries[i][0]);
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.memoryCache.entries()) {
      if ((now - entry.timestamp) > entry.ttl) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.memoryCache.delete(key));
    
    if (keysToDelete.length > 0) {
      this.saveToStorage();
      console.log(`🧹 Cleaned up ${keysToDelete.length} expired cache entries`);
    }
  }

  /**
   * Stop cleanup timer
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
  }
}

// Export singleton instance
const persistentCacheService = new PersistentCacheService();
export default persistentCacheService; 