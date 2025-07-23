import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { ZPOOL_ADDRESS, ZPOOL_ABI } from '../contracts';
import { TokenConfig } from '../config/tokens';
import { useToast } from '../contexts/ToastContext';
import { useAllowance } from '../hooks/useAllowance';
import cacheService, { CacheKeys, CacheTTL } from '../services/cacheService';
import { clearCacheAfterDeposit, clearCacheAfterWithdrawal } from '../utils/cacheUtils';
import '../styles/components/PageContainer.css';
import '../styles/components/Form.css';
import '../styles/components/ActionToggle.css';
import '../styles/components/InfoBox.css';

interface PoolPageProps {
  account: string;
  selectedToken: TokenConfig;
  fheInitialized: boolean;
  fheLoading: boolean;
  fheError: string | null;
  isSDKAvailable: boolean;
  encrypt: (value: number) => Promise<{ encryptedValue: string; proof: string }>;
  decrypt: (encryptedValue: string) => Promise<number>;
  refreshFHE: () => Promise<void>;
  refreshBalance: () => Promise<void>;
}

const PoolPage: React.FC<PoolPageProps> = ({ 
  account, 
  selectedToken, 
  fheInitialized, 
  fheLoading, 
  fheError, 
  isSDKAvailable,
  encrypt, 
  decrypt,
  refreshFHE,
  refreshBalance
}) => {
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isTokenSupported, setIsTokenSupported] = useState<boolean>(false);
  const [action, setAction] = useState<'deposit' | 'withdraw'>('deposit');
  
  const { showSuccess, showError, showInfo } = useToast();

  // Use allowance hook for better caching
  const { allowanceInfo, requestApproval } = useAllowance(account, selectedToken, amount);

  // Check if contracts exist and TestToken is supported by ZPool
  useEffect(() => {
    const checkContractsAndSupport = async () => {
      if (!account) return;
      
      try {
        // Check cache first for contract existence
        const zpoolExistsKey = CacheKeys.contractExists(ZPOOL_ADDRESS);
        const tokenExistsKey = CacheKeys.contractExists(selectedToken.address);
        const tokenSupportKey = CacheKeys.tokenSupport(selectedToken.address);
        
        let zpoolExists = cacheService.get<boolean>(zpoolExistsKey);
        let tokenExists = cacheService.get<boolean>(tokenExistsKey);
        let isSupported = cacheService.get<boolean>(tokenSupportKey);
        
        if (zpoolExists === null) {
          const provider = new ethers.BrowserProvider((window as any).ethereum);
          const zpoolCode = await provider.getCode(ZPOOL_ADDRESS);
          zpoolExists = zpoolCode !== '0x';
          cacheService.set(zpoolExistsKey, zpoolExists, CacheTTL.CONTRACT_EXISTS);
        }
        
        if (!zpoolExists) {
          showError("ZPool contract not found at the specified address. Please deploy the contracts first.");
          return;
        }
        
        if (tokenExists === null) {
          const provider = new ethers.BrowserProvider((window as any).ethereum);
          const tokenCode = await provider.getCode(selectedToken.address);
          tokenExists = tokenCode !== '0x';
          cacheService.set(tokenExistsKey, tokenExists, CacheTTL.CONTRACT_EXISTS);
        }
        
        if (!tokenExists) {
          showError(`${selectedToken.name} contract not found at the specified address. Please deploy the contracts first.`);
          return;
        }
        
        if (isSupported === null) {
          const provider = new ethers.BrowserProvider((window as any).ethereum);
          const zpool = new ethers.Contract(ZPOOL_ADDRESS, ZPOOL_ABI, provider);
          isSupported = await zpool.supportedTokens(selectedToken.address);
          cacheService.set(tokenSupportKey, isSupported, CacheTTL.TOKEN_SUPPORT);
        }
        
        setIsTokenSupported(isSupported || false);
        
        if (!isSupported) {
          showError(`${selectedToken.name} is not supported by ZPool. Please add it first.`);
        }
      } catch (error) {
        console.error("Error checking contracts and support:", error);
        showError(`Error checking contracts: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    checkContractsAndSupport();
  }, [account, selectedToken, showError]);

  const handleDeposit = async () => {
    if (!account) {
      showError("Please connect your wallet first");
      return;
    }
    
    if (!amount || !fheInitialized) {
      showError("Please enter an amount and ensure FHE is initialized");
      return;
    }

    // Validate that amount is an integer
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0 || !Number.isInteger(amountNum)) {
      showError("Please enter a valid positive integer amount");
      return;
    }

    setLoading(true);
    showInfo("Processing deposit...");

    try {
      console.log("Starting deposit process...");
      console.log("Amount:", amount);
      console.log("Account:", account);

      // Get token contract
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(selectedToken.address, selectedToken.abi, signer);
      const zpoolContract = new ethers.Contract(ZPOOL_ADDRESS, ZPOOL_ABI, signer);

      // Debug: Check contract status
      console.log("🔍 Checking contract status...");
      const isTokenSupported = await zpoolContract.supportedTokens(selectedToken.address);
      console.log("TestToken supported:", isTokenSupported);
      
      if (!isTokenSupported) {
        throw new Error(`${selectedToken.name} is not supported by ZPool. Please add it first.`);
      }

      // Check balance first
      const balance = await tokenContract.balanceOf(account);
      const amountWei = ethers.parseEther(amount);

      console.log("Balance check:", {
        balance: balance.toString(),
        amountWei: amountWei.toString(),
        hasEnoughBalance: balance >= amountWei
      });

      if (balance < amountWei) {
        throw new Error(`Insufficient ${selectedToken.name} balance. You have ${ethers.formatEther(balance)}, but need ${amount} tokens. Please mint more tokens first.`);
      }

      // Check allowance using the hook
      console.log("Allowance check:", {
        allowance: allowanceInfo.allowance,
        allowanceFormatted: allowanceInfo.allowanceFormatted,
        amountWei: amountWei.toString(),
        hasEnoughAllowance: allowanceInfo.hasEnoughAllowance
      });

      if (!allowanceInfo.hasEnoughAllowance) {
        console.log("Insufficient allowance, requesting approval...");
        showInfo("Requesting token approval...");
        
        // Approve a larger amount to avoid frequent approvals
        // Approve 10x the current amount or 10000 tokens, whichever is larger
        const approveAmount = amountWei * BigInt(10) > ethers.parseEther("10000") 
          ? ethers.formatEther(amountWei * BigInt(10))
          : "10000";
        
        await requestApproval(approveAmount);
        console.log("Approval successful for", approveAmount, "tokens");
        showSuccess(`Approved ${approveAmount} tokens for future deposits`);
      } else {
        console.log("✅ Sufficient allowance, no approval needed");
      }

      // Encrypt the amount using FHE
      console.log("🔐 Encrypting amount...");
      const { encryptedValue, proof } = await encrypt(parseFloat(amount));
      console.log("Encrypted amount:", encryptedValue);
      console.log("Proof:", proof);

      // Prepare the deposit transaction
      console.log("📝 Preparing deposit transaction...");
      const depositTx = await zpoolContract.deposit(
        selectedToken.address,
        encryptedValue,
        proof,
        amountWei
      );

      console.log("⏳ Waiting for transaction confirmation...");
      showInfo("Waiting for transaction confirmation...");
      
      const receipt = await depositTx.wait();
      console.log("✅ Deposit successful!", receipt);

      // Check allowance after deposit
      const allowanceAfterDeposit = await tokenContract.allowance(account, ZPOOL_ADDRESS);
      console.log("Allowance after deposit:", {
        allowanceAfterDeposit: allowanceAfterDeposit.toString(),
        allowanceAfterDepositFormatted: ethers.formatEther(allowanceAfterDeposit)
      });

      showSuccess("Deposit successful! Your tokens are now in the private pool.");
      setAmount(""); // Clear the input
      
      // Clear relevant cache after successful transaction
      if (account) {
        clearCacheAfterDeposit(account, selectedToken.address);
      }
      
      // Refresh balance after a short delay to ensure transaction is confirmed
      setTimeout(async () => {
        await refreshBalance();
      }, 2000);

    } catch (error) {
      console.error("❌ Deposit error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      showError(`Deposit failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!account) {
      showError("Please connect your wallet first");
      return;
    }
    
    if (!amount || !fheInitialized) {
      showError("Please enter an amount and ensure FHE is initialized");
      return;
    }

    // Validate that amount is an integer
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0 || !Number.isInteger(amountNum)) {
      showError("Please enter a valid positive integer amount");
      return;
    }

    setLoading(true);
    showInfo("Processing withdrawal...");

    try {
      console.log("Starting withdrawal process...");
      console.log("Amount:", amount);
      console.log("Account:", account);

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      
      const zpool = new ethers.Contract(ZPOOL_ADDRESS, ZPOOL_ABI, signer);
      const amountWei = ethers.parseEther(amount);

      // Check if FHE is initialized
      if (!fheInitialized) {
        showError("FHE service not initialized. Please wait...");
        return;
      }

      // Encrypt the amount using FHE
      showInfo("Encrypting amount using FHE...");
      const { encryptedValue, proof } = await encrypt(parseFloat(amount));
      
      console.log('Encrypted value for withdrawal:', encryptedValue);
      console.log('Proof for withdrawal:', proof);
      
      // Withdraw with encrypted amount and proof
      const withdrawTx = await zpool.withdraw(
        selectedToken.address,
        encryptedValue,
        proof,
        amountWei
      );

      showInfo("Waiting for transaction confirmation...");
      await withdrawTx.wait();

      showSuccess("Withdrawal successful! Tokens returned to your wallet.");
      setAmount("");
      
      // Clear relevant cache after successful transaction
      if (account) {
        clearCacheAfterWithdrawal(account, selectedToken.address);
      }
      
      // Refresh balance after a short delay to ensure transaction is confirmed
      setTimeout(async () => {
        await refreshBalance();
      }, 2000);

    } catch (error: any) {
      console.error("Withdraw error:", error);
      
      // Provide more specific error messages
      if (error.message.includes("execution reverted")) {
        if (error.message.includes("insufficient balance")) {
          showError("Error: Insufficient encrypted balance for withdrawal.");
        } else if (error.message.includes("Contract is paused")) {
          showError("Error: ZPool contract is paused.");
        } else {
          showError("Error: Contract execution failed. This might be due to invalid FHE proof or encrypted amount format.");
        }
      } else if (error.message.includes("user rejected")) {
        showError("Error: Transaction was rejected by user.");
      } else {
        showError(`Error: ${error.message || "Transaction failed"}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h2>Pool Operations</h2>
      
      {/* Action Toggle */}
      <div className="action-toggle">
        <button
          className={`toggle-button ${action === 'deposit' ? 'active' : ''}`}
          onClick={() => setAction('deposit')}
          disabled={loading}
        >
          💰 Deposit
        </button>
        <button
          className={`toggle-button ${action === 'withdraw' ? 'active' : ''}`}
          onClick={() => setAction('withdraw')}
          disabled={loading}
        >
          💸 Withdraw
        </button>
      </div>

      {/* Pool Form */}
      <div className="form-container">
        <div className="input-group">
          <label htmlFor="amount">Amount to {action === 'deposit' ? 'Deposit' : 'Withdraw'} ({selectedToken.symbol})</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Enter whole number amount to ${action}`}
            min="0"
            step="1"
            pattern="[0-9]*"
            disabled={loading || !fheInitialized || (action === 'deposit' && !isTokenSupported)}
          />
        </div>

        <button
          className="action-button"
          onClick={action === 'deposit' ? handleDeposit : handleWithdraw}
          disabled={loading || !amount || !fheInitialized || (action === 'deposit' && !isTokenSupported)}
        >
          {loading ? 'Processing...' : `${action === 'deposit' ? 'Deposit' : 'Withdraw'} ${selectedToken.symbol}`}
        </button>
      </div>

      <div className="info-box">
        <h3>How FHE {action === 'deposit' ? 'Deposit' : 'Withdraw'} Works:</h3>
        {action === 'deposit' ? (
          <ol>
            <li>Enter amount you want to deposit</li>
            <li>Amount gets encrypted using FHE</li>
            <li>Encrypted amount is added to your private balance</li>
            <li>Your tokens are transferred to the ZPool contract</li>
            <li>Only you can see your encrypted balance</li>
          </ol>
        ) : (
          <ol>
            <li>Enter amount you want to withdraw</li>
            <li>Amount gets encrypted using FHE</li>
            <li>Encrypted amount is subtracted from your private balance</li>
            <li>Your tokens are returned from the ZPool contract</li>
            <li>Only you can decrypt your balance</li>
          </ol>
        )}
      </div>
    </div>
  );
};

export default PoolPage;