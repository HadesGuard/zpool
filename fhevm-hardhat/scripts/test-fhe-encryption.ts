import { ethers } from "hardhat";

async function main() {
  const ZPOOL_ADDRESS = "0xF6e6AE366316b30699e275A8bA0627AAb967a4Da";
  const TEST_TOKEN_ADDRESS = "0x662E0846592CD39fc0129e94eC752f5F92FB3444";
  const USER_ADDRESS = "0xF7A13273929a61077D09e8365De2F61c8A381C13";

  console.log("Testing FHE encryption and contract interaction...\n");

  // Get contract instances
  const zpool = await ethers.getContractAt("ZPool", ZPOOL_ADDRESS);
  const testToken = await ethers.getContractAt("TestToken", TEST_TOKEN_ADDRESS);

  // Test with a small amount
  const testAmount = "1"; // 1 token
  const testAmountInWei = ethers.parseUnits(testAmount, 18);
  
  console.log("Test parameters:");
  console.log(`  Token amount: ${testAmount}`);
  console.log(`  Amount in wei: ${testAmountInWei.toString()}`);
  console.log(`  ZPool address: ${ZPOOL_ADDRESS}`);
  console.log(`  TestToken address: ${TEST_TOKEN_ADDRESS}`);
  console.log(`  User address: ${USER_ADDRESS}`);

  // Check contract state
  console.log("\nContract state:");
  const isSupported = await zpool.supportedTokens(TEST_TOKEN_ADDRESS);
  const isPaused = await zpool.paused();
  const owner = await zpool.owner();
  
  console.log(`  Token supported: ${isSupported}`);
  console.log(`  Contract paused: ${isPaused}`);
  console.log(`  Contract owner: ${owner}`);

  // Check user state
  console.log("\nUser state:");
  const userBalance = await testToken.balanceOf(USER_ADDRESS);
  const allowance = await testToken.allowance(USER_ADDRESS, ZPOOL_ADDRESS);
  
  console.log(`  User balance: ${ethers.formatEther(userBalance)} tokens`);
  console.log(`  Allowance: ${ethers.formatEther(allowance)} tokens`);

  // Check if we can call deposit function (without FHE data)
  console.log("\nTesting deposit function call (without FHE data):");
  try {
    // This will fail because we don't have valid FHE data, but it will show us the error
    const dummyEncryptedValue = "0x" + "00".repeat(32);
    const dummyProof = "0x" + "00".repeat(64);
    
    console.log("  Attempting to call deposit with dummy data...");
    const tx = await zpool.deposit(
      TEST_TOKEN_ADDRESS,
      dummyEncryptedValue,
      dummyProof,
      testAmountInWei
    );
    console.log("  ✅ Deposit call succeeded (unexpected)");
  } catch (error: any) {
    console.log("  ❌ Deposit call failed (expected):");
    console.log(`    Error: ${error.message}`);
    
    // Check if it's a custom error
    if (error.data) {
      console.log(`    Error data: ${error.data}`);
      
      // Try to decode custom errors
      const customErrors = [
        "TokenNotSupported()",
        "ContractPaused()", 
        "InvalidEncryptedAmount()",
        "InsufficientBalance()",
        "InvalidRecipient()",
        "CannotTransferToSelf()",
        "InvalidTokenAddress()",
        "TokenAlreadySupported()",
        "OnlyOwner()",
        "InvalidOwner()"
      ];
      
      for (const errorSig of customErrors) {
        const errorSelector = ethers.id(errorSig).substring(0, 10);
        if (error.data.startsWith(errorSelector)) {
          console.log(`    Decoded error: ${errorSig}`);
          break;
        }
      }
    }
  }

  console.log("\n💡 The issue is likely with FHE proof generation in the frontend.");
  console.log("💡 Try using a smaller amount (like 1 token) in the frontend.");
  console.log("💡 Or check if the FHE SDK is generating valid proofs for euint128.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 