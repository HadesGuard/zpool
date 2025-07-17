// Simple test utility for Zama SDK
export const testZamaSDK = async () => {
  console.log('🧪 Testing Zama SDK...');
  
  try {
    // Check if CDN is loaded
    const cdnAvailable = typeof window !== 'undefined' && (
      !!(window as any).relayerSDK || 
      !!(window as any).ZamaSDK || 
      !!(window as any).ZamaFHE || 
      !!(window as any).FHESDK
    );
    
    console.log('CDN Available:', cdnAvailable);
    console.log('window.relayerSDK:', (window as any).relayerSDK);
    console.log('window.ZamaSDK:', (window as any).ZamaSDK);
    console.log('window.ZamaFHE:', (window as any).ZamaFHE);
    console.log('window.FHESDK:', (window as any).FHESDK);
    
    // Check CDN SDK methods if available
    let cdnMethods = null;
    if (cdnAvailable) {
      const cdnSDK = (window as any).relayerSDK || (window as any).ZamaSDK || (window as any).ZamaFHE || (window as any).FHESDK;
      cdnMethods = {
        initSDK: !!cdnSDK.initSDK,
        createInstance: !!cdnSDK.createInstance,
        SepoliaConfig: !!cdnSDK.SepoliaConfig,
        createEncryptedInput: !!cdnSDK.createEncryptedInput,
        generateKeypair: !!cdnSDK.generateKeypair,
        createEIP712: !!cdnSDK.createEIP712,
        userDecrypt: !!cdnSDK.userDecrypt,
        publicDecrypt: !!cdnSDK.publicDecrypt
      };
      console.log('CDN SDK methods:', cdnMethods);
    }
    
    // Try to import bundle
    let bundleImport = false;
    let bundleMethods = null;
    
    try {
      const sdk = await import("@zama-fhe/relayer-sdk/bundle");
      console.log('✅ Bundle import successful:', sdk);
      bundleImport = true;
      bundleMethods = {
        initSDK: !!sdk.initSDK,
        createInstance: !!sdk.createInstance,
        SepoliaConfig: !!sdk.SepoliaConfig
      };
    } catch (bundleError) {
      console.log('❌ Bundle import failed:', bundleError);
    }
    
    return {
      success: cdnAvailable || bundleImport,
      cdnAvailable,
      cdnMethods,
      bundleImport,
      bundleMethods,
      error: null
    };
    
  } catch (error) {
    console.error('❌ SDK test failed:', error);
    return {
      success: false,
      cdnAvailable: false,
      cdnMethods: null,
      bundleImport: false,
      bundleMethods: null,
      error
    };
  }
};

// Test CDN loading directly
export const testCDNLoading = async () => {
  console.log('🌐 Testing CDN loading...');
  
  try {
    // Test if we can fetch the CDN URL
    const response = await fetch('https://cdn.zama.ai/relayer-sdk-js/0.1.0-9/relayer-sdk-js.umd.cjs');
    const isAvailable = response.ok;
    
    console.log('CDN URL accessible:', isAvailable);
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    return {
      success: isAvailable,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('❌ CDN fetch failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

// Test local SDK file
export const testLocalSDK = async () => {
  console.log('📁 Testing local SDK file...');
  
  try {
    // Test if local file exists and is accessible
    const response = await fetch('./relayer-sdk-js.umd.cjs');
    const isAvailable = response.ok;
    
    console.log('Local SDK file accessible:', isAvailable);
    console.log('Response status:', response.status);
    console.log('File size:', response.headers.get('content-length'), 'bytes');
    
    if (isAvailable) {
      // Try to load the script
      const script = document.createElement('script');
      script.src = './relayer-sdk-js.umd.cjs';
      script.type = 'text/javascript';
      
      return new Promise((resolve) => {
        script.onload = () => {
          console.log('✅ Local SDK script loaded successfully');
          console.log('window.ZamaSDK:', (window as any).ZamaSDK);
          console.log('window.ZamaFHE:', (window as any).ZamaFHE);
          console.log('window.FHESDK:', (window as any).FHESDK);
          
          resolve({
            success: true,
            status: response.status,
            fileSize: response.headers.get('content-length'),
            sdkAvailable: !!(window as any).ZamaSDK || !!(window as any).ZamaFHE || !!(window as any).FHESDK
          });
        };
        
        script.onerror = () => {
          console.error('❌ Failed to load local SDK script');
          resolve({
            success: false,
            error: 'Failed to load local SDK script'
          });
        };
        
        document.head.appendChild(script);
      });
    } else {
      return {
        success: false,
        error: 'Local SDK file not accessible'
      };
    }
  } catch (error) {
    console.error('❌ Local SDK test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

export const testEncryption = async (value: number) => {
  console.log(`=== Testing Encryption with value: ${value} ===`);
  
  try {
    const sdk = (window as any).ZamaSDK;
    if (!sdk) {
      throw new Error('SDK not available');
    }
    
    const testContractAddress = '0x605B40C462B44E7394F3016F930eaf645524e3B1';
    const testUserAddress = '0x0000000000000000000000000000000000000000';
    
    const buffer = sdk.createEncryptedInput(testContractAddress, testUserAddress);
    buffer.add32(value);
    
    const ciphertexts = await buffer.encrypt();
    
    // Convert to hex strings
    const handleArray = Array.from(ciphertexts.handles[0]) as number[];
    const encryptedValue = '0x' + handleArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    
    const proofArray = Array.from(ciphertexts.inputProof) as number[];
    const proof = '0x' + proofArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    
    console.log('✅ Encryption successful');
    console.log('Encrypted value:', encryptedValue);
    console.log('Proof:', proof);
    
    return { encryptedValue, proof };
    
  } catch (error) {
    console.error('❌ Encryption test failed:', error);
    throw error;
  }
};

export default testZamaSDK; 