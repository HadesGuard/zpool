// Centralized cache service for the entire application
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

export class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private config: CacheConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 30000, // 30 seconds default
      maxSize: 1000, // maximum 1000 entries
      cleanupInterval: 60000, // cleanup every minute
      ...config
    };
    
    this.startCleanupTimer();
  }

  /**
   * Set a value in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const entryTTL = ttl || this.config.defaultTTL;
    
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }
    
    this.cache.set(key, {
      data,
      timestamp: now,
      ttl: entryTTL
    });
    
    console.log(`📦 Cached: ${key} (TTL: ${entryTTL}ms)`);
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }
    
    const now = Date.now();
    const isExpired = (now - entry.timestamp) > entry.ttl;
    
    if (isExpired) {
      this.cache.delete(key);
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
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`🗑️ Cache deleted: ${key}`);
    }
    return deleted;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    console.log(`🗑️ Clearing all cache (${this.cache.size} entries)`);
    this.cache.clear();
  }

  /**
   * Clear cache entries matching a pattern
   */
  clearPattern(pattern: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.delete(key));
    console.log(`🗑️ Cleared ${keysToDelete.length} cache entries matching pattern: ${pattern}`);
  }

  /**
   * Clear cache for specific user
   */
  clearUserCache(userAddress: string): void {
    this.clearPattern(userAddress.toLowerCase());
  }

  /**
   * Clear cache for specific token
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
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      ttl: entry.ttl
    }));
    
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: 0, // TODO: implement hit rate tracking
      entries
    };
  }

  /**
   * Evict oldest entries when cache is full
   */
  private evictOldest(): void {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove 10% of oldest entries
    const toRemove = Math.ceil(this.config.maxSize * 0.1);
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      this.cache.delete(entries[i][0]);
    }
    
    console.log(`🗑️ Evicted ${toRemove} oldest cache entries`);
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
    
    for (const [key, entry] of this.cache.entries()) {
      if ((now - entry.timestamp) > entry.ttl) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
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
const cacheService = new CacheService();
export default cacheService;

// Cache key generators
export const CacheKeys = {
  // Balance cache keys
  balance: (userAddress: string, tokenAddress: string, withFHE: boolean = false) => 
    `balance:${userAddress.toLowerCase()}:${tokenAddress.toLowerCase()}:${withFHE ? 'fhe' : 'no-fhe'}`,
  
  // Total balance cache keys
  totalBalance: (userAddress: string, withFHE: boolean = false) => 
    `total-balance:${userAddress.toLowerCase()}:${withFHE ? 'fhe' : 'no-fhe'}`,
  
  // FHE operation cache keys
  encrypt: (value: number, userAddress: string) => 
    `encrypt:${value}:${userAddress.toLowerCase()}`,
  
  decrypt: (encryptedValue: string) => 
    `decrypt:${encryptedValue}`,
  
  publicDecrypt: (encryptedValue: string) => 
    `public-decrypt:${encryptedValue}`,
  
  // Allowance cache keys
  allowance: (userAddress: string, tokenAddress: string, spenderAddress: string) => 
    `allowance:${userAddress.toLowerCase()}:${tokenAddress.toLowerCase()}:${spenderAddress.toLowerCase()}`,
  
  // Contract support cache keys
  tokenSupport: (tokenAddress: string) => 
    `token-support:${tokenAddress.toLowerCase()}`,
  
  // Contract existence cache keys
  contractExists: (address: string) => 
    `contract-exists:${address.toLowerCase()}`,
  
  // Network info cache keys
  networkInfo: (chainId: string) => 
    `network-info:${chainId}`,
};

// Cache TTL constants
export const CacheTTL = {
  BALANCE: 15000, // 15 seconds
  TOTAL_BALANCE: 20000, // 20 seconds
  ENCRYPT: 60000, // 1 minute (encryption results are deterministic)
  DECRYPT: 30000, // 30 seconds
  PUBLIC_DECRYPT: 30000, // 30 seconds
  ALLOWANCE: 30000, // 30 seconds
  TOKEN_SUPPORT: 60000, // 1 minute
  CONTRACT_EXISTS: 300000, // 5 minutes
  NETWORK_INFO: 60000, // 1 minute
}; 