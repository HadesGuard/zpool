import { ethers } from 'ethers';
import { TEST_TOKEN_ADDRESS, TEST_TOKEN_ABI, ZPOOL_ADDRESS } from '../contracts';
import { TokenConfig } from '../config/tokens';

export interface AllowanceInfo {
  currentAllowance: string;
  formattedAllowance: string;
  isSufficient: boolean;
  needsApproval: boolean;
}

/**
 * Check current allowance for a specific token and spender
 */
export const checkAllowance = async (
  account: string,
  token: TokenConfig,
  spenderAddress: string = ZPOOL_ADDRESS
): Promise<AllowanceInfo> => {
  try {
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const tokenContract = new ethers.Contract(token.address, token.abi, provider);
    
    const allowance = await tokenContract.allowance(account, spenderAddress);
    const formattedAllowance = ethers.formatEther(allowance);
    
    return {
      currentAllowance: allowance.toString(),
      formattedAllowance,
      isSufficient: false, // Will be set by caller
      needsApproval: false // Will be set by caller
    };
  } catch (error) {
    console.error('Error checking allowance:', error);
    return {
      currentAllowance: '0',
      formattedAllowance: '0',
      isSufficient: false,
      needsApproval: true
    };
  }
};

/**
 * Check if current allowance is sufficient for a given amount
 */
export const checkAllowanceForAmount = async (
  account: string,
  amount: string,
  token: TokenConfig,
  spenderAddress: string = ZPOOL_ADDRESS
): Promise<AllowanceInfo> => {
  const allowanceInfo = await checkAllowance(account, token, spenderAddress);
  const amountWei = ethers.parseEther(amount);
  const currentAllowanceWei = ethers.parseUnits(allowanceInfo.formattedAllowance, 18);
  
  allowanceInfo.isSufficient = currentAllowanceWei >= amountWei;
  allowanceInfo.needsApproval = currentAllowanceWei < amountWei;
  
  return allowanceInfo;
};

/**
 * Approve tokens if needed
 */
export const approveIfNeeded = async (
  account: string,
  amount: string,
  token: TokenConfig,
  spenderAddress: string = ZPOOL_ADDRESS
): Promise<{ approved: boolean; txHash?: string }> => {
  try {
    const allowanceInfo = await checkAllowanceForAmount(account, amount, token, spenderAddress);
    
    if (!allowanceInfo.needsApproval) {
      console.log('Sufficient allowance already exists');
      return { approved: true };
    }
    
    console.log('Approval needed, requesting approval...');
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();
    const tokenContract = new ethers.Contract(token.address, token.abi, signer);
    
    const amountWei = ethers.parseEther(amount);
    const approveTx = await tokenContract.approve(spenderAddress, amountWei);
    await approveTx.wait();
    
    console.log('Approval successful:', approveTx.hash);
    return { approved: true, txHash: approveTx.hash };
    
  } catch (error) {
    console.error('Error in approveIfNeeded:', error);
    throw error;
  }
};

/**
 * Get allowance status message
 */
export const getAllowanceStatusMessage = (
  allowanceInfo: AllowanceInfo,
  amount: string
): string => {
  if (allowanceInfo.needsApproval) {
    return `⚠️ Approval needed: You have ${allowanceInfo.formattedAllowance} approved, but need ${amount} for this transaction.`;
  } else if (parseFloat(amount) > 0) {
    return `✅ Sufficient allowance: You have ${allowanceInfo.formattedAllowance} approved for this transaction.`;
  }
  return '';
}; 