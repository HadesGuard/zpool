import { ZPool, ZPool__factory } from "../types";
import { TestToken, TestToken__factory } from "../types";
import { FhevmType, HardhatFhevmRuntimeEnvironment } from "@fhevm/hardhat-plugin";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import * as hre from "hardhat";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  charlie: HardhatEthersSigner;
};

async function deployFixture() {
  // Deploy test token
  const testTokenFactory = (await ethers.getContractFactory("TestToken")) as TestToken__factory;
  const testToken = (await testTokenFactory.deploy()) as TestToken;
  const testTokenAddress = await testToken.getAddress();

  // Deploy ZPool
  const zpoolFactory = (await ethers.getContractFactory("ZPool")) as ZPool__factory;
  const zpool = (await zpoolFactory.deploy()) as ZPool;
  const zpoolAddress = await zpool.getAddress();

  return { zpool, zpoolAddress, testToken, testTokenAddress };
}

describe("ZPool", function () {
  let zpool: ZPool;
  let zpoolAddress: string;
  let testToken: TestToken;
  let testTokenAddress: string;
  let signers: Signers;
  let fhevm: HardhatFhevmRuntimeEnvironment;

  before(async function () {
    if (!hre.fhevm.isMock) {
      throw new Error(`This hardhat test suite cannot run on Sepolia Testnet`);
    }
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { 
      deployer: ethSigners[0], 
      alice: ethSigners[1], 
      bob: ethSigners[2],
      charlie: ethSigners[3]
    };
    fhevm = hre.fhevm;
  });

  beforeEach(async function () {
    const deployment = await deployFixture();
    zpool = deployment.zpool;
    zpoolAddress = deployment.zpoolAddress;
    testToken = deployment.testToken;
    testTokenAddress = deployment.testTokenAddress;
    await zpool.addToken(testTokenAddress);
    await testToken.mint(signers.alice.address, 1000);
    await testToken.mint(signers.bob.address, 1000);
    await testToken.mint(signers.charlie.address, 1000);
  });

  function getEncryptedInput32(contractAddr: string, user: HardhatEthersSigner, value: number) {
    return fhevm.createEncryptedInput(contractAddr, user.address).add32(value).encrypt();
  }

  describe("Token Management", function () {
    it("should add token correctly", async function () {
      expect(await zpool.supportedTokens(testTokenAddress)).to.be.true;
    });
    it("should remove token correctly", async function () {
      await zpool.removeToken(testTokenAddress);
      expect(await zpool.supportedTokens(testTokenAddress)).to.be.false;
    });
  });

  describe("Deposit", function () {
    it("should deposit tokens correctly", async function () {
      const depositAmount = 100;
      const plainAmount = 100;
      await testToken.connect(signers.alice).approve(zpoolAddress, plainAmount);
      const encryptedInput = await getEncryptedInput32(zpoolAddress, signers.alice, depositAmount);
      const tx = await zpool.connect(signers.alice).deposit(
        testTokenAddress,
        encryptedInput.handles[0],
        encryptedInput.inputProof,
        plainAmount
      );
      await tx.wait();
      const encryptedBalance = await zpool.getBalance(signers.alice.address, testTokenAddress);
      let clearBalance = 0;
      try {
        clearBalance = await fhevm.userDecryptEuint(
          FhevmType.euint32,
          encryptedBalance,
          zpoolAddress,
          signers.alice
        );
      } catch {
        clearBalance = 0;
      }
      expect(Number(clearBalance)).to.equal(depositAmount);
    });
    it("should handle multiple deposits", async function () {
      const deposit1 = 50;
      const deposit2 = 75;
      const plainAmount1 = 50;
      const plainAmount2 = 75;
      await testToken.connect(signers.alice).approve(zpoolAddress, plainAmount1);
      const encryptedInput1 = await getEncryptedInput32(zpoolAddress, signers.alice, deposit1);
      await zpool.connect(signers.alice).deposit(
        testTokenAddress,
        encryptedInput1.handles[0],
        encryptedInput1.inputProof,
        plainAmount1
      );
      await testToken.connect(signers.alice).approve(zpoolAddress, plainAmount2);
      const encryptedInput2 = await getEncryptedInput32(zpoolAddress, signers.alice, deposit2);
      await zpool.connect(signers.alice).deposit(
        testTokenAddress,
        encryptedInput2.handles[0],
        encryptedInput2.inputProof,
        plainAmount2
      );
      const encryptedBalance = await zpool.getBalance(signers.alice.address, testTokenAddress);
      let clearBalance = 0;
      try {
        clearBalance = await fhevm.userDecryptEuint(
          FhevmType.euint32,
          encryptedBalance,
          zpoolAddress,
          signers.alice
        );
      } catch {
        clearBalance = 0;
      }
      expect(Number(clearBalance)).to.equal(deposit1 + deposit2);
    });
  });

  describe("Withdraw", function () {
    it("should withdraw tokens correctly", async function () {
      const depositAmount = 100;
      const withdrawAmount = 50;
      const plainDeposit = 100;
      const plainWithdraw = 50;
      await testToken.connect(signers.alice).approve(zpoolAddress, plainDeposit);
      const encryptedDeposit = await getEncryptedInput32(zpoolAddress, signers.alice, depositAmount);
      await zpool.connect(signers.alice).deposit(
        testTokenAddress,
        encryptedDeposit.handles[0],
        encryptedDeposit.inputProof,
        plainDeposit
      );
      const encryptedWithdraw = await getEncryptedInput32(zpoolAddress, signers.alice, withdrawAmount);
      await zpool.connect(signers.alice).withdraw(
        testTokenAddress,
        encryptedWithdraw.handles[0],
        encryptedWithdraw.inputProof,
        plainWithdraw
      );
      const encryptedBalance = await zpool.getBalance(signers.alice.address, testTokenAddress);
      let clearBalance = 0;
      try {
        clearBalance = await fhevm.userDecryptEuint(
          FhevmType.euint32,
          encryptedBalance,
          zpoolAddress,
          signers.alice
        );
      } catch {
        clearBalance = 0;
      }
      expect(Number(clearBalance)).to.equal(depositAmount - withdrawAmount);
    });
  });

  describe("Transfer", function () {
    it("should transfer tokens between users", async function () {
      const depositAmount = 100;
      const transferAmount = 30;
      const plainDeposit = 100;
      await testToken.connect(signers.alice).approve(zpoolAddress, plainDeposit);
      const encryptedDeposit = await getEncryptedInput32(zpoolAddress, signers.alice, depositAmount);
      await zpool.connect(signers.alice).deposit(
        testTokenAddress,
        encryptedDeposit.handles[0],
        encryptedDeposit.inputProof,
        plainDeposit
      );
      const encryptedTransfer = await getEncryptedInput32(zpoolAddress, signers.alice, transferAmount);
      await zpool.connect(signers.alice).transfer(
        signers.bob.address,
        testTokenAddress,
        encryptedTransfer.handles[0],
        encryptedTransfer.inputProof
      );
      const aliceEncryptedBalance = await zpool.getBalance(signers.alice.address, testTokenAddress);
      let aliceClearBalance = 0;
      try {
        aliceClearBalance = await fhevm.userDecryptEuint(
          FhevmType.euint32,
          aliceEncryptedBalance,
          zpoolAddress,
          signers.alice
        );
      } catch {
        aliceClearBalance = 0;
      }
      const bobEncryptedBalance = await zpool.getBalance(signers.bob.address, testTokenAddress);
      let bobClearBalance = 0;
      try {
        bobClearBalance = await fhevm.userDecryptEuint(
          FhevmType.euint32,
          bobEncryptedBalance,
          zpoolAddress,
          signers.bob
        );
      } catch {
        bobClearBalance = 0;
      }
      expect(Number(aliceClearBalance)).to.equal(depositAmount - transferAmount);
      expect(Number(bobClearBalance)).to.equal(transferAmount);
    });
  });

  describe("Balance Checks", function () {
    it("should check if user has balance", async function () {
      const depositAmount = 100;
      const plainAmount = 100;
      await testToken.connect(signers.alice).approve(zpoolAddress, plainAmount);
      const encryptedInput = await getEncryptedInput32(zpoolAddress, signers.alice, depositAmount);
      await zpool.connect(signers.alice).deposit(
        testTokenAddress,
        encryptedInput.handles[0],
        encryptedInput.inputProof,
        plainAmount
      );
      const hasBalanceResult = await zpool.hasBalance(signers.alice.address, testTokenAddress);
      expect(hasBalanceResult).to.be.true;
    });
    it("should return false for user without balance", async function () {
      const hasBalanceResult = await zpool.hasBalance(signers.bob.address, testTokenAddress);
      expect(hasBalanceResult).to.be.false;
    });
  });

  describe("Total Supply", function () {
    it("should track total supply correctly", async function () {
      const deposit1 = 100;
      const deposit2 = 200;
      const plain1 = 100;
      const plain2 = 200;
      await testToken.connect(signers.alice).approve(zpoolAddress, plain1);
      const encrypted1 = await getEncryptedInput32(zpoolAddress, signers.alice, deposit1);
      await zpool.connect(signers.alice).deposit(
        testTokenAddress,
        encrypted1.handles[0],
        encrypted1.inputProof,
        plain1
      );
      await testToken.connect(signers.bob).approve(zpoolAddress, plain2);
      const encrypted2 = await getEncryptedInput32(zpoolAddress, signers.bob, deposit2);
      await zpool.connect(signers.bob).deposit(
        testTokenAddress,
        encrypted2.handles[0],
        encrypted2.inputProof,
        plain2
      );
      const encryptedTotalSupply = await zpool.getTotalSupply(testTokenAddress);
      expect(encryptedTotalSupply).to.not.equal(0);
    });
  });
}); 