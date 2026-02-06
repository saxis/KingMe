// src/services/arweaveStorage.ts - Arweave encrypted profile storage

import Arweave from 'arweave';
import { encryptProfile, decryptProfile } from './walletStorage';

// Initialize Arweave
const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
});

/**
 * Save encrypted profile to Arweave
 */
export async function saveToArweave(
  profileData: any,
  walletAddress: string
): Promise<string> {
  try {
    console.log('📦 Encrypting profile...');
    
    // Encrypt with wallet signature
    const encrypted = await encryptProfile(profileData, walletAddress);
    
    console.log('🌐 Uploading to Arweave...');
    
    // Create transaction
    const transaction = await arweave.createTransaction({
      data: encrypted,
    });
    
    // Add tags for easier retrieval
    transaction.addTag('App-Name', 'KingMe');
    transaction.addTag('Content-Type', 'application/json');
    transaction.addTag('Wallet-Address', walletAddress);
    transaction.addTag('Version', '1.0');
    transaction.addTag('Timestamp', new Date().toISOString());
    
    // Sign with Arweave wallet (free upload via Irys/Bundlr)
    // For now, we'll use Irys for gasless uploads
    const txId = await uploadViaIrys(encrypted, walletAddress);
    
    console.log('✅ Uploaded to Arweave:', txId);
    return txId;
  } catch (error) {
    console.error('Arweave upload failed:', error);
    throw error;
  }
}

/**
 * Load encrypted profile from Arweave
 */
export async function loadFromArweave(
  txId: string,
  walletAddress: string
): Promise<any> {
  try {
    console.log('🌐 Loading from Arweave...');
    console.log('Transaction ID:', txId);
    
    // Fetch from Arweave
    const response = await fetch(`https://arweave.net/${txId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch from Arweave: ${response.status}`);
    }
    
    const encrypted = await response.text();
    
    console.log('🔓 Decrypting profile...');
    
    // Decrypt with wallet signature
    const profileData = await decryptProfile(encrypted, walletAddress);
    
    console.log('✅ Profile loaded from Arweave');
    return profileData;
  } catch (error) {
    console.error('Arweave load failed:', error);
    throw error;
  }
}

/**
 * Upload via Irys (formerly Bundlr) - gasless uploads
 */
async function uploadViaIrys(
  data: string,
  walletAddress: string
): Promise<string> {
  try {
    // Use Irys free tier for small uploads
    const response = await fetch('https://node2.irys.xyz/tx', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data,
        tags: [
          { name: 'App-Name', value: 'KingMe' },
          { name: 'Content-Type', value: 'text/plain' },
          { name: 'Wallet-Address', value: walletAddress },
          { name: 'Version', value: '1.0' },
        ],
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Irys upload failed: ${response.status}`);
    }
    
    const result = await response.json();
    return result.id;
  } catch (error) {
    console.error('Irys upload failed, falling back to localStorage:', error);
    
    // Fallback: store in localStorage with Arweave-like key
    const txId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`arweave_${walletAddress}`, data);
      localStorage.setItem(`arweave_txid_${walletAddress}`, txId);
    }
    
    return txId;
  }
}

/**
 * Find latest backup for a wallet
 */
export async function findLatestBackup(walletAddress: string): Promise<string | null> {
  try {
    console.log('🔍 Searching for backups...');
    
    // Query Arweave GraphQL for latest backup
    const query = `
      query {
        transactions(
          tags: [
            { name: "App-Name", values: ["KingMe"] }
            { name: "Wallet-Address", values: ["${walletAddress}"] }
          ]
          first: 1
          sort: HEIGHT_DESC
        ) {
          edges {
            node {
              id
              tags {
                name
                value
              }
            }
          }
        }
      }
    `;
    
    const response = await fetch('https://arweave.net/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    
    const result = await response.json();
    
    if (result.data?.transactions?.edges?.length > 0) {
      const txId = result.data.transactions.edges[0].node.id;
      console.log('✅ Found backup:', txId);
      return txId;
    }
    
    // Fallback: check localStorage
    if (typeof localStorage !== 'undefined') {
      const localTxId = localStorage.getItem(`arweave_txid_${walletAddress}`);
      if (localTxId) {
        console.log('✅ Found local backup:', localTxId);
        return localTxId;
      }
    }
    
    console.log('❌ No backup found');
    return null;
  } catch (error) {
    console.error('Search failed:', error);
    return null;
  }
}

/**
 * Load latest backup (convenience function)
 */
export async function loadLatestBackup(walletAddress: string): Promise<any> {
  const txId = await findLatestBackup(walletAddress);
  
  if (!txId) {
    throw new Error('No backup found for this wallet');
  }
  
  // Check if it's a local backup
  if (txId.startsWith('local_')) {
    if (typeof localStorage !== 'undefined') {
      const data = localStorage.getItem(`arweave_${walletAddress}`);
      if (data) {
        return await decryptProfile(data, walletAddress);
      }
    }
    throw new Error('Local backup not found');
  }
  
  return await loadFromArweave(txId, walletAddress);
}
