import React, { useState } from 'react';
import { ethers } from 'ethers';
import { TokenConfig } from '../config/tokens';
import { useToast } from '../contexts/ToastContext';
import '../styles/components/PageContainer.css';
import '../styles/components/Form.css';
import '../styles/components/InfoBox.css';

interface FaucetPageProps {
  account: string;
  selectedToken: TokenConfig;
  isCorrectNetwork: boolean;
  refreshBalance?: () => Promise<void>;
}

const FaucetPage: React.FC<FaucetPageProps> = ({ 
  account, 
  selectedToken, 
  isCorrectNetwork,
  refreshBalance
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const { showSuccess, showError, showInfo } = useToast();

  const handleMintToken = async () => {
    if (!account) {
      showError("Please connect your wallet first");
      return;
    }

    if (!isCorrectNetwork) {
      showError("Please switch to Sepolia testnet first");
      return;
    }

    setLoading(true);
    showInfo(`Minting ${selectedToken.symbol} tokens...`);

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      
      const tokenContract = new ethers.Contract(selectedToken.address, selectedToken.abi, signer);
      const mintAmount = ethers.parseEther("1000");
      const tx = await tokenContract.mint(account, mintAmount);
      
      showInfo("Waiting for transaction confirmation...");
      await tx.wait();
      
      showSuccess(`Successfully minted 1000 ${selectedToken.symbol} tokens!`);

      // Refresh balance after minting
      if (refreshBalance) {
        setTimeout(async () => {
          showInfo("Updating balance...");
          await refreshBalance();
        }, 2000);
      }
      
    } catch (error) {
      console.error("Mint error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes("user rejected")) {
        showError("Transaction was rejected by user");
      } else if (errorMessage.includes("execution reverted")) {
        showError("Minting failed. This might be due to insufficient permissions or contract issues.");
      } else {
        showError(`Minting failed: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h2>🪙 Test Token Faucet</h2>
      
      <div className="form-container">
        <div className="input-group">
          <label>Selected Token:</label>
          <div style={{ 
            padding: '0.75rem', 
            background: 'rgba(255, 255, 255, 0.1)', 
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            fontFamily: 'monospace',
            fontSize: '0.9rem'
          }}>
            {selectedToken.icon} {selectedToken.name} ({selectedToken.symbol})
          </div>
        </div>

        <button
          className="action-button"
          onClick={handleMintToken}
          disabled={loading || !account || !isCorrectNetwork}
        >
          {loading ? `Minting ${selectedToken.symbol}...` : `🪙 Mint 1000 ${selectedToken.symbol}`}
        </button>
      </div>

      <div className="info-box">
        <h3>🪙 How to Get Test Tokens:</h3>
        <ol>
          <li>Make sure you're connected to Sepolia testnet</li>
          <li>Select the token you want to mint from the dropdown above</li>
          <li>Click "Mint 1000 [TOKEN]" button</li>
          <li>Wait for transaction confirmation</li>
          <li>Check your wallet balance</li>
        </ol>
        
      </div>
    </div>
  );
};

export default FaucetPage; 