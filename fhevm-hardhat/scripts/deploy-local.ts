import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy TestToken
  console.log("Deploying TestToken...");
  const TestToken = await ethers.getContractFactory("TestToken");
  const testToken = await TestToken.deploy();
  await testToken.waitForDeployment();
  const testTokenAddress = await testToken.getAddress();
  console.log("TestToken deployed to:", testTokenAddress);

  // Deploy ZPool
  console.log("Deploying ZPool...");
  const ZPool = await ethers.getContractFactory("ZPool");
  const zpool = await ZPool.deploy();
  await zpool.waitForDeployment();
  const zpoolAddress = await zpool.getAddress();
  console.log("ZPool deployed to:", zpoolAddress);

  // Add TestToken as supported token
  console.log("Adding TestToken as supported token...");
  await zpool.addToken(testTokenAddress);
  console.log("TestToken added as supported token");

  // Mint some tokens to deployer for testing
  console.log("Minting tokens to deployer...");
  await testToken.mint(deployer.address, ethers.parseEther("1000"));
  console.log("Minted 1000 tokens to deployer");

  console.log("Deployment completed successfully!");
  console.log("TestToken:", testTokenAddress);
  console.log("ZPool:", zpoolAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 