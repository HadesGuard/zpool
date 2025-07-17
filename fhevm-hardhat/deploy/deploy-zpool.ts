import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Deploy TestToken
  console.log("Deploying TestToken...");
  const testToken = await deploy("TestToken", {
    from: deployer,
    log: true,
  });

  // Deploy ZPool
  console.log("Deploying ZPool...");
  const zpool = await deploy("ZPool", {
    from: deployer,
    log: true,
  });

  // Add TestToken as supported token
  console.log("Adding TestToken as supported token...");
  const zpoolContract = await hre.ethers.getContractAt("ZPool", zpool.address);
  await zpoolContract.addToken(testToken.address);
  console.log("TestToken added as supported token");

  console.log("Deployment completed successfully!");
  console.log("TestToken:", testToken.address);
  console.log("ZPool:", zpool.address);
};

export default func;
func.id = "deploy_zpool"; // id required to prevent reexecution
func.tags = ["ZPool"]; 