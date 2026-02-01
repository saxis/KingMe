// src/components/WalletConnect.tsx
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useState } from 'react';
// TODO: Switch to real wallet service when using development build
// import { connectWallet, disconnectWallet } from '../services/wallet';
import { connectWallet, disconnectWallet, getMockWalletAssets } from '../services/wallet-mock';
import { convertToAssets } from '../services/helius';
import { useStore } from '../store/useStore';

export function WalletConnect() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const wallets = useStore((state) => state.wallets);
  const addAsset = useStore((state) => state.addAsset);
  const saveProfile = useStore((state) => state.saveProfile);

  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      const walletInfo = await connectWallet();
      
      // Add wallet to profile
      const currentWallets = useStore.getState().wallets;
      
      // Check if already connected
      if (currentWallets.includes(walletInfo.address)) {
        Alert.alert('Already Connected', 'This wallet is already connected.');
        setIsConnecting(false);
        return;
      }
      
      // Update store with new wallet
      useStore.setState({
        wallets: [...currentWallets, walletInfo.address],
      });
      
      // Immediately sync wallet data
      await handleSync(walletInfo.address);
      
      await saveProfile();
      
      Alert.alert(
        'Wallet Connected!',
        `Successfully connected ${walletInfo.address.slice(0, 4)}...${walletInfo.address.slice(-4)}`
      );
    } catch (error: any) {
      Alert.alert('Connection Failed', error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSync = async (walletAddress?: string) => {
    setIsSyncing(true);
    
    try {
      const walletsToSync = walletAddress ? [walletAddress] : wallets;
      
      if (walletsToSync.length === 0) {
        Alert.alert('No Wallets', 'Please connect a wallet first.');
        setIsSyncing(false);
        return;
      }

      // TODO: Switch to real Helius API when using development build
      // Fetch data for all wallets
      const allAssets: any[] = [];
      
      for (const address of walletsToSync) {
        try {
          // Using mock data for now
          const walletData = getMockWalletAssets(address);
          const assets = convertToAssets(walletData);
          allAssets.push(...assets);
          
          // Real implementation:
          // const walletData = await fetchWalletData(address);
          // const assets = convertToAssets(walletData);
          // allAssets.push(...assets);
        } catch (error) {
          console.error(`Failed to sync wallet ${address}:`, error);
        }
      }

      // Add all synced assets to store
      // Remove existing crypto assets first to avoid duplicates
      const currentAssets = useStore.getState().assets;
      const nonCryptoAssets = currentAssets.filter(a => a.type !== 'crypto' && a.type !== 'defi');
      
      useStore.setState({
        assets: [...nonCryptoAssets, ...allAssets],
      });

      await saveProfile();
      
      Alert.alert(
        'Sync Complete',
        `Synced ${allAssets.length} assets from ${walletsToSync.length} wallet(s)`
      );
    } catch (error: any) {
      Alert.alert('Sync Failed', error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async (address: string) => {
    Alert.alert(
      'Disconnect Wallet',
      `Are you sure you want to disconnect ${address.slice(0, 4)}...${address.slice(-4)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await disconnectWallet(address);
              
              // Remove wallet from profile
              const currentWallets = useStore.getState().wallets;
              useStore.setState({
                wallets: currentWallets.filter(w => w !== address),
              });
              
              // Remove assets from this wallet
              const currentAssets = useStore.getState().assets;
              const filteredAssets = currentAssets.filter(
                asset => {
                  const metadata = asset.metadata as any;
                  return metadata.walletAddress !== address;
                }
              );
              
              useStore.setState({ assets: filteredAssets });
              
              await saveProfile();
              
              Alert.alert('Disconnected', 'Wallet disconnected successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Solana Wallets</Text>
        {wallets.length > 0 && (
          <TouchableOpacity
            style={styles.syncButton}
            onPress={() => handleSync()}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color="#4ade80" />
            ) : (
              <Text style={styles.syncButtonText}>🔄 Sync All</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {wallets.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No wallets connected</Text>
          <Text style={styles.emptySubtext}>
            Connect your Phantom or Solflare wallet to automatically track your crypto assets
          </Text>
        </View>
      ) : (
        <View style={styles.walletsList}>
          {wallets.map((address) => (
            <View key={address} style={styles.walletCard}>
              <View>
                <Text style={styles.walletAddress}>
                  {address.slice(0, 4)}...{address.slice(-4)}
                </Text>
                <Text style={styles.walletLabel}>Connected</Text>
              </View>
              <TouchableOpacity onPress={() => handleDisconnect(address)}>
                <Text style={styles.disconnectButton}>Disconnect</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={styles.connectButton}
        onPress={handleConnect}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <ActivityIndicator size="small" color="#0a0e1a" />
        ) : (
          <Text style={styles.connectButtonText}>+ Connect Wallet</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  syncButton: {
    backgroundColor: '#1a1f2e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4ade80',
  },
  syncButtonText: {
    color: '#4ade80',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
  },
  walletsList: {
    marginBottom: 12,
  },
  walletCard: {
    backgroundColor: '#1a1f2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#4ade80',
  },
  walletAddress: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 4,
  },
  walletLabel: {
    fontSize: 12,
    color: '#4ade80',
  },
  disconnectButton: {
    fontSize: 14,
    color: '#ff6b6b',
  },
  connectButton: {
    backgroundColor: '#4ade80',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a0e1a',
  },
});
