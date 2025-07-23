import { useState, useEffect, useCallback } from 'react';
import { TokenConfig } from '../config/tokens';
import allowanceService, { AllowanceInfo } from '../services/allowanceService';
import { ZPOOL_ADDRESS } from '../contracts';

interface UseAllowanceReturn {
  allowanceInfo: AllowanceInfo;
  isLoading: boolean;
  error: string | null;
  refreshAllowance: () => Promise<void>;
  requestApproval: (amount: string) => Promise<void>;
}

export const useAllowance = (
  account: string | null,
  token: TokenConfig | null,
  requiredAmount: string = "0",
  spenderAddress: string = ZPOOL_ADDRESS
): UseAllowanceReturn => {
  const [allowanceInfo, setAllowanceInfo] = useState<AllowanceInfo>({
    allowance: '0',
    allowanceFormatted: '0',
    hasEnoughAllowance: false,
    requiredAmount,
    isLoading: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllowance = useCallback(async () => {
    if (!account || !token) {
      setAllowanceInfo({
        allowance: '0',
        allowanceFormatted: '0',
        hasEnoughAllowance: false,
        requiredAmount,
        isLoading: false
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 Fetching allowance for:', { account, token: token.symbol, requiredAmount });
      const info = await allowanceService.getAllowanceInfo(account, token, requiredAmount, spenderAddress);
      setAllowanceInfo(info);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch allowance';
      setError(errorMessage);
      console.error('Allowance fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [account, token, requiredAmount, spenderAddress]);

  const refreshAllowance = useCallback(async () => {
    if (!account || !token) return;
    
    console.log('🔄 Refreshing allowance...');
    
    // Clear allowance cache for this user/token combination
    allowanceService.clearAllowanceCache(account, token.address, spenderAddress);
    
    await fetchAllowance();
  }, [account, token, spenderAddress, fetchAllowance]);

  const requestApproval = useCallback(async (amount: string) => {
    if (!account || !token) {
      throw new Error('Account and token are required for approval');
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔐 Requesting approval for amount:', amount);
      
      // Request approval
      const approvalTx = await allowanceService.requestApproval(account, token, amount, spenderAddress);
      
      // Wait for confirmation
      await allowanceService.waitForApproval(approvalTx);
      
      // Refresh allowance after approval
      await refreshAllowance();
      
      console.log('✅ Approval completed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request approval';
      setError(errorMessage);
      console.error('Approval error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [account, token, spenderAddress, refreshAllowance]);

  // Fetch allowance when dependencies change
  useEffect(() => {
    if (account && token) {
      // Add a small delay to avoid rapid successive calls
      const timeoutId = setTimeout(() => {
        fetchAllowance();
      }, 200);
      
      return () => clearTimeout(timeoutId);
    } else {
      // Reset state when no account or token
      setAllowanceInfo({
        allowance: '0',
        allowanceFormatted: '0',
        hasEnoughAllowance: false,
        requiredAmount,
        isLoading: false
      });
      setError(null);
    }
  }, [account, token, requiredAmount, spenderAddress, fetchAllowance]);

  return {
    allowanceInfo,
    isLoading,
    error,
    refreshAllowance,
    requestApproval
  };
}; 