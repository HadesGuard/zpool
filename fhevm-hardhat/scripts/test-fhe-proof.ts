import { ethers } from "hardhat";

async function main() {
  // Initialize FHEVM plugin
  try {
    console.log("Initializing FHEVM plugin...");
    // Note: FHEVM plugin should be automatically initialized when using @fhevm/hardhat-plugin
    console.log("FHEVM plugin initialization attempted");
  } catch (error) {
    console.log("FHEVM plugin initialization failed:", error);
  }
  const ZPOOL_ADDRESS = "0xcA792289432771EF6534eBfae9126F7c344d9b40";
  const TEST_TOKEN_ADDRESS = "0x933788D67c40Dc25a81C100F0C5dfA32fa458536";
  const USER_ADDRESS = "0xF7A13273929a61077D09e8365De2F61c8A381C13";

  console.log("Testing FHE proof validation...\n");

  // Get contract instances
  const zpool = await ethers.getContractAt("ZPool", ZPOOL_ADDRESS);
  const testToken = await ethers.getContractAt("TestToken", TEST_TOKEN_ADDRESS);

  // Test with the exact FHE data from frontend
  const testEncryptedValue = "0x9f72c38e35f2aaf8c4a2621f50236d3d32cd395e27000000000000aa36a70600";
  const testProof = "0x01019f72c38e35f2aaf8c4a2621f50236d3d32cd395e27000000000000aa36a706002fde7f71caf68b95b5621f00453c677e99d675767e7cb54c03d84b32841f03bf78b616f745f4ec4e45e4f01db05a17c0b1149a7c78524be6abe5de4f9be378fd1b";
  const testAmount = "1"; // 1 token
  const testAmountInWei = ethers.parseUnits(testAmount, 18);
  
  console.log("Test parameters:");
  console.log(`  Token amount: ${testAmount}`);
  console.log(`  Amount in wei: ${testAmountInWei.toString()}`);
  console.log(`  Encrypted value: ${testEncryptedValue}`);
  console.log(`  Proof: ${testProof.substring(0, 20)}...`);
  console.log(`  Encrypted value length: ${testEncryptedValue.length}`);
  console.log(`  Proof length: ${testProof.length}`);

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

  // Test deposit function call with the exact FHE data
  console.log("\nTesting deposit function call with FHE data:");
  try {
    console.log("  Attempting to call deposit with FHE data...");
    const tx = await zpool.deposit(
      TEST_TOKEN_ADDRESS,
      testEncryptedValue,
      testProof,
      testAmountInWei
    );
    console.log("  ✅ Deposit call succeeded!");
    console.log(`  Transaction hash: ${tx.hash}`);
  } catch (error: any) {
    console.log("  ❌ Deposit call failed:");
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

  console.log("\n💡 If the error is 'InvalidEncryptedAmount', the FHE proof is not valid.");
  console.log("💡 This could be due to:");
  console.log("   - FHE coprocessor not available on the network");
  console.log("   - FHE proof format not compatible with the contract");
  console.log("   - Network configuration issues");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 