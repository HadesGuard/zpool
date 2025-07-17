import React from 'react';
import TotalBalanceDisplay from './TotalBalanceDisplay';
import { TotalBalanceInfo } from '../hooks/useTotalBalance';
import { TokenConfig } from '../config/tokens';
import '../styles/components/PageContainer.css';
import '../styles/components/Header.css';

interface HeaderProps {
  account: string;
  network: string;
  isCorrectNetwork: boolean;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  totalBalanceInfo: TotalBalanceInfo;
  selectedToken: TokenConfig;
  onTokenSelect: (token: TokenConfig) => void;
  showAccountMenu: boolean;
  setShowAccountMenu: (show: boolean) => void;
  rpcHealth: boolean[];
  currentRpcIndex: number;
  getCurrentRpcEndpoints: () => any[];
  getNetworkName: (chainId: string) => string;
  isSDKAvailable: boolean;
  fheInitialized: boolean;
  fheLoading: boolean;
  refreshAccount: () => void;
  testConnection: () => void;
  disconnectWallet: () => void;
  switchToSepolia: () => void;
  SEPOLIA_CHAIN_ID: string;
}

const Header: React.FC<HeaderProps> = ({
  account,
  network,
  isCorrectNetwork,
  currentPage,
  setCurrentPage,
  totalBalanceInfo,
  selectedToken,
  onTokenSelect,
  showAccountMenu,
  setShowAccountMenu,
  rpcHealth,
  currentRpcIndex,
  getCurrentRpcEndpoints,
  getNetworkName,
  isSDKAvailable,
  fheInitialized,
  fheLoading,
  refreshAccount,
  testConnection,
  disconnectWallet,
  switchToSepolia,
  SEPOLIA_CHAIN_ID
}) => {
  return (
    <header className="App-header">
      <div className="header-top">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">🔐</div>
            <div className="logo-text">
              <h1>ZPool</h1>
              <p>Private & Secure Token Pool</p>
            </div>
          </div>
        </div>
        
        {account && isCorrectNetwork && (
          <div className="top-balance">
            <div className="balance-display-compact">
              <TotalBalanceDisplay
                totalBalanceInfo={totalBalanceInfo}
                selectedToken={selectedToken}
                onTokenSelect={onTokenSelect}
              />
              <div className="account-info-compact">
                <div className="account-dropdown">
                  <button 
                    className="account-dropdown-toggle"
                    onClick={() => setShowAccountMenu(!showAccountMenu)}
                  >
                    <span className="account-address-compact">{account.substring(0, 6)}...{account.substring(38)}</span>
                    <span className="dropdown-arrow">▼</span>
                  </button>
                  {showAccountMenu && (
                    <div className="account-dropdown-menu">
                      <div className="rpc-status">
                        <span className="rpc-label">RPC:</span>
                        <span className={`rpc-name ${rpcHealth[currentRpcIndex] ? 'healthy' : 'unhealthy'}`}>
                          {getCurrentRpcEndpoints()[currentRpcIndex]?.name || 'Unknown'}
                        </span>
                      </div>
                      <div className="fhe-status">
                        <span className="fhe-label">FHE SDK:</span>
                        <span className={`fhe-name ${isSDKAvailable ? 'available' : 'unavailable'}`}>
                          {isSDKAvailable ? 'Available' : 'Not Available'}
                        </span>
                      </div>
                      <div className="fhe-status">
                        <span className="fhe-label">FHE Service:</span>
                        <span className={`fhe-name ${fheInitialized ? 'ready' : fheLoading ? 'loading' : 'error'}`}>
                          {fheInitialized ? (isSDKAvailable ? 'Real SDK' : 'Error') : fheLoading ? 'Loading...' : 'Error'}
                        </span>
                      </div>
                      <div className="network-selection">
                        <span className="network-label">Network:</span>
                        <div className="network-buttons">
                          <button 
                            className={`network-btn ${network === SEPOLIA_CHAIN_ID ? 'active' : ''}`}
                            onClick={switchToSepolia}
                          >
                            🌐 Sepolia
                          </button>
                        </div>
                      </div>
                      <button className="dropdown-item" onClick={refreshAccount}>
                        🔄 Refresh Account
                      </button>
                      <button className="dropdown-item" onClick={testConnection}>
                        🔍 Test Connection
                      </button>
                      <button className="dropdown-item disconnect" onClick={disconnectWallet}>
                        ❌ Disconnect
                      </button>
                    </div>
                  )}
                </div>
                <span className={`network-badge-compact ${isCorrectNetwork ? 'connected' : 'wrong'}`}>
                  {getNetworkName(network)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {account && isCorrectNetwork && (
        <div className="header-tabs">
          <div className="tab-container">
            <button 
              className={`tab-button ${currentPage === "deposit" ? "active" : ""}`}
              onClick={() => setCurrentPage("deposit")}
            >
              🏊 Pool
            </button>
            <button 
              className={`tab-button ${currentPage === "transfer" ? "active" : ""}`}
              onClick={() => setCurrentPage("transfer")}
            >
              🔄 Transfer
            </button>
            <button 
              className={`tab-button ${currentPage === "faucet" ? "active" : ""}`}
              onClick={() => setCurrentPage("faucet")}
            >
              🪙 Faucet
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header; 