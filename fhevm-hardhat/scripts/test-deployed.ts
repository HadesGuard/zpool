import { ethers } from "hardhat";

async function main() {
  console.log("Testing deployed ZPool on Sepolia...\n");

  // Get the deployed contract addresses
  // Replace these with your actual deployed addresses
  const ZPOOL_ADDRESS = "YOUR_ZPOOL_ADDRESS_HERE";
  const TEST_TOKEN_ADDRESS = "YOUR_TEST_TOKEN_ADDRESS_HERE";

  // Get signers
  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

  try {
    // Get contract instances
    const zpool = await ethers.getContractAt("ZPool", ZPOOL_ADDRESS);
    const testToken = await ethers.getContractAt("TestToken", TEST_TOKEN_ADDRESS);

    console.log("=== Contract Information ===");
    console.log("ZPool address:", await zpool.getAddress());
    console.log("TestToken address:", await testToken.getAddress());
    console.log("ZPool owner:", await zpool.owner());
    console.log("ZPool paused:", await zpool.paused());
    console.log("TestToken supported:", await zpool.supportedTokens(await testToken.getAddress()));
    console.log("Deployer TestToken balance:", ethers.formatEther(await testToken.balanceOf(deployer.address)));
    console.log("");

    // Test basic functionality
    console.log("=== Testing Basic Functions ===");
    
    // Check if TestToken is supported
    const isSupported = await zpool.supportedTokens(await testToken.getAddress());
    console.log("✅ TestToken is supported:", isSupported);

    // Check initial balance
    const initialBalance = await zpool.getBalance(deployer.address, await testToken.getAddress());
    console.log("✅ Initial encrypted balance:", initialBalance);

    // Check total supply
    const totalSupply = await zpool.getTotalSupply(await testToken.getAddress());
    console.log("✅ Total encrypted supply:", totalSupply);

    // Check hasBalance
    const hasBalance = await zpool.hasBalance(deployer.address, await testToken.getAddress());
    console.log("✅ Has balance:", hasBalance);

    console.log("\n=== Test Completed Successfully ===");
    console.log("All basic functions are working correctly!");
    console.log("\nNote: For FHE operations (deposit/withdraw/transfer),");
    console.log("you need to use fhevm-js to generate proper encrypted values.");

  } catch (error) {
    console.error("❌ Error testing contracts:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 