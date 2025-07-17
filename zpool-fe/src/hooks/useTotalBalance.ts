import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { AVAILABLE_TOKENS, TokenConfig } from '../config/tokens';
import { ZPOOL_ADDRESS, ZPOOL_ABI } from '../contracts';

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
              const decryptedBalance = await fheInstance.decrypt(encryptedBalance);
              console.log('🔓 Raw decrypted balance:', decryptedBalance, 'type:', typeof decryptedBalance);
              
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
              
              console.log('💰 Final private balance:', privateBalance);
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
    if (!account || !rpcUrl) return;

    setBalanceInfo(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const balancePromises = AVAILABLE_TOKENS.map(token => fetchTokenBalance(token));
      const results = await Promise.all(balancePromises);

      const tokenBalances: { [key: string]: any } = {};
      let totalPrivate = 0;
      let totalPublic = 0;

      results.forEach(result => {
        tokenBalances[result.token.address] = result;
        totalPrivate += parseFloat(result.privateBalance) || 0;
        totalPublic += parseFloat(result.publicBalance) || 0;
      });

      setBalanceInfo({
        totalPrivateBalance: totalPrivate.toFixed(2),
        totalPublicBalance: totalPublic.toFixed(2),
        tokenBalances,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching total balances:', error);
      setBalanceInfo(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, [account, rpcUrl, fetchTokenBalance]);

  const refreshBalance = useCallback(async () => {
    console.log('🔄 Refreshing balances...');
    await fetchAllBalances();
  }, [fetchAllBalances]);

  useEffect(() => {
    fetchAllBalances();
  }, [fetchAllBalances]);

  return {
    ...balanceInfo,
    refreshBalance
  };
}; 