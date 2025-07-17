import { HardhatRuntimeEnvironment } from "hardhat/types";

async function main(hre: HardhatRuntimeEnvironment) {
  const { ethers } = hre;
  
  console.log("Adding new test tokens to ZPool...");

  // ZPool contract address
  const ZPOOL_ADDRESS = "0xF6e6AE366316b30699e275A8bA0627AAb967a4Da";
  
  // New token addresses
  const TEST_TOKEN2_ADDRESS = "0x4d6634c673dB0a55e1fF0DBc893D3e116b28CbD0";
  const TEST_TOKEN3_ADDRESS = "0x20e95adE07D966AeA72537347B8C364e67F3285D";
  const TEST_TOKEN4_ADDRESS = "0xd5baaAbA3C649D7698aB53879d950c0d3DB1b48A";

  // Get ZPool contract
  const zpool = await ethers.getContractAt("ZPool", ZPOOL_ADDRESS);

  // Get signer
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  try {
    // Add TestToken2
    console.log("Adding TestToken2...");
    const tx1 = await zpool.addToken(TEST_TOKEN2_ADDRESS);
    await tx1.wait();
    console.log("TestToken2 added successfully");

    // Add TestToken3
    console.log("Adding TestToken3...");
    const tx2 = await zpool.addToken(TEST_TOKEN3_ADDRESS);
    await tx2.wait();
    console.log("TestToken3 added successfully");

    // Add TestToken4
    console.log("Adding TestToken4...");
    const tx3 = await zpool.addToken(TEST_TOKEN4_ADDRESS);
    await tx3.wait();
    console.log("TestToken4 added successfully");

    console.log("\nAll tokens added successfully to ZPool!");
    console.log("TestToken2:", TEST_TOKEN2_ADDRESS);
    console.log("TestToken3:", TEST_TOKEN3_ADDRESS);
    console.log("TestToken4:", TEST_TOKEN4_ADDRESS);

  } catch (error) {
    console.error("Error adding tokens:", error);
  }
}

// Run the script
main(require("hardhat"))
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 