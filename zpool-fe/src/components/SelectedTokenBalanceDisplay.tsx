import React, { useState, useEffect } from 'react';
import { TokenConfig } from '../config/tokens';
import { useSelectedTokenBalance } from '../hooks/useSelectedTokenBalance';
import '../styles/components/PageContainer.css';
import '../styles/components/TotalBalanceDisplay.css';

interface SelectedTokenBalanceDisplayProps {
  account: string;
  selectedToken: TokenConfig;
  fheInstance: any;
  rpcUrl: string;
  onTokenSelect: (token: TokenConfig) => void;
}

const SelectedTokenBalanceDisplay: React.FC<SelectedTokenBalanceDisplayProps> = ({
  account,
  selectedToken,
  fheInstance,
  rpcUrl,
  onTokenSelect
}) => {
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  
  const { 
    privateBalance, 
    publicBalance, 
    isLoading
  } = useSelectedTokenBalance(account, selectedToken, fheInstance, rpcUrl);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.balance-item')) {
        setShowTokenSelector(false);
      }
    };

    if (showTokenSelector) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTokenSelector]);

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (isNaN(num)) return "0";
    if (num === 0) return "0";
    if (num < 0.01) return "< 0.01";
    return num.toFixed(2);
  };

  // Import available tokens for selector
  const { AVAILABLE_TOKENS } = require('../config/tokens');

  return (
    <div className="balance-info-compact">
      <div className="balance-item">
        <div className="token-selector-row">
          <div className="token-info">
            <span className="token-icon">{selectedToken.icon || '🪙'}</span>
            <span className="token-symbol">{selectedToken.symbol}</span>
            <button 
              className="token-selector-btn"
              onClick={() => setShowTokenSelector(!showTokenSelector)}
              title="Select token"
            >
              ▼
            </button>
          </div>
          
          <div className="balance-breakdown-compact">
            <div className="breakdown-compact-item">
              <span className="breakdown-icon">🔐 Private</span>
              <span className="breakdown-value">
                {isLoading ? '...' : formatBalance(privateBalance)}
              </span>
            </div>
            <div className="breakdown-compact-item">
              <span className="breakdown-icon">🌐 Public</span>
              <span className="breakdown-value">
                {isLoading ? '...' : formatBalance(publicBalance)}
              </span>
            </div>
          </div>
        </div>
        
        {showTokenSelector && (
          <div className="token-selector-dropdown">
            <div className="token-selector-header">
              <span>Select Token</span>
              <button 
                className="close-btn"
                onClick={() => setShowTokenSelector(false)}
              >
                ×
              </button>
            </div>
            <div className="token-options">
              {AVAILABLE_TOKENS.map((token: TokenConfig) => (
                <button
                  key={token.address}
                  className={`token-option ${selectedToken.address === token.address ? 'selected' : ''}`}
                  onClick={() => {
                    onTokenSelect(token);
                    setShowTokenSelector(false);
                  }}
                >
                  <div className="token-left">
                    <span className="token-icon">{token.icon || '🪙'}</span>
                    <div className="token-details">
                      <span className="token-symbol">{token.symbol}</span>
                      <span className="token-name">{token.name}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectedTokenBalanceDisplay; 