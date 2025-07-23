import React, { useEffect, useState, useCallback, useMemo } from "react";
import { ethers } from "ethers";
import { ZPOOL_ADDRESS } from "./contracts";
import Header from "./components/Header";
import Body from "./components/Body";
import Footer from "./components/Footer";
import ToastContainer from "./components/ToastContainer";
import { ToastProvider } from "./contexts/ToastContext";
import { useFHE } from "./hooks/useFHE";
import { useTotalBalance } from "./hooks/useTotalBalance";
import { useBlockchainEvents } from "./hooks/useBlockchainEvents";
import { TransferNotifications } from "./components/TransferNotifications";
import CacheStats from "./components/CacheStats";
import { DEFAULT_TOKEN, TokenConfig } from "./config/tokens";
import { saveWalletState, clearWalletState, autoReconnectWallet } from "./utils/walletPersistence";

import "./styles/App.css";

function App() {
  const [account, setAccount] = useState<string>("");
  const [network, setNetwork] = useState<string>("");
  const [isCorrectNetwork, setIsCorrectNetwork] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<string>("deposit");
  const [showAccountMenu, setShowAccountMenu] = useState<boolean>(false);
  const [isDisconnecting, setIsDisconnecting] = useState<boolean>(false);
  const [selectedToken, setSelectedToken] = useState<TokenConfig>(DEFAULT_TOKEN);


  const SEPOLIA_CHAIN_ID = "0xaa36a7"; // 11155111 in hex

  // Multi-RPC configuration
  const SEPOLIA_RPC_ENDPOINTS = useMemo(() => [
    {
      name: "Lavanet",
      url: "https://g.w.lavanet.xyz:443/gateway/sep1/rpc-http/ac0a485e471079428fadfc1850f34a3d",
      priority: 1
    },
    {
      name: "PublicNode",
      url: "https://ethereum-sepolia-rpc.publicnode.com",
      priority: 2
    }
  ], []);

  // Get current RPC endpoints based on network
  const getCurrentRpcEndpoints = useCallback(() => {
    return SEPOLIA_RPC_ENDPOINTS;
  }, [SEPOLIA_RPC_ENDPOINTS]);

  const [currentRpcIndex, setCurrentRpcIndex] = useState<number>(0);
  const [rpcHealth, setRpcHealth] = useState<boolean[]>(new Array(SEPOLIA_RPC_ENDPOINTS.length).fill(true));

  // FHE integration with real SDK
  const fheConfig = account ? {
    network: (window as any).ethereum,
    rpcUrl: getCurrentRpcEndpoints()[currentRpcIndex]?.url,
    chainId: network ? parseInt(network, 16) : parseInt(SEPOLIA_CHAIN_ID, 16),
    account: account
  } : undefined;
  
  const { fheInstance, isInitialized: fheInitialized, isLoading: fheLoading, error: fheError, isSDKAvailable, encrypt, decrypt, refreshInstance: refreshFHE } = useFHE(fheConfig);
  
  // Get total balance for all tokens
  const { refreshBalance, ...totalBalanceInfo } = useTotalBalance(account, fheInstance, getCurrentRpcEndpoints()[currentRpcIndex]?.url || "");

  // Setup blockchain event listeners for real-time cache invalidation
  const { clearCacheForUser, clearCacheForToken } = useBlockchainEvents({
    account,
    rpcUrl: getCurrentRpcEndpoints()[currentRpcIndex]?.url || "",
    isConnected: !!account
  });

  // Get current RPC provider
  const getCurrentRpcProvider = useCallback((): ethers.JsonRpcProvider => {
    const currentRpcEndpoints = getCurrentRpcEndpoints();
    const currentRpc = currentRpcEndpoints[currentRpcIndex];

    return new ethers.JsonRpcProvider(currentRpc.url);
  }, [currentRpcIndex, network, getCurrentRpcEndpoints]);

  // Check network and auto-switch to Sepolia if needed
  const checkNetwork = async () => {
    if (!(window as any).ethereum) {
      alert("Please install MetaMask!");
      return;
    }

    try {
      // Get current chain ID
      const chainId = await (window as any).ethereum.request({ method: "eth_chainId" });
      setNetwork(chainId);

      if (chainId === SEPOLIA_CHAIN_ID) {
        setIsCorrectNetwork(true);
  
      } else {
        setIsCorrectNetwork(false);

        // Auto-switch to Sepolia
        await switchToSepolia();
      }
    } catch (error) {
      console.error("Error checking network:", error);
    }
  };

  // Switch to Sepolia
  const switchToSepolia = async () => {
    try {
      await (window as any).ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
      setNetwork(SEPOLIA_CHAIN_ID);
      setIsCorrectNetwork(true);
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: SEPOLIA_CHAIN_ID,
                chainName: "Sepolia Testnet",
                nativeCurrency: {
                  name: "Sepolia Ether",
                  symbol: "SEP",
                  decimals: 18,
                },
                rpcUrls: ["https://g.w.lavanet.xyz:443/gateway/sep1/rpc-http/ac0a485e471079428fadfc1850f34a3d"],
                blockExplorerUrls: ["https://sepolia.etherscan.io"],
              },
            ],
          });
          setNetwork(SEPOLIA_CHAIN_ID);
          setIsCorrectNetwork(true);
        } catch (addError) {
          console.error("Error adding Sepolia network:", addError);
          alert("Failed to add Sepolia network to MetaMask");
        }
      } else {
        console.error("Error switching to Sepolia:", switchError);
        alert("Failed to switch to Sepolia network");
      }
    }
  };

  // Get network name from chain ID
  const getNetworkName = (chainId: string) => {
    switch (chainId) {
      case "0x1":
        return "Ethereum Mainnet";
      case "0xaa36a7":
        return "Sepolia Testnet";
      default:
        return "Unknown Network";
    }
  };

  // Connect wallet
  const connectWallet = async () => {
    if ((window as any).ethereum) {
      try {
        // First check network
        await checkNetwork();
        
        // Then connect wallet
        const accounts = await (window as any).ethereum.request({ 
          method: "eth_requestAccounts" 
        });
        
        const account = accounts[0];
        setAccount(account);
        
        // Save wallet state for persistence
        const walletState = {
          account,
          network: await (window as any).ethereum.request({ method: "eth_chainId" }),
          isConnected: true,
          lastConnected: Date.now()
        };
        saveWalletState(walletState);
        
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    try {
      setIsDisconnecting(true);
      setAccount("");
      setShowAccountMenu(false);
      setNetwork("");
      setIsCorrectNetwork(false);
      
      // Clear saved wallet state
      clearWalletState();
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Refresh account manually
  const refreshAccount = async () => {
    if ((window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({ 
          method: "eth_accounts" 
        });
        
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount("");
        }
        setShowAccountMenu(false);
      } catch (error) {
        console.error("Error refreshing account:", error);
      }
    }
  };

  // Test network connection
  const testConnection = async () => {
    try {
      const provider = getCurrentRpcProvider();
      const network = await provider.getNetwork();
      
      // Test contract existence
      const testTokenCode = await provider.getCode(DEFAULT_TOKEN.address);
      const zpoolCode = await provider.getCode(ZPOOL_ADDRESS);
      
      if (testTokenCode === "0x") {
        alert("TestToken contract not found on this network. Please check deployment.");
        return;
      }
      
      if (zpoolCode === "0x") {
        alert("ZPool contract not found on this network. Please check deployment.");
        return;
      }
      
      alert("Connection test successful! Both contracts are deployed.");
    } catch (error) {
      console.error("Connection test failed:", error);
      alert("Connection test failed. Check console for details.");
    }
  };

  // Listen for network changes
  useEffect(() => {
    if ((window as any).ethereum) {
      console.log("Setting up MetaMask event listeners...");
      
      const handleChainChanged = (chainId: string) => {
        console.log("Chain changed to:", chainId);
        setNetwork(chainId);
        setIsCorrectNetwork(chainId === SEPOLIA_CHAIN_ID);
      };

      const handleAccountsChanged = (accounts: string[]) => {
        console.log("Accounts changed:", accounts);
        
        // Don't process if we're manually disconnecting
        if (isDisconnecting) {
          console.log("Ignoring accountsChanged during manual disconnect");
          return;
        }
        
        if (accounts.length > 0) {
          console.log("Setting new account:", accounts[0]);
          setAccount(accounts[0]);
          
          // Update saved wallet state
          (async () => {
            try {
              const walletState = {
                account: accounts[0],
                network: await (window as any).ethereum.request({ method: "eth_chainId" }),
                isConnected: true,
                lastConnected: Date.now()
              };
              saveWalletState(walletState);
            } catch (error) {
              console.error("Error updating wallet state:", error);
            }
          })();
        } else {
          console.log("No accounts, disconnecting");
          setAccount("");
          clearWalletState();
        }
      };

      // Add event listeners
      (window as any).ethereum.on("chainChanged", handleChainChanged);
      (window as any).ethereum.on("accountsChanged", handleAccountsChanged);

      // Cleanup function
      return () => {
        console.log("Cleaning up MetaMask event listeners...");
        (window as any).ethereum.removeListener("chainChanged", handleChainChanged);
        (window as any).ethereum.removeListener("accountsChanged", handleAccountsChanged);
      };
    }
  }, [isDisconnecting]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.account-dropdown')) {
        setShowAccountMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset RPC index when network changes
  useEffect(() => {
    if (network) {

      setCurrentRpcIndex(0); // Reset to first RPC for new network
      const currentRpcEndpoints = getCurrentRpcEndpoints();
      setRpcHealth(new Array(currentRpcEndpoints.length).fill(true));
    }
  }, [network, getCurrentRpcEndpoints]);

  // Auto-reconnect on mount
  useEffect(() => {
    const attemptAutoReconnect = async () => {
      if (!account && (window as any).ethereum) {
        try {
          const result = await autoReconnectWallet();
          if (result) {
            setAccount(result.account);
            setNetwork(result.network);
            setIsCorrectNetwork(result.network === SEPOLIA_CHAIN_ID);
          }
        } catch (error) {
          console.error("Auto-reconnect failed:", error);
        }
      }
    };

    attemptAutoReconnect();
  }, []); // Only run on mount

  // Check current account on mount and when network changes
  useEffect(() => {
    const checkCurrentAccount = async () => {
      if ((window as any).ethereum && isCorrectNetwork) {
        try {
          const accounts = await (window as any).ethereum.request({ 
            method: "eth_accounts" 
          });
          if (accounts.length > 0 && accounts[0] !== account) {
            setAccount(accounts[0]);
            
            // Update saved wallet state
            const walletState = {
              account: accounts[0],
              network: await (window as any).ethereum.request({ method: "eth_chainId" }),
              isConnected: true,
              lastConnected: Date.now()
            };
            saveWalletState(walletState);
          }
        } catch (error) {
          console.error("Error checking current account:", error);
        }
      }
    };

    // Only check if we don't have an account yet or if network changed
    if (!account || isCorrectNetwork) {
      checkCurrentAccount();
    }
  }, [isCorrectNetwork]); // Remove account from dependencies to prevent loops

  // Poll for account changes every 30 seconds
  useEffect(() => {
    if (!account || !isCorrectNetwork) return;

    const pollInterval = setInterval(async () => {
      if ((window as any).ethereum) {
        try {
          const accounts = await (window as any).ethereum.request({ 
            method: "eth_accounts" 
          });
          
          if (accounts.length > 0 && accounts[0] !== account) {
            setAccount(accounts[0]);
          }
        } catch (error) {
          console.error("Error polling for account changes:", error);
        }
      }
    }, 30000); // 30 seconds

    return () => clearInterval(pollInterval);
  }, [account, isCorrectNetwork]);

  return (
    <ToastProvider>
      <div className="App">
        <Header
          account={account}
          network={network}
          isCorrectNetwork={isCorrectNetwork}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalBalanceInfo={totalBalanceInfo}
          selectedToken={selectedToken}
          onTokenSelect={setSelectedToken}
          showAccountMenu={showAccountMenu}
          setShowAccountMenu={setShowAccountMenu}
          rpcHealth={rpcHealth}
          currentRpcIndex={currentRpcIndex}
          getCurrentRpcEndpoints={getCurrentRpcEndpoints}
          getNetworkName={getNetworkName}
          isSDKAvailable={isSDKAvailable}
          fheInitialized={fheInitialized}
          fheLoading={fheLoading}
          refreshAccount={refreshAccount}
          testConnection={testConnection}
          disconnectWallet={disconnectWallet}
          switchToSepolia={switchToSepolia}
          SEPOLIA_CHAIN_ID={SEPOLIA_CHAIN_ID}

        />

        <Body
          account={account}
          isCorrectNetwork={isCorrectNetwork}
          currentPage={currentPage}
          selectedToken={selectedToken}
          fheInitialized={fheInitialized}
          fheLoading={fheLoading}
          fheError={fheError}
          isSDKAvailable={isSDKAvailable}
          encrypt={encrypt}
          decrypt={decrypt}
          refreshFHE={refreshFHE}
          refreshBalance={refreshBalance}
          connectWallet={connectWallet}
          switchToSepolia={switchToSepolia}
          network={network}
        />

        <Footer />
      </div>
      <ToastContainer />
      <TransferNotifications
        account={account}
        rpcUrl={getCurrentRpcEndpoints()[currentRpcIndex]?.url || ""}
        isConnected={!!account}
      />
      <CacheStats />
    </ToastProvider>
  );
}

export default App;
