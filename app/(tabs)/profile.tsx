// app/(tabs)/profile.tsx
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useState } from 'react';
import { useStore, useFreedomScore } from '../../src/store/useStore';
import { WalletConnect } from '../../src/components/WalletConnect';
import type { BankAccount } from '../../src/types';

export default function ProfileScreen() {
  const income            = useStore((state) => state.income);
  const avatarType        = useStore((state) => state.settings.avatarType);
  const assets            = useStore((state) => state.assets);
  const obligations       = useStore((state) => state.obligations);
  const bankAccounts      = useStore((state) => state.bankAccounts);
  const addBankAccount    = useStore((state) => state.addBankAccount);
  const removeBankAccount = useStore((state) => state.removeBankAccount);
  const updateBankAccount = useStore((state) => state.updateBankAccount);
  const exportBackup      = useStore((state) => state.exportBackup);
  const importBackup      = useStore((state) => state.importBackup);
  const resetStore        = useStore((state) => state.resetStore);

  const freedom = useFreedomScore();

  // ── Add-account modal state ──────────────────────────────────────────────
  const [showAddModal, setShowAddModal]   = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [backupJson, setBackupJson]       = useState('');
  const [importJson, setImportJson]       = useState('');
  const [accountName, setAccountName]   = useState('');
  const [institution, setInstitution]   = useState('');
  const [accountType, setAccountType]   = useState<'checking' | 'savings' | 'investment'>('checking');
  const [currentBalance, setCurrentBalance] = useState('');
  const [isPrimary, setIsPrimary]       = useState(false);

  // ── Confirmation state (for delete) ──────────────────────────────────────
  const [deleteId, setDeleteId]         = useState<string | null>(null);

  const handleAddAccount = () => {
    if (!accountName || !currentBalance) return;

    // If marking as primary, clear the flag on everyone else first
    if (isPrimary) {
      bankAccounts.forEach((acct) => {
        if (acct.isPrimaryIncome) updateBankAccount(acct.id, { isPrimaryIncome: false });
      });
    }

    const newAccount: BankAccount = {
      id: Date.now().toString(),
      name: accountName,
      institution: institution || 'Unknown',
      type: accountType,
      currentBalance: isNaN(parseFloat(currentBalance)) ? 0 : parseFloat(currentBalance),
      isPrimaryIncome: isPrimary || bankAccounts.length === 0,
    };

    addBankAccount(newAccount);
    resetForm();
  };

  const resetForm = () => {
    setAccountName('');
    setInstitution('');
    setAccountType('checking');
    setCurrentBalance('');
    setIsPrimary(false);
    setShowAddModal(false);
  };

  const handleSetPrimary = (id: string) => {
    const acct = bankAccounts.find((a) => a.id === id);
    if (acct?.isPrimaryIncome) return; // already primary, nothing to do
    bankAccounts.forEach((a) => {
      if (a.isPrimaryIncome) updateBankAccount(a.id, { isPrimaryIncome: false });
    });
    updateBankAccount(id, { isPrimaryIncome: true });
  };

  const totalBalance = bankAccounts.reduce((sum, a) => sum + (a.currentBalance ?? 0), 0);

  const handleResetOnboarding = () => {
    if (confirm('Are you sure? This will clear all your data.')) {
      resetStore();
    }
  };

  const handleExportBackup = () => {
    const json = exportBackup();
    setBackupJson(json);
    setShowBackupModal(true);
  };

  const handleImportBackup = () => {
    try {
      importBackup(importJson);
      alert('Backup imported successfully!');
      setImportJson('');
      setShowImportModal(false);
    } catch (error) {
      alert('Failed to import backup: ' + (error as Error).message);
    }
  };

  const handleCopyBackup = async () => {
    // For web: navigator.clipboard
    // For RN: use @react-native-clipboard/clipboard
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(backupJson);
      alert('Backup copied to clipboard!');
    }
  };

  const handleDownloadBackup = () => {
    // For web: create download link
    if (typeof document !== 'undefined') {
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kingme-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const typeIcon = { checking: '🏦', savings: '💰', investment: '📈' };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Profile</Text>

        {/* ── Wallet ── */}
        <View style={styles.section}>
          <WalletConnect />
        </View>

        {/* ── Bank Accounts ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bank Accounts</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {bankAccounts.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.emptyText}>No accounts added yet.</Text>
              <Text style={styles.emptySubtext}>Tap "+ Add" to connect your first bank account.</Text>
            </View>
          ) : (
            <>
              {bankAccounts.map((acct) => (
                <View key={acct.id} style={styles.accountCard}>
                  <View style={styles.accountRow}>
                    <View style={styles.accountLeft}>
                      <Text style={styles.accountIcon}>{typeIcon[acct.type]}</Text>
                      <View>
                        <Text style={styles.accountName}>{acct.name}</Text>
                        <Text style={styles.accountInstitution}>
                          {acct.institution} · {acct.type.charAt(0).toUpperCase() + acct.type.slice(1)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.accountRight}>
                      <Text style={styles.accountBalance}>${(acct.currentBalance ?? 0).toLocaleString()}</Text>
                      <TouchableOpacity onPress={() => setDeleteId(acct.id)}>
                        <Text style={styles.deleteButton}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Primary toggle */}
                  <TouchableOpacity
                    style={styles.primaryRow}
                    onPress={() => handleSetPrimary(acct.id)}
                  >
                    <Text style={[styles.primaryDot, acct.isPrimaryIncome && styles.primaryDotActive]}>
                      {acct.isPrimaryIncome ? '●' : '○'}
                    </Text>
                    <Text style={[styles.primaryLabel, acct.isPrimaryIncome && styles.primaryLabelActive]}>
                      {acct.isPrimaryIncome ? 'Primary (Paycheck)' : 'Set as primary'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* Total */}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Balance</Text>
                <Text style={styles.totalValue}>${totalBalance.toLocaleString()}</Text>
              </View>
            </>
          )}
        </View>

        {/* ── Income ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Income</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Annual Salary</Text>
              <Text style={styles.value}>${income.salary.toLocaleString()}</Text>
            </View>
            {income.otherIncome > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>Other Income</Text>
                <Text style={styles.value}>${income.otherIncome.toLocaleString()}</Text>
              </View>
            )}
            <View style={styles.row}>
              <Text style={styles.label}>Asset Income (Annual)</Text>
              <Text style={styles.valueGreen}>${(freedom.dailyAssetIncome * 365).toLocaleString()}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.labelBold}>Total Annual Income</Text>
              <Text style={styles.valueBold}>
                ${(income.salary + income.otherIncome + (freedom.dailyAssetIncome * 365)).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Freedom Stats ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Freedom Stats</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Freedom Days</Text>
              <Text style={styles.valueBold}>{freedom.formatted}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Current State</Text>
              <Text style={styles.value}>{freedom.state}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Total Assets</Text>
              <Text style={styles.value}>{assets.length}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Total Obligations</Text>
              <Text style={styles.value}>{obligations.length}</Text>
            </View>
          </View>
        </View>

        {/* ── Settings ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Avatar</Text>
              <Text style={styles.value}>
                {avatarType === 'male-medium' ? 'Male' : 'Female'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Backup & Restore ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Backup & Restore</Text>
          <Text style={styles.sectionSubtext}>
            Export your data to keep it safe. You can reimport it anytime.
          </Text>
          
          <TouchableOpacity style={styles.backupButton} onPress={handleExportBackup}>
            <Text style={styles.backupButtonText}>📥 Export Backup</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.restoreButton} onPress={() => setShowImportModal(true)}>
            <Text style={styles.restoreButtonText}>📤 Import Backup</Text>
          </TouchableOpacity>
        </View>

        {/* ── Danger Zone ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <TouchableOpacity style={styles.dangerButton} onPress={handleResetOnboarding}>
            <Text style={styles.dangerButtonText}>Reset All Data</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ═══════════════ ADD ACCOUNT MODAL ═══════════════ */}
      <Modal visible={showAddModal} animationType="slide" transparent={true} onRequestClose={resetForm}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Add Bank Account</Text>

              <Text style={styles.modalLabel}>Account Nickname</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., Chase Checking, Ally Savings"
                placeholderTextColor="#666"
                value={accountName}
                onChangeText={setAccountName}
              />

              <Text style={styles.modalLabel}>Bank / Institution</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., Chase, Bank of America"
                placeholderTextColor="#666"
                value={institution}
                onChangeText={setInstitution}
              />

              <Text style={styles.modalLabel}>Account Type</Text>
              <View style={styles.typeButtons}>
                {(['checking', 'savings', 'investment'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeButton, accountType === t && styles.typeButtonActive]}
                    onPress={() => setAccountType(t)}
                  >
                    <Text style={[styles.typeButtonText, accountType === t && styles.typeButtonTextActive]}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalLabel}>Current Balance</Text>
              <View style={styles.inputRow}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.inputRowField}
                  placeholder="0"
                  placeholderTextColor="#666"
                  keyboardType="decimal-pad"
                  value={currentBalance}
                  onChangeText={(text) => {
                    // Allow: optional leading minus, digits, one decimal point
                    const cleaned = text.replace(/[^0-9.\-]/g, '');
                    // Only one minus, only at the start
                    const parts = cleaned.split('-');
                    const safe = parts.length > 2
                      ? '-' + parts.slice(1).join('')
                      : cleaned;
                    setCurrentBalance(safe);
                  }}
                />
              </View>

              <TouchableOpacity style={styles.checkboxRow} onPress={() => setIsPrimary(!isPrimary)}>
                <View style={[styles.checkbox, isPrimary && styles.checkboxChecked]}>
                  {isPrimary && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>This is where I get my paycheck</Text>
              </TouchableOpacity>

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalCancelButton} onPress={resetForm}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalAddButton, (!accountName || !currentBalance) && styles.modalAddButtonDisabled]}
                  onPress={handleAddAccount}
                  disabled={!accountName || !currentBalance}
                >
                  <Text style={styles.modalAddText}>Add</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═══════════════ DELETE CONFIRM MODAL ═══════════════ */}
      <Modal visible={deleteId !== null} animationType="fade" transparent={true} onRequestClose={() => setDeleteId(null)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Delete Account?</Text>
            <Text style={styles.confirmBody}>
              This will remove the account. Income sources or obligations linked to it will lose their account reference.
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity style={styles.confirmCancel} onPress={() => setDeleteId(null)}>
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDelete}
                onPress={() => { if (deleteId) removeBankAccount(deleteId); setDeleteId(null); }}
              >
                <Text style={styles.confirmDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══════════════ BACKUP MODAL ═══════════════ */}
      <Modal visible={showBackupModal} animationType="slide" transparent={true} onRequestClose={() => setShowBackupModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Export Backup</Text>
              <Text style={styles.modalSubtext}>
                Your complete profile data. Keep this safe!
              </Text>

              <TextInput
                style={[styles.modalInput, { height: 200, fontFamily: 'monospace', fontSize: 11 }]}
                multiline
                value={backupJson}
                editable={false}
                selectTextOnFocus
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalButton} onPress={handleCopyBackup}>
                  <Text style={styles.modalButtonText}>📋 Copy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalButton} onPress={handleDownloadBackup}>
                  <Text style={styles.modalButtonText}>💾 Download</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowBackupModal(false)}>
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═══════════════ IMPORT MODAL ═══════════════ */}
      <Modal visible={showImportModal} animationType="slide" transparent={true} onRequestClose={() => setShowImportModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Import Backup</Text>
              <Text style={styles.modalSubtext}>
                Paste your backup JSON here. This will replace all current data!
              </Text>

              <TextInput
                style={[styles.modalInput, { height: 200, fontFamily: 'monospace', fontSize: 11 }]}
                multiline
                placeholder="Paste backup JSON..."
                placeholderTextColor="#666"
                value={importJson}
                onChangeText={setImportJson}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalCancelButton} onPress={() => { setImportJson(''); setShowImportModal(false); }}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, !importJson && styles.modalButtonDisabled]} 
                  onPress={handleImportBackup}
                  disabled={!importJson}
                >
                  <Text style={styles.modalButtonText}>Import</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e1a' },
  content: { padding: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#f4c430', marginBottom: 30 },

  // ── Section ──
  section: { marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },

  // ── Add button ──
  addButton: { backgroundColor: '#4ade80', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  addButtonText: { color: '#0a0e1a', fontWeight: 'bold', fontSize: 14 },

  // ── Generic card / rows ──
  card: { backgroundColor: '#1a1f2e', padding: 16, borderRadius: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  label: { fontSize: 16, color: '#a0a0a0' },
  labelBold: { fontSize: 16, color: '#ffffff', fontWeight: 'bold' },
  value: { fontSize: 16, color: '#ffffff' },
  valueGreen: { fontSize: 16, color: '#4ade80', fontWeight: '600' },
  valueBold: { fontSize: 16, color: '#f4c430', fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#2a2f3e', marginVertical: 8 },

  // ── Bank account cards ──
  accountCard: {
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#60a5fa',
  },
  accountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  accountLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  accountIcon: { fontSize: 24 },
  accountName: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },
  accountInstitution: { fontSize: 13, color: '#666', marginTop: 2 },
  accountRight: { alignItems: 'flex-end', gap: 4 },
  accountBalance: { fontSize: 18, fontWeight: 'bold', color: '#4ade80' },
  deleteButton: { fontSize: 18, color: '#ff4444', paddingHorizontal: 4 },

  // Primary toggle
  primaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#2a2f3e' },
  primaryDot: { fontSize: 14, color: '#666' },
  primaryDotActive: { color: '#4ade80' },
  primaryLabel: { fontSize: 13, color: '#666' },
  primaryLabelActive: { color: '#4ade80', fontWeight: '600' },

  // Total row
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2a2f3e' },
  totalLabel: { fontSize: 14, color: '#a0a0a0' },
  totalValue: { fontSize: 20, fontWeight: 'bold', color: '#4ade80' },

  // Empty
  emptyText: { fontSize: 15, color: '#666', marginBottom: 4 },
  emptySubtext: { fontSize: 13, color: '#444' },

  // ── Backup & Restore ──
  sectionSubtext: { fontSize: 13, color: '#666', marginBottom: 12, lineHeight: 18 },
  backupButton: { backgroundColor: '#4ade80', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  backupButtonText: { color: '#0a0e1a', fontWeight: 'bold', fontSize: 16 },
  restoreButton: { backgroundColor: '#60a5fa', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  restoreButtonText: { color: '#0a0e1a', fontWeight: 'bold', fontSize: 16 },

  // ── Danger ──
  dangerButton: { backgroundColor: '#ff4444', padding: 16, borderRadius: 12, alignItems: 'center' },
  dangerButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },

  // ════════ ADD MODAL ════════
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#0a0e1a', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#4ade80', marginBottom: 20 },
  modalLabel: { fontSize: 16, fontWeight: 'bold', color: '#ffffff', marginBottom: 8, marginTop: 14 },
  modalInput: {
    backgroundColor: '#1a1f2e', borderRadius: 12, padding: 16,
    fontSize: 16, color: '#ffffff', borderWidth: 2, borderColor: '#2a2f3e',
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a1f2e', borderRadius: 12, paddingHorizontal: 16,
    borderWidth: 2, borderColor: '#2a2f3e',
  },
  currencySymbol: { fontSize: 20, color: '#4ade80', marginRight: 8 },
  inputRowField: { flex: 1, fontSize: 20, color: '#ffffff', paddingVertical: 16 },

  typeButtons: { flexDirection: 'row', gap: 8 },
  typeButton: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 2, borderColor: '#2a2f3e', alignItems: 'center' },
  typeButtonActive: { borderColor: '#4ade80', backgroundColor: '#1a2f1e' },
  typeButtonText: { fontSize: 14, color: '#666' },
  typeButtonTextActive: { color: '#4ade80', fontWeight: 'bold' },

  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#2a2f3e', marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#4ade80', borderColor: '#4ade80' },
  checkmark: { color: '#0a0e1a', fontSize: 16, fontWeight: 'bold' },
  checkboxLabel: { fontSize: 14, color: '#a0a0a0' },

  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 20 },
  modalCancelButton: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 2, borderColor: '#2a2f3e', alignItems: 'center' },
  modalCancelText: { color: '#a0a0a0', fontSize: 16 },
  modalAddButton: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#4ade80', alignItems: 'center' },
  modalAddButtonDisabled: { opacity: 0.5 },
  modalAddText: { color: '#0a0e1a', fontSize: 16, fontWeight: 'bold' },

  // ════════ BACKUP MODALS ════════
  modalSubtext: { fontSize: 14, color: '#a0a0a0', marginBottom: 16, lineHeight: 20 },
  modalButton: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#4ade80', alignItems: 'center' },
  modalButtonDisabled: { opacity: 0.5 },
  modalButtonText: { color: '#0a0e1a', fontSize: 16, fontWeight: 'bold' },
  modalCloseButton: { padding: 16, borderRadius: 12, borderWidth: 2, borderColor: '#2a2f3e', alignItems: 'center', marginTop: 12 },
  modalCloseText: { color: '#a0a0a0', fontSize: 16 },

  // ════════ DELETE CONFIRM ════════
  confirmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 40 },
  confirmBox: { backgroundColor: '#1a1f2e', borderRadius: 16, padding: 24, width: '100%' },
  confirmTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff', marginBottom: 10 },
  confirmBody: { fontSize: 14, color: '#a0a0a0', lineHeight: 20, marginBottom: 20 },
  confirmButtons: { flexDirection: 'row', gap: 12 },
  confirmCancel: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 2, borderColor: '#2a2f3e', alignItems: 'center' },
  confirmCancelText: { color: '#a0a0a0', fontSize: 16 },
  confirmDelete: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#ff4444', alignItems: 'center' },
  confirmDeleteText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});
