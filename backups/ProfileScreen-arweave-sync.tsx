// Update Profile screen to use Arweave

import { saveToArweave, loadLatestBackup } from '../../src/services/arweaveStorage';

// Replace handleWalletBackup with:
const handleArweaveBackup = async () => {
  if (wallets.length === 0) {
    Alert.alert('No Wallet', 'Please connect a wallet first to enable encrypted backup.');
    return;
  }

  setIsSyncing(true);
  
  try {
    const primaryWallet = wallets[0];
    
    // Get all profile data
    const profileData = {
      bankAccounts,
      income,
      obligations,
      debts,
      assets,
      desires: useStore.getState().desires,
      wallets,
      paycheckDeductions,
      preTaxDeductions: useStore.getState().preTaxDeductions,
      taxes: useStore.getState().taxes,
      postTaxDeductions: useStore.getState().postTaxDeductions,
      timestamp: new Date().toISOString(),
    };
    
    // Save to Arweave (encrypted)
    const txId = await saveToArweave(profileData, primaryWallet);
    
    // Save txId locally for easy access
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`kingme_last_backup_${primaryWallet}`, txId);
    }
    
    setLastSyncTime(new Date().toISOString());
    
    Alert.alert(
      'Backup Complete! 🌐',
      `Profile encrypted and uploaded to Arweave.\n\nTransaction ID: ${txId.slice(0, 8)}...\n\nPermanently stored on the blockchain. You can restore on any device.`,
      [
        { text: 'OK' },
        { 
          text: 'View on Arweave', 
          onPress: () => {
            // Open in browser
            const url = `https://viewblock.io/arweave/tx/${txId}`;
            console.log('View:', url);
          }
        }
      ]
    );
  } catch (error: any) {
    console.error('Backup failed:', error);
    Alert.alert('Backup Failed', error.message);
  } finally {
    setIsSyncing(false);
  }
};

// Replace handleWalletRestore with:
const handleArweaveRestore = async () => {
  if (wallets.length === 0) {
    Alert.alert('No Wallet', 'Please connect a wallet first to restore your backup.');
    return;
  }

  Alert.alert(
    'Restore from Arweave?',
    'This will replace all current data with your backed-up profile. Continue?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Restore',
        style: 'destructive',
        onPress: async () => {
          setIsSyncing(true);
          
          try {
            const primaryWallet = wallets[0];
            
            // Load latest backup from Arweave
            const profileData = await loadLatestBackup(primaryWallet);
            
            // Restore to store
            useStore.setState({
              bankAccounts: profileData.bankAccounts || [],
              income: profileData.income || { sources: [] },
              obligations: profileData.obligations || [],
              debts: profileData.debts || [],
              assets: profileData.assets || [],
              desires: profileData.desires || [],
              wallets: profileData.wallets || [primaryWallet],
              paycheckDeductions: profileData.paycheckDeductions || [],
              preTaxDeductions: profileData.preTaxDeductions || [],
              taxes: profileData.taxes || [],
              postTaxDeductions: profileData.postTaxDeductions || [],
            });
            
            await saveProfile();
            
            setLastSyncTime(profileData.timestamp);
            
            Alert.alert(
              'Restore Complete! ✅',
              `Profile restored from Arweave.\n\nLast backup: ${new Date(profileData.timestamp).toLocaleString()}\n\nAll your data is now synced!`
            );
          } catch (error: any) {
            console.error('Restore failed:', error);
            Alert.alert('Restore Failed', error.message || 'No backup found for this wallet');
          } finally {
            setIsSyncing(false);
          }
        }
      }
    ]
  );
};

// Update JSX section title:
<View style={styles.syncSection}>
  <Text style={styles.sectionTitle}>🌐 Arweave Encrypted Sync</Text>
  <Text style={styles.syncDescription}>
    Backup your profile permanently to Arweave, encrypted with your wallet. Decentralized & secure.
  </Text>
  
  {lastSyncTime && (
    <Text style={styles.lastSync}>
      Last backup: {new Date(lastSyncTime).toLocaleString()}
    </Text>
  )}
  
  <View style={styles.syncButtons}>
    <TouchableOpacity
      style={[styles.syncButton, styles.backupButton]}
      onPress={handleArweaveBackup}
      disabled={isSyncing || wallets.length === 0}
    >
      {isSyncing ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.syncButtonText}>📤 Backup to Arweave</Text>
      )}
    </TouchableOpacity>
    
    <TouchableOpacity
      style={[styles.syncButton, styles.restoreButton]}
      onPress={handleArweaveRestore}
      disabled={isSyncing || wallets.length === 0}
    >
      {isSyncing ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.syncButtonText}>📥 Restore</Text>
      )}
    </TouchableOpacity>
  </View>
  
  {wallets.length === 0 && (
    <Text style={styles.warningText}>⚠️ Connect a wallet to enable Arweave sync</Text>
  )}
</View>
