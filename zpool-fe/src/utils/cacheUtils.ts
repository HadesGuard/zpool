import cacheService from '../services/cacheService';

/**
 * Clear all cache related to a specific user
 */
export const clearUserCache = (userAddress: string): void => {
  console.log(`🗑️ Clearing cache for user: ${userAddress}`);
  cacheService.clearUserCache(userAddress);
};

/**
 * Clear all cache related to a specific token
 */
export const clearTokenCache = (tokenAddress: string): void => {
  console.log(`🗑️ Clearing cache for token: ${tokenAddress}`);
  cacheService.clearTokenCache(tokenAddress);
};

/**
 * Clear cache after a deposit transaction
 */
export const clearCacheAfterDeposit = (userAddress: string, tokenAddress: string): void => {
  console.log(`🗑️ Clearing cache after deposit: ${userAddress} -> ${tokenAddress}`);
  cacheService.clearUserCache(userAddress);
  cacheService.clearTokenCache(tokenAddress);
};

/**
 * Clear cache after a withdrawal transaction
 */
export const clearCacheAfterWithdrawal = (userAddress: string, tokenAddress: string): void => {
  console.log(`🗑️ Clearing cache after withdrawal: ${userAddress} -> ${tokenAddress}`);
  cacheService.clearUserCache(userAddress);
  cacheService.clearTokenCache(tokenAddress);
};



/**
 * Clear cache after an approval transaction
 */
export const clearCacheAfterApproval = (userAddress: string, tokenAddress: string): void => {
  console.log(`🗑️ Clearing cache after approval: ${userAddress} -> ${tokenAddress}`);
  cacheService.clearPattern(`allowance:${userAddress.toLowerCase()}:${tokenAddress.toLowerCase()}`);
};

/**
 * Clear all FHE-related cache
 */
export const clearFHECache = (): void => {
  console.log('🗑️ Clearing FHE cache');
  cacheService.clearPattern('encrypt:');
  cacheService.clearPattern('decrypt:');
  cacheService.clearPattern('public-decrypt:');
};

/**
 * Clear all balance-related cache
 */
export const clearBalanceCache = (): void => {
  console.log('🗑️ Clearing balance cache');
  cacheService.clearPattern('balance:');
  cacheService.clearPattern('total-balance:');
};

/**
 * Clear all allowance-related cache
 */
export const clearAllowanceCache = (): void => {
  console.log('🗑️ Clearing allowance cache');
  cacheService.clearPattern('allowance:');
};

/**
 * Clear all contract-related cache
 */
export const clearContractCache = (): void => {
  console.log('🗑️ Clearing contract cache');
  cacheService.clearPattern('contract-exists:');
  cacheService.clearPattern('token-support:');
};

/**
 * Clear all cache (nuclear option)
 */
export const clearAllCache = (): void => {
  console.log('🗑️ Clearing all cache');
  cacheService.clear();
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return cacheService.getStats();
};

/**
 * Preload common data for better performance
 */
export const preloadCommonData = async (
  userAddress: string,
  tokenAddresses: string[]
): Promise<void> => {
  console.log('🚀 Preloading common data...');
  
  // This would be implemented based on specific needs
  // For now, just log the intention
  console.log(`Preloading data for user: ${userAddress}`);
  console.log(`Preloading data for tokens: ${tokenAddresses.join(', ')}`);
}; 