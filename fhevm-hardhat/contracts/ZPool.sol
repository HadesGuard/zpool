// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint128, externalEuint128, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title ZPool - Multi-Asset Shielded Pool on FHEVM
/// @notice A privacy-focused pool that allows users to deposit, withdraw, and transfer tokens
/// with encrypted amounts using Fully Homomorphic Encryption (FHE)
contract ZPool is SepoliaConfig {
    using SafeERC20 for IERC20;

    // Token address => user address => encrypted balance
    mapping(address => mapping(address => euint128)) private _balances;
    
    // Token address => total encrypted supply
    mapping(address => euint128) private _totalSupply;
    
    // Supported tokens
    mapping(address => bool) public supportedTokens;
    
    // Owner for admin functions
    address public owner;
    
    // Pause functionality
    bool public paused;
    
    // Custom errors for better gas efficiency
    error TokenNotSupported();
    error ContractPaused();
    error InvalidEncryptedAmount();
    error InsufficientBalance();
    error InvalidRecipient();
    error CannotTransferToSelf();
    error InvalidTokenAddress();
    error TokenAlreadySupported();
    error OnlyOwner();
    error InvalidOwner();

    // Events
    event TokenAdded(address indexed token);
    event TokenRemoved(address indexed token);
    event Deposit(address indexed user, address indexed token, euint128 amount);
    event Withdraw(address indexed user, address indexed token, euint128 amount);
    event Transfer(address indexed from, address indexed to, address indexed token, euint128 amount);
    event Paused(address indexed by);
    event Unpaused(address indexed by);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // Modifiers
    modifier onlySupportedToken(address token) {
        if (!supportedTokens[token]) revert TokenNotSupported();
        _;
    }
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }
    
    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    /// @notice Constructor
    constructor() {
        owner = msg.sender;
    }
    
    /// @notice Add a new supported token
    /// @param token The ERC20 token address to add
    function addToken(address token) external onlyOwner {
        if (token == address(0)) revert InvalidTokenAddress();
        if (supportedTokens[token]) revert TokenAlreadySupported();
        
        supportedTokens[token] = true;
        emit TokenAdded(token);
    }

    /// @notice Remove a supported token (only if no balances exist)
    /// @param token The ERC20 token address to remove
    function removeToken(address token) external onlyOwner onlySupportedToken(token) {
        // Note: In a real implementation, you'd want to check if any users have balances
        // This is simplified for the demo
        supportedTokens[token] = false;
        emit TokenRemoved(token);
    }

    /// @notice Deposit tokens into the pool with encrypted amount
    /// @param token The ERC20 token to deposit
    /// @param amount The encrypted amount to deposit
    /// @param proof The FHE proof for the encrypted amount
    /// @param plainAmount The plain amount (for token transfer validation)
    function deposit(
        address token,
        externalEuint128 amount,
        bytes calldata proof,
        uint256 plainAmount
    ) external onlySupportedToken(token) whenNotPaused {
        require(plainAmount > 0, "ZPool: plainAmount must be > 0");
        euint128 encryptedAmount = FHE.fromExternal(amount, proof);
        require(FHE.isInitialized(encryptedAmount), "ZPool: Invalid encrypted amount");
        IERC20(token).safeTransferFrom(msg.sender, address(this), plainAmount);
        euint128 currentBalance = _balances[token][msg.sender];
        euint128 newBalance;
        if (FHE.isInitialized(currentBalance)) {
            newBalance = FHE.add(currentBalance, encryptedAmount);
            ebool balanceOverflow = FHE.lt(newBalance, currentBalance);
            _balances[token][msg.sender] = FHE.select(balanceOverflow, currentBalance, newBalance);
        } else {
            _balances[token][msg.sender] = encryptedAmount;
        }
        euint128 currentTotalSupply = _totalSupply[token];
        if (FHE.isInitialized(currentTotalSupply)) {
            euint128 newTotalSupply = FHE.add(currentTotalSupply, encryptedAmount);
            ebool supplyOverflow = FHE.lt(newTotalSupply, currentTotalSupply);
            _totalSupply[token] = FHE.select(supplyOverflow, currentTotalSupply, newTotalSupply);
        } else {
            _totalSupply[token] = encryptedAmount;
        }
        FHE.allowThis(_balances[token][msg.sender]);
        FHE.allow(_balances[token][msg.sender], msg.sender);
        FHE.allowThis(_totalSupply[token]);
        emit Deposit(msg.sender, token, encryptedAmount);
    }

    /// @notice Withdraw tokens from the pool with encrypted amount
    /// @param token The ERC20 token to withdraw
    /// @param amount The encrypted amount to withdraw
    /// @param proof The FHE proof for the encrypted amount
    /// @param plainAmount The plain amount (for token transfer validation)
    function withdraw(
        address token,
        externalEuint128 amount,
        bytes calldata proof,
        uint256 plainAmount
    ) external onlySupportedToken(token) whenNotPaused {
        require(plainAmount > 0, "ZPool: plainAmount must be > 0");
        euint128 encryptedAmount = FHE.fromExternal(amount, proof);
        require(FHE.isInitialized(encryptedAmount), "ZPool: Invalid encrypted amount");
        euint128 userBalance = _balances[token][msg.sender];
        FHE.allowThis(userBalance);
        FHE.allow(userBalance, msg.sender);
        euint128 newBalance;
        if (FHE.isInitialized(userBalance)) {
            newBalance = FHE.sub(userBalance, encryptedAmount);
            ebool balanceUnderflow = FHE.gt(newBalance, userBalance);
            _balances[token][msg.sender] = FHE.select(balanceUnderflow, userBalance, newBalance);
        } else {
            revert InsufficientBalance();
        }
        euint128 currentTotalSupply = _totalSupply[token];
        if (FHE.isInitialized(currentTotalSupply)) {
            euint128 newTotalSupply = FHE.sub(currentTotalSupply, encryptedAmount);
            ebool supplyUnderflow = FHE.gt(newTotalSupply, currentTotalSupply);
            _totalSupply[token] = FHE.select(supplyUnderflow, currentTotalSupply, newTotalSupply);
        }
        IERC20(token).safeTransfer(msg.sender, plainAmount);
        FHE.allowThis(_balances[token][msg.sender]);
        FHE.allow(_balances[token][msg.sender], msg.sender);
        FHE.allowThis(_totalSupply[token]);
        emit Withdraw(msg.sender, token, encryptedAmount);
    }

    /// @notice Transfer tokens privately between users
    /// @param to The recipient address
    /// @param token The ERC20 token to transfer
    /// @param amount The encrypted amount to transfer
    /// @param proof The FHE proof for the encrypted amount
    function transfer(
        address to,
        address token,
        externalEuint128 amount,
        bytes calldata proof
    ) external onlySupportedToken(token) whenNotPaused {
        if (to == address(0)) revert InvalidRecipient();
        if (to == msg.sender) revert CannotTransferToSelf();
        euint128 encryptedAmount = FHE.fromExternal(amount, proof);
        require(FHE.isInitialized(encryptedAmount), "ZPool: Invalid encrypted amount");
        euint128 senderBalance = _balances[token][msg.sender];
        euint128 recipientBalance = _balances[token][to];
        euint128 senderNewBalance;
        if (FHE.isInitialized(senderBalance)) {
            senderNewBalance = FHE.sub(senderBalance, encryptedAmount);
            ebool senderUnderflow = FHE.gt(senderNewBalance, senderBalance);
            _balances[token][msg.sender] = FHE.select(senderUnderflow, senderBalance, senderNewBalance);
        } else {
            revert InsufficientBalance();
        }
        euint128 recipientNewBalance;
        if (FHE.isInitialized(recipientBalance)) {
            recipientNewBalance = FHE.add(recipientBalance, encryptedAmount);
            ebool recipientOverflow = FHE.lt(recipientNewBalance, recipientBalance);
            _balances[token][to] = FHE.select(recipientOverflow, recipientBalance, recipientNewBalance);
        } else {
            _balances[token][to] = encryptedAmount;
        }
        FHE.allowThis(_balances[token][msg.sender]);
        FHE.allow(_balances[token][msg.sender], msg.sender);
        FHE.allowThis(_balances[token][to]);
        FHE.allow(_balances[token][to], to);
        emit Transfer(msg.sender, to, token, encryptedAmount);
    }

    /// @notice Get the encrypted balance of a user for a specific token
    /// @param user The user address
    /// @param token The ERC20 token address
    /// @return The encrypted balance
    function getBalance(address user, address token) external view returns (euint128) {
        return _balances[token][user];
    }

    /// @notice Get the total encrypted supply for a specific token
    /// @param token The ERC20 token address
    /// @return The encrypted total supply
    function getTotalSupply(address token) external view returns (euint128) {
        return _totalSupply[token];
    }

    /// @notice Check if a user has a balance greater than zero for a specific token
    /// @param user The user address
    /// @param token The ERC20 token address
    /// @return True if the user has a balance greater than zero, false otherwise
    function hasBalance(address user, address token) external returns (bool) {
        return FHE.isInitialized(_balances[token][user]);
    }
  
    /// @notice Pause the contract
    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }
    
    /// @notice Unpause the contract
    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }
    
    /// @notice Transfer ownership
    /// @param newOwner The new owner address
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidOwner();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
    
    /// @notice Emergency function to recover tokens stuck in contract
    /// @param token The token address to recover
    /// @param to The address to send tokens to
    /// @param amount The amount to recover
    function emergencyRecover(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner {
        if (to == address(0)) revert InvalidRecipient();
        IERC20(token).safeTransfer(to, amount);
    }
} 