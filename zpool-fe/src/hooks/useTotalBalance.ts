import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { AVAILABLE_TOKENS, TokenConfig } from '../config/tokens';
import { ZPOOL_ADDRESS, ZPOOL_ABI } from '../contracts';
import cacheService, { CacheKeys, CacheTTL } from '../services/cacheService';

export interface TotalBalanceInfo {
  totalPrivateBalance: string;
  totalPublicBalance: string;
  tokenBalances: {
    [tokenAddress: string]: {
      privateBalance: string;
      publicBalance: string;
      token: TokenConfig;
    };
  };
  isLoading: boolean;
  error: string | null;
}

export const useTotalBalance = (
  account: string,
  fheInstance: any,
  rpcUrl: string
): TotalBalanceInfo & { refreshBalance: () => Promise<void> } => {
  const [balanceInfo, setBalanceInfo] = useState<TotalBalanceInfo>({
    totalPrivateBalance: "0",
    totalPublicBalance: "0",
    tokenBalances: {},
    isLoading: false,
    error: null
  });

  // Use ref to track if we're currently fetching to prevent duplicate calls
  const isFetchingRef = useRef(false);
  const lastFetchKeyRef = useRef<string>('');

  const fetchTokenBalance = useCallback(async (token: TokenConfig) => {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      
      // Get public balance
      const tokenContract = new ethers.Contract(token.address, token.abi, provider);
      const publicBalance = await tokenContract.balanceOf(account);
      const publicBalanceFormatted = ethers.formatUnits(publicBalance, token.decimals);

      // Get private balance if FHE is available
      let privateBalance = "0";
      if (fheInstance) {
        try {
          const zpoolContract = new ethers.Contract(
            ZPOOL_ADDRESS,
            ZPOOL_ABI,
            provider
          );

          const hasBalance = await zpoolContract.hasBalance(account, token.address);
          
          if (hasBalance) {
            const encryptedBalance = await zpoolContract.getBalance(account, token.address);
            
            if (encryptedBalance && encryptedBalance !== "0x") {
              // Use individual token balance cache key
              const tokenBalanceCacheKey = CacheKeys.balance(account, token.address, true);
              const cachedTokenBalance = cacheService.get<string>(tokenBalanceCacheKey);
              
              if (cachedTokenBalance !== null) {
                privateBalance = cachedTokenBalance;
              } else {
                const decryptedBalance = await fheInstance.decrypt(encryptedBalance);
                
                // Handle different return types
                if (typeof decryptedBalance === 'bigint') {
                  // If it's BigInt (wei), convert to token units
                  privateBalance = ethers.formatUnits(decryptedBalance, token.decimals);
                } else if (typeof decryptedBalance === 'number') {
                  // If it's number, assume it's already in token units
                  privateBalance = decryptedBalance.toString();
                } else if (typeof decryptedBalance === 'string') {
                  // If it's string, try to parse as number first
                  const numValue = parseFloat(decryptedBalance);
                  if (!isNaN(numValue)) {
                    privateBalance = numValue.toString();
                  } else {
                    // Try to parse as BigInt (wei)
                    try {
                      const bigIntValue = BigInt(decryptedBalance);
                      privateBalance = ethers.formatUnits(bigIntValue, token.decimals);
                    } catch {
                      privateBalance = decryptedBalance;
                    }
                  }
                } else {
                  privateBalance = String(decryptedBalance);
                }
                
                // Cache individual token balance
                cacheService.set(tokenBalanceCacheKey, privateBalance, CacheTTL.BALANCE);
              }
            }
          }
        } catch (error) {
          console.warn(`Failed to get private balance for ${token.symbol}:`, error);
        }
      }

      return {
        privateBalance,
        publicBalance: publicBalanceFormatted,
        token
      };
    } catch (error) {
      console.error(`Error fetching balance for ${token.symbol}:`, error);
      return {
        privateBalance: "0",
        publicBalance: "0",
        token
      };
    }
  }, [account, fheInstance, rpcUrl]);

  const fetchAllBalances = useCallback(async () => {
    if (!account || !rpcUrl) {
      return;
    }

    // Create a unique fetch key to prevent duplicate fetches
    const fetchKey = `${account}-${rpcUrl}-${fheInstance ? 'with-fhe' : 'no-fhe'}`;
    
    // Prevent duplicate fetches
    if (isFetchingRef.current && lastFetchKeyRef.current === fetchKey) {
      return;
    }

    // Check cache first
    const cacheKey = CacheKeys.totalBalance(account, !!fheInstance);
    const cached = cacheService.get<TotalBalanceInfo>(cacheKey);
    if (cached !== null) {
      setBalanceInfo(cached);
      return;
    }

    isFetchingRef.current = true;
    lastFetchKeyRef.current = fetchKey;
    
    setBalanceInfo(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Use individual token balance fetching
      const balancePromises = AVAILABLE_TOKENS.map(token => fetchTokenBalance(token));
      const results = await Promise.all(balancePromises);

      const tokenBalances: { [key: string]: any } = {};
      let totalPrivate = 0;
      let totalPublic = 0;

      results.forEach((result: any) => {
        tokenBalances[result.token.address] = result;
        totalPrivate += parseFloat(result.privateBalance) || 0;
        totalPublic += parseFloat(result.publicBalance) || 0;
      });

      const result = {
        totalPrivateBalance: totalPrivate.toFixed(2),
        totalPublicBalance: totalPublic.toFixed(2),
        tokenBalances,
        isLoading: false,
        error: null
      };

      // Cache the result
      cacheService.set(cacheKey, result, CacheTTL.TOTAL_BALANCE);
      
      setBalanceInfo(result);
    } catch (error) {
      console.error('Error fetching total balances:', error);
      setBalanceInfo(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    } finally {
      isFetchingRef.current = false;
    }
  }, [account, rpcUrl, fetchTokenBalance, fheInstance]);

  const refreshBalance = useCallback(async () => {
    // Clear cache for this user
    const cacheKey = CacheKeys.totalBalance(account, !!fheInstance);
    cacheService.delete(cacheKey);
    
    // Clear individual token balance caches
    AVAILABLE_TOKENS.forEach(token => {
      const tokenBalanceCacheKey = CacheKeys.balance(account, token.address, true);
      cacheService.delete(tokenBalanceCacheKey);
    });
    
    await fetchAllBalances();
  }, [fetchAllBalances, account, fheInstance]);

  // Debounced effect to prevent rapid successive calls
  useEffect(() => {
    if (!account || !rpcUrl) return;

    const timeoutId = setTimeout(() => {
      fetchAllBalances();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [fetchAllBalances]);

  return {
    ...balanceInfo,
    refreshBalance
  };
}; 