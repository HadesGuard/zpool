// Import persistent cache service
import persistentCacheService from './persistentCacheService';

// Re-export types for backward compatibility
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

// Wrapper class that uses persistent cache
export class CacheService {
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 30000, // 30 seconds default
      maxSize: 1000, // maximum 1000 entries
      cleanupInterval: 60000, // cleanup every minute
      ...config
    };
  }

  /**
   * Set a value in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    persistentCacheService.set(key, data, ttl || this.config.defaultTTL);
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    return persistentCacheService.get<T>(key);
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    return persistentCacheService.has(key);
  }

  /**
   * Delete a specific key
   */
  delete(key: string): boolean {
    return persistentCacheService.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    persistentCacheService.clear();
  }

  /**
   * Clear cache entries matching a pattern
   */
  clearPattern(pattern: string): void {
    persistentCacheService.clearPattern(pattern);
  }

  /**
   * Clear cache for specific user
   */
  clearUserCache(userAddress: string): void {
    persistentCacheService.clearUserCache(userAddress);
  }

  /**
   * Clear cache for specific token
   */
  clearTokenCache(tokenAddress: string): void {
    persistentCacheService.clearTokenCache(tokenAddress);
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
    return persistentCacheService.getStats();
  }

  /**
   * Stop cleanup timer
   */
  destroy(): void {
    persistentCacheService.destroy();
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
  BALANCE: 30000, // 30 seconds
  TOTAL_BALANCE: 45000, // 45 seconds
  ENCRYPT: 300000, // 5 minutes (encryption results are deterministic)
  DECRYPT: 300000, // 5 minutes (decrypt results are deterministic)
  PUBLIC_DECRYPT: 300000, // 5 minutes
  ALLOWANCE: 60000, // 1 minute
  TOKEN_SUPPORT: 300000, // 5 minutes
  CONTRACT_EXISTS: 600000, // 10 minutes
  NETWORK_INFO: 300000, // 5 minutes
}; 