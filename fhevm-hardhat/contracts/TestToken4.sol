// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title TestToken4 - A simple ERC20 token for testing ZPool
contract TestToken4 is ERC20 {
    constructor() ERC20("Test Token 4", "TEST4") {
        _mint(msg.sender, 1000000 * 10**decimals());
    }

    /// @notice Mint additional tokens for testing
    /// @param to The address to mint tokens to
    /// @param amount The amount to mint
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
} 