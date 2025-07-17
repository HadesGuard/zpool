import { ethers } from "hardhat";

async function main() {
  const ZPOOL_ADDRESS = "0x3B97431c10bfA7E2d1B02042bc9d13817bf2d80f";
  const TEST_TOKEN_ADDRESS = "0xab6a8dA3A0c89b0AdC842f7a249c91777175EbdD";
  const USER_ADDRESS = "0xF7A13273929a61077D09e8365De2F61c8A381C13";

  console.log("Debugging FHE deposit with small amount...\n");

  // Get contract instances
  const zpool = await ethers.getContractAt("ZPool", ZPOOL_ADDRESS);
  const testToken = await ethers.getContractAt("TestToken", TEST_TOKEN_ADDRESS);

  // Test with a small amount (1 token = 1000000000000000000 wei)
  const testAmount = "1"; // 1 token
  const testAmountInWei = ethers.parseUnits(testAmount, 18);
  
  console.log("Test parameters:");
  console.log(`  Token amount: ${testAmount}`);
  console.log(`  Amount in wei: ${testAmountInWei.toString()}`);
  console.log(`  Max euint32: ${2n**32n - 1n}`);
  console.log(`  Is amount within euint32 range: ${testAmountInWei <= 2n**32n - 1n}`);

  // Check if user has enough balance
  const userBalance = await testToken.balanceOf(USER_ADDRESS);
  console.log(`\nUser balance: ${ethers.formatEther(userBalance)} tokens`);
  
  if (userBalance < testAmountInWei) {
    console.log("❌ User doesn't have enough balance for test");
    return;
  }

  // Check allowance
  const allowance = await testToken.allowance(USER_ADDRESS, ZPOOL_ADDRESS);
  console.log(`Allowance: ${ethers.formatEther(allowance)} tokens`);
  
  if (allowance < testAmountInWei) {
    console.log("❌ User doesn't have enough allowance for test");
    return;
  }

  // Check if token is supported
  const isSupported = await zpool.supportedTokens(TEST_TOKEN_ADDRESS);
  console.log(`Token supported: ${isSupported}`);
  
  if (!isSupported) {
    console.log("❌ Token is not supported");
    return;
  }

  // Check if contract is paused
  const isPaused = await zpool.paused();
  console.log(`Contract paused: ${isPaused}`);
  
  if (isPaused) {
    console.log("❌ Contract is paused");
    return;
  }

  console.log("\n✅ All preconditions met for deposit test");
  console.log("💡 The issue might be with FHE proof generation in the frontend");
  console.log("💡 Try using a smaller amount (like 1 token) in the frontend");
  console.log("💡 Or check if the FHE SDK is generating valid proofs");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 