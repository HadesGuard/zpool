// Wallet persistence utilities
const WALLET_STORAGE_KEY = 'zpool_wallet_state';

export interface WalletState {
  account: string;
  network: string;
  isConnected: boolean;
  lastConnected: number;
}

/**
 * Save wallet state to localStorage
 */
export const saveWalletState = (state: WalletState): void => {
  try {
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save wallet state to localStorage:', error);
  }
};

/**
 * Load wallet state from localStorage
 */
export const loadWalletState = (): WalletState | null => {
  try {
    const stored = localStorage.getItem(WALLET_STORAGE_KEY);
    if (stored) {
      const state = JSON.parse(stored);
      
      // Check if state is not too old (24 hours)
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (now - state.lastConnected < maxAge) {
        return state;
      } else {
        // Clear old state
        clearWalletState();
        return null;
      }
    }
    return null;
  } catch (error) {
    console.warn('Failed to load wallet state from localStorage:', error);
    return null;
  }
};

/**
 * Clear wallet state from localStorage
 */
export const clearWalletState = (): void => {
  try {
    localStorage.removeItem(WALLET_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear wallet state from localStorage:', error);
  }
};

/**
 * Check if wallet was previously connected
 */
export const wasWalletConnected = (): boolean => {
  const state = loadWalletState();
  return state !== null && state.isConnected;
};

/**
 * Auto-reconnect wallet if previously connected
 */
export const autoReconnectWallet = async (): Promise<{ account: string; network: string } | null> => {
  try {
    const state = loadWalletState();
    if (!state || !state.isConnected) {
      return null;
    }

    // Check if MetaMask is available
    if (!(window as any).ethereum) {
      return null;
    }

    // Check if we're on the same network
    const currentChainId = await (window as any).ethereum.request({ method: "eth_chainId" });
    if (currentChainId !== state.network) {
      console.log('Network changed, clearing saved state');
      clearWalletState();
      return null;
    }

    // Check if account is still available
    const accounts = await (window as any).ethereum.request({ method: "eth_accounts" });
    if (accounts.length === 0) {
      console.log('No accounts available, clearing saved state');
      clearWalletState();
      return null;
    }

    // Check if saved account is still connected
    const savedAccount = state.account.toLowerCase();
    const currentAccount = accounts[0].toLowerCase();
    
    if (savedAccount === currentAccount) {
      console.log('Auto-reconnecting to previously connected wallet');
      return {
        account: accounts[0],
        network: currentChainId
      };
    } else {
      console.log('Account changed, updating saved state');
      const newState: WalletState = {
        account: accounts[0],
        network: currentChainId,
        isConnected: true,
        lastConnected: Date.now()
      };
      saveWalletState(newState);
      return {
        account: accounts[0],
        network: currentChainId
      };
    }
  } catch (error) {
    console.warn('Auto-reconnect failed:', error);
    clearWalletState();
    return null;
  }
}; 