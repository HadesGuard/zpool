import testTokenAbi from '../abi/TestToken.json';
import testToken2Abi from '../abi/TestToken2.json';
import testToken3Abi from '../abi/TestToken3.json';

export interface TokenConfig {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  abi: any;
  icon?: string;
  description?: string;
}

// Available tokens configuration
export const AVAILABLE_TOKENS: TokenConfig[] = [
  {
    address: "0x662E0846592CD39fc0129e94eC752f5F92FB3444", // TestToken on Sepolia
    symbol: "TEST",
    name: "TestToken",
    decimals: 18,
    abi: testTokenAbi.abi,
    icon: "🧪",
    description: "Test token for development and testing"
  },
  {
    address: "0x4d6634c673dB0a55e1fF0DBc893D3e116b28CbD0", // TestToken2 on Sepolia
    symbol: "TEST2",
    name: "Test Token 2",
    decimals: 18,
    abi: testToken2Abi.abi,
    icon: "🔬",
    description: "Second test token for development and testing"
  },
  {
    address: "0x20e95adE07D966AeA72537347B8C364e67F3285D", // TestToken3 on Sepolia
    symbol: "TEST3",
    name: "Test Token 3",
    decimals: 18,
    abi: testToken3Abi.abi,
    icon: "⚗️",
    description: "Third test token for development and testing"
  }
];

// Default token (first in the list)
export const DEFAULT_TOKEN = AVAILABLE_TOKENS[0];

// Helper function to get token by address
export const getTokenByAddress = (address: string): TokenConfig | undefined => {
  return AVAILABLE_TOKENS.find(token => token.address.toLowerCase() === address.toLowerCase());
};

// Helper function to get token by symbol
export const getTokenBySymbol = (symbol: string): TokenConfig | undefined => {
  return AVAILABLE_TOKENS.find(token => token.symbol.toLowerCase() === symbol.toLowerCase());
}; 