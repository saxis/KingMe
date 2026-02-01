// app/(tabs)/assets.tsx
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useState } from 'react';
import { useStore } from '../../src/store/useStore';
import type { Asset } from '../../src/types';

export default function AssetsScreen() {
  const assets = useStore((state) => state.assets);
  const addAsset = useStore((state) => state.addAsset);
  const removeAsset = useStore((state) => state.removeAsset);
  
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<Asset['type']>('crypto');
  const [value, setValue] = useState('');
  const [apy, setApy] = useState('');
  const [annualIncome, setAnnualIncome] = useState('');

  const handleAddAsset = () => {
    if (!name || !value) return;
    
    let calculatedIncome = parseFloat(annualIncome) || 0;
    if (apy && !annualIncome) {
      calculatedIncome = parseFloat(value) * (parseFloat(apy) / 100);
    }
    
    const newAsset: Asset = {
      id: Date.now().toString(),
      name,
      type,
      value: parseFloat(value),
      annualIncome: calculatedIncome,
      metadata: {
        type: 'other',
        description: name,
      },
    };
    
    addAsset(newAsset);
    
    // Reset form
    setName('');
    setType('crypto');
    setValue('');
    setApy('');
    setAnnualIncome('');
    setShowAddModal(false);
  };

  const calculateTotalValue = () => {
    return assets.reduce((sum, asset) => sum + asset.value, 0);
  };

  const calculateTotalIncome = () => {
    return assets.reduce((sum, asset) => sum + asset.annualIncome, 0);
  };

  const getTypeLabel = (type: Asset['type']) => {
    const labels = {
      crypto: '₿ Crypto',
      stocks: '📈 Stocks',
      real_estate: '🏠 Real Estate',
      business: '💼 Business',
      other: '💰 Other',
    };
    return labels[type];
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Summary */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Value</Text>
              <Text style={styles.summaryValue}>${calculateTotalValue().toLocaleString()}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Annual Income</Text>
              <Text style={styles.summaryIncome}>${calculateTotalIncome().toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Assets List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Assets</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {assets.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No assets yet</Text>
              <Text style={styles.emptySubtext}>Tap "+ Add" to add your first asset</Text>
            </View>
          ) : (
            assets.map((asset) => (
              <View key={asset.id} style={styles.assetCard}>
                <View style={styles.assetHeader}>
                  <View>
                    <Text style={styles.assetName}>{asset.name}</Text>
                    <Text style={styles.assetType}>{getTypeLabel(asset.type)}</Text>
                    {asset.annualIncome === 0 && (
                      <Text style={styles.warningBadge}>⚠️ Not generating income</Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => removeAsset(asset.id)}>
                    <Text style={styles.deleteButton}>✕</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.assetDetails}>
                  <View style={styles.assetDetail}>
                    <Text style={styles.assetDetailLabel}>Value</Text>
                    <Text style={styles.assetDetailValue}>${asset.value.toLocaleString()}</Text>
                  </View>
                  <View style={styles.assetDetail}>
                    <Text style={styles.assetDetailLabel}>Annual Income</Text>
                    <Text style={[
                      styles.assetIncome,
                      asset.annualIncome === 0 && styles.assetIncomeZero
                    ]}>
                      ${asset.annualIncome.toLocaleString()}/yr
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Asset Modal - simplified version */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Add Asset</Text>

              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., USDC in Kamino, 100 SOL"
                placeholderTextColor="#666"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.label}>Current Value</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  value={value}
                  onChangeText={setValue}
                />
              </View>

              <Text style={styles.label}>APY (optional)</Text>
              <Text style={styles.helperText}>Leave blank if not earning yield</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  value={apy}
                  onChangeText={setApy}
                />
                <Text style={styles.percent}>%</Text>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setShowAddModal(false);
                    setName('');
                    setValue('');
                    setApy('');
                  }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalAddButton, (!name || !value) && styles.modalAddButtonDisabled]}
                  onPress={handleAddAsset}
                  disabled={!name || !value}
                >
                  <Text style={styles.modalAddText}>Add</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e1a',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  summaryBox: {
    backgroundColor: '#1a1f2e',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#4ade80',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#a0a0a0',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  summaryIncome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4ade80',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  addButton: {
    backgroundColor: '#4ade80',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#0a0e1a',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
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
  assetCard: {
    backgroundColor: '#1a1f2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4ade80',
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  assetName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  assetType: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  warningBadge: {
    fontSize: 11,
    color: '#ff9800',
    marginTop: 4,
    fontWeight: '600',
  },
  deleteButton: {
    fontSize: 20,
    color: '#ff4444',
    padding: 4,
  },
  assetDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  assetDetail: {
    flex: 1,
  },
  assetDetailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  assetDetailValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  assetIncome: {
    fontSize: 14,
    color: '#4ade80',
    fontWeight: 'bold',
  },
  assetIncomeZero: {
    color: '#666',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0a0e1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4ade80',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    marginTop: 12,
  },
  helperText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 2,
    borderColor: '#2a2f3e',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#2a2f3e',
  },
  currencySymbol: {
    fontSize: 20,
    color: '#4ade80',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 20,
    color: '#ffffff',
    paddingVertical: 16,
  },
  percent: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  modalCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2a2f3e',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#a0a0a0',
    fontSize: 16,
  },
  modalAddButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#4ade80',
    alignItems: 'center',
  },
  modalAddButtonDisabled: {
    opacity: 0.5,
  },
  modalAddText: {
    color: '#0a0e1a',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
