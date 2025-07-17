import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploying additional test tokens...");

  // Deploy TestToken2
  console.log("Deploying TestToken2...");
  const testToken2 = await deploy("TestToken2", {
    from: deployer,
    log: true,
  });

  // Deploy TestToken3
  console.log("Deploying TestToken3...");
  const testToken3 = await deploy("TestToken3", {
    from: deployer,
    log: true,
  });

  // Deploy TestToken4
  console.log("Deploying TestToken4...");
  const testToken4 = await deploy("TestToken4", {
    from: deployer,
    log: true,
  });

  console.log("\nDeployment Summary:");
  console.log("===================");
  console.log("TestToken2 (TEST2):", testToken2.address);
  console.log("TestToken3 (TEST3):", testToken3.address);
  console.log("TestToken4 (TEST4):", testToken4.address);

  // Get deployer address
  console.log("\nDeployer address:", deployer);

  // Check balances using contract instances
  const testToken2Contract = await hre.ethers.getContractAt("TestToken2", testToken2.address);
  const testToken3Contract = await hre.ethers.getContractAt("TestToken3", testToken3.address);
  const testToken4Contract = await hre.ethers.getContractAt("TestToken4", testToken4.address);

  const balance2 = await testToken2Contract.balanceOf(deployer);
  const balance3 = await testToken3Contract.balanceOf(deployer);
  const balance4 = await testToken4Contract.balanceOf(deployer);

  console.log("\nInitial Balances:");
  console.log("==================");
  console.log("TEST2 balance:", hre.ethers.formatEther(balance2));
  console.log("TEST3 balance:", hre.ethers.formatEther(balance3));
  console.log("TEST4 balance:", hre.ethers.formatEther(balance4));
};

export default func;
func.id = "deploy_test_tokens"; // id required to prevent reexecution
func.tags = ["TestTokens"]; 