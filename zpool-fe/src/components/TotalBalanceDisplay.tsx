import React, { useState, useEffect } from 'react';
import { TotalBalanceInfo } from '../hooks/useTotalBalance';
import { TokenConfig } from '../config/tokens';
import '../styles/components/PageContainer.css';
import '../styles/components/TotalBalanceDisplay.css';

interface TotalBalanceDisplayProps {
  totalBalanceInfo: TotalBalanceInfo;
  selectedToken: TokenConfig;
  onTokenSelect: (token: TokenConfig) => void;
}

const TotalBalanceDisplay: React.FC<TotalBalanceDisplayProps> = ({
  totalBalanceInfo,
  selectedToken,
  onTokenSelect
}) => {
  const [showTokenSelector, setShowTokenSelector] = useState(false);

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
    if (num === 0) return "0";
    if (num < 0.01) return "< 0.01";
    return num.toFixed(2);
  };

  const getSelectedTokenBalance = () => {
    const tokenBalance = totalBalanceInfo.tokenBalances[selectedToken.address];
    if (!tokenBalance) return { private: "0", public: "0", total: "0" };
    
    const privateBalance = parseFloat(tokenBalance.privateBalance) || 0;
    const publicBalance = parseFloat(tokenBalance.publicBalance) || 0;
    const totalBalance = privateBalance + publicBalance;
    
    return {
      private: formatBalance(tokenBalance.privateBalance),
      public: formatBalance(tokenBalance.publicBalance),
      total: formatBalance(totalBalance.toString())
    };
  };

  const selectedBalance = getSelectedTokenBalance();

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
              <span className="breakdown-value">{selectedBalance.private}</span>
            </div>
            <div className="breakdown-compact-item">
              <span className="breakdown-icon">🌐 Public</span>
              <span className="breakdown-value">{selectedBalance.public}</span>
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
              {Object.values(totalBalanceInfo.tokenBalances).map((tokenBalance) => {
                const privateBalance = parseFloat(tokenBalance.privateBalance) || 0;
                const publicBalance = parseFloat(tokenBalance.publicBalance) || 0;
                const totalBalance = privateBalance + publicBalance;
                
                return (
                  <button
                    key={tokenBalance.token.address}
                    className={`token-option ${selectedToken.address === tokenBalance.token.address ? 'selected' : ''}`}
                    onClick={() => {
                      onTokenSelect(tokenBalance.token);
                      setShowTokenSelector(false);
                    }}
                  >
                    <div className="token-left">
                      <span className="token-icon">{tokenBalance.token.icon || '🪙'}</span>
                      <div className="token-details">
                        <span className="token-symbol">{tokenBalance.token.symbol}</span>
                        <span className="token-name">{tokenBalance.token.name}</span>
                      </div>
                    </div>
                    <div className="token-right">
                      <span className="total-balance">{formatBalance(totalBalance.toString())} {tokenBalance.token.symbol}</span>
                      <div className="balance-breakdown-mini">
                        <span className="breakdown-private">🔐 {formatBalance(tokenBalance.privateBalance)}</span>
                        <span className="breakdown-public">🌐 {formatBalance(tokenBalance.publicBalance)}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TotalBalanceDisplay; 