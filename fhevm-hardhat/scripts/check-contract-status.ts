import { ethers } from "hardhat";

async function main() {
  const ZPOOL_ADDRESS = "0xF6e6AE366316b30699e275A8bA0627AAb967a4Da";
  const TEST_TOKEN_ADDRESS = "0x662E0846592CD39fc0129e94eC752f5F92FB3444";
  const USER_ADDRESS = "0xF7A13273929a61077D09e8365De2F61c8A381C13"; // User address from error

  console.log("Checking contract status...\n");

  // Get contract instances
  const zpool = await ethers.getContractAt("ZPool", ZPOOL_ADDRESS);
  const testToken = await ethers.getContractAt("TestToken", TEST_TOKEN_ADDRESS);

  // Check if token is supported
  console.log("1. Checking if token is supported:");
  const isSupported = await zpool.supportedTokens(TEST_TOKEN_ADDRESS);
  console.log(`   Token ${TEST_TOKEN_ADDRESS} is supported: ${isSupported}`);

  // Check contract owner
  console.log("\n2. Checking contract owner:");
  const owner = await zpool.owner();
  console.log(`   Contract owner: ${owner}`);

  // Check if contract is paused
  console.log("\n3. Checking if contract is paused:");
  const isPaused = await zpool.paused();
  console.log(`   Contract is paused: ${isPaused}`);

  // Check user's token balance
  console.log("\n4. Checking user's token balance:");
  const userBalance = await testToken.balanceOf(USER_ADDRESS);
  console.log(`   User balance: ${ethers.formatEther(userBalance)} tokens`);

  // Check user's allowance for ZPool contract
  console.log("\n5. Checking user's allowance for ZPool:");
  const allowance = await testToken.allowance(USER_ADDRESS, ZPOOL_ADDRESS);
  console.log(`   Allowance: ${ethers.formatEther(allowance)} tokens`);

  // Check ZPool's token balance
  console.log("\n6. Checking ZPool's token balance:");
  const zpoolBalance = await testToken.balanceOf(ZPOOL_ADDRESS);
  console.log(`   ZPool balance: ${ethers.formatEther(zpoolBalance)} tokens`);

  // Check user's encrypted balance in ZPool
  console.log("\n7. Checking user's encrypted balance in ZPool:");
  try {
    const encryptedBalance = await zpool.getBalance(TEST_TOKEN_ADDRESS, USER_ADDRESS);
    console.log(`   Encrypted balance: ${encryptedBalance}`);
  } catch (error) {
    console.log(`   Error getting encrypted balance: ${error}`);
  }

  // Check total supply in ZPool
  console.log("\n8. Checking total supply in ZPool:");
  try {
    const totalSupply = await zpool.getTotalSupply(TEST_TOKEN_ADDRESS);
    console.log(`   Total supply: ${totalSupply}`);
  } catch (error) {
    console.log(`   Error getting total supply: ${error}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 