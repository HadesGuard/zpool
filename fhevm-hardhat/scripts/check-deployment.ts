import { ethers } from "hardhat";

async function main() {
  console.log("Checking ZPool deployment status...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

  // Check if contracts are deployed
  try {
    // Check TestToken
    const testTokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Default local address
    const testTokenCode = await deployer.provider.getCode(testTokenAddress);
    
    if (testTokenCode === "0x") {
      console.log("❌ TestToken not deployed at:", testTokenAddress);
    } else {
      console.log("✅ TestToken deployed at:", testTokenAddress);
      
      // Try to get token info
      try {
        const testToken = await ethers.getContractAt("TestToken", testTokenAddress);
        const name = await testToken.name();
        const symbol = await testToken.symbol();
        const totalSupply = await testToken.totalSupply();
        console.log(`   Name: ${name}`);
        console.log(`   Symbol: ${symbol}`);
        console.log(`   Total Supply: ${ethers.formatEther(totalSupply)} ${symbol}`);
      } catch (error) {
        console.log("   ⚠️ Could not read token info (might be wrong address)");
      }
    }

    // Check ZPool
    const zpoolAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // Default local address
    const zpoolCode = await deployer.provider.getCode(zpoolAddress);
    
    if (zpoolCode === "0x") {
      console.log("❌ ZPool not deployed at:", zpoolAddress);
    } else {
      console.log("✅ ZPool deployed at:", zpoolAddress);
      
      // Try to get ZPool info
      try {
        const zpool = await ethers.getContractAt("ZPool", zpoolAddress);
        const owner = await zpool.owner();
        const paused = await zpool.paused();
        const testTokenSupported = await zpool.supportedTokens(testTokenAddress);
        
        console.log(`   Owner: ${owner}`);
        console.log(`   Paused: ${paused}`);
        console.log(`   TestToken Supported: ${testTokenSupported}`);
        
        if (testTokenSupported) {
          console.log("   ✅ TestToken is supported by ZPool");
        } else {
          console.log("   ❌ TestToken is NOT supported by ZPool");
          console.log("   💡 You can add it by calling zpool.addToken(testTokenAddress)");
        }
      } catch (error) {
        console.log("   ⚠️ Could not read ZPool info (might be wrong address)");
      }
    }

  } catch (error) {
    console.error("Error checking deployment:", error);
  }

  console.log("\nTo deploy contracts, run:");
  console.log("npx hardhat deploy --network localhost");
  console.log("or");
  console.log("npx hardhat deploy --network sepolia");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 