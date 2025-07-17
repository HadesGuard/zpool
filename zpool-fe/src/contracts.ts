import zpoolAbi from './abi/ZPool.json';
import testTokenAbi from './abi/TestToken.json';

// Sepolia deployment addresses (updated with euint128 support)
export const ZPOOL_ADDRESS = "0xF6e6AE366316b30699e275A8bA0627AAb967a4Da";
export const TEST_TOKEN_ADDRESS = "0x662E0846592CD39fc0129e94eC752f5F92FB3444";

// Import ABI from JSON files
export const ZPOOL_ABI = zpoolAbi.abi;
export const TEST_TOKEN_ABI = testTokenAbi.abi;