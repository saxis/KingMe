// KingMe - Helius API Service
// Fetches wallet balances, tokens, and DeFi positions from Solana

import type { Asset, CryptoAsset, HeliusWalletData } from '../types';
import { API_ENDPOINTS, API_KEYS } from '../utils/constants';

/**
 * Fetch enriched wallet data from Helius ORB API
 */
export async function fetchWalletData(walletAddress: string): Promise<HeliusWalletData> {
  try {
    const response = await fetch(
      `${API_ENDPOINTS.HELIUS_ORB}/addresses/${walletAddress}/balances?api-key=${API_KEYS.HELIUS}`
    );

    if (!response.ok) {
      throw new Error(`Helius API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform Helius response to our format
    // Note: This is a simplified version - actual Helius ORB response structure may differ
    return {
      address: walletAddress,
      tokens: data.tokens || [],
      defiPositions: data.defiPositions || [],
      nativeBalance: data.nativeBalance || 0,
    };
  } catch (error) {
    console.error('Failed to fetch wallet data from Helius:', error);
    throw error;
  }
}

/**
 * Convert Helius wallet data to KingMe Asset objects
 */
export function convertToAssets(heliusData: HeliusWalletData): Asset[] {
  const assets: Asset[] = [];

  // Add SOL native balance
  if (heliusData.nativeBalance > 0) {
    assets.push({
      id: `${heliusData.address}-SOL`,
      type: 'crypto',
      name: 'Solana',
      value: heliusData.nativeBalance, // Assuming already converted to USD
      annualIncome: 0, // Not staked, so no income
      metadata: {
        type: 'crypto',
        quantity: heliusData.nativeBalance,
        isStaked: false,
        walletAddress: heliusData.address,
      } as CryptoAsset,
    });
  }

  // Add token balances
  heliusData.tokens.forEach((token) => {
    const value = token.balance * token.price;
    
    assets.push({
      id: `${heliusData.address}-${token.mint}`,
      type: 'crypto',
      name: token.symbol,
      value,
      annualIncome: 0, // No income unless in DeFi
      metadata: {
        type: 'crypto',
        tokenMint: token.mint,
        quantity: token.balance,
        isStaked: false,
        walletAddress: heliusData.address,
      } as CryptoAsset,
    });
  });

  // Add DeFi positions
  if (heliusData.defiPositions) {
    heliusData.defiPositions.forEach((position) => {
      assets.push({
        id: `${heliusData.address}-${position.protocol}-${position.positionId}`,
        type: 'defi',
        name: `${position.protocol} - ${position.type}`,
        value: position.value,
        annualIncome: position.value * (position.apy / 100),
        metadata: {
          type: 'crypto',
          tokenMint: position.underlyingToken,
          quantity: position.amount,
          protocol: position.protocol,
          apy: position.apy,
          isStaked: position.type === 'staked',
          walletAddress: heliusData.address,
        } as CryptoAsset,
      });
    });
  }

  return assets;
}

/**
 * Sync all connected wallets and return combined assets
 */
export async function syncAllWallets(walletAddresses: string[]): Promise<Asset[]> {
  try {
    // Fetch data for all wallets in parallel
    const walletDataPromises = walletAddresses.map((address) => fetchWalletData(address));
    const walletsData = await Promise.all(walletDataPromises);

    // Convert all wallet data to assets
    const allAssets = walletsData.flatMap((walletData) => convertToAssets(walletData));

    console.log(`Synced ${allAssets.length} assets from ${walletAddresses.length} wallets`);
    return allAssets;
  } catch (error) {
    console.error('Failed to sync wallets:', error);
    throw error;
  }
}

/**
 * Get current SOL price (for conversions)
 */
export async function getSolPrice(): Promise<number> {
  try {
    // This would typically call a price API
    // For now, return a placeholder
    // TODO: Implement actual price fetching (Jupiter, CoinGecko, etc.)
    return 200; // $200 per SOL
  } catch (error) {
    console.error('Failed to fetch SOL price:', error);
    return 0;
  }
}

/**
 * Get available DeFi protocols and their APYs
 */
export async function getDeFiProtocols(): Promise<
  Array<{ name: string; apy: number; type: string }>
> {
  // This would typically fetch from DeFi Llama or similar
  // For now, return some example protocols
  return [
    { name: 'Kamino', apy: 8.5, type: 'Lending' },
    { name: 'MarginFi', apy: 7.2, type: 'Lending' },
    { name: 'Marinade', apy: 7.0, type: 'Staking' },
    { name: 'Drift', apy: 6.8, type: 'Lending' },
  ];
}

/**
 * Check if API key is configured
 */
export function isHeliusConfigured(): boolean {
  return !!API_KEYS.HELIUS && API_KEYS.HELIUS.length > 0;
}
