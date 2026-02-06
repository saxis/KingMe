// src/providers/WalletProvider.tsx - Full MWA + Web support
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Platform } from 'react-native';
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';

interface WalletContextType {
  connected: boolean;
  connecting: boolean;
  publicKey: PublicKey | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
  signTransaction: (transaction: any) => Promise<any>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Web: Listen for Phantom connection changes
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'solana' in window) {
      const phantom = (window as any).solana;
      
      // Check if already connected
      if (phantom.isConnected && phantom.publicKey) {
        setConnected(true);
        setPublicKey(new PublicKey(phantom.publicKey.toString()));
      }
      
      // Listen for connection changes
      phantom.on('connect', (publicKey: any) => {
        console.log('Phantom connected:', publicKey.toString());
        setConnected(true);
        setPublicKey(new PublicKey(publicKey.toString()));
      });
      
      phantom.on('disconnect', () => {
        console.log('Phantom disconnected');
        setConnected(false);
        setPublicKey(null);
      });
      
      return () => {
        phantom.removeAllListeners();
      };
    }
  }, []);

  const connect = useCallback(async () => {
    if (connected || connecting) return;
    
    setConnecting(true);
    
    try {
      if (Platform.OS === 'web') {
        // Web: Use Phantom extension
        if (typeof window !== 'undefined' && 'solana' in window) {
          const resp = await (window as any).solana.connect();
          setConnected(true);
          setPublicKey(new PublicKey(resp.publicKey.toString()));
        } else {
          throw new Error('Phantom extension not found');
        }
      } else {
        // Mobile: Use Mobile Wallet Adapter
        console.log('🔌 Connecting to mobile wallet...');
        await transact(async (wallet) => {
        const authorization = await wallet.authorize({
          cluster: 'mainnet-beta',
          identity: {
            name: 'KingMe',
            uri: 'https://kingme.app',
            icon: 'favicon.ico',
          },
        });
        
        console.log('✅ Authorized');
        
        const addressData = authorization.accounts[0].address;
        
        // Address is base64 encoded - decode it first
        let addressBytes: Uint8Array;
        
        if (typeof addressData === 'string') {
          // Decode base64 to bytes
          const binaryString = atob(addressData);
          addressBytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            addressBytes[i] = binaryString.charCodeAt(i);
          }
        } else {
          addressBytes = addressData;
        }
        
        // Now encode bytes to base58
        const addressString = bs58.encode(addressBytes);
        console.log('Address:', addressString);
        
        const pubKey = new PublicKey(addressString);
        setPublicKey(pubKey);
        setAuthToken(authorization.auth_token);
        setConnected(true);
        
        console.log('✅ Connected:', pubKey.toBase58());
      });
        
       
      }
    } catch (error: any) {
      console.error('Connection failed:', error);
      throw error;
    } finally {
      setConnecting(false);
    }
  }, [connected, connecting]);

  const disconnect = useCallback(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'solana' in window) {
      (window as any).solana.disconnect();
    }
    setConnected(false);
    setPublicKey(null);
    setAuthToken(null);
    console.log('🔌 Disconnected');
  }, []);

  const signMessage = useCallback(async (message: Uint8Array): Promise<Uint8Array> => {
    if (!connected || !publicKey) {
      throw new Error('Wallet not connected');
    }
    
    try {
      console.log('✍️ Signing message...');
      
      if (Platform.OS === 'web') {
        // Web: Use Phantom
        if (typeof window !== 'undefined' && 'solana' in window) {
          const encodedMessage = new TextEncoder().encode(message.toString());
          const signedMessage = await (window as any).solana.signMessage(encodedMessage, 'utf8');
          return signedMessage.signature;
        }
        throw new Error('Phantom not found');
      } else {
        // Mobile: Use MWA
        if (!authToken) {
          throw new Error('Not authorized');
        }
        
        let signature: Uint8Array | null = null;
        
        await transact(async (wallet) => {
          // Reauthorize with token
          await wallet.reauthorize({
            auth_token: authToken,
            identity: {
              name: 'KingMe',
              uri: 'https://kingme.app',
              icon: 'favicon.ico',
            },
          });
          
          // Sign message
          const result = await wallet.signMessages({
            addresses: [publicKey.toBase58()],
            payloads: [message],
          });
          
          signature = result[0];
        });
        
        if (!signature) {
          throw new Error('Failed to get signature');
        }
        
        console.log('✅ Message signed');
        return signature;
      }
    } catch (error: any) {
      console.error('Signing failed:', error);
      throw error;
    }
  }, [connected, publicKey, authToken]);

  const signTransaction = useCallback(async (transaction: any): Promise<any> => {
    if (!connected || !publicKey) {
      throw new Error('Wallet not connected');
    }
    
    try {
      console.log('✍️ Signing transaction...');
      
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && 'solana' in window) {
          return await (window as any).solana.signTransaction(transaction);
        }
        throw new Error('Phantom not found');
      } else {
        // Mobile: Use MWA
        if (!authToken) {
          throw new Error('Not authorized');
        }
        
        let signedTx: any = null;
        
        await transact(async (wallet) => {
          // Reauthorize
          await wallet.reauthorize({
            auth_token: authToken,
            identity: {
              name: 'KingMe',
              uri: 'https://kingme.app',
              icon: 'favicon.ico',
            },
          });
          
          // Sign transaction
          const result = await wallet.signTransactions({
            transactions: [transaction],
          });
          
          signedTx = result[0];
        });
        
        console.log('✅ Transaction signed');
        return signedTx;
      }
    } catch (error: any) {
      console.error('Transaction signing failed:', error);
      throw error;
    }
  }, [connected, publicKey, authToken]);

  return (
    <WalletContext.Provider
      value={{
        connected,
        connecting,
        publicKey,
        connect,
        disconnect,
        signMessage,
        signTransaction,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
