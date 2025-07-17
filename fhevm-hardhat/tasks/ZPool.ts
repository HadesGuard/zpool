import { task } from "hardhat/config";

task("zpool:deploy", "Deploy ZPool and TestToken")
  .setAction(async (taskArgs, hre) => {
    const { ethers } = hre;
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    // Deploy TestToken
    const TestToken = await ethers.getContractFactory("TestToken");
    const testToken = await TestToken.deploy();
    await testToken.waitForDeployment();
    console.log("TestToken deployed to:", await testToken.getAddress());

    // Deploy ZPool
    const ZPool = await ethers.getContractFactory("ZPool");
    const zpool = await ZPool.deploy();
    await zpool.waitForDeployment();
    console.log("ZPool deployed to:", await zpool.getAddress());

    // Add TestToken as supported token
    await zpool.addToken(await testToken.getAddress());
    console.log("TestToken added as supported token");

    return { testToken, zpool };
  });

task("zpool:add-token", "Add a token to ZPool")
  .addParam("zpool", "ZPool contract address")
  .addParam("token", "Token contract address")
  .setAction(async (taskArgs, hre) => {
    const { ethers } = hre;
    const zpool = await ethers.getContractAt("ZPool", taskArgs.zpool);
    await zpool.addToken(taskArgs.token);
    console.log(`Token ${taskArgs.token} added to ZPool`);
  });

task("zpool:deposit", "Deposit tokens to ZPool")
  .addParam("zpool", "ZPool contract address")
  .addParam("token", "Token contract address")
  .addParam("amount", "Amount to deposit")
  .setAction(async (taskArgs, hre) => {
    const { ethers } = hre;
    const [signer] = await ethers.getSigners();
    const zpool = await ethers.getContractAt("ZPool", taskArgs.zpool);
    const token = await ethers.getContractAt("TestToken", taskArgs.token);
    
    const amount = ethers.parseUnits(taskArgs.amount, 18);
    
    // Approve ZPool to spend tokens
    await token.approve(taskArgs.zpool, amount);
    console.log(`Approved ${taskArgs.amount} tokens for ZPool`);
    
    // For demo purposes, we'll use a simple encrypted value
    // In a real implementation, you'd use fhevm-js to encrypt the amount
    const encryptedAmount = ethers.zeroPadValue(ethers.toBeHex(amount), 32);
    
    await zpool.deposit(taskArgs.token, encryptedAmount, "0x", amount);
    console.log(`Deposited ${taskArgs.amount} tokens to ZPool`);
  });

task("zpool:withdraw", "Withdraw tokens from ZPool")
  .addParam("zpool", "ZPool contract address")
  .addParam("token", "Token contract address")
  .addParam("amount", "Amount to withdraw")
  .setAction(async (taskArgs, hre) => {
    const { ethers } = hre;
    const zpool = await ethers.getContractAt("ZPool", taskArgs.zpool);
    const amount = ethers.parseUnits(taskArgs.amount, 18);
    
    // For demo purposes, we'll use a simple encrypted value
    const encryptedAmount = ethers.zeroPadValue(ethers.toBeHex(amount), 32);
    
    await zpool.withdraw(taskArgs.token, encryptedAmount, "0x", amount);
    console.log(`Withdrew ${taskArgs.amount} tokens from ZPool`);
  });

task("zpool:transfer", "Transfer tokens between users in ZPool")
  .addParam("zpool", "ZPool contract address")
  .addParam("token", "Token contract address")
  .addParam("to", "Recipient address")
  .addParam("amount", "Amount to transfer")
  .setAction(async (taskArgs, hre) => {
    const { ethers } = hre;
    const zpool = await ethers.getContractAt("ZPool", taskArgs.zpool);
    const amount = ethers.parseUnits(taskArgs.amount, 18);
    
    // For demo purposes, we'll use a simple encrypted value
    const encryptedAmount = ethers.zeroPadValue(ethers.toBeHex(amount), 32);
    
    await zpool.transfer(taskArgs.to, taskArgs.token, encryptedAmount, "0x");
    console.log(`Transferred ${taskArgs.amount} tokens to ${taskArgs.to}`);
  });

task("zpool:balance", "Get user balance in ZPool")
  .addParam("zpool", "ZPool contract address")
  .addParam("token", "Token contract address")
  .addParam("user", "User address")
  .setAction(async (taskArgs, hre) => {
    const { ethers } = hre;
    const zpool = await ethers.getContractAt("ZPool", taskArgs.zpool);
    
    try {
      // Try to get balance as encrypted value
      const balance = await zpool.getBalance(taskArgs.user, taskArgs.token);
      console.log(`Encrypted balance for ${taskArgs.user}: ${balance}`);
      console.log(`Note: This is an encrypted value. To decrypt, use fhevm-js in frontend.`);
    } catch (error) {
      console.log(`Balance for ${taskArgs.user}: 0 (no balance or encrypted value)`);
    }
  });

task("zpool:supply", "Get total supply for token in ZPool")
  .addParam("zpool", "ZPool contract address")
  .addParam("token", "Token contract address")
  .setAction(async (taskArgs, hre) => {
    const { ethers } = hre;
    const zpool = await ethers.getContractAt("ZPool", taskArgs.zpool);
    
    try {
      // Try to get total supply as encrypted value
      const supply = await zpool.getTotalSupply(taskArgs.token);
      console.log(`Encrypted total supply for ${taskArgs.token}: ${supply}`);
      console.log(`Note: This is an encrypted value. To decrypt, use fhevm-js in frontend.`);
    } catch (error) {
      console.log(`Total supply for ${taskArgs.token}: 0 (no supply or encrypted value)`);
    }
  }); 