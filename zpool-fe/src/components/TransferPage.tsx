import React, { useState } from "react";
import { ethers } from "ethers";
import { ZPOOL_ADDRESS, ZPOOL_ABI } from "../contracts";
import { TokenConfig } from "../config/tokens";
import { useToast } from '../contexts/ToastContext';
import '../styles/components/PageContainer.css';
import '../styles/components/Form.css';
import '../styles/components/InfoBox.css';

interface TransferPageProps {
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

const TransferPage: React.FC<TransferPageProps> = ({ 
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
  const [recipient, setRecipient] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  
  const { showSuccess, showError, showInfo } = useToast();

  const handleTransfer = async () => {
    if (!recipient || !ethers.isAddress(recipient)) {
      showError("Please enter a valid recipient address");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      showError("Please enter a valid amount");
      return;
    }

    // Validate that amount is an integer
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0 || !Number.isInteger(amountNum)) {
      showError("Please enter a valid positive integer amount");
      return;
    }

    if (recipient.toLowerCase() === account.toLowerCase()) {
      showError("Cannot transfer to yourself");
      return;
    }

    setLoading(true);
    showInfo("Processing transfer...");

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      
      const zpool = new ethers.Contract(ZPOOL_ADDRESS, ZPOOL_ABI, signer);

      // Check if FHE is initialized
      if (!fheInitialized) {
        showError("FHE service not initialized. Please wait...");
        return;
      }

      // Encrypt the amount using FHE
      showInfo("Encrypting amount using FHE...");
      const { encryptedValue, proof } = await encrypt(parseFloat(amount));
      
      console.log('Encrypted value for transfer:', encryptedValue);
      console.log('Proof for transfer:', proof);
      
      // Transfer with encrypted amount and proof
      const transferTx = await zpool.transfer(
        recipient,
        selectedToken.address,
        encryptedValue,
        proof
      );

      showInfo("Waiting for transaction confirmation...");
      await transferTx.wait();

      showSuccess("Transfer successful! Check recipient's encrypted balance.");
      setRecipient("");
      setAmount("");
      
      // Transfer doesn't affect allowance, so no need to refresh
      // setRefreshTrigger(prev => prev + 1);
      
      // Refresh balance after a short delay to ensure transaction is confirmed
      setTimeout(async () => {
        await refreshBalance();
      }, 2000);

    } catch (error: any) {
      console.error("Transfer error:", error);
      showError(`Error: ${error.message || "Transaction failed"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h2>Transfer Tokens</h2>
      
      <div className="form-container">
        <div className="input-group">
          <label htmlFor="recipient">Recipient Address:</label>
          <input
            type="text"
            id="recipient"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            disabled={loading}
            style={{ fontFamily: 'monospace' }}
          />
        </div>

        <div className="input-group">
          <label htmlFor="amount">Amount to Transfer:</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter whole number amount (e.g., 25)"
            disabled={loading}
            min="0"
            step="1"
            pattern="[0-9]*"
          />
        </div>

        <button 
          onClick={handleTransfer} 
          disabled={loading || !recipient || !amount || !fheInitialized}
          className="action-button"
        >
          {loading ? "Processing..." : !fheInitialized ? "FHE Not Ready" : "Transfer Tokens"}
        </button>
      </div>

      <div className="info-box">
        <h3>How FHE Transfer Works:</h3>
        <ol>
          <li>Enter recipient address and amount</li>
          <li>Amount gets encrypted using FHE</li>
          <li>Encrypted amount is subtracted from your balance</li>
          <li>Encrypted amount is added to recipient's balance</li>
          <li>Only recipient can decrypt their new balance</li>
        </ol>
      </div>
    </div>
  );
};

export default TransferPage; 