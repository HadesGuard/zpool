import { ethers } from "hardhat";

async function main() {
  console.log("Checking euint128 range...\n");

  // Calculate euint128 max value
  const euint128Max = 2n**128n - 1n;
  console.log(`euint128 max value: ${euint128Max}`);
  console.log(`euint128 max value (scientific): ${euint128Max.toLocaleString()}`);

  // Test with different token amounts
  const testAmounts = [
    "1",           // 1 token
    "1000",        // 1000 tokens
    "1000000",     // 1M tokens
    "1000000000",  // 1B tokens
    "1000000000000" // 1T tokens
  ];

  console.log("\nTesting different token amounts:");
  for (const amount of testAmounts) {
    const amountInWei = ethers.parseUnits(amount, 18);
    const fitsInEuint128 = amountInWei <= euint128Max;
    
    console.log(`  ${amount} tokens = ${amountInWei.toString()} wei`);
    console.log(`  Fits in euint128: ${fitsInEuint128 ? '✅' : '❌'}`);
    
    if (!fitsInEuint128) {
      console.log(`  ❌ ${amount} tokens is too large for euint128`);
      break;
    }
  }

  // Calculate how many tokens can fit in euint128
  const maxTokensInEuint128 = euint128Max / (10n**18n);
  console.log(`\nMaximum tokens that fit in euint128: ${maxTokensInEuint128.toLocaleString()}`);
  console.log(`This is approximately: ${(maxTokensInEuint128 / (10n**9n)).toString()} billion tokens`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 