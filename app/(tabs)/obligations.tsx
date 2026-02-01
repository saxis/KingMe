// app/(tabs)/obligations.tsx
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useState } from 'react';
import { useStore } from '../../src/store/useStore';
import type { Obligation } from '../../src/types';

export default function ObligationsScreen() {
  const obligations = useStore((state) => state.obligations);
  const addObligation = useStore((state) => state.addObligation);
  const removeObligation = useStore((state) => state.removeObligation);
  
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [payee, setPayee] = useState('');
  const [amount, setAmount] = useState('');

  const handleAddObligation = () => {
    if (!name || !amount) return;
    
    const newObligation: Obligation = {
      id: Date.now().toString(),
      name,
      payee: payee || 'Various',
      amount: parseFloat(amount),
      category: 'other',
      isRecurring: true,
    };
    
    addObligation(newObligation);
    
    // Reset form
    setName('');
    setPayee('');
    setAmount('');
    setShowAddModal(false);
  };

  const calculateMonthlyTotal = () => {
    return obligations.reduce((sum, o) => sum + o.amount, 0);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Summary */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Total Monthly Obligations</Text>
          <Text style={styles.summaryValue}>${calculateMonthlyTotal().toLocaleString()}</Text>
          <Text style={styles.summaryYearly}>${(calculateMonthlyTotal() * 12).toLocaleString()}/year</Text>
        </View>

        {/* Obligations List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Obligations</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {obligations.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No obligations yet</Text>
              <Text style={styles.emptySubtext}>Tap "+ Add" to add your first obligation</Text>
            </View>
          ) : (
            obligations.map((obligation) => (
              <View key={obligation.id} style={styles.obligationCard}>
                <View style={styles.obligationHeader}>
                  <View>
                    <Text style={styles.obligationName}>{obligation.name}</Text>
                    <Text style={styles.obligationPayee}>Paid to: {obligation.payee}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeObligation(obligation.id)}>
                    <Text style={styles.deleteButton}>✕</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.obligationAmount}>${obligation.amount.toFixed(2)}/month</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Obligation Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Obligation</Text>

            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g., Rent, Netflix, Car Payment"
              placeholderTextColor="#666"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Who are you paying?</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g., XYZ Financial, Landlord"
              placeholderTextColor="#666"
              value={payee}
              onChangeText={setPayee}
            />

            <Text style={styles.label}>Monthly Amount</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#666"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
              <Text style={styles.period}>/month</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowAddModal(false);
                  setName('');
                  setPayee('');
                  setAmount('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalAddButton, (!name || !amount) && styles.modalAddButtonDisabled]}
                onPress={handleAddObligation}
                disabled={!name || !amount}
              >
                <Text style={styles.modalAddText}>Add</Text>
              </TouchableOpacity>
            </View>
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
    borderColor: '#f4c430',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#a0a0a0',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f4c430',
  },
  summaryYearly: {
    fontSize: 14,
    color: '#a0a0a0',
    marginTop: 4,
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
    backgroundColor: '#f4c430',
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
  obligationCard: {
    backgroundColor: '#1a1f2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f4c430',
  },
  obligationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  obligationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  obligationPayee: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  deleteButton: {
    fontSize: 20,
    color: '#ff4444',
    padding: 4,
  },
  obligationAmount: {
    fontSize: 16,
    color: '#f4c430',
    fontWeight: 'bold',
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
    color: '#f4c430',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    marginTop: 12,
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
    color: '#f4c430',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 20,
    color: '#ffffff',
    paddingVertical: 16,
  },
  period: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
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
    backgroundColor: '#f4c430',
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
