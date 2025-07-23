import cacheService from '../services/cacheService';

/**
 * Clear cache after deposit operation
 */
export const clearCacheAfterDeposit = (userAddress: string, tokenAddress: string) => {
  console.log('🗑️ Clearing cache after deposit:', { userAddress, tokenAddress });
  
  // Clear user-specific cache
  cacheService.clearUserCache(userAddress);
  
  // Clear token-specific cache
  cacheService.clearTokenCache(tokenAddress);
  
  // Clear total balance cache
  const totalBalanceKey = `total-balance:${userAddress.toLowerCase()}:fhe`;
  cacheService.delete(totalBalanceKey);
  
  console.log('✅ Cache cleared after deposit');
};

/**
 * Clear cache after withdrawal operation
 */
export const clearCacheAfterWithdrawal = (userAddress: string, tokenAddress: string) => {
  console.log('🗑️ Clearing cache after withdrawal:', { userAddress, tokenAddress });
  
  // Clear user-specific cache
  cacheService.clearUserCache(userAddress);
  
  // Clear token-specific cache
  cacheService.clearTokenCache(tokenAddress);
  
  // Clear total balance cache
  const totalBalanceKey = `total-balance:${userAddress.toLowerCase()}:fhe`;
  cacheService.delete(totalBalanceKey);
  
  console.log('✅ Cache cleared after withdrawal');
};

/**
 * Clear cache after transfer operation
 */
export const clearCacheAfterTransfer = (
  senderAddress: string, 
  recipientAddress: string, 
  tokenAddress: string
) => {
  console.log('🗑️ Clearing cache after transfer:', { 
    senderAddress, 
    recipientAddress, 
    tokenAddress 
  });
  
  // Clear sender cache
  cacheService.clearUserCache(senderAddress);
  
  // Clear recipient cache
  cacheService.clearUserCache(recipientAddress);
  
  // Clear token cache
  cacheService.clearTokenCache(tokenAddress);
  
  // Clear total balance cache for both users
  const senderTotalBalanceKey = `total-balance:${senderAddress.toLowerCase()}:fhe`;
  const recipientTotalBalanceKey = `total-balance:${recipientAddress.toLowerCase()}:fhe`;
  
  cacheService.delete(senderTotalBalanceKey);
  cacheService.delete(recipientTotalBalanceKey);
  
  console.log('✅ Cache cleared after transfer');
};

/**
 * Clear cache after approval operation
 */
export const clearCacheAfterApproval = (
  userAddress: string, 
  tokenAddress: string, 
  spenderAddress: string
) => {
  console.log('🗑️ Clearing cache after approval:', { 
    userAddress, 
    tokenAddress, 
    spenderAddress 
  });
  
  // Clear allowance cache
  const allowanceKey = `allowance:${userAddress.toLowerCase()}:${tokenAddress.toLowerCase()}:${spenderAddress.toLowerCase()}`;
  cacheService.delete(allowanceKey);
  
  console.log('✅ Cache cleared after approval');
};

/**
 * Clear all cache for debugging
 */
export const clearAllCache = () => {
  console.log('🗑️ Clearing all cache for debugging');
  cacheService.clear();
  console.log('✅ All cache cleared');
};

/**
 * Get cache statistics for debugging
 */
export const getCacheStats = () => {
  return cacheService.getStats();
};

/**
 * Clear cache for specific user
 */
export const clearUserCache = (userAddress: string) => {
  console.log('🗑️ Clearing cache for user:', userAddress);
  cacheService.clearUserCache(userAddress);
  console.log('✅ User cache cleared');
};

/**
 * Clear cache for specific token
 */
export const clearTokenCache = (tokenAddress: string) => {
  console.log('🗑️ Clearing cache for token:', tokenAddress);
  cacheService.clearTokenCache(tokenAddress);
  console.log('✅ Token cache cleared');
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