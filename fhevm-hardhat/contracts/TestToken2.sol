// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title TestToken2 - A simple ERC20 token for testing ZPool
contract TestToken2 is ERC20 {
    constructor() ERC20("Test Token 2", "TEST2") {
        _mint(msg.sender, 1000000 * 10**decimals());
    }

    /// @notice Mint additional tokens for testing
    /// @param to The address to mint tokens to
    /// @param amount The amount to mint
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
} 