import { ethers } from 'ethers';
import { TokenConfig } from '../config/tokens';
import { ZPOOL_ADDRESS } from '../contracts';
import cacheService, { CacheKeys, CacheTTL } from './cacheService';

export interface AllowanceInfo {
  allowance: string;
  allowanceFormatted: string;
  hasEnoughAllowance: boolean;
  requiredAmount: string;
  isLoading: boolean;
  error?: string;
}

export class AllowanceService {
  private provider: ethers.BrowserProvider | null = null;

  private getProvider(): ethers.BrowserProvider {
    if (!this.provider) {
      this.provider = new ethers.BrowserProvider((window as any).ethereum);
    }
    return this.provider;
  }

  /**
   * Get allowance for a specific token
   */
  async getAllowance(
    userAddress: string, 
    tokenAddress: string, 
    spenderAddress: string = ZPOOL_ADDRESS
  ): Promise<string> {
    try {
      const cacheKey = CacheKeys.allowance(userAddress, tokenAddress, spenderAddress);
      
      // Check cache first
      const cached = cacheService.get<string>(cacheKey);
      if (cached !== null) {
        console.log('📦 Using cached allowance');
        return cached;
      }

      console.log('🔍 Getting allowance for:', { user: userAddress, token: tokenAddress, spender: spenderAddress });
      
      const provider = this.getProvider();
      const tokenContract = new ethers.Contract(tokenAddress, ['function allowance(address,address) view returns (uint256)'], provider);
      
      const allowance = await tokenContract.allowance(userAddress, spenderAddress);
      const allowanceHex = ethers.hexlify(allowance);
      
      console.log('💰 Raw allowance:', allowance.toString());
      console.log('💰 Allowance hex:', allowanceHex);
      
      // Cache the result
      cacheService.set(cacheKey, allowanceHex, CacheTTL.ALLOWANCE);
      
      return allowanceHex;
    } catch (error) {
      console.error('Error getting allowance:', error);
      throw new Error(`Failed to get allowance: ${error}`);
    }
  }

  /**
   * Get complete allowance info
   */
  async getAllowanceInfo(
    userAddress: string,
    token: TokenConfig,
    requiredAmount: string,
    spenderAddress: string = ZPOOL_ADDRESS
  ): Promise<AllowanceInfo> {
    try {
      const allowance = await this.getAllowance(userAddress, token.address, spenderAddress);
      const allowanceBigInt = BigInt(allowance);
      const requiredBigInt = ethers.parseUnits(requiredAmount, token.decimals);
      
      const allowanceFormatted = ethers.formatUnits(allowanceBigInt, token.decimals);
      const hasEnoughAllowance = allowanceBigInt >= requiredBigInt;
      
      return {
        allowance: allowance,
        allowanceFormatted,
        hasEnoughAllowance,
        requiredAmount,
        isLoading: false
      };
    } catch (error) {
      console.error('Error getting allowance info:', error);
      return {
        allowance: '0',
        allowanceFormatted: '0',
        hasEnoughAllowance: false,
        requiredAmount,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Request approval for a token
   */
  async requestApproval(
    userAddress: string,
    token: TokenConfig,
    amount: string,
    spenderAddress: string = ZPOOL_ADDRESS
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      console.log('🔐 Requesting approval for:', { user: userAddress, token: token.symbol, amount, spender: spenderAddress });
      
      const provider = this.getProvider();
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(token.address, token.abi, signer);
      
      const amountWei = ethers.parseUnits(amount, token.decimals);
      
      // Request approval
      const approvalTx = await tokenContract.approve(spenderAddress, amountWei);
      
      // Clear allowance cache for this user/token combination
      const cacheKey = CacheKeys.allowance(userAddress, token.address, spenderAddress);
      cacheService.delete(cacheKey);
      
      console.log('✅ Approval transaction sent:', approvalTx.hash);
      return approvalTx;
    } catch (error) {
      console.error('Error requesting approval:', error);
      throw new Error(`Failed to request approval: ${error}`);
    }
  }

  /**
   * Wait for approval transaction confirmation
   */
  async waitForApproval(approvalTx: ethers.ContractTransactionResponse): Promise<ethers.ContractTransactionReceipt | null> {
    try {
      console.log('⏳ Waiting for approval confirmation...');
      const receipt = await approvalTx.wait();
      console.log('✅ Approval confirmed:', receipt);
      return receipt;
    } catch (error) {
      console.error('Error waiting for approval:', error);
      throw new Error(`Failed to wait for approval: ${error}`);
    }
  }

  /**
   * Clear allowance cache for a specific user/token combination
   */
  clearAllowanceCache(userAddress: string, tokenAddress: string, spenderAddress?: string): void {
    if (spenderAddress) {
      const cacheKey = CacheKeys.allowance(userAddress, tokenAddress, spenderAddress);
      cacheService.delete(cacheKey);
    } else {
      // Clear all allowance cache for this user/token combination
      cacheService.clearPattern(`allowance:${userAddress.toLowerCase()}:${tokenAddress.toLowerCase()}`);
    }
  }

  /**
   * Clear all allowance cache for a user
   */
  clearUserAllowanceCache(userAddress: string): void {
    cacheService.clearPattern(`allowance:${userAddress.toLowerCase()}`);
  }

  /**
   * Clear all allowance cache
   */
  clearAllAllowanceCache(): void {
    cacheService.clearPattern('allowance:');
  }
}

// Export singleton instance
const allowanceService = new AllowanceService();
export default allowanceService; 