import { ethers } from 'ethers';
import { ZPOOL_ADDRESS } from '../contracts';

// Import Zama SDK from bundle as recommended in docs
import { initSDK, createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk/bundle";

// Types for FHE operations
export interface FHEInstance {
  encrypt: (value: number) => Promise<{ encryptedValue: string; proof: string }>;
  decrypt: (encryptedValue: string) => Promise<number>;
  publicDecrypt: (encryptedValue: string) => Promise<number>;
}

export interface FHEConfig {
  network: any;
  rpcUrl?: string;
  chainId?: number;
  account?: string;
}

// Real FHE service using Zama SDK
class RealFHEService {
  private isInitialized = false;
  private sdkInstance: any = null;
  private initPromise: Promise<void> | null = null;
  private decryptCache: Map<string, { value: number; timestamp: number }> = new Map();
  private readonly DECRYPT_CACHE_DURATION = 30000; // 30 seconds (increased from 10 seconds)

  async init(): Promise<void> {
    if (this.isInitialized) return;
    
    // If initialization is already in progress, wait for it
    if (this.initPromise) {
      await this.initPromise;
      return;
    }
    
    this.initPromise = this.performInit();
    await this.initPromise;
  }

  private async performInit(): Promise<void> {
    console.log('Initializing FHE service with Zama SDK...');
    
    try {
      // Initialize SDK using bundle import as per docs
      console.log('Calling initSDK()...');
      await initSDK(); // Load needed WASM
      console.log('Zama SDK initialized successfully');
      this.isInitialized = true;
    } catch (error: any) {
      console.error('Failed to initialize Zama SDK:', error);
      console.error('Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        code: error?.code
      });
      
      // Check if it's a network/RPC issue
      if (error?.message && error.message.includes('getCoprocessorSigners')) {
        console.error('This error suggests the network does not have FHE coprocessor contracts deployed.');
        console.error('Please ensure you are connected to a network that supports FHE (like Sepolia with proper RPC).');
      }
      
      this.isInitialized = false;
      this.sdkInstance = null;
      throw new Error('FHE initialization failed: ' + (error?.message || 'Unknown error'));
    }
  }

  async createInstance(config: FHEConfig): Promise<FHEInstance> {
    await this.init();
    
    // Log network configuration for debugging
    console.log('Creating FHE instance with config:', {
      network: config.network,
      rpcUrl: config.rpcUrl,
      chainId: config.chainId,
      account: config.account
    });
    
    // Create SDK instance using proper config as per docs
    const sdkConfig = { ...SepoliaConfig, network: config.network };
    console.log('SDK config:', sdkConfig);
    
    try {
      this.sdkInstance = await createInstance(sdkConfig);
      console.log('FHE instance created successfully');
    } catch (error: any) {
      console.error('Failed to create FHE instance:', error);
      console.error('This might be due to network/RPC issues or missing FHE coprocessor contracts.');
      throw error;
    }
    
    return {
      encrypt: async (value: number): Promise<{ encryptedValue: string; proof: string }> => {
        console.log(`Encrypting value: ${value}`);
        
        try {
          // Use real Zama SDK for encryption
          console.log('Using real Zama SDK for encryption...');
          
          // Create encrypted input using Zama SDK
          const userAddress = config.account;
          if (!userAddress) {
            throw new Error('User address is required for FHE encryption. Please connect your wallet first.');
          }
          console.log('🧪 Encrypt for:', { contract: ZPOOL_ADDRESS, user: userAddress });
          const buffer = this.sdkInstance.createEncryptedInput(
            ZPOOL_ADDRESS, // Contract address
            userAddress // User address
          );
          
          // Add the value to the buffer (using add128 for larger numbers)
          buffer.add128(value);
          
          // Encrypt and get ciphertext handles
          const ciphertexts = await buffer.encrypt();
          
          console.log('Encryption successful:', ciphertexts);
          console.log('Ciphertext handle:', ciphertexts.handles[0]);
          console.log('Input proof:', ciphertexts.inputProof);
          
          // Convert Uint8Array to hex string properly
          const handleArray = Array.from(ciphertexts.handles[0]) as number[];
          const encryptedValue = '0x' + handleArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
          
          // Convert inputProof Uint8Array to hex string
          const proofArray = Array.from(ciphertexts.inputProof) as number[];
          const proof = '0x' + proofArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
          
          console.log('Generated encrypted value:', encryptedValue);
          console.log('Generated proof:', proof);
          
          return { encryptedValue, proof };
        } catch (error) {
          console.error('Encryption error:', error);
          throw new Error('Encryption failed: ' + error);
        }
      },
      
      decrypt: async (encryptedValue: string): Promise<number> => {
        console.log(`Decrypting value: ${encryptedValue}`);
        try {
          // Use real Zama SDK for decryption
          console.log('Using real Zama SDK for decryption...');
          
          // Generate keypair for user
          const keypair = this.sdkInstance.generateKeypair();
          console.log('Generated keypair:', keypair);
          
          // Prepare handle-contract pairs
          const handleContractPairs = [
            {
              handle: encryptedValue,
              contractAddress: ZPOOL_ADDRESS,
            },
          ];
          
          // Prepare EIP712 signature data
          const startTimeStamp = Math.floor(Date.now() / 1000).toString();
          const durationDays = "10";
          const contractAddresses = [ZPOOL_ADDRESS];
          
          const eip712 = this.sdkInstance.createEIP712(
            keypair.publicKey, 
            contractAddresses, 
            startTimeStamp, 
            durationDays
          );
          
          console.log('EIP712 data:', eip712);
          
          // Get signer from window.ethereum
          const provider = new ethers.BrowserProvider((window as any).ethereum);
          const signer = await provider.getSigner();
          
          // Sign the EIP712 data
          const signature = await signer.signTypedData(
            eip712.domain,
            {
              UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
            },
            eip712.message,
          );
          
          console.log('Signature:', signature);
          
          // Perform user decryption
          const result = await this.sdkInstance.userDecrypt(
            handleContractPairs,
            keypair.privateKey,
            keypair.publicKey,
            signature.replace("0x", ""),
            contractAddresses,
            signer.address,
            startTimeStamp,
            durationDays,
          );
          
          console.log('User decryption result:', result);
          
          // Extract decrypted value
          const decryptedValue = result[encryptedValue];
          console.log('Decrypted value:', decryptedValue);
          
          return Number(decryptedValue);
        } catch (error) {
          console.error('Decryption error:', error);
          throw new Error('Decryption failed: ' + error);
        }
      },
      
      publicDecrypt: async (encryptedValue: string): Promise<number> => {
        console.log(`Public decrypting value: ${encryptedValue}`);
        
        // Check cache first
        const now = Date.now();
        const cached = this.decryptCache.get(encryptedValue);
        if (cached && (now - cached.timestamp) < this.DECRYPT_CACHE_DURATION) {
          console.log('📦 Using cached decryption result');
          return cached.value;
        }
        
        try {
          // Use real Zama SDK for public decryption
          console.log('Using real Zama SDK for public decryption...');
          
          // Prepare handles array for public decryption
          const handles = [encryptedValue];
          
          // Perform public decryption
          const values = await this.sdkInstance.publicDecrypt(handles);
          console.log('Public decryption result:', values);
          
          // Extract the decrypted value
          const decryptedValue = values[encryptedValue];
          console.log('Public decrypted value:', decryptedValue);
          
          // Handle different return types
          let result: number;
          if (typeof decryptedValue === 'bigint') {
            result = Number(decryptedValue);
          } else if (typeof decryptedValue === 'number') {
            result = decryptedValue;
          } else if (typeof decryptedValue === 'boolean') {
            result = decryptedValue ? 1 : 0;
          } else {
            console.log('Unknown decrypted value type:', typeof decryptedValue);
            result = 0;
          }
          
          // Cache the result
          this.decryptCache.set(encryptedValue, { value: result, timestamp: now });
          return result;
        } catch (error) {
          console.error('Public decryption error:', error);
          throw new Error('Public decryption failed: ' + error);
        }
      }
    };
  }

  // Method to check if SDK is available
  isSDKAvailable(): boolean {
    return this.isInitialized && this.sdkInstance !== null;
  }

  // Debug method to check SDK status
  getSDKStatus(): { initialized: boolean; sdkInstance: any; cdnAvailable: boolean } {
    const cdnAvailable = typeof window !== 'undefined' && (
      !!(window as any).relayerSDK || 
      !!(window as any).ZamaSDK || 
      !!(window as any).ZamaFHE || 
      !!(window as any).FHESDK
    );
    
    return {
      initialized: this.isInitialized,
      sdkInstance: this.sdkInstance,
      cdnAvailable
    };
  }

  // Method to reset initialization state
  reset(): void {
    this.isInitialized = false;
    this.sdkInstance = null;
    this.initPromise = null;
    this.decryptCache.clear();
  }

  // Method to clear decrypt cache
  clearDecryptCache(): void {
    console.log('🗑️ Clearing FHE decrypt cache');
    this.decryptCache.clear();
  }
}

// Export the service
const fheService = new RealFHEService();

export default fheService;

// Helper functions for contract interactions
export const createFHEProof = (): string => {
  return ethers.hexlify(ethers.randomBytes(32));
};

export const formatEncryptedValue = (value: number): string => {
  return ethers.parseUnits(value.toString(), 18).toString();
};

export const parseEncryptedValue = (value: string): number => {
  return parseFloat(ethers.formatUnits(value, 18));
}; 