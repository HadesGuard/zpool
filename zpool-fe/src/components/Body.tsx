import React from 'react';
import PoolPage from './DepositPage'; // Renamed to PoolPage
import TransferPage from './TransferPage';
import FaucetPage from './FaucetPage';
import { TokenConfig } from '../config/tokens';
import '../styles/components/Body.css';

interface BodyProps {
  account: string;
  isCorrectNetwork: boolean;
  currentPage: string;
  selectedToken: TokenConfig;
  fheInitialized: boolean;
  fheLoading: boolean;
  fheError: string | null;
  isSDKAvailable: boolean;
  encrypt: (value: number) => Promise<{ encryptedValue: string; proof: string }>;
  decrypt: (encryptedValue: string) => Promise<number>;
  refreshFHE: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  connectWallet: () => void;
  switchToSepolia: () => void;
  network: string;
}

const Body: React.FC<BodyProps> = ({
  account,
  isCorrectNetwork,
  currentPage,
  selectedToken,
  fheInitialized,
  fheLoading,
  fheError,
  isSDKAvailable,
  encrypt,
  decrypt,
  refreshFHE,
  refreshBalance,
  connectWallet,
  switchToSepolia,
  network
}) => {
  const renderCurrentPage = () => {
    if (!account || !isCorrectNetwork) {
      return null;
    }

    switch (currentPage) {
      case "deposit":
        return (
          <PoolPage 
            account={account} 
            selectedToken={selectedToken}
            fheInitialized={fheInitialized}
            fheLoading={fheLoading}
            fheError={fheError}
            isSDKAvailable={isSDKAvailable}
            encrypt={encrypt}
            decrypt={decrypt}
            refreshFHE={refreshFHE}
            refreshBalance={refreshBalance}
          />
        );
      case "transfer":
        return (
          <TransferPage 
            account={account} 
            selectedToken={selectedToken}
            fheInitialized={fheInitialized}
            fheLoading={fheLoading}
            fheError={fheError}
            isSDKAvailable={isSDKAvailable}
            encrypt={encrypt}
            decrypt={decrypt}
            refreshFHE={refreshFHE}
            refreshBalance={refreshBalance}
          />
        );
      case "faucet":
        return (
          <FaucetPage 
            account={account} 
            selectedToken={selectedToken}
            isCorrectNetwork={isCorrectNetwork}
            refreshBalance={refreshBalance}
          />
        );
      default:
        return (
          <PoolPage 
            account={account} 
            selectedToken={selectedToken}
            fheInitialized={fheInitialized}
            fheLoading={fheLoading}
            fheError={fheError}
            isSDKAvailable={isSDKAvailable}
            encrypt={encrypt}
            decrypt={decrypt}
            refreshFHE={refreshFHE}
            refreshBalance={refreshBalance}
          />
        );
    }
  };

  return (
    <main className="App-main">
      {!account ? (
        <div className="connect-section">
          <h2>Connect Your Wallet</h2>
          <button onClick={connectWallet} className="connect-btn">
            Connect MetaMask
          </button>
        </div>
      ) : (
        <>
          {!isCorrectNetwork && (
            <div className="network-warning">
              <div className="warning-icon">⚠️</div>
              <div className="warning-content">
                <p>Please switch to Sepolia Testnet to use ZPool</p>
                <div className="network-switch-buttons">
                  <button onClick={switchToSepolia} className="switch-network-btn">
                    🌐 Switch to Sepolia
                  </button>
                </div>
              </div>
            </div>
          )}

          {isCorrectNetwork && renderCurrentPage()}
        </>
      )}
    </main>
  );
};

export default Body; 