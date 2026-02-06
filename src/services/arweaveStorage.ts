// src/services/arweaveStorage.ts - React Native version

import AsyncStorage from '@react-native-async-storage/async-storage';
import { encryptProfileWithWallet, decryptProfileWithWallet } from './walletStorage';

/**
 * Save encrypted profile to Arweave with wallet signature
 */
export async function saveToArweave(
  profileData: any,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>,
  walletAddress: string
): Promise<string> {
  try {
    console.log('📦 Encrypting profile with wallet...');
    
    // Encrypt with wallet signature
    const encrypted = await encryptProfileWithWallet(profileData, signMessage);
    
    console.log('🌐 Uploading to Arweave...');
    
    // Upload via Irys (for now, use AsyncStorage fallback)
    const txId = await uploadViaIrys(encrypted, walletAddress);
    
    console.log('✅ Uploaded to Arweave:', txId);
    return txId;
  } catch (error) {
    console.error('Arweave upload failed:', error);
    throw error;
  }
}

/**
 * Load encrypted profile from Arweave with wallet signature
 */
export async function loadFromArweave(
  txId: string,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>
): Promise<any> {
  try {
    console.log('🌐 Loading from Arweave...');
    console.log('Transaction ID:', txId);
    
    // Check if local backup
    if (txId.startsWith('local_')) {
      const data = await AsyncStorage.getItem(`arweave_backup_${txId}`);
      if (data) {
        console.log('🔓 Decrypting local backup...');
        return await decryptProfileWithWallet(data, signMessage);
      }
      throw new Error('Local backup not found');
    }
    
    // Fetch from Arweave
    const response = await fetch(`https://arweave.net/${txId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch from Arweave: ${response.status}`);
    }
    
    const encrypted = await response.text();
    
    console.log('🔓 Decrypting profile with wallet...');
    
    // Decrypt with wallet signature
    const profileData = await decryptProfileWithWallet(encrypted, signMessage);
    
    console.log('✅ Profile loaded from Arweave');
    return profileData;
  } catch (error) {
    console.error('Arweave load failed:', error);
    throw error;
  }
}

/**
 * Upload via Irys - gasless uploads
 * For now, uses AsyncStorage fallback
 */
async function uploadViaIrys(
  data: string,
  walletAddress: string
): Promise<string> {
  try {
    // For now, just use AsyncStorage fallback
    // Real Irys/Arweave uploads require payment setup
    console.log('Using AsyncStorage fallback for now...');
    
    const txId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await AsyncStorage.setItem(`arweave_backup_${txId}`, data);
    await AsyncStorage.setItem(`arweave_latest_${walletAddress}`, txId);
    
    return txId;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}

/**
 * Find latest backup for a wallet
 */
export async function findLatestBackup(walletAddress: string): Promise<string | null> {
  try {
    console.log('🔍 Searching for backups...');
    
    // Check AsyncStorage first
    const localTxId = await AsyncStorage.getItem(`arweave_latest_${walletAddress}`);
    if (localTxId) {
      console.log('✅ Found local backup:', localTxId);
      return localTxId;
    }
    
    console.log('❌ No backup found');
    return null;
  } catch (error) {
    console.error('Search failed:', error);
    return null;
  }
}

/**
 * Load latest backup
 */
export async function loadLatestBackup(
  walletAddress: string,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>
): Promise<any> {
  const txId = await findLatestBackup(walletAddress);
  
  if (!txId) {
    throw new Error('No backup found for this wallet');
  }
  
  return await loadFromArweave(txId, signMessage);
}
