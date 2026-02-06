// app/(tabs)/debts.tsx
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useState } from 'react';
import { useStore } from '../../src/store/useStore';
import type { Debt, BankAccount } from '../../src/types';

// ── Standalone component so it doesn't nest inside DebtsScreen ──
function AccountPicker({ bankAccounts, value, onChange }: { bankAccounts: BankAccount[]; value: string; onChange: (id: string) => void }) {
  return (
    <>
      <Text style={styles.label}>Payment Account</Text>
      {bankAccounts.length === 0 ? (
        <Text style={styles.noAccountsText}>⚠️ No bank accounts added yet</Text>
      ) : (
        <View style={styles.accountsList}>
          <TouchableOpacity
            style={[styles.accountOption, value === '' && styles.accountOptionSelected]}
            onPress={() => onChange('')}
          >
            <Text style={[styles.accountOptionText, value === '' && styles.accountOptionTextSelected]}>
              Not assigned
            </Text>
            {value === '' && <Text style={styles.accountOptionCheck}>✓</Text>}
          </TouchableOpacity>

          {bankAccounts.map((account) => (
            <TouchableOpacity
              key={account.id}
              style={[styles.accountOption, value === account.id && styles.accountOptionSelected]}
              onPress={() => onChange(account.id)}
            >
              <View>
                <Text style={[styles.accountOptionText, value === account.id && styles.accountOptionTextSelected]}>
                  {account.name}
                </Text>
                <Text style={styles.accountOptionSub}>{account.institution} · ${(account.currentBalance ?? 0).toLocaleString()}</Text>
              </View>
              {value === account.id && <Text style={styles.accountOptionCheck}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </>
  );
}

export default function DebtsScreen() {
  const debts = useStore((state) => state.debts);
  const bankAccounts = useStore((state) => state.bankAccounts);
  const addDebt = useStore((state) => state.addDebt);
  const removeDebt = useStore((state) => state.removeDebt);
  const updateDebt = useStore((state) => state.updateDebt);

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState('');
  const [addPrincipal, setAddPrincipal] = useState('');
  const [addMonthlyPayment, setAddMonthlyPayment] = useState('');
  const [addInterestRate, setAddInterestRate] = useState('');
  const [addBankAccountId, setAddBankAccountId] = useState('');

  // Edit modal
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrincipal, setEditPrincipal] = useState('');
  const [editMonthlyPayment, setEditMonthlyPayment] = useState('');
  const [editInterestRate, setEditInterestRate] = useState('');
  const [editBankAccountId, setEditBankAccountId] = useState('');

  // ── Add ──
  const handleAddDebt = () => {
    if (!addName || !addPrincipal || !addMonthlyPayment) return;

    const newDebt: Debt = {
      id: Date.now().toString(),
      name: addName,
      principal: parseFloat(addPrincipal),
      monthlyPayment: parseFloat(addMonthlyPayment),
      minimumPayment: parseFloat(addMonthlyPayment),
      interestRate: addInterestRate ? parseFloat(addInterestRate) / 100 : 0,
      ...(addBankAccountId && { bankAccountId: addBankAccountId }),
    };

    addDebt(newDebt);
    setAddName('');
    setAddPrincipal('');
    setAddMonthlyPayment('');
    setAddInterestRate('');
    setAddBankAccountId('');
    setShowAddModal(false);
  };

  // ── Edit (opens when user taps a card) ──
  const openEdit = (debt: Debt) => {
    setSelectedDebt(debt);
    setEditName(debt.name);
    setEditPrincipal(debt.principal.toString());
    setEditMonthlyPayment(debt.monthlyPayment.toString());
    setEditInterestRate(debt.interestRate ? (debt.interestRate * 100).toString() : '');
    setEditBankAccountId(debt.bankAccountId || '');
  };

  const handleSaveEdit = () => {
    if (!selectedDebt) return;
    updateDebt(selectedDebt.id, {
      name: editName,
      principal: parseFloat(editPrincipal) || selectedDebt.principal,
      monthlyPayment: parseFloat(editMonthlyPayment) || selectedDebt.monthlyPayment,
      minimumPayment: parseFloat(editMonthlyPayment) || selectedDebt.minimumPayment,
      interestRate: editInterestRate ? parseFloat(editInterestRate) / 100 : 0,
      bankAccountId: editBankAccountId || undefined,
    });
    setSelectedDebt(null);
  };

  // ── Normalize old debt records that used different field names ──
  // Old shape: { totalAmount, remainingAmount, lender, interestRate as whole number }
  // New shape: { principal, monthlyPayment, minimumPayment, interestRate as decimal }
  const normalize = (debt: any): Debt => ({
    id: debt.id,
    name: debt.name,
    principal: debt.principal ?? debt.remainingAmount ?? debt.totalAmount ?? 0,
    monthlyPayment: debt.monthlyPayment ?? 0,
    minimumPayment: debt.minimumPayment ?? debt.monthlyPayment ?? 0,
    interestRate: debt.interestRate != null
      ? (debt.interestRate > 1 ? debt.interestRate / 100 : debt.interestRate) // auto-detect whole vs decimal
      : 0,
    bankAccountId: debt.bankAccountId,
  });

  const normalizedDebts = debts.map(normalize);

  const getAccountName = (id?: string) => {
    if (!id) return null;
    return bankAccounts.find((a) => a.id === id)?.name || null;
  };

  const calculateMonthlyTotal = () => normalizedDebts.reduce((sum, d) => sum + d.monthlyPayment, 0);
  const calculateTotalDebt = () => normalizedDebts.reduce((sum, d) => sum + d.principal, 0);
  const unassignedCount = normalizedDebts.filter((d) => !d.bankAccountId).length;




  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>

        {/* Summary */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Debt</Text>
              <Text style={styles.summaryDebt}>${calculateTotalDebt().toLocaleString()}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Monthly Payments</Text>
              <Text style={styles.summaryPayment}>${calculateMonthlyTotal().toLocaleString()}/mo</Text>
            </View>
          </View>
        </View>

        {/* Unassigned warning */}
        {unassignedCount > 0 && (
          <View style={styles.unassignedBanner}>
            <Text style={styles.unassignedBannerText}>
              ⚠️ {unassignedCount} debt{unassignedCount > 1 ? 's' : ''} not assigned to an account. Tap to assign.
            </Text>
          </View>
        )}

        {/* Debts List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Debts</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {debts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No debts tracked</Text>
              <Text style={styles.emptySubtext}>Tap "+ Add" to add your first debt</Text>
            </View>
          ) : (
            normalizedDebts.map((debt) => {
              const accountName = getAccountName(debt.bankAccountId);
              return (
                <TouchableOpacity key={debt.id} style={styles.debtCard} onPress={() => openEdit(debt)}>
                  <View style={styles.debtHeader}>
                    <View style={styles.debtHeaderLeft}>
                      <Text style={styles.debtName}>{debt.name}</Text>
                      {accountName ? (
                        <Text style={styles.debtAccount}>💳 Paid from {accountName}</Text>
                      ) : (
                        <Text style={styles.debtAccountUnset}>Tap to assign account →</Text>
                      )}
                    </View>
                    <TouchableOpacity onPress={() => removeDebt(debt.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Text style={styles.deleteButton}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.debtDetails}>
                    <View style={styles.debtDetail}>
                      <Text style={styles.debtDetailLabel}>Remaining</Text>
                      <Text style={styles.debtDetailValue}>${debt.principal.toLocaleString()}</Text>
                    </View>
                    <View style={styles.debtDetail}>
                      <Text style={styles.debtDetailLabel}>Monthly</Text>
                      <Text style={styles.debtPayment}>${debt.monthlyPayment.toLocaleString()}/mo</Text>
                    </View>
                    <View style={styles.debtDetail}>
                      <Text style={styles.debtDetailLabel}>Rate</Text>
                      <Text style={styles.debtDetailValue}>
                        {debt.interestRate ? (debt.interestRate * 100).toFixed(1) + '%' : '—'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* ── ADD MODAL ── */}
      <Modal visible={showAddModal} animationType="slide" transparent={true} onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Add Debt</Text>

              <Text style={styles.label}>Name</Text>
              <TextInput style={styles.modalInput} placeholder="e.g., Credit Card, Student Loan" placeholderTextColor="#666" value={addName} onChangeText={setAddName} />

              <Text style={styles.label}>Total Amount Owed</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput style={styles.input} placeholder="0" placeholderTextColor="#666" keyboardType="numeric" value={addPrincipal} onChangeText={setAddPrincipal} />
              </View>

              <Text style={styles.label}>Monthly Payment</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput style={styles.input} placeholder="0" placeholderTextColor="#666" keyboardType="numeric" value={addMonthlyPayment} onChangeText={setAddMonthlyPayment} />
                <Text style={styles.period}>/mo</Text>
              </View>

              <Text style={styles.label}>Interest Rate (optional)</Text>
              <View style={styles.inputContainer}>
                <TextInput style={styles.input} placeholder="0" placeholderTextColor="#666" keyboardType="numeric" value={addInterestRate} onChangeText={setAddInterestRate} />
                <Text style={styles.percent}>%</Text>
              </View>

              <AccountPicker bankAccounts={bankAccounts} value={addBankAccountId} onChange={setAddBankAccountId} />

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowAddModal(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalAddButton, (!addName || !addPrincipal || !addMonthlyPayment) && styles.modalAddButtonDisabled]}
                  onPress={handleAddDebt}
                  disabled={!addName || !addPrincipal || !addMonthlyPayment}
                >
                  <Text style={styles.modalAddText}>Add</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── EDIT MODAL (tap a debt card) ── */}
      <Modal visible={selectedDebt !== null} animationType="slide" transparent={true} onRequestClose={() => setSelectedDebt(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Edit Debt</Text>

              <Text style={styles.label}>Name</Text>
              <TextInput style={styles.modalInput} placeholder="Debt name" placeholderTextColor="#666" value={editName} onChangeText={setEditName} />

              <Text style={styles.label}>Total Amount Owed</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput style={styles.input} placeholder="0" placeholderTextColor="#666" keyboardType="numeric" value={editPrincipal} onChangeText={setEditPrincipal} />
              </View>

              <Text style={styles.label}>Monthly Payment</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput style={styles.input} placeholder="0" placeholderTextColor="#666" keyboardType="numeric" value={editMonthlyPayment} onChangeText={setEditMonthlyPayment} />
                <Text style={styles.period}>/mo</Text>
              </View>

              <Text style={styles.label}>Interest Rate (optional)</Text>
              <View style={styles.inputContainer}>
                <TextInput style={styles.input} placeholder="0" placeholderTextColor="#666" keyboardType="numeric" value={editInterestRate} onChangeText={setEditInterestRate} />
                <Text style={styles.percent}>%</Text>
              </View>

              <AccountPicker bankAccounts={bankAccounts} value={editBankAccountId} onChange={setEditBankAccountId} />

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalCancelButton} onPress={() => setSelectedDebt(null)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSaveButton} onPress={handleSaveEdit}>
                  <Text style={styles.modalSaveText}>Save</Text>
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
  container: { flex: 1, backgroundColor: '#0a0e1a' },
  scrollView: { flex: 1, padding: 20 },

  // Summary
  summaryBox: { backgroundColor: '#1a1f2e', padding: 20, borderRadius: 12, marginBottom: 12, borderWidth: 2, borderColor: '#ff6b6b' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryItem: { flex: 1 },
  summaryLabel: { fontSize: 14, color: '#a0a0a0', marginBottom: 4 },
  summaryDebt: { fontSize: 24, fontWeight: 'bold', color: '#ffffff' },
  summaryPayment: { fontSize: 24, fontWeight: 'bold', color: '#ff6b6b' },

  // Unassigned banner
  unassignedBanner: { backgroundColor: '#2a1a1e', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#ff6b6b44' },
  unassignedBannerText: { fontSize: 14, color: '#ff9f43', textAlign: 'center' },

  // List
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  addButton: { backgroundColor: '#ff6b6b', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  addButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#666', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#444', textAlign: 'center' },

  // Debt card (tappable)
  debtCard: { backgroundColor: '#1a1f2e', padding: 16, borderRadius: 12, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#ff6b6b' },
  debtHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  debtHeaderLeft: { flex: 1, marginRight: 12 },
  debtName: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', marginBottom: 4 },
  debtAccount: { fontSize: 13, color: '#4ade80' },
  debtAccountUnset: { fontSize: 13, color: '#ff9f43', fontStyle: 'italic' },
  deleteButton: { fontSize: 20, color: '#ff4444', padding: 4 },
  debtDetails: { flexDirection: 'row', justifyContent: 'space-between' },
  debtDetail: { flex: 1 },
  debtDetailLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  debtDetailValue: { fontSize: 14, color: '#ffffff', fontWeight: '600' },
  debtPayment: { fontSize: 14, color: '#ff6b6b', fontWeight: 'bold' },

  // Modal shared
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#0a0e1a', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#ff6b6b', marginBottom: 20 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#ffffff', marginBottom: 8, marginTop: 12 },
  modalInput: { backgroundColor: '#1a1f2e', borderRadius: 12, padding: 16, fontSize: 16, color: '#ffffff', borderWidth: 2, borderColor: '#2a2f3e' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1f2e', borderRadius: 12, paddingHorizontal: 16, borderWidth: 2, borderColor: '#2a2f3e' },
  currencySymbol: { fontSize: 20, color: '#ff6b6b', marginRight: 8 },
  input: { flex: 1, fontSize: 20, color: '#ffffff', paddingVertical: 16 },
  period: { fontSize: 14, color: '#666', marginLeft: 8 },
  percent: { fontSize: 16, color: '#666', marginLeft: 8 },

  // Account picker
  noAccountsText: { fontSize: 14, color: '#ff6b6b', padding: 12, backgroundColor: '#2a1a1e', borderRadius: 8, marginTop: 4 },
  accountsList: { gap: 8, marginTop: 4 },
  accountOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 10, borderWidth: 2, borderColor: '#2a2f3e', backgroundColor: '#1a1f2e' },
  accountOptionSelected: { borderColor: '#4ade80', backgroundColor: '#1a2f1e' },
  accountOptionText: { fontSize: 15, color: '#ffffff', marginBottom: 2 },
  accountOptionTextSelected: { color: '#4ade80', fontWeight: 'bold' },
  accountOptionSub: { fontSize: 12, color: '#666' },
  accountOptionCheck: { fontSize: 18, color: '#4ade80', fontWeight: 'bold' },

  // Modal buttons
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 20 },
  modalCancelButton: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 2, borderColor: '#2a2f3e', alignItems: 'center' },
  modalCancelText: { color: '#a0a0a0', fontSize: 16 },
  modalAddButton: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#ff6b6b', alignItems: 'center' },
  modalAddButtonDisabled: { opacity: 0.5 },
  modalAddText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  modalSaveButton: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#4ade80', alignItems: 'center' },
  modalSaveText: { color: '#0a0e1a', fontSize: 16, fontWeight: 'bold' },
});
