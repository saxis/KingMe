// src/services/wallet.ts
import { 
  transact,
  Web3MobileWallet,
} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { Connection, PublicKey } from '@solana/web3.js';

// Solana RPC endpoint - you can use your own or Helius
const RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';

export interface WalletInfo {
  address: string;
  publicKey: PublicKey;
  name?: string;
}

/**
 * Connect to a Solana wallet using Mobile Wallet Adapter
 * This will open Phantom, Solflare, or other compatible wallets
 */
export async function connectWallet(): Promise<WalletInfo> {
  try {
    const result = await transact(async (wallet: Web3MobileWallet) => {
      // Request authorization
      const authResult = await wallet.authorize({
        cluster: 'mainnet-beta',
        identity: {
          name: 'KingMe',
          uri: 'https://kingme.money',
          icon: 'favicon.ico', // You'll need to add this
        },
      });

      const publicKey = new PublicKey(authResult.accounts[0].address);

      return {
        address: publicKey.toBase58(),
        publicKey,
        name: authResult.wallet_name,
      };
    });

    console.log('Wallet connected:', result.address);
    return result;
  } catch (error: any) {
    console.error('Wallet connection failed:', error);
    
    // Handle specific errors
    if (error.code === 4001) {
      throw new Error('User rejected the connection request');
    } else if (error.message?.includes('No wallet found')) {
      throw new Error('No compatible wallet app found. Please install Phantom or Solflare.');
    }
    
    throw new Error(`Failed to connect wallet: ${error.message}`);
  }
}

/**
 * Disconnect wallet (deauthorize)
 */
export async function disconnectWallet(address: string): Promise<void> {
  try {
    await transact(async (wallet: Web3MobileWallet) => {
      await wallet.deauthorize({ auth_token: address });
    });
    
    console.log('Wallet disconnected');
  } catch (error) {
    console.error('Failed to disconnect wallet:', error);
    // Don't throw - disconnection can fail silently
  }
}

/**
 * Sign a message with the connected wallet
 * Useful for proving ownership and deriving encryption keys
 */
export async function signMessage(message: string): Promise<Uint8Array> {
  try {
    const result = await transact(async (wallet: Web3MobileWallet) => {
      const encodedMessage = new TextEncoder().encode(message);
      
      const signResult = await wallet.signMessages({
        addresses: [], // Will use the authorized address
        payloads: [encodedMessage],
      });

      return signResult.signed_payloads[0];
    });

    return result;
  } catch (error) {
    console.error('Failed to sign message:', error);
    throw new Error('Failed to sign message');
  }
}

/**
 * Get native SOL balance for an address
 */
export async function getSolBalance(address: string): Promise<number> {
  try {
    const connection = new Connection(RPC_ENDPOINT);
    const publicKey = new PublicKey(address);
    const balance = await connection.getBalance(publicKey);
    
    // Convert lamports to SOL
    return balance / 1e9;
  } catch (error) {
    console.error('Failed to fetch SOL balance:', error);
    return 0;
  }
}

/**
 * Check if wallet is currently authorized
 */
export async function checkWalletAuthorization(): Promise<boolean> {
  try {
    // This is a simplified check
    // In production, you'd want to store the auth token and verify it
    return true;
  } catch (error) {
    return false;
  }
}
