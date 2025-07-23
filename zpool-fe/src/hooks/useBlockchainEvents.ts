import { useEffect, useRef, useCallback } from 'react';
import { ethers } from 'ethers';
import { ZPOOL_ADDRESS, ZPOOL_ABI } from '../contracts';
import cacheService from '../services/cacheService';
import { AVAILABLE_TOKENS } from '../config/tokens';

interface UseBlockchainEventsProps {
  account: string | null;
  rpcUrl: string;
  isConnected: boolean;
}

export const useBlockchainEvents = ({ account, rpcUrl, isConnected }: UseBlockchainEventsProps) => {
  const providerRef = useRef<ethers.JsonRpcProvider | null>(null);
  const listenerRef = useRef<ethers.Contract | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedBlockRef = useRef<number>(0);

  // Clear cache for specific addresses and tokens
  const clearCacheForTransfer = useCallback((from: string, to: string, token: string) => {
    console.log(`🔄 Clearing cache after transfer: ${from} -> ${to} (${token})`);
    
    // Clear cache for sender
    if (from) {
      cacheService.clearUserCache(from);
    }
    
    // Clear cache for recipient  
    if (to) {
      cacheService.clearUserCache(to);
    }
    
    // Clear token-specific cache
    if (token) {
      cacheService.clearTokenCache(token);
    }
  }, []);

  // Setup blockchain event listeners
  const setupEventListeners = useCallback(async () => {
    if (!isConnected || !rpcUrl || !account) {
      return;
    }

    try {
      // Create provider with better error handling
      providerRef.current = new ethers.JsonRpcProvider(rpcUrl, undefined, {
        staticNetwork: true,
        batchMaxCount: 1,
        batchStallTime: 10
      });
      
      // Create contract instance for listening
      listenerRef.current = new ethers.Contract(ZPOOL_ADDRESS, ZPOOL_ABI, providerRef.current);

      // Setup event listeners with error handling
      const setupEvent = (eventName: string, handler: (...args: any[]) => void) => {
        try {
          listenerRef.current?.on(eventName, handler);
        } catch (error) {
          console.warn(`⚠️ Failed to setup ${eventName} listener:`, error);
        }
      };

      // Listen for Transfer events
      setupEvent('Transfer', (from: string, to: string, token: string, amount: any, event: any) => {
        console.log('📡 Transfer event detected:', { from, to, token, amount: amount.toString() });
        
        // Clear cache for both sender and recipient
        clearCacheForTransfer(from, to, token);
      });

      // Listen for Deposit events
      setupEvent('Deposit', (user: string, token: string, amount: any, event: any) => {
        console.log('📡 Deposit event detected:', { user, token, amount: amount.toString() });
        
        // Clear cache for the user who deposited
        if (user) {
          cacheService.clearUserCache(user);
        }
        if (token) {
          cacheService.clearTokenCache(token);
        }
      });

      // Listen for Withdraw events
      setupEvent('Withdraw', (user: string, token: string, amount: any, event: any) => {
        console.log('📡 Withdraw event detected:', { user, token, amount: amount.toString() });
        
        // Clear cache for the user who withdrew
        if (user) {
          cacheService.clearUserCache(user);
        }
        if (token) {
          cacheService.clearTokenCache(token);
        }
      });

      console.log('✅ Blockchain event listeners setup complete');
      retryCountRef.current = 0; // Reset retry count on success
    } catch (error) {
      console.error('❌ Error setting up blockchain event listeners:', error);
      
      // Retry with exponential backoff
      if (retryCountRef.current < maxRetries) {
        const retryDelay = Math.pow(2, retryCountRef.current) * 1000; // 1s, 2s, 4s
        console.log(`🔄 Retrying setup in ${retryDelay}ms (attempt ${retryCountRef.current + 1}/${maxRetries})`);
        
        retryTimeoutRef.current = setTimeout(() => {
          retryCountRef.current++;
          setupEventListeners();
        }, retryDelay);
      } else {
        console.error('❌ Max retries reached for blockchain event listeners');
        console.log('🔄 Falling back to polling mechanism');
        setupPollingFallback();
      }
    }
  }, [isConnected, rpcUrl, account, clearCacheForTransfer]);

  // Fallback polling mechanism
  const setupPollingFallback = useCallback(async () => {
    if (!providerRef.current || !account) return;

    try {
      console.log('📡 Setting up polling fallback for blockchain events');
      
      const pollForEvents = async () => {
        try {
          const currentBlock = await providerRef.current!.getBlockNumber();
          
          if (currentBlock > lastProcessedBlockRef.current) {
            // Get events from last processed block to current block
            const fromBlock = lastProcessedBlockRef.current || currentBlock - 1;
            
            const contract = new ethers.Contract(ZPOOL_ADDRESS, ZPOOL_ABI, providerRef.current!);
            
            // Get Transfer events
            const transferEvents = await contract.queryFilter('Transfer', fromBlock, currentBlock);
            
            for (const event of transferEvents) {
              if ('args' in event && event.args) {
                const { from, to, token, amount } = event.args;
                console.log('📡 Polling detected Transfer event:', { from, to, token, amount: amount.toString() });
                clearCacheForTransfer(from, to, token);
              }
            }
            
            // Get Deposit events
            const depositEvents = await contract.queryFilter('Deposit', fromBlock, currentBlock);
            for (const event of depositEvents) {
              if ('args' in event && event.args) {
                const { user, token, amount } = event.args;
                console.log('📡 Polling detected Deposit event:', { user, token, amount: amount.toString() });
                if (user) cacheService.clearUserCache(user);
                if (token) cacheService.clearTokenCache(token);
              }
            }
            
            // Get Withdraw events
            const withdrawEvents = await contract.queryFilter('Withdraw', fromBlock, currentBlock);
            for (const event of withdrawEvents) {
              if ('args' in event && event.args) {
                const { user, token, amount } = event.args;
                console.log('📡 Polling detected Withdraw event:', { user, token, amount: amount.toString() });
                if (user) cacheService.clearUserCache(user);
                if (token) cacheService.clearTokenCache(token);
              }
            }
            
            lastProcessedBlockRef.current = currentBlock;
          }
        } catch (error) {
          console.warn('⚠️ Error in polling fallback:', error);
        }
      };
      
      // Poll every 10 seconds
      pollingIntervalRef.current = setInterval(pollForEvents, 10000);
      
      // Initial poll
      await pollForEvents();
      
    } catch (error) {
      console.error('❌ Error setting up polling fallback:', error);
    }
  }, [account, clearCacheForTransfer]);

  // Cleanup event listeners
  const cleanupEventListeners = useCallback(() => {
    if (listenerRef.current) {
      try {
        // Remove specific listeners to avoid filter errors
        listenerRef.current.off('Transfer');
        listenerRef.current.off('Deposit');
        listenerRef.current.off('Withdraw');
        console.log('🧹 Cleaned up blockchain event listeners');
      } catch (error) {
        console.error('❌ Error cleaning up event listeners:', error);
      }
      listenerRef.current = null;
    }
    
    if (providerRef.current) {
      try {
        // Cleanup provider
        providerRef.current = null;
      } catch (error) {
        console.error('❌ Error cleaning up provider:', error);
      }
    }
  }, []);

  // Setup listeners when dependencies change
  useEffect(() => {
    if (isConnected && rpcUrl && account) {
      setupEventListeners();
    } else {
      cleanupEventListeners();
    }

    // Cleanup on unmount
    return () => {
      cleanupEventListeners();
      
      // Clear any pending retry timeouts
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      
      // Clear polling interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isConnected, rpcUrl, account, setupEventListeners, cleanupEventListeners]);

  // Manual cache clearing function
  const clearCacheForUser = useCallback((userAddress: string) => {
    console.log(`🗑️ Manually clearing cache for user: ${userAddress}`);
    cacheService.clearUserCache(userAddress);
  }, []);

  const clearCacheForToken = useCallback((tokenAddress: string) => {
    console.log(`🗑️ Manually clearing cache for token: ${tokenAddress}`);
    cacheService.clearTokenCache(tokenAddress);
  }, []);

  return {
    clearCacheForUser,
    clearCacheForToken,
    clearCacheForTransfer
  };
}; 