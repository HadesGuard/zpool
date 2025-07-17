import { useState, useEffect, useCallback } from 'react';
import balanceService from '../services/balanceService';
import { FHEInstance } from '../services/fheService';
import { BalanceInfo } from '../services/balanceService';

interface UseBalanceReturn {
  balanceInfo: BalanceInfo;
  isLoading: boolean;
  error: string | null;
  refreshBalance: () => Promise<void>;
}

export const useBalance = (
  account: string | null,
  fheInstance: FHEInstance | null,
  tokenAddress: string
): UseBalanceReturn => {
  const [balanceInfo, setBalanceInfo] = useState<BalanceInfo>({
    encryptedBalance: '0x',
    hasBalance: false,
    isLoading: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchKey, setLastFetchKey] = useState<string>('');
  const [currentRequest, setCurrentRequest] = useState<Promise<void> | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!account) {
      setBalanceInfo({
        encryptedBalance: '0x',
        hasBalance: false,
        isLoading: false
      });
      return;
    }

    // Create a unique key for this fetch request
    const fetchKey = `${account}-${tokenAddress}-${fheInstance ? 'with-fhe' : 'no-fhe'}`;
    
    console.log('🔍 Balance fetch requested - Key:', fetchKey, 'Time:', new Date().toISOString());
    
    // Avoid duplicate fetches
    if (lastFetchKey === fetchKey && isLoading) {
      console.log('🔄 Skipping duplicate balance fetch');
      return;
    }

    // If there's already a request in progress, wait for it
    if (currentRequest) {
      console.log('🔄 Waiting for existing request to complete');
      await currentRequest;
      return;
    }

    setIsLoading(true);
    setError(null);
    setLastFetchKey(fetchKey);

    const request = (async () => {
      try {
        console.log('🔄 Fetching balance for account:', account, 'at:', new Date().toISOString());
        const info = await balanceService.getBalanceInfo(account, tokenAddress, fheInstance || undefined);
        setBalanceInfo(info);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch balance';
        setError(errorMessage);
        console.error('Balance fetch error:', err);
      } finally {
        setIsLoading(false);
        setCurrentRequest(null);
      }
    })();

    setCurrentRequest(request);
    await request;
  }, [account, fheInstance, lastFetchKey, isLoading, currentRequest, tokenAddress]);

  const refreshBalance = useCallback(async () => {
    await fetchBalance();
  }, [fetchBalance]);

  // Fetch balance when account or FHE instance changes
  useEffect(() => {
    // Only fetch if we have an account
    if (account) {
      // Add a small delay to avoid rapid successive calls
      const timeoutId = setTimeout(() => {
        fetchBalance();
      }, 200); // Increased delay
      
      return () => clearTimeout(timeoutId);
    } else {
      // Reset state when no account
      setBalanceInfo({
        encryptedBalance: '0x',
        hasBalance: false,
        isLoading: false
      });
      setError(null);
      setCurrentRequest(null);
    }
  }, [account, fheInstance, fetchBalance, tokenAddress]); // Include fetchBalance in dependencies

  return {
    balanceInfo,
    isLoading,
    error,
    refreshBalance
  };
}; 