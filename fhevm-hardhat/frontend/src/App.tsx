import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getInstance, FhevmInstance } from '@fhevm/fhevm-js';
import './App.css';

// Contract ABIs (simplified for demo)
const ZPOOL_ABI = [
  "function addToken(address token) external",
  "function deposit(address token, bytes calldata amount, bytes calldata proof, uint256 plainAmount) external",
  "function withdraw(address token, bytes calldata amount, bytes calldata proof, uint256 plainAmount) external",
  "function transfer(address to, address token, bytes calldata amount, bytes calldata proof) external",
  "function getBalance(address user, address token) external view returns (bytes)",
  "function getTotalSupply(address token) external view returns (bytes)",
  "function supportedTokens(address token) external view returns (bool)"
];

const TEST_TOKEN_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)"
];

function App() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string>('');
  const [fhevm, setFhevm] = useState<FhevmInstance | null>(null);
  const [zpoolAddress, setZpoolAddress] = useState<string>('');
  const [testTokenAddress, setTestTokenAddress] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [recipient, setRecipient] = useState<string>('');
  const [balance, setBalance] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Connect wallet
  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const accounts = await provider.send('eth_requestAccounts', []);
        
        setProvider(provider);
        setSigner(signer);
        setAccount(accounts[0]);

        // Initialize FHEVM
        const instance = await getInstance();
        setFhevm(instance);
      } else {
        alert('Please install MetaMask!');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  // Deploy contracts
  const deployContracts = async () => {
    if (!signer) return;
    
    setLoading(true);
    try {
      // Deploy TestToken
      const TestToken = new ethers.ContractFactory(
        ['constructor()'],
        ['608060405234801561001057600080fd5b506040516101e83803806101e8833981810160405281019061003291906100a0565b6000819055506100cd565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061006d82610042565b9050919050565b61007d81610062565b811461008857600080fd5b50565b60008151905061009a81610074565b92915050565b6000602082840312156100b6576100b561003d565b5b60006100c48482850161008b565b91505092915050565b61010a806100dc6000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c806318160ddd1461003b575b600080fd5b610043610061565b6040516100509190610088565b60405180910390f35b60008054905090565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061008282610057565b9050919050565b61009281610077565b82525050565b60006020820190506100ad6000830184610089565b9291505056fea2646970667358221220123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef64736f6c63430008120033'],
        signer
      );
      const testToken = await TestToken.deploy();
      await testToken.waitForDeployment();
      const testTokenAddr = await testToken.getAddress();
      setTestTokenAddress(testTokenAddr);

      // Deploy ZPool (simplified - you'd need the actual bytecode)
      alert('Please deploy ZPool contract manually and enter the address');
      
    } catch (error) {
      console.error('Error deploying contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Deposit tokens
  const deposit = async () => {
    if (!signer || !zpoolAddress || !testTokenAddress || !amount) return;
    
    setLoading(true);
    try {
      const zpool = new ethers.Contract(zpoolAddress, ZPOOL_ABI, signer);
      const testToken = new ethers.Contract(testTokenAddress, TEST_TOKEN_ABI, signer);
      
      const amountWei = ethers.parseUnits(amount, 18);
      
      // Approve tokens
      await testToken.approve(zpoolAddress, amountWei);
      
      // Encrypt amount using FHEVM
      if (fhevm) {
        const encryptedAmount = fhevm.encrypt32(parseInt(amount));
        const proof = fhevm.generateProof(encryptedAmount);
        
        await zpool.deposit(testTokenAddress, encryptedAmount, proof, amountWei);
        alert('Deposit successful!');
      }
    } catch (error) {
      console.error('Error depositing:', error);
      alert('Deposit failed!');
    } finally {
      setLoading(false);
    }
  };

  // Withdraw tokens
  const withdraw = async () => {
    if (!signer || !zpoolAddress || !testTokenAddress || !amount) return;
    
    setLoading(true);
    try {
      const zpool = new ethers.Contract(zpoolAddress, ZPOOL_ABI, signer);
      const amountWei = ethers.parseUnits(amount, 18);
      
      if (fhevm) {
        const encryptedAmount = fhevm.encrypt32(parseInt(amount));
        const proof = fhevm.generateProof(encryptedAmount);
        
        await zpool.withdraw(testTokenAddress, encryptedAmount, proof, amountWei);
        alert('Withdrawal successful!');
      }
    } catch (error) {
      console.error('Error withdrawing:', error);
      alert('Withdrawal failed!');
    } finally {
      setLoading(false);
    }
  };

  // Transfer tokens
  const transfer = async () => {
    if (!signer || !zpoolAddress || !testTokenAddress || !amount || !recipient) return;
    
    setLoading(true);
    try {
      const zpool = new ethers.Contract(zpoolAddress, ZPOOL_ABI, signer);
      
      if (fhevm) {
        const encryptedAmount = fhevm.encrypt32(parseInt(amount));
        const proof = fhevm.generateProof(encryptedAmount);
        
        await zpool.transfer(recipient, testTokenAddress, encryptedAmount, proof);
        alert('Transfer successful!');
      }
    } catch (error) {
      console.error('Error transferring:', error);
      alert('Transfer failed!');
    } finally {
      setLoading(false);
    }
  };

  // Get balance
  const getBalance = async () => {
    if (!provider || !zpoolAddress || !testTokenAddress || !account) return;
    
    try {
      const zpool = new ethers.Contract(zpoolAddress, ZPOOL_ABI, provider);
      const encryptedBalance = await zpool.getBalance(account, testTokenAddress);
      
      if (fhevm) {
        const decryptedBalance = fhevm.decrypt32(encryptedBalance);
        setBalance(decryptedBalance.toString());
      }
    } catch (error) {
      console.error('Error getting balance:', error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🧱 ZPool - Multi-Asset Shielded Pool</h1>
        <p>Privacy-focused token operations using FHE</p>
      </header>

      <main className="App-main">
        {!account ? (
          <button onClick={connectWallet} className="connect-btn">
            Connect Wallet
          </button>
        ) : (
          <div className="wallet-info">
            <p>Connected: {account}</p>
            
            <div className="contract-setup">
              <h3>Contract Setup</h3>
              <input
                type="text"
                placeholder="ZPool Contract Address"
                value={zpoolAddress}
                onChange={(e) => setZpoolAddress(e.target.value)}
              />
              <input
                type="text"
                placeholder="TestToken Contract Address"
                value={testTokenAddress}
                onChange={(e) => setTestTokenAddress(e.target.value)}
              />
              <button onClick={deployContracts} disabled={loading}>
                {loading ? 'Deploying...' : 'Deploy Contracts'}
              </button>
            </div>

            <div className="operations">
              <h3>Operations</h3>
              
              <div className="operation">
                <h4>Deposit</h4>
                <input
                  type="number"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <button onClick={deposit} disabled={loading}>
                  {loading ? 'Processing...' : 'Deposit'}
                </button>
              </div>

              <div className="operation">
                <h4>Withdraw</h4>
                <input
                  type="number"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <button onClick={withdraw} disabled={loading}>
                  {loading ? 'Processing...' : 'Withdraw'}
                </button>
              </div>

              <div className="operation">
                <h4>Transfer</h4>
                <input
                  type="text"
                  placeholder="Recipient Address"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <button onClick={transfer} disabled={loading}>
                  {loading ? 'Processing...' : 'Transfer'}
                </button>
              </div>

              <div className="operation">
                <h4>Balance</h4>
                <button onClick={getBalance}>Get Balance</button>
                {balance && <p>Balance: {balance}</p>}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App; 