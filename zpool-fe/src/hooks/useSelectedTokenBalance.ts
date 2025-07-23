import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { TokenConfig } from '../config/tokens';
import { ZPOOL_ADDRESS, ZPOOL_ABI } from '../contracts';
import cacheService, { CacheKeys, CacheTTL } from '../services/cacheService';

export interface SelectedTokenBalanceInfo {
  privateBalance: string;
  publicBalance: string;
  totalBalance: string;
  isLoading: boolean;
  error: string | null;
}

export const useSelectedTokenBalance = (
  account: string,
  selectedToken: TokenConfig,
  fheInstance: any,
  rpcUrl: string
): SelectedTokenBalanceInfo & { refreshBalance: () => Promise<void> } => {
  const [balanceInfo, setBalanceInfo] = useState<SelectedTokenBalanceInfo>({
    privateBalance: "0",
    publicBalance: "0",
    totalBalance: "0",
    isLoading: false,
    error: null
  });

  // Use ref to track if we're currently fetching to prevent duplicate calls
  const isFetchingRef = useRef(false);
  const lastFetchKeyRef = useRef<string>('');

  const fetchTokenBalance = useCallback(async () => {
    if (!account || !selectedToken || !rpcUrl) {
      return;
    }

    // Create a unique fetch key to prevent duplicate fetches
    const fetchKey = `${account}-${selectedToken.address}-${rpcUrl}-${fheInstance ? 'with-fhe' : 'no-fhe'}`;
    
    // Prevent duplicate fetches
    if (isFetchingRef.current && lastFetchKeyRef.current === fetchKey) {
      return;
    }

    // Check cache first
    const cacheKey = CacheKeys.balance(account, selectedToken.address, !!fheInstance);
    const cached = cacheService.get<{ privateBalance: string; publicBalance: string }>(cacheKey);
    if (cached !== null) {
      const totalBalance = (parseFloat(cached.privateBalance) + parseFloat(cached.publicBalance)).toString();
      setBalanceInfo({
        privateBalance: cached.privateBalance,
        publicBalance: cached.publicBalance,
        totalBalance,
        isLoading: false,
        error: null
      });
      return;
    }

    isFetchingRef.current = true;
    lastFetchKeyRef.current = fetchKey;
    
    setBalanceInfo(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      
      // Get public balance
      const tokenContract = new ethers.Contract(selectedToken.address, selectedToken.abi, provider);
      const publicBalance = await tokenContract.balanceOf(account);
      const publicBalanceFormatted = ethers.formatUnits(publicBalance, selectedToken.decimals);

      // Get private balance if FHE is available
      let privateBalance = "0";
      if (fheInstance) {
        try {
          const zpoolContract = new ethers.Contract(
            ZPOOL_ADDRESS,
            ZPOOL_ABI,
            provider
          );

          const hasBalance = await zpoolContract.hasBalance(account, selectedToken.address);
          
          if (hasBalance) {
            const encryptedBalance = await zpoolContract.getBalance(account, selectedToken.address);
            
            if (encryptedBalance && encryptedBalance !== "0x") {
              // Use individual token balance cache key
              const tokenBalanceCacheKey = CacheKeys.balance(account, selectedToken.address, true);
              const cachedTokenBalance = cacheService.get<string>(tokenBalanceCacheKey);
              
              if (cachedTokenBalance !== null) {
                privateBalance = cachedTokenBalance;
              } else {
                const decryptedBalance = await fheInstance.decrypt(encryptedBalance);
                
                // Handle different return types
                if (typeof decryptedBalance === 'bigint') {
                  // If it's BigInt (wei), convert to token units
                  privateBalance = ethers.formatUnits(decryptedBalance, selectedToken.decimals);
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
                      privateBalance = ethers.formatUnits(bigIntValue, selectedToken.decimals);
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
          console.warn(`Failed to get private balance for ${selectedToken.symbol}:`, error);
        }
      }

      const totalBalance = (parseFloat(privateBalance) + parseFloat(publicBalanceFormatted)).toString();

      const result = {
        privateBalance,
        publicBalance: publicBalanceFormatted,
        totalBalance,
        isLoading: false,
        error: null
      };

      // Cache the result
      cacheService.set(cacheKey, {
        privateBalance: result.privateBalance,
        publicBalance: result.publicBalance
      }, CacheTTL.BALANCE);
      
      setBalanceInfo(result);
    } catch (error) {
      console.error('Error fetching token balance:', error);
      setBalanceInfo(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    } finally {
      isFetchingRef.current = false;
    }
  }, [account, selectedToken, fheInstance, rpcUrl]);

  const refreshBalance = useCallback(async () => {
    // Clear cache for this token
    const cacheKey = CacheKeys.balance(account, selectedToken.address, !!fheInstance);
    cacheService.delete(cacheKey);
    
    await fetchTokenBalance();
  }, [fetchTokenBalance, account, selectedToken, fheInstance]);

  // Fetch balance when dependencies change
  useEffect(() => {
    if (!account || !selectedToken || !rpcUrl) return;

    const timeoutId = setTimeout(() => {
      fetchTokenBalance();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [fetchTokenBalance, account, selectedToken, rpcUrl]);

  return {
    ...balanceInfo,
    refreshBalance
  };
}; 