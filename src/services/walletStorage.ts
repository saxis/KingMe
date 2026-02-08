// src/services/walletStorage.ts
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import * as Crypto from 'expo-crypto';
import { decode as atob, encode as btoa } from 'base-64';

const ENCRYPTION_MESSAGE = 'Sign this message to prove you own this wallet';

// Polyfill for TextEncoder/TextDecoder
function encodeText(str: string): Uint8Array {
  const utf8 = unescape(encodeURIComponent(str));
  const result = new Uint8Array(utf8.length);
  for (let i = 0; i < utf8.length; i++) {
    result[i] = utf8.charCodeAt(i);
  }
  return result;
}

function decodeText(arr: Uint8Array): string {
  let str = '';
  for (let i = 0; i < arr.length; i++) {
    str += String.fromCharCode(arr[i]);
  }
  return decodeURIComponent(escape(str));
}

export async function getEncryptionKeyFromWallet(
  signMessage: (message: Uint8Array) => Promise<Uint8Array>,
  publicKey: string
): Promise<Uint8Array> {
  try {
    // Require signature to prove ownership
    const message = encodeText(ENCRYPTION_MESSAGE);
    await signMessage(message);

    console.log('Using public key for encryption:', publicKey);

    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      publicKey
    );

    console.log('Encryption key hash:', hash);

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

export async function encryptProfileWithWallet(
  profileData: any,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>,
  publicKey: string
): Promise<string> {
  try {
    console.log('🔐 Encrypting with wallet signature...');

    const key = await getEncryptionKeyFromWallet(signMessage, publicKey);

    const jsonString = JSON.stringify(profileData);
    const message = encodeText(jsonString);

    const nonce = nacl.randomBytes(24);
    const encrypted = nacl.secretbox(message, nonce, key);

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

export async function decryptProfileWithWallet(
  encryptedData: string,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>,
  publicKey: string
): Promise<any> {
  try {
    console.log('🔓 Decrypting with wallet signature...');

    const key = await getEncryptionKeyFromWallet(signMessage, publicKey);

    const combined = bs58.decode(encryptedData);
    const nonce = combined.slice(0, 24);
    const encrypted = combined.slice(24);

    const decrypted = nacl.secretbox.open(encrypted, nonce, key);

    if (!decrypted) {
      throw new Error('Decryption failed - wrong wallet or corrupted data');
    }

    const jsonString = decodeText(decrypted);
    const profileData = JSON.parse(jsonString);

    console.log('✅ Decrypted successfully');
    return profileData;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw error;
  }
}