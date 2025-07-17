import { ethers } from "ethers";
import { ZPOOL_ADDRESS, ZPOOL_ABI } from "../contracts";
import { FHEInstance } from "./fheService";

export interface BalanceInfo {
  encryptedBalance: string;
  decryptedBalance?: string;
  hasBalance: boolean;
  isLoading: boolean;
  error?: string;
}

export class BalanceService {
  private provider: ethers.BrowserProvider | null = null;
  private contract: ethers.Contract | null = null;
  private cache: Map<string, { data: BalanceInfo; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 15000; // 15 seconds (increased from 5 seconds)

  private getProvider(): ethers.BrowserProvider {
    if (!this.provider) {
      this.provider = new ethers.BrowserProvider((window as any).ethereum);
    }
    return this.provider;
  }

  private getContract(): ethers.Contract {
    if (!this.contract) {
      this.contract = new ethers.Contract(ZPOOL_ADDRESS, ZPOOL_ABI, this.getProvider());
    }
    return this.contract;
  }

  /**
   * Get encrypted balance from contract
   */
  async getEncryptedBalance(userAddress: string, tokenAddress: string): Promise<string> {
    try {
      console.log('🔍 Getting encrypted balance for:', { user: userAddress, token: tokenAddress });
      
      const contract = this.getContract();
      const balance = await contract.getBalance(userAddress, tokenAddress);
      console.log('📊 Raw encrypted balance:', balance);
      
      // Convert balance to hex string
      const balanceHex = ethers.hexlify(balance);
      console.log('🔐 Encrypted balance hex:', balanceHex);
      
      return balanceHex;
    } catch (error) {
      console.error('Error getting encrypted balance:', error);
      throw new Error(`Failed to get encrypted balance: ${error}`);
    }
  }

  /**
   * Check if user has balance
   */
  async hasBalance(userAddress: string, tokenAddress: string): Promise<boolean> {
    try {
      const contract = this.getContract();
      const hasBalance = await contract.hasBalance(userAddress, tokenAddress);
      console.log('💰 Has balance:', hasBalance);
      return hasBalance;
    } catch (error) {
      console.error('Error checking balance existence:', error);
      return false;
    }
  }

  /**
   * Decrypt balance using FHE service
   */
  async decryptBalance(encryptedBalance: string, fheInstance?: FHEInstance): Promise<string> {
    try {
      console.log('🔓 Decrypting balance:', encryptedBalance.substring(0, 20) + '...');
      
      if (!fheInstance) {
        throw new Error('FHE instance is required for decryption');
      }
      
      // Check if this is a valid FHE handle format
      if (!encryptedBalance.startsWith('0x') || encryptedBalance.length < 10) {
        throw new Error('Invalid encrypted balance format');
      }
      
      // Use decrypt() with EIP-712 signature instead of publicDecrypt()
      // This requires user to sign a message to prove they own the balance
      console.log('🔓 Using decrypt() with EIP-712 signature...');
      const decryptedValue: any = await fheInstance.decrypt(encryptedBalance);
      console.log('🔓 Decrypted value:', decryptedValue);
      console.log('🔓 Decrypted value type:', typeof decryptedValue);
      
      // Handle different return types and convert appropriately
      let tokenAmount: string;
      if (typeof decryptedValue === 'bigint') {
        // If it's already a BigInt, format it with 18 decimals
        tokenAmount = ethers.formatUnits(decryptedValue, 18);
      } else if (typeof decryptedValue === 'number') {
        // If it's a number, it might already be in token units
        tokenAmount = decryptedValue.toString();
      } else if (typeof decryptedValue === 'string') {
        // If it's a string, try to parse it
        const numValue = parseFloat(decryptedValue);
        if (!isNaN(numValue)) {
          tokenAmount = numValue.toString();
        } else {
          // Try to parse as BigInt
          const bigIntValue = BigInt(decryptedValue);
          tokenAmount = ethers.formatUnits(bigIntValue, 18);
        }
      } else {
        // Fallback
        tokenAmount = String(decryptedValue);
      }
      
      console.log('💰 Token amount:', tokenAmount);
      
      return tokenAmount;
      
    } catch (error) {
      console.error('Error decrypting balance:', error);
      
      // Return a user-friendly message
      return "🔐 Encrypted Balance";
    }
  }

  /**
   * Get complete balance info (encrypted + decrypted)
   */
  async getBalanceInfo(userAddress: string, tokenAddress: string, fheInstance?: FHEInstance): Promise<BalanceInfo> {
    try {
      // Create cache key
      const cacheKey = `${userAddress}-${tokenAddress}-${fheInstance ? 'with-fhe' : 'no-fhe'}`;
      const now = Date.now();
      
      // Check cache first
      const cached = this.cache.get(cacheKey);
      if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
        console.log('📦 Using cached balance info');
        return cached.data;
      }
      
      console.log('🔄 Getting complete balance info...');
      
      // Check if user has balance first
      const hasBalance = await this.hasBalance(userAddress, tokenAddress);
      
      if (!hasBalance) {
        const result = {
          encryptedBalance: '0x',
          hasBalance: false,
          isLoading: false
        };
        
        // Cache the result
        this.cache.set(cacheKey, { data: result, timestamp: now });
        return result;
      }

      // Get encrypted balance
      const encryptedBalance = await this.getEncryptedBalance(userAddress, tokenAddress);
      
      // Try to decrypt balance if FHE instance is available
      let decryptedBalance: string | undefined;
      if (fheInstance) {
        try {
          decryptedBalance = await this.decryptBalance(encryptedBalance, fheInstance);
        } catch (decryptError) {
          console.warn('Could not decrypt balance:', decryptError);
          // Continue without decrypted balance
        }
      }

      const result = {
        encryptedBalance,
        decryptedBalance,
        hasBalance: true,
        isLoading: false
      };
      
      // Cache the result
      this.cache.set(cacheKey, { data: result, timestamp: now });
      return result;
    } catch (error) {
      console.error('Error getting balance info:', error);
      return {
        encryptedBalance: '0x',
        hasBalance: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Refresh balance info
   */
  async refreshBalance(userAddress: string, tokenAddress: string, fheInstance?: FHEInstance): Promise<BalanceInfo> {
    console.log('🔄 Refreshing balance...');
    
    // Clear cache for this user/token combination
    const cacheKey = `${userAddress}-${tokenAddress}-${fheInstance ? 'with-fhe' : 'no-fhe'}`;
    this.cache.delete(cacheKey);
    
    return this.getBalanceInfo(userAddress, tokenAddress, fheInstance);
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    console.log('🗑️ Clearing balance cache');
    this.cache.clear();
  }
}

// Export singleton instance
const balanceService = new BalanceService();
export default balanceService; 