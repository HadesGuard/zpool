# 🧱 ZPool - Multi-Asset Shielded Pool on FHEVM

**ZPool** is a privacy-focused decentralized application built on **Zama's FHEVM**, providing confidential token operations using Fully Homomorphic Encryption (FHE). Users can deposit, transfer, and withdraw tokens while keeping all amounts and balances encrypted on-chain.

## 🌟 Features

- **🔐 Private Deposits**: Deposit tokens with encrypted amounts
- **🔄 Private Transfers**: Transfer tokens between users without revealing amounts
- **💸 Private Withdrawals**: Withdraw tokens while keeping balances hidden
- **🏦 Multi-Asset Support**: Support for multiple ERC20 tokens
- **🎯 User-Friendly UI**: Clean React frontend with real-time balance updates
- **🪙 Test Token Faucet**: Easy token minting for testing

## 🏗️ Architecture

```
zpool/
├── fhevm-hardhat/     # Smart contracts & deployment
│   ├── contracts/     # Solidity contracts
│   │   ├── ZPool.sol      # Main pool contract
│   │   ├── TestToken.sol  # Test ERC20tokens
│   │   └── ...
│   ├── scripts/       # Deployment & utility scripts
│   ├── test/          # Contract tests
│   └── deploy/        # Deployment configurations
└── zpool-fe/          # React frontend
    ├── src/
    │   ├── components/    # React components
    │   │   ├── Header.tsx      # Navigation & balance display
    │   │   ├── DepositPage.tsx # Pool operations (deposit/withdraw)
    │   │   ├── TransferPage.tsx # Private transfers
    │   │   ├── FaucetPage.tsx  # Test token faucet
    │   │   └── ...
    │   ├── hooks/         # Custom React hooks
    │   │   ├── useFHE.ts       # FHE SDK integration
    │   │   ├── useTotalBalance.ts # Balance management
    │   │   └── ...
    │   ├── services/      # External services
    │   │   ├── fheService.ts   # FHE operations
    │   │   └── balanceService.ts # Balance fetching
    │   ├── styles/        # CSS files
    │   ├── config/        # Configuration files
    │   └── utils/         # Utility functions
    └── public/            # Static assets
```

## 🚀 Quick Start

### 🌐 Live Demo

**Try ZPool now!** Visit our live demo at: **[https://zpool.pages.dev/](https://zpool.pages.dev/)**

- 🔐 **Test Private Operations**: Deposit, transfer, and withdraw with encrypted amounts
- 🪙 **Multi-Token Support**: Try with different test tokens
- 💰 **Faucet Integration**: Get test tokens directly from the app
- 📱 **Mobile Friendly**: Works on desktop and mobile browsers
- 🔄 **Real-time Updates**: Live balance updates and transaction status

### Prerequisites

- Node.js 18+ 
- MetaMask wallet
- Sepolia testnet ETH

### 1 Clone & Install

```bash
git clone <repository-url>
cd zpool

# Install backend dependencies
cd fhevm-hardhat
npm install

# Install frontend dependencies  
cd ../zpool-fe
npm install
```

### 2. Deploy Contracts

```bash
cd fhevm-hardhat

# Copy deployment config
cp deploy-config.example deploy-config.json
# Edit deploy-config.json with your settings:
# - PRIVATE_KEY: Your deployment wallet private key
# - SEPOLIA_RPC_URL: Sepolia RPC endpoint
# - ETHERSCAN_API_KEY: For contract verification

# Deploy to Sepolia
npm run deploy:sepolia

# Deploy test tokens
npm run deploy:tokens
```

###3. Start Frontend

```bash
cd zpool-fe
npm start
```

Visit `http://localhost:3000` and connect your MetaMask wallet.

**Or try the live demo**: [https://zpool.pages.dev/](https://zpool.pages.dev/)

## 🔐 FHE Integration

### Overview
ZPool uses Zama's FHEVM technology to provide privacy-preserving token operations. All amounts are encrypted before being stored on-chain, ensuring complete privacy of user balances and transaction amounts.

### FHE Flow
```
User Input → FHE Encryption → Smart Contract → FHE Decryption → User Display
     ↓              ↓              ↓              ↓              ↓
   Amount      Encrypted      On-chain      Decrypted      Balance
   (100)       Amount        Storage       Amount         Display
               (0xabc...)    (0)    (100)         (100TEST)
```

### Setup
```bash
# Download Zama SDK bundle
curl -o zpool-fe/public/relayer-sdk-js.umd.cjs https://cdn.zama.ai/relayer-sdk-js.umd.cjs

# Or use the provided scripts
cd zpool-fe
./download-sdk.sh  # Linux/Mac
./download-sdk.ps1 # Windows
```

### Core Operations

#### Encryption
```typescript
// Encrypt amount for deposit/transfer
const { encryptedValue, proof } = await encrypt(10turns:[object Object] encryptedValue: 0.", proof: "0." }
```

#### Decryption
```typescript
// Decrypt balance for display
const decryptedBalance = await decrypt(encryptedValue);
// Returns: 100number)
```

## 🏛️ Smart Contracts

### Core Contracts

#### `ZPool.sol`
The main contract that handles:
- **Private Deposits**: Accept encrypted amounts and store them privately
- **Private Withdrawals**: Allow users to withdraw with encrypted amounts
- **Private Transfers**: Transfer encrypted amounts between users
- **Multi-Token Support**: Handle multiple ERC20 tokens
- **Balance Management**: Store and retrieve encrypted balances

#### `TestToken.sol` (and variants)
ERC20 tokens for development and testing:
- `TestToken.sol` - Basic test token (TEST)
- `TestToken2.sol` - Second test token (TEST2
- `TestToken3.sol` - Third test token (TEST3
- `TestToken4.sol` - Fourth test token (TEST4)

### Contract Functions

#### Public Functions
```solidity
// Deposit encrypted amount
function deposit(address token, bytes calldata encryptedAmount, bytes calldata proof, uint256amount) external

// Withdraw encrypted amount  
function withdraw(address token, bytes calldata encryptedAmount, bytes calldata proof, uint256amount) external

// Transfer encrypted amount
function transfer(address to, address token, bytes calldata encryptedAmount, bytes calldata proof) external

// Get encrypted balance
function getBalance(address user, address token) external view returns (bytes memory)

// Check if user has balance
function hasBalance(address user, address token) external view returns (bool)
```

#### Owner Functions
```solidity
// Add supported token
function addToken(address token) external onlyOwner

// Remove supported token
function removeToken(address token) external onlyOwner

// Pause/unpause contract
function pause() external onlyOwner
function unpause() external onlyOwner
```

## 🎨 Frontend Components

### Core Components

#### Header Component
- **Navigation**: Switch between Pool, Transfer, and Faucet
- **Balance Display**: Show public and private balances
- **Wallet Connection**: MetaMask integration
- **Token Selector**: Choose from available tokens

#### Pool Page (DepositPage.tsx)
- **Toggle Actions**: Switch between deposit and withdraw
- **Amount Input**: Integer-only input with validation
- **Transaction Status**: Real-time feedback and error handling
- **FHE Integration**: Automatic encryption/decryption

#### Transfer Page
- **Recipient Input**: Address validation and formatting
- **Amount Input**: Integer-only with validation
- **Private Transfers**: Encrypted amount transfers
- **Transaction Tracking**: Status updates and confirmations

#### Faucet Page
- **Token Selection**: Choose token to mint
- **Mint Function**: One-click token minting
- **Balance Updates**: Automatic balance refresh
- **Error Handling**: Clear error messages

## 🔧 Development

### Smart Contracts

```bash
cd fhevm-hardhat

# Compile contracts
npm run compile

# Run tests
npm test

# Deploy locally
npm run deploy:local

# Check deployment status
npm run check-deployment

# Verify on Etherscan
npm run verify:sepolia
```

### Frontend

```bash
cd zpool-fe

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Check for errors
npm run lint
```

### Available Scripts

#### Deployment Scripts
- `deploy:sepolia` - Deploy to Sepolia testnet
- `deploy:local` - Deploy to local hardhat network
- `deploy:tokens` - Deploy test tokens
- `verify:sepolia` - Verify contracts on Etherscan

#### Utility Scripts
- `check-deployment` - Check deployment status
- `check-contract-status` - Verify contract functionality
- `test-fhe-encryption` - Test FHE encryption/decryption
- `test-fhe-proof` - Test FHE proof generation

## 🧪 Testing

### Contract Tests
```bash
cd fhevm-hardhat
npm test
```

### Frontend Tests
```bash
cd zpool-fe
npm test
```

### FHE Testing
```bash
# Test FHE functionality
npm run test:fhe

# Test encryption/decryption
npm run test:encryption
```

## 🔒 Security

### FHE Security
- All amounts encrypted using Zamas FHE libraries
- Encrypted balances stored on-chain
- Zero-knowledge proof verification
- Private key management in browser

### Access Control
- Owner-only functions for token management
- Pausable functionality for emergencies
- Input validation and bounds checking

### Gas Optimization
- Efficient storage patterns
- Batch operations where possible
- Optimized FHE operations

### Current Gas Costs
- Deposit: ~15,000 gas
- Withdraw: ~120,000 gas  
- Transfer: ~100,000 gas
- Balance check: ~30,000 gas

## 🐛 Troubleshooting

### Quick Fixes

#### App Won't Load
```bash
# Clear browser cache
Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

# Check console for errors
F12 → Console tab
```

#### MetaMask Issues
```bash
# Refresh MetaMask
1. Open MetaMask2. Click Settings → Advanced
3. Click Reset Account"
4. Reconnect wallet
```

#### FHE Not Working
```bash
# Refresh FHE service1. Click "Refresh FHE" in dropdown2Wait 10-15s
3. Try operation again
```

### Common Issues

#### MetaMask Connection Problems
- **"Please install MetaMask"**: Install from [metamask.io](https://metamask.io)
- **"Wrong network detected"**: App should auto-switch to Sepolia
- **"User rejected connection"**: Check MetaMask popup and clickConnect"

#### FHE Service Issues
- **"FHE service not initialized"**: Wait 10-15s for initialization
- **"FHE encryption failed**: Check browser console for specific errors
- **Decryption failed**: Try refreshing balance manually

#### Transaction Failures
- **"Insufficient balance**: Use faucet to get test tokens
- **"Transaction reverted"**: Check gas settings and contract deployment
- **"Gas estimation failed"**: Increase gas limit manually

### Debug Commands
```bash
# Frontend debugging
cd zpool-fe
npm ls
rm -rf node_modules package-lock.json && npm install
npm run lint
npm run build

# Contract debugging
cd fhevm-hardhat
npm run check-deployment
npm test
npm run check-contract-status
```

## 📊 Performance

### Optimization Features
- **Code Splitting**: Lazy loading of components
- **Bundle Optimization**: Tree shaking and minification
- **Caching**: FHE results and balance caching
- **Lazy Loading**: Components load on demand

### Performance Metrics
- **First Load**: <3 seconds
- **FHE Operations**: <2 seconds
- **Balance Updates**: <1 second
- **Transaction Confirmation**: <30 seconds

## 🤝 Contributing

### Getting Started
1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Make** your changes
4. **Test** thoroughly
5. **Commit** with clear messages
6. **Push** to your fork
7. **Create** a pull request

### Code Standards
- **TypeScript**: Use strict type checking
- **Solidity**: Follow OpenZeppelin standards
- **React**: Use functional components with hooks
- **CSS**: Component-based styling
- **Comments**: Clear, descriptive comments

### Areas for Contribution
- **High Priority**: Performance optimization, security enhancements, error handling
- **Medium Priority**: UI/UX improvements, documentation, mobile support
- **Low Priority**: Advanced features, analytics, integrations

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](fhevm-hardhat/LICENSE) file for details.

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Security**: Email security issues to security@zpool.com

---

**Built with ❤️ using Zama's FHEVM technology**
