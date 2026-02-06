// src/components/WalletConnect.tsx - Debug asset metadata
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { useState } from 'react';
import { syncAllWallets } from '../services/helius';
import { useStore } from '../store/useStore';

export function WalletConnect() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [disconnectAddress, setDisconnectAddress] = useState('');
  
  const wallets = useStore((state) => state.wallets);
  const saveProfile = useStore((state) => state.saveProfile);

  const handleConnectByAddress = async () => {
    if (!addressInput.trim()) {
      Alert.alert('Error', 'Please enter a wallet address');
      return;
    }

    setIsConnecting(true);
    
    try {
      const trimmedAddress = addressInput.trim();
      
      if (trimmedAddress.length < 32 || trimmedAddress.length > 44) {
        throw new Error('Invalid Solana address format');
      }
      
      const currentWallets = useStore.getState().wallets;
      if (currentWallets.includes(trimmedAddress)) {
        Alert.alert('Already Connected', 'This wallet is already connected.');
        setShowAddressModal(false);
        setAddressInput('');
        setIsConnecting(false);
        return;
      }
      
      useStore.setState({
        wallets: [...currentWallets, trimmedAddress],
      });
      
      await handleSync(trimmedAddress);
      await saveProfile();
      
      setShowAddressModal(false);
      setAddressInput('');
      
      Alert.alert(
        'Wallet Connected!',
        `Successfully connected ${trimmedAddress.slice(0, 4)}...${trimmedAddress.slice(-4)}`
      );
    } catch (error: any) {
      console.error('Connection error:', error);
      Alert.alert('Connection Failed', error.message || 'Failed to connect wallet');
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

      console.log(`Starting sync for ${walletsToSync.length} wallet(s)...`);
      const allAssets = await syncAllWallets(walletsToSync);
      console.log(`Sync complete: ${allAssets.length} assets found`);

      const currentAssets = useStore.getState().assets;
      const nonCryptoAssets = currentAssets.filter(a => 
        a.type !== 'crypto' && a.type !== 'defi'
      );
      
      console.log(`Keeping ${nonCryptoAssets.length} non-crypto assets`);
      console.log(`Adding ${allAssets.length} crypto assets`);
      
      useStore.setState({
        assets: [...nonCryptoAssets, ...allAssets],
      });

      await saveProfile();
      
      Alert.alert(
        'Sync Complete!',
        `Found ${allAssets.length} tokens from ${walletsToSync.length} wallet(s)`
      );
    } catch (error: any) {
      console.error('Sync error:', error);
      Alert.alert('Sync Failed', error.message || 'Failed to sync wallets');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnectClick = (address: string) => {
    console.log('Disconnect button clicked for:', address);
    setDisconnectAddress(address);
    setShowDisconnectModal(true);
  };

  const confirmDisconnect = async () => {
    try {
      console.log('Starting disconnect process for:', disconnectAddress);
      
      const currentWallets = useStore.getState().wallets;
      const currentAssets = useStore.getState().assets;
      
      console.log('Current wallets:', currentWallets);
      console.log('Current assets count:', currentAssets.length);
      
      // DEBUG: Log all assets with their metadata
      console.log('=== ASSET DETAILS ===');
      currentAssets.forEach((asset, idx) => {
        console.log(`Asset ${idx + 1}:`, {
          name: asset.name,
          type: asset.type,
          id: asset.id,
          metadata: asset.metadata,
          walletAddress: (asset.metadata as any)?.walletAddress
        });
      });
      console.log('=== END ASSET DETAILS ===');
      
      const newWallets = currentWallets.filter(w => w !== disconnectAddress);
      console.log('New wallets:', newWallets);
      
      const filteredAssets = currentAssets.filter(asset => {
        // Keep non-crypto/defi assets
        if (asset.type !== 'crypto' && asset.type !== 'defi') {
          console.log(`Keeping non-crypto asset: ${asset.name}`);
          return true;
        }
        
        const metadata = asset.metadata as any;
        const walletAddress = metadata?.walletAddress;
        
        console.log(`Checking crypto asset: ${asset.name}, wallet: ${walletAddress}`);
        
        if (!walletAddress) {
          console.log(`  -> No wallet address, keeping`);
          return true;
        }
        
        const shouldKeep = walletAddress !== disconnectAddress;
        if (!shouldKeep) {
          console.log(`  -> REMOVING (matches ${disconnectAddress.slice(0,4)}...${disconnectAddress.slice(-4)})`);
        } else {
          console.log(`  -> Keeping (wallet: ${walletAddress.slice(0,4)}...${walletAddress.slice(-4)})`);
        }
        return shouldKeep;
      });
      
      console.log('Filtered assets count:', filteredAssets.length);
      console.log('Assets removed:', currentAssets.length - filteredAssets.length);
      
      useStore.setState({ 
        wallets: newWallets,
        assets: filteredAssets,
      });
      
      await saveProfile();
      
      setShowDisconnectModal(false);
      setDisconnectAddress('');
      
      console.log('Disconnect complete');
      Alert.alert('Success', 'Wallet disconnected successfully');
    } catch (error: any) {
      console.error('Disconnect error:', error);
      Alert.alert('Error', error.message || 'Failed to disconnect wallet');
    }
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
            Connect your Solana wallet to automatically track your crypto assets
          </Text>
        </View>
      ) : (
        <View style={styles.walletsList}>
          {wallets.map((address) => (
            <View key={address} style={styles.walletCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.walletAddress}>
                  {address.slice(0, 4)}...{address.slice(-4)}
                </Text>
                <Text style={styles.walletLabel}>Connected</Text>
              </View>
              <TouchableOpacity 
                onPress={() => handleDisconnectClick(address)}
                style={styles.disconnectButtonContainer}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.disconnectButton}>Disconnect</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={styles.connectButton}
        onPress={() => setShowAddressModal(true)}
      >
        <Text style={styles.connectButtonText}>+ Connect Wallet</Text>
      </TouchableOpacity>

      <Modal visible={showAddressModal} animationType="slide" transparent={true} onRequestClose={() => setShowAddressModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Connect Wallet</Text>
            
            <Text style={styles.label}>Enter your Solana wallet address:</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 7xKXt...9YoLF"
              placeholderTextColor="#666"
              value={addressInput}
              onChangeText={setAddressInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <Text style={styles.helperText}>
              Paste your Phantom or Solflare wallet address. Your tokens will sync automatically.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddressModal(false);
                  setAddressInput('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.confirmButton, (!addressInput.trim() || isConnecting) && styles.confirmButtonDisabled]}
                onPress={handleConnectByAddress}
                disabled={!addressInput.trim() || isConnecting}
              >
                {isConnecting ? (
                  <ActivityIndicator size="small" color="#0a0e1a" />
                ) : (
                  <Text style={styles.confirmButtonText}>Connect</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showDisconnectModal} animationType="fade" transparent={true} onRequestClose={() => setShowDisconnectModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Disconnect Wallet?</Text>
            
            <Text style={styles.disconnectWarning}>
              Are you sure you want to disconnect{'\n'}
              <Text style={styles.disconnectAddress}>
                {disconnectAddress.slice(0, 4)}...{disconnectAddress.slice(-4)}
              </Text>
            </Text>
            
            <Text style={styles.disconnectSubtext}>
              This will remove all synced crypto assets from this wallet.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowDisconnectModal(false);
                  setDisconnectAddress('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.dangerButton}
                onPress={confirmDisconnect}
              >
                <Text style={styles.dangerButtonText}>Disconnect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  syncButton: { backgroundColor: '#1a1f2e', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#4ade80' },
  syncButtonText: { color: '#4ade80', fontSize: 14, fontWeight: '600' },
  emptyState: { padding: 30, alignItems: 'center', backgroundColor: '#1a1f2e', borderRadius: 12, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#666', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#444', textAlign: 'center' },
  walletsList: { marginBottom: 12 },
  walletCard: { backgroundColor: '#1a1f2e', padding: 16, borderRadius: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderLeftWidth: 4, borderLeftColor: '#4ade80' },
  walletAddress: { fontSize: 16, color: '#ffffff', fontWeight: '600', marginBottom: 4 },
  walletLabel: { fontSize: 12, color: '#4ade80' },
  disconnectButtonContainer: { padding: 8 },
  disconnectButton: { fontSize: 14, color: '#ff6b6b', fontWeight: '600' },
  connectButton: { backgroundColor: '#4ade80', padding: 16, borderRadius: 12, alignItems: 'center' },
  connectButtonText: { fontSize: 16, fontWeight: 'bold', color: '#0a0e1a' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#0a0e1a', borderRadius: 20, padding: 24, width: '100%', maxWidth: 400 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#4ade80', marginBottom: 20 },
  label: { fontSize: 15, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  input: { backgroundColor: '#1a1f2e', borderRadius: 12, padding: 14, fontSize: 16, color: '#fff', borderWidth: 2, borderColor: '#2a2f3e', marginBottom: 12 },
  helperText: { fontSize: 13, color: '#666', marginBottom: 20, lineHeight: 18 },
  disconnectWarning: { fontSize: 16, color: '#fff', marginBottom: 12, textAlign: 'center', lineHeight: 24 },
  disconnectAddress: { color: '#4ade80', fontWeight: '600' },
  disconnectSubtext: { fontSize: 13, color: '#888', marginBottom: 20, textAlign: 'center', lineHeight: 18 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelButton: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 2, borderColor: '#2a2f3e', alignItems: 'center' },
  cancelButtonText: { color: '#a0a0a0', fontSize: 16 },
  confirmButton: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#4ade80', alignItems: 'center' },
  confirmButtonDisabled: { opacity: 0.4 },
  confirmButtonText: { color: '#0a0e1a', fontSize: 16, fontWeight: 'bold' },
  dangerButton: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#ff6b6b', alignItems: 'center' },
  dangerButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
