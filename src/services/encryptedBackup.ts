import AsyncStorage from '@react-native-async-storage/async-storage';
import { encryptProfileWithWallet, decryptProfileWithWallet } from './walletStorage';

const BACKUP_API = process.env.EXPO_PUBLIC_BACKUP_API_URL || 'http://localhost:3000/api/backup';

export async function saveBackup(
  profileData: any,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>,
  walletAddress: string
): Promise<string> {
  try {
    console.log('📦 Encrypting profile with wallet...');

    // Pass walletAddress to encryption
    const encrypted = await encryptProfileWithWallet(profileData, signMessage, walletAddress);

    console.log('☁️ Uploading to cloud...');

    const response = await fetch(`${BACKUP_API}?wallet=${walletAddress}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: encrypted })
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    const backupId = `cloud_${Date.now()}`;
    await AsyncStorage.setItem(`backup_latest_${walletAddress}`, backupId);

    console.log('✅ Backup saved to cloud');
    return backupId;
  } catch (error) {
    console.error('Backup failed:', error);
    throw error;
  }
}

export async function loadBackup(
  walletAddress: string,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>
): Promise<any> {
  try {
    console.log('☁️ Loading backup from cloud...');

    const response = await fetch(`${BACKUP_API}?wallet=${walletAddress}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch backup: ${response.status}`);
    }

    const { data: encrypted } = await response.json();

    if (!encrypted) {
      throw new Error('No backup found for this wallet');
    }

    // Strip quotes if present
    const cleanEncrypted = typeof encrypted === 'string'
      ? encrypted.replace(/^"|"$/g, '')
      : encrypted;

    console.log('🔓 Decrypting profile with wallet...');

    // Pass walletAddress to decryption
    const profileData = await decryptProfileWithWallet(cleanEncrypted, signMessage, walletAddress);

    console.log('✅ Backup loaded from cloud');
    return profileData;
  } catch (error) {
    console.error('Load backup failed:', error);
    throw error;
  }
}