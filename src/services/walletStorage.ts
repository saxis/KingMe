// src/services/walletStorage.ts - Fixed for React Native

import nacl from 'tweetnacl';
import bs58 from 'bs58';
import * as Crypto from 'expo-crypto';

const ENCRYPTION_MESSAGE = 'Sign this message to encrypt/decrypt your KingMe profile data';

/**
 * Get encryption key from wallet signature
 */
export async function getEncryptionKeyFromWallet(
  signMessage: (message: Uint8Array) => Promise<Uint8Array>
): Promise<Uint8Array> {
  try {
    const message = new TextEncoder().encode(ENCRYPTION_MESSAGE);
    const signature = await signMessage(message);
    
    // Hash signature to get 32 bytes for encryption key
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      Buffer.from(signature).toString('hex')
    );
    
    // Convert hex string to Uint8Array
    const keyArray = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      keyArray[i] = parseInt(hash.substr(i * 2, 2), 16);
    }
    
    return keyArray;
  } catch (error) {
    console.error('Failed to get encryption key:', error);
    throw error;
  }
}

/**
 * Encrypt profile data with wallet signature
 */
export async function encryptProfileWithWallet(
  profileData: any,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>
): Promise<string> {
  try {
    console.log('🔐 Encrypting with wallet signature...');
    
    // Get encryption key from wallet
    const key = await getEncryptionKeyFromWallet(signMessage);
    
    // Convert profile to JSON
    const jsonString = JSON.stringify(profileData);
    const message = new TextEncoder().encode(jsonString);
    
    // Generate nonce
    const nonce = nacl.randomBytes(24);
    
    // Encrypt
    const encrypted = nacl.secretbox(message, nonce, key);
    
    // Combine nonce + encrypted
    const combined = new Uint8Array(nonce.length + encrypted.length);
    combined.set(nonce);
    combined.set(encrypted, nonce.length);
    
    const base58String = bs58.encode(combined);
    
    console.log('✅ Encrypted with wallet:', base58String.length, 'chars');
    return base58String;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw error;
  }
}

/**
 * Decrypt profile data with wallet signature
 */
export async function decryptProfileWithWallet(
  encryptedData: string,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>
): Promise<any> {
  try {
    console.log('🔓 Decrypting with wallet signature...');
    
    // Get encryption key from wallet
    const key = await getEncryptionKeyFromWallet(signMessage);
    
    // Decode
    const combined = bs58.decode(encryptedData);
    const nonce = combined.slice(0, 24);
    const encrypted = combined.slice(24);
    
    // Decrypt
    const decrypted = nacl.secretbox.open(encrypted, nonce, key);
    
    if (!decrypted) {
      throw new Error('Decryption failed - wrong wallet or corrupted data');
    }
    
    // Parse JSON
    const jsonString = new TextDecoder().decode(decrypted);
    const profileData = JSON.parse(jsonString);
    
    console.log('✅ Decrypted successfully');
    return profileData;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw error;
  }
}
