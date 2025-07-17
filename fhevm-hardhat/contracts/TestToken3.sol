// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title TestToken3 - A simple ERC20 token for testing ZPool
contract TestToken3 is ERC20 {
    constructor() ERC20("Test Token 3", "TEST3") {
        _mint(msg.sender, 1000000 * 10**decimals());
    }

    /// @notice Mint additional tokens for testing
    /// @param to The address to mint tokens to
    /// @param amount The amount to mint
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
} 