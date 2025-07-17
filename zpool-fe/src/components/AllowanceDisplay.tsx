import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { ZPOOL_ADDRESS } from '../contracts';
import { checkAllowance } from '../utils/allowanceUtils';
import { TokenConfig } from '../config/tokens';
import '../styles/components/AllowanceDisplay.css';

interface AllowanceInfo {
  currentAllowance: string;
  formattedAllowance: string;
  isSufficient: boolean;
  needsApproval: boolean;
}

interface AllowanceDisplayProps {
  account: string;
  isTokenSupported: boolean;
  amount: string;
  selectedToken?: TokenConfig;
  onAllowanceChange?: (allowanceInfo: AllowanceInfo) => void;
  refreshTrigger?: number; // Add this to trigger refresh
}

const AllowanceDisplay: React.FC<AllowanceDisplayProps> = ({
  account,
  isTokenSupported,
  amount,
  selectedToken,
  onAllowanceChange,
  refreshTrigger
}) => {
  const [allowanceInfo, setAllowanceInfo] = useState<AllowanceInfo>({
    currentAllowance: '0',
    formattedAllowance: '0',
    isSufficient: false,
    needsApproval: false
  });
  const [checkingAllowance, setCheckingAllowance] = useState<boolean>(false);

  const refreshAllowance = useCallback(async () => {
    if (!account || !isTokenSupported || !selectedToken) return;
    
    try {
      setCheckingAllowance(true);
      const info = await checkAllowance(account, selectedToken);
      setAllowanceInfo(info);
      onAllowanceChange?.(info);
      console.log("Current allowance for ZPool:", info.formattedAllowance);
    } catch (error) {
      console.error("Error checking allowance:", error);
      const errorInfo = {
        currentAllowance: '0',
        formattedAllowance: '0',
        isSufficient: false,
        needsApproval: true
      };
      setAllowanceInfo(errorInfo);
      onAllowanceChange?.(errorInfo);
    } finally {
      setCheckingAllowance(false);
    }
  }, [account, isTokenSupported, selectedToken, onAllowanceChange]);

  // Check allowance when account or token support changes
  useEffect(() => {
    if (account && isTokenSupported && selectedToken) {
      refreshAllowance();
    }
  }, [account, isTokenSupported, selectedToken, refreshAllowance]);

  // Check allowance when refreshTrigger changes (after transactions)
  useEffect(() => {
    if (refreshTrigger && account && isTokenSupported && selectedToken) {
      console.log("🔄 Refreshing allowance due to transaction...");
      refreshAllowance();
    }
  }, [refreshTrigger, account, isTokenSupported, selectedToken, refreshAllowance]);

  if (!isTokenSupported || !selectedToken) {
    return null;
  }

  return (
    <div className="status-item allowance-status">
      <span className="status-icon">
        {checkingAllowance ? '⏳' : '💰'}
      </span>
      <span className="status-text">
        Allowance: {checkingAllowance ? 'Checking...' : `${allowanceInfo.formattedAllowance} ${selectedToken.symbol}`}
        {!checkingAllowance && parseFloat(allowanceInfo.formattedAllowance) > 0 && (
          <span style={{ fontSize: '0.8rem', color: '#888', marginLeft: '0.5rem' }}>
            (Approved for future deposits)
          </span>
        )}
      </span>
      <button 
        onClick={refreshAllowance}
        disabled={checkingAllowance}
        className="refresh-allowance-btn"
        title="Refresh allowance"
      >
        🔄
      </button>
    </div>
  );
};

export default AllowanceDisplay; 