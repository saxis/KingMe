// src/services/wallet-mock.ts
// Mock wallet service for development without native modules
// Replace with real wallet service when using development build

export interface WalletInfo {
  address: string;
  publicKey: any;
  name?: string;
}

/**
 * Mock wallet connection - simulates Phantom/Solflare connection
 */
export async function connectWallet(): Promise<WalletInfo> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('Mock wallet connected');
  
  return {
    address: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
    publicKey: null,
    name: 'Mock Wallet (Phantom)',
  };
}

/**
 * Mock disconnect
 */
export async function disconnectWallet(address: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log('Mock wallet disconnected');
}

/**
 * Mock message signing
 */
export async function signMessage(message: string): Promise<Uint8Array> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return new Uint8Array([1, 2, 3, 4]);
}

/**
 * Mock SOL balance
 */
export async function getSolBalance(address: string): Promise<number> {
  // Return a mock balance
  return 10.5;
}

/**
 * Mock authorization check
 */
export async function checkWalletAuthorization(): Promise<boolean> {
  return true;
}

/**
 * Generate mock wallet data for testing
 * Call this after connecting to populate with demo assets
 */
export function getMockWalletAssets(walletAddress: string) {
  return {
    address: walletAddress,
    tokens: [
      {
        symbol: 'SOL',
        mint: 'So11111111111111111111111111111111111111112',
        balance: 10.5,
        price: 200,
        decimals: 9,
      },
      {
        symbol: 'USDC',
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        balance: 5000,
        price: 1,
        decimals: 6,
      },
      {
        symbol: 'BONK',
        mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
        balance: 1000000,
        price: 0.00002,
        decimals: 5,
      },
    ],
    defiPositions: [
      {
        protocol: 'Kamino',
        type: 'lending',
        positionId: 'kamino-1',
        underlyingToken: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        amount: 10000,
        value: 10000,
        apy: 8.5,
      },
      {
        protocol: 'Marinade',
        type: 'staked',
        positionId: 'marinade-1',
        underlyingToken: 'So11111111111111111111111111111111111111112',
        amount: 50,
        value: 10000,
        apy: 7.2,
      },
    ],
    nativeBalance: 2100, // $2,100 worth of SOL (10.5 SOL * $200)
  };
}
