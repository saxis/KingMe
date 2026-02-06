// app/(tabs)/assets.tsx
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { useStore } from '../../src/store/useStore';
import { analyzeAllAccounts } from '../../src/services/cashflow';
import { fetchSKRHolding, calcSKRIncome } from '../../src/services/skr';
import type { Asset, BankAccount } from '../../src/types';
import type { SKRHolding, SKRIncomeSnapshot } from '../../src/services/skr';

// Default APY assumptions per account type (user can override when adding)
const DEFAULT_APY = {
  checking: 0.5,   // 0.5%
  savings: 4.5,    // 4.5% high-yield
  investment: 0,   // varies
};

/**
 * Synthesize bank accounts into Asset objects so they render
 * alongside manually added assets. Income = balance * APY.
 */
function bankAccountsAsAssets(accounts: BankAccount[]): Asset[] {
  return accounts.map((account) => {
    const apy = DEFAULT_APY[account.type];
    const balance = typeof account.currentBalance === 'number' && !isNaN(account.currentBalance)
      ? account.currentBalance
      : 0;
    return {
      id: `bank_${account.id}`,
      type: 'bank_account' as const,
      name: account.name,
      value: balance,
      annualIncome: balance * (apy / 100),
      metadata: {
        type: 'bank_account' as const,
        accountType: account.type,
        institution: account.institution,
        apy,
      },
    };
  });
}

export default function AssetsScreen() {
  const assets = useStore((state) => state.assets);
  const bankAccounts = useStore((state) => state.bankAccounts);
  const incomeSources = useStore((state) => state.income.sources || []);
  const obligations = useStore((state) => state.obligations);
  const debts = useStore((state) => state.debts);
  const paycheckDeductions = useStore((state) => state.paycheckDeductions || []);
  const addAsset = useStore((state) => state.addAsset);
  const removeAsset = useStore((state) => state.removeAsset);
  const updateAsset = useStore((state) => state.updateAsset);

  const [showAddModal, setShowAddModal] = useState(false);
  const [cashFlowExpanded, setCashFlowExpanded] = useState(true);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  // ── SKR auto-detected holding ───────────────────────────────────────────
  const wallets = useStore((state) => state.wallets);
  const [skrHolding, setSkrHolding]   = useState<SKRHolding | null>(null);
  const [skrIncome, setSKRIncome]     = useState<SKRIncomeSnapshot | null>(null);
  const [skrLoading, setSkrLoading]   = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setSkrLoading(true);
      // Try each connected wallet; use the first one that has SKR.
      // In dev / hackathon demo, fall back to mock if no wallets connected.
      let holding: SKRHolding | null = null;
      if (wallets.length > 0) {
        for (const addr of wallets) {
          holding = await fetchSKRHolding(addr);
          if (holding) break;
        }
      }

      if (!cancelled) {
        setSkrHolding(holding);
        setSKRIncome(holding ? calcSKRIncome(holding) : null);
        setSkrLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [wallets]);

  // Generic asset form state
  const [name, setName] = useState('');
  const [type, setType] = useState<Asset['type']>('crypto');
  const [value, setValue] = useState('');
  const [apy, setApy] = useState('');
  const [annualIncome, setAnnualIncome] = useState('');

  // Retirement-specific form state
  const [retAccountType, setRetAccountType] = useState<'401k' | 'roth_401k' | 'ira' | 'roth_ira'>('401k');
  const [retInstitution, setRetInstitution] = useState('');
  const [retBalance, setRetBalance] = useState('');
  const [retContribution, setRetContribution] = useState('');
  const [retFrequency, setRetFrequency] = useState<'weekly' | 'biweekly' | 'twice_monthly' | 'monthly'>('biweekly');
  const [retMatchPercent, setRetMatchPercent] = useState('');

  // Derived: monthly contribution for display
  const retMonthly = (() => {
    const amt = parseFloat(retContribution) || 0;
    if (retFrequency === 'weekly') return amt * 4.33;
    if (retFrequency === 'biweekly') return amt * 2.17;
    if (retFrequency === 'twice_monthly') return amt * 2;
    return amt; // monthly
  })();

  // Cash flow data
  const cashFlow = analyzeAllAccounts(bankAccounts, incomeSources, obligations, debts, assets, paycheckDeductions);

  // Merge: bank account assets + manually added assets
  const bankAssets = bankAccountsAsAssets(bankAccounts);
  const allAssets = [...bankAssets, ...assets];

  const resetForm = () => {
    setName('');
    setType('crypto');
    setValue('');
    setApy('');
    setAnnualIncome('');
    setRetAccountType('401k');
    setRetInstitution('');
    setRetBalance('');
    setRetContribution('');
    setRetFrequency('biweekly');
    setRetMatchPercent('');
    setEditingAsset(null);
    setShowAddModal(false);
  };

  const handleAddAsset = () => {
    // ── Retirement path ──────────────────────────────────────────────────
    if (type === 'retirement') {
      if (!retInstitution || !retBalance) return;

      // Employer match in $/mo — approximate from income sources
      const totalMonthlySalary = incomeSources.reduce((sum, s) => {
        if (s.frequency === 'biweekly') return sum + s.amount * 2.17;
        if (s.frequency === 'weekly') return sum + s.amount * 4.33;
        if (s.frequency === 'twice_monthly') return sum + s.amount * 2;
        return sum + s.amount;
      }, 0);
      const matchPct = parseFloat(retMatchPercent) || 0;
      const employerMatchDollars = matchPct > 0 ? totalMonthlySalary * (matchPct / 100) : 0;

      const newAsset: Asset = {
        id: 'ret_' + Date.now().toString(),
        type: 'retirement',
        name: `${retAccountType === '401k' ? '401(k)' : retAccountType === 'roth_401k' ? 'Roth 401(k)' : retAccountType === 'ira' ? 'IRA' : 'Roth IRA'} — ${retInstitution}`,
        value: parseFloat(retBalance),
        annualIncome: 0, // retirement accounts don't generate spendable income yet
        metadata: {
          type: 'retirement',
          accountType: retAccountType,
          institution: retInstitution,
          contributionAmount: parseFloat(retContribution) || 0,
          contributionFrequency: retFrequency,
          employerMatchPercent: matchPct || undefined,
          employerMatchDollars: employerMatchDollars || undefined,
        },
      };

      addAsset(newAsset);
      resetForm();
      return;
    }

    // ── Generic asset path ────────────────────────────────────────────────
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
    resetForm();
  };

  // Delete asset (plain — retirement assets have no linked obligation)
  const handleRemoveAsset = (asset: Asset) => {
    removeAsset(asset.id);
  };

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    
    // Pre-fill form based on asset type
    if (asset.type === 'retirement' && asset.metadata.type === 'retirement') {
      setType('retirement');
      setRetAccountType(asset.metadata.accountType);
      setRetInstitution(asset.metadata.institution || '');
      setRetBalance(asset.value.toString());
      setRetContribution(asset.metadata.contributionAmount?.toString() || '0');
      setRetFrequency(asset.metadata.contributionFrequency || 'biweekly');
      setRetMatchPercent(asset.metadata.employerMatchPercent?.toString() || '0');
    } else {
      setType(asset.type);
      setName(asset.name);
      setValue(asset.value.toString());
      setApy(asset.metadata.apy?.toString() || '');
      setAnnualIncome(asset.annualIncome.toString());
    }
    
    setShowAddModal(true);
  };

  const handleSaveEdit = () => {
    if (!editingAsset) return;

    let updatedAsset: Partial<Asset> = {};

    if (type === 'retirement') {
      if (!retInstitution || !retBalance) return;
      
      const balance = parseFloat(retBalance.replace(/,/g, '')) || 0;
      const contribution = parseFloat(retContribution.replace(/,/g, '')) || 0;
      const matchPercent = parseFloat(retMatchPercent.replace(/,/g, '')) || 0;

      // Recalculate employer match dollars per month
      const totalMonthlySalary = incomeSources.reduce((sum, s) => {
        if (s.frequency === 'biweekly') return sum + s.amount * 2.17;
        if (s.frequency === 'weekly') return sum + s.amount * 4.33;
        if (s.frequency === 'twice_monthly') return sum + s.amount * 2;
        return sum + s.amount;
      }, 0);

      const employerMatchDollars = (matchPercent / 100) * totalMonthlySalary;

      updatedAsset = {
        value: balance,
        metadata: {
          ...editingAsset.metadata,
          type: 'retirement' as const,
          accountType: retAccountType,
          institution: retInstitution,
          contributionAmount: contribution,
          contributionFrequency: retFrequency,
          employerMatchPercent: matchPercent,
          employerMatchDollars,
        },
      };
    } else {
      if (!name || !value) return;
      
      const assetValue = parseFloat(value.replace(/,/g, '')) || 0;
      const assetApy = parseFloat(apy) || 0;
      const income = annualIncome ? parseFloat(annualIncome) : (assetValue * assetApy) / 100;

      updatedAsset = {
        name,
        value: assetValue,
        annualIncome: income,
        metadata: {
          ...editingAsset.metadata,
          apy: assetApy,
        },
      };
    }

    updateAsset(editingAsset.id, updatedAsset);
    resetForm();
  };

  const calculateTotalValue = () => allAssets.reduce((sum, a) => sum + a.value, 0);
  const calculateTotalIncome = () => allAssets.reduce((sum, a) => sum + a.annualIncome, 0);

  const getTypeLabel = (type: Asset['type']) => {
    const labels: Record<string, string> = {
      crypto: '₿ Crypto',
      stocks: '📈 Stocks',
      real_estate: '🏠 Real Estate',
      business: '💼 Business',
      bank_account: '🏦 Bank Account',
      retirement: '🏛️ Retirement',
      defi: '⛓ DeFi',
      other: '💰 Other',
    };
    return labels[type] || '💰 Other';
  };

  // Color for health badge
  const healthColor = {
    critical: '#ff4444',
    struggling: '#ff9f43',
    stable: '#f4c430',
    building: '#4ade80',
    thriving: '#4ade80',
  };

  const healthIcon = {
    critical: '🔴',
    struggling: '🟠',
    stable: '🟡',
    building: '🟢',
    thriving: '🟢',
  };

  const accountStatusColor = {
    deficit: '#ff4444',
    tight: '#ff9f43',
    healthy: '#4ade80',
  };

  const accountStatusLabel = {
    deficit: 'Deficit',
    tight: 'Tight',
    healthy: 'Healthy',
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>

        {/* ── Cash Flow Summary (collapsible) ── */}
        <TouchableOpacity
          style={styles.cashFlowToggle}
          onPress={() => setCashFlowExpanded(!cashFlowExpanded)}
        >
          <View style={styles.cashFlowToggleLeft}>
            <Text style={styles.cashFlowToggleIcon}>{healthIcon[cashFlow.healthStatus]}</Text>
            <Text style={[styles.cashFlowToggleLabel, { color: healthColor[cashFlow.healthStatus] }]}>
              Cash Flow: {cashFlow.healthStatus.charAt(0).toUpperCase() + cashFlow.healthStatus.slice(1)}
            </Text>
          </View>
          <Text style={styles.cashFlowToggleChevron}>{cashFlowExpanded ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {cashFlowExpanded && (
          <View style={styles.cashFlowPanel}>
            <Text style={styles.cashFlowMessage}>{cashFlow.healthMessage}</Text>

            {/* In / Out / Net row */}
            <View style={styles.numbersRow}>
              <View style={styles.numberCard}>
                <Text style={styles.numberLabel}>Monthly In</Text>
                <Text style={[styles.numberValue, { color: '#4ade80' }]}>
                  ${cashFlow.totalMonthlyIncome.toLocaleString()}
                </Text>
              </View>
              <View style={styles.numberCard}>
                <Text style={styles.numberLabel}>Monthly Out</Text>
                <Text style={[styles.numberValue, { color: '#ff6b6b' }]}>
                  ${(cashFlow.totalMonthlyObligations + cashFlow.totalMonthlyDebtPayments).toLocaleString()}
                </Text>
              </View>
              <View style={styles.numberCard}>
                <Text style={styles.numberLabel}>Net</Text>
                <Text style={[styles.numberValue, { color: cashFlow.totalMonthlyNet >= 0 ? '#4ade80' : '#ff4444' }]}>
                  {cashFlow.totalMonthlyNet >= 0 ? '+' : ''}${cashFlow.totalMonthlyNet.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Pre-tax retirement row (only shown when contributions exist) */}
            {cashFlow.totalPreTaxDeductions > 0 && (
              <View style={styles.pretaxRow}>
                <View style={styles.pretaxItem}>
                  <Text style={styles.pretaxLabel}>401k / IRA</Text>
                  <Text style={styles.pretaxValue}>-${cashFlow.totalPreTaxDeductions.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo</Text>
                </View>
                <Text style={styles.pretaxSep}>·</Text>
                <View style={styles.pretaxItem}>
                  <Text style={styles.pretaxLabel}>Employer Match</Text>
                  <Text style={[styles.pretaxValue, { color: '#4ade80' }]}>+${cashFlow.totalEmployerMatch.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo</Text>
                </View>
                <Text style={styles.pretaxSep}>·</Text>
                <View style={styles.pretaxItem}>
                  <Text style={styles.pretaxLabel}>Net to 401k</Text>
                  <Text style={[styles.pretaxValue, { color: '#c084fc' }]}>
                    ${(cashFlow.totalPreTaxDeductions + cashFlow.totalEmployerMatch).toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo
                  </Text>
                </View>
              </View>
            )}

            {/* Per-account mini cards */}
            {cashFlow.accounts.map((analysis) => (
              <View key={analysis.account.id} style={styles.accountMiniCard}>
                <View style={styles.accountMiniHeader}>
                  <Text style={styles.accountMiniName}>{analysis.account.name}</Text>
                  <View style={[styles.statusPill, { borderColor: accountStatusColor[analysis.status], backgroundColor: accountStatusColor[analysis.status] + '22' }]}>
                    <Text style={[styles.statusPillText, { color: accountStatusColor[analysis.status] }]}>
                      {accountStatusLabel[analysis.status]}
                    </Text>
                  </View>
                </View>

                <View style={styles.accountMiniRow}>
                  <Text style={styles.accountMiniBalance}>${(analysis.currentBalance ?? 0).toLocaleString()}</Text>
                  <Text style={[styles.accountMiniNet, { color: (analysis.monthlyNet ?? 0) >= 0 ? '#4ade80' : '#ff4444' }]}>
                    {(analysis.monthlyNet ?? 0) >= 0 ? '+' : ''}${(analysis.monthlyNet ?? 0).toLocaleString()}/mo
                  </Text>
                </View>

                {/* Runway bar */}
                {analysis.monthlyObligations > 0 && (
                  <View style={styles.runwayRow}>
                    <View style={styles.runwayBarBg}>
                      <View style={[
                        styles.runwayBarFill,
                        {
                          width: `${Math.min(Math.max((analysis.daysOfRunway / 90) * 100, 0), 100)}%`,
                          backgroundColor: analysis.daysOfRunway >= 90 ? '#4ade80' : analysis.daysOfRunway >= 30 ? '#ff9f43' : '#ff4444',
                        }
                      ]} />
                    </View>
                    <Text style={styles.runwayText}>
                      {analysis.daysOfRunway === Infinity ? '∞' : Math.max(analysis.daysOfRunway, 0)}d runway
                    </Text>
                  </View>
                )}
              </View>
            ))}

            {/* Recommendations */}
            {cashFlow.recommendations.length > 0 && (
              <View style={styles.recommendationsBox}>
                {cashFlow.recommendations.map((rec, i) => (
                  <Text key={i} style={styles.recommendationText}>💡 {rec}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── Portfolio Summary ── */}
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

        {/* ── Asset List ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Assets</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {/* ── SKR Auto-Detected Card ── */}
          {skrHolding && skrIncome && (
            <View style={styles.skrCard}>
              {/* header row: logo + badge */}
              <View style={styles.skrHeader}>
                <View style={styles.skrLogoRow}>
                  <Text style={styles.skrLogo}>◎</Text>
                  <View>
                    <Text style={styles.skrTitle}>$SKR — Solana Mobile</Text>
                    <Text style={styles.skrSub}>Auto-detected from wallet</Text>
                  </View>
                </View>
                <View style={styles.skrApyBadge}>
                  <Text style={styles.skrApyText}>{((skrHolding.apy ?? 0) * 100).toFixed(0)}% APY</Text>
                </View>
              </View>

              {/* staked / liquid split bar */}
              <View style={styles.skrBarBg}>
                <View style={[
                  styles.skrBarStaked,
                  { width: `${skrHolding.totalBalance > 0 ? (skrHolding.stakedBalance / skrHolding.totalBalance) * 100 : 0}%` }
                ]} />
              </View>
              <View style={styles.skrBarLabels}>
                <Text style={styles.skrBarLabelStaked}>
                  Staked: {skrHolding.stakedBalance.toLocaleString()} SKR
                </Text>
                <Text style={styles.skrBarLabelLiquid}>
                  Liquid: {skrHolding.liquidBalance.toLocaleString()} SKR
                </Text>
              </View>

              {/* 3-column numbers */}
              <View style={styles.skrNumbers}>
                <View style={styles.skrNumCol}>
                  <Text style={styles.skrNumLabel}>Total Value</Text>
                  <Text style={styles.skrNumValue}>
                    ${skrIncome.totalValueUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </Text>
                </View>
                <View style={styles.skrNumCol}>
                  <Text style={styles.skrNumLabel}>Monthly Yield</Text>
                  <Text style={[styles.skrNumValue, { color: '#4ade80' }]}>
                    ${skrIncome.monthlyYieldUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </Text>
                </View>
                <View style={styles.skrNumCol}>
                  <Text style={styles.skrNumLabel}>Annual Yield</Text>
                  <Text style={[styles.skrNumValue, { color: '#4ade80' }]}>
                    ${skrIncome.annualYieldUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>

              {/* freedom-days contribution */}
              <View style={styles.skrFreedomRow}>
                <Text style={styles.skrFreedomText}>
                  📈 SKR staking adds {skrIncome.monthlyYieldUsd > 0
                    ? `$${skrIncome.monthlyYieldUsd.toFixed(2)}/mo`
                    : '—'} of passive income to your freedom score
                </Text>
              </View>
            </View>
          )}

          {allAssets.length === 0 && !skrHolding ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No assets yet</Text>
              <Text style={styles.emptySubtext}>Tap "+ Add" to add your first asset</Text>
            </View>
          ) : (
            allAssets.map((asset) => {
              const isBankAsset = asset.id.startsWith('bank_');
              return (
                <TouchableOpacity
                  key={asset.id}
                  style={[
                    styles.assetCard,
                    isBankAsset && { borderLeftColor: '#60a5fa' },
                  ]}
                  onPress={() => !isBankAsset && handleEditAsset(asset)}
                  disabled={isBankAsset}
                  activeOpacity={isBankAsset ? 1 : 0.7}
                >
                  <View style={styles.assetHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.assetName}>{asset.name}</Text>
                      <Text style={styles.assetType}>{getTypeLabel(asset.type)}</Text>
                      {isBankAsset && (
                        <Text style={styles.bankBadge}>
                          {asset.metadata.type === 'bank_account' ? `${asset.metadata.apy}% APY` : ''}
                        </Text>
                      )}
                      {asset.type === 'retirement' && asset.metadata.type === 'retirement' && (
                        <Text style={styles.retirementBadge}>
                          {asset.metadata.contributionAmount > 0
                            ? `+$${(asset.metadata.contributionAmount).toLocaleString()}/${asset.metadata.contributionFrequency === 'monthly' ? 'mo' : asset.metadata.contributionFrequency === 'biweekly' ? 'biweekly' : asset.metadata.contributionFrequency === 'weekly' ? 'wk' : '2x/mo'}`
                            : 'No contribution set'}
                          {asset.metadata.employerMatchDollars ? ` · match +$${asset.metadata.employerMatchDollars.toFixed(0)}/mo` : ''}
                        </Text>
                      )}
                      {asset.annualIncome === 0 && !isBankAsset && asset.type !== 'retirement' && (
                        <Text style={styles.warningBadge}>⚠️ Not generating income</Text>
                      )}
                    </View>
                    {!isBankAsset && (
                      <TouchableOpacity 
                        onPress={(e) => {
                          e.stopPropagation();
                          handleRemoveAsset(asset);
                        }}
                        style={styles.deleteButtonContainer}
                      >
                        <Text style={styles.deleteButton}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.assetDetails}>
                    <View style={styles.assetDetail}>
                      <Text style={styles.assetDetailLabel}>Value</Text>
                      <Text style={styles.assetDetailValue}>${asset.value.toLocaleString()}</Text>
                    </View>
                    <View style={styles.assetDetail}>
                      <Text style={styles.assetDetailLabel}>Annual Income</Text>
                      <Text style={[styles.assetIncome, asset.annualIncome === 0 && styles.assetIncomeZero]}>
                        ${asset.annualIncome.toLocaleString()}/yr
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* ── Add Asset Modal ── */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {editingAsset 
                  ? (type === 'retirement' ? 'Edit Retirement Account' : 'Edit Asset')
                  : (type === 'retirement' ? 'Add Retirement Account' : 'Add Asset')
                }
              </Text>

              {/* ── Type picker (all types) ── */}
              <Text style={styles.label}>Type</Text>
              <View style={styles.typeButtons}>
                {(['crypto', 'stocks', 'real_estate', 'business', 'retirement', 'other'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeButton, type === t && styles.typeButtonActive]}
                    onPress={() => setType(t)}
                  >
                    <Text style={[styles.typeButtonText, type === t && styles.typeButtonTextActive]}>
                      {getTypeLabel(t)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* ════════ RETIREMENT FORM ════════ */}
              {type === 'retirement' ? (
                <>
                  <Text style={styles.label}>Account Type</Text>
                  <View style={styles.typeButtons}>
                    {(['401k', 'roth_401k', 'ira', 'roth_ira'] as const).map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.typeButton, retAccountType === t && styles.typeButtonActive]}
                        onPress={() => setRetAccountType(t)}
                      >
                        <Text style={[styles.typeButtonText, retAccountType === t && styles.typeButtonTextActive]}>
                          {t === '401k' ? '401(k)' : t === 'roth_401k' ? 'Roth 401(k)' : t === 'ira' ? 'IRA' : 'Roth IRA'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>Institution</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g., Fidelity, Vanguard, Schwab"
                    placeholderTextColor="#666"
                    value={retInstitution}
                    onChangeText={setRetInstitution}
                  />

                  <Text style={styles.label}>Current Balance</Text>
                  <View style={styles.inputContainer}>
                    <Text style={styles.currencySymbol}>$</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      placeholderTextColor="#666"
                      keyboardType="numeric"
                      value={retBalance}
                      onChangeText={setRetBalance}
                    />
                  </View>

                  <Text style={styles.label}>Contribution Per Pay Period</Text>
                  <Text style={styles.helperText}>How much you put in each time you're paid. Leave 0 if you're not contributing right now.</Text>
                  <View style={styles.inputContainer}>
                    <Text style={styles.currencySymbol}>$</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      placeholderTextColor="#666"
                      keyboardType="numeric"
                      value={retContribution}
                      onChangeText={setRetContribution}
                    />
                  </View>

                  <Text style={styles.label}>Pay Frequency</Text>
                  <View style={styles.typeButtons}>
                    {(['weekly', 'biweekly', 'twice_monthly', 'monthly'] as const).map((f) => (
                      <TouchableOpacity
                        key={f}
                        style={[styles.typeButton, retFrequency === f && styles.typeButtonActive]}
                        onPress={() => setRetFrequency(f)}
                      >
                        <Text style={[styles.typeButtonText, retFrequency === f && styles.typeButtonTextActive]}>
                          {f === 'biweekly' ? 'Bi-weekly' : f === 'twice_monthly' ? '2x/mo' : f.charAt(0).toUpperCase() + f.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Monthly equivalent preview */}
                  {parseFloat(retContribution) > 0 && (
                    <Text style={styles.retMonthlyPreview}>= ${retMonthly.toFixed(0)}/mo pre-tax from your paycheck</Text>
                  )}

                  <Text style={styles.label}>Employer Match (optional)</Text>
                  <Text style={styles.helperText}>The % of your salary your employer matches. E.g. "4" means they match up to 4%.</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      placeholderTextColor="#666"
                      keyboardType="numeric"
                      value={retMatchPercent}
                      onChangeText={setRetMatchPercent}
                    />
                    <Text style={styles.percent}>%</Text>
                  </View>

                  <View style={styles.modalButtons}>
                    <TouchableOpacity style={styles.modalCancelButton} onPress={resetForm}>
                      <Text style={styles.modalCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalAddButton, (!retInstitution || !retBalance) && styles.modalAddButtonDisabled]}
                      onPress={editingAsset ? handleSaveEdit : handleAddAsset}
                      disabled={!retInstitution || !retBalance}
                    >
                      <Text style={styles.modalAddText}>{editingAsset ? 'Save' : 'Add'}</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
              /* ════════ GENERIC ASSET FORM ════════ */
                <>
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
                  <Text style={styles.helperText}>Leave blank if not earning yield. We'll calculate annual income from this.</Text>
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
                    <TouchableOpacity style={styles.modalCancelButton} onPress={resetForm}>
                      <Text style={styles.modalCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalAddButton, (!name || !value) && styles.modalAddButtonDisabled]}
                      onPress={editingAsset ? handleSaveEdit : handleAddAsset}
                      disabled={!name || !value}
                    >
                      <Text style={styles.modalAddText}>{editingAsset ? 'Save' : 'Add'}</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
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

  // ── Cash flow toggle bar ──
  cashFlowToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 2,
  },
  cashFlowToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cashFlowToggleIcon: { fontSize: 18 },
  cashFlowToggleLabel: { fontSize: 16, fontWeight: 'bold' },
  cashFlowToggleChevron: { fontSize: 12, color: '#666' },

  // ── Expanded cash flow panel ──
  cashFlowPanel: {
    backgroundColor: '#141825',
    borderRadius: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  cashFlowMessage: { fontSize: 14, color: '#c0c0c0', marginBottom: 14, lineHeight: 20 },

  numbersRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  numberCard: { flex: 1, backgroundColor: '#1a1f2e', borderRadius: 10, padding: 12, alignItems: 'center' },
  numberLabel: { fontSize: 11, color: '#666', marginBottom: 4 },
  numberValue: { fontSize: 16, fontWeight: 'bold' },

  // Pre-tax retirement deduction row (sits between In/Out/Net and per-account cards)
  pretaxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1f2e',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#c084fc',
  },
  pretaxItem: { flex: 1, alignItems: 'center' },
  pretaxLabel: { fontSize: 10, color: '#666', marginBottom: 2 },
  pretaxValue: { fontSize: 13, fontWeight: 'bold', color: '#c084fc' },
  pretaxSep: { fontSize: 14, color: '#333', marginHorizontal: 4 },
  accountMiniCard: { backgroundColor: '#1a1f2e', borderRadius: 10, padding: 12, marginBottom: 8 },
  accountMiniHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  accountMiniName: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  statusPill: { borderWidth: 1, borderRadius: 5, paddingHorizontal: 8, paddingVertical: 2 },
  statusPillText: { fontSize: 11, fontWeight: 'bold' },
  accountMiniRow: { flexDirection: 'row', justifyContent: 'space-between' },
  accountMiniBalance: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  accountMiniNet: { fontSize: 14, fontWeight: '600' },

  runwayRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  runwayBarBg: { flex: 1, height: 6, backgroundColor: '#0a0e1a', borderRadius: 3, overflow: 'hidden' },
  runwayBarFill: { height: '100%', borderRadius: 3 },
  runwayText: { fontSize: 11, color: '#666', minWidth: 60 },

  recommendationsBox: { marginTop: 12, gap: 6 },
  recommendationText: { fontSize: 13, color: '#a0a0a0', lineHeight: 18 },

  // ── Portfolio summary ──
  summaryBox: { backgroundColor: '#1a1f2e', padding: 20, borderRadius: 12, marginBottom: 20, borderWidth: 2, borderColor: '#4ade80' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryItem: { flex: 1 },
  summaryLabel: { fontSize: 14, color: '#a0a0a0', marginBottom: 4 },
  summaryValue: { fontSize: 24, fontWeight: 'bold', color: '#ffffff' },
  summaryIncome: { fontSize: 24, fontWeight: 'bold', color: '#4ade80' },

  // ── Asset list ──
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  addButton: { backgroundColor: '#4ade80', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  addButtonText: { color: '#0a0e1a', fontWeight: 'bold', fontSize: 14 },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#666', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#444', textAlign: 'center' },

  assetCard: { backgroundColor: '#1a1f2e', padding: 16, borderRadius: 12, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#4ade80' },
  assetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  assetName: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', marginBottom: 4 },
  assetType: { fontSize: 14, color: '#a0a0a0' },
  bankBadge: { fontSize: 12, color: '#60a5fa', fontWeight: '600', marginTop: 2 },
  retirementBadge: { fontSize: 12, color: '#c084fc', fontWeight: '600', marginTop: 2 },
  retMonthlyPreview: { fontSize: 14, color: '#c084fc', marginTop: 8, textAlign: 'right' },
  warningBadge: { fontSize: 11, color: '#ff9800', marginTop: 4, fontWeight: '600' },
  deleteButton: { fontSize: 20, color: '#ff4444', padding: 4 },
  deleteButtonContainer: { padding: 4 },
  assetDetails: { flexDirection: 'row', justifyContent: 'space-between' },
  assetDetail: { flex: 1 },
  assetDetailLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  assetDetailValue: { fontSize: 14, color: '#ffffff', fontWeight: '600' },
  assetIncome: { fontSize: 14, color: '#4ade80', fontWeight: 'bold' },
  assetIncomeZero: { color: '#666' },

  // ── Modal ──
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#0a0e1a', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '75%' },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#4ade80', marginBottom: 20 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#ffffff', marginBottom: 8, marginTop: 12 },
  helperText: { fontSize: 13, color: '#666', marginBottom: 8 },
  modalInput: { backgroundColor: '#1a1f2e', borderRadius: 12, padding: 16, fontSize: 16, color: '#ffffff', borderWidth: 2, borderColor: '#2a2f3e' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1f2e', borderRadius: 12, paddingHorizontal: 16, borderWidth: 2, borderColor: '#2a2f3e' },
  currencySymbol: { fontSize: 20, color: '#4ade80', marginRight: 8 },
  input: { flex: 1, fontSize: 20, color: '#ffffff', paddingVertical: 16 },
  percent: { fontSize: 16, color: '#666', marginLeft: 8 },

  typeButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeButton: { padding: 10, borderRadius: 8, borderWidth: 2, borderColor: '#2a2f3e', alignItems: 'center' },
  typeButtonActive: { borderColor: '#4ade80', backgroundColor: '#1a2f1e' },
  typeButtonText: { fontSize: 13, color: '#666' },
  typeButtonTextActive: { color: '#4ade80', fontWeight: 'bold' },

  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 20, marginBottom: 20 },
  modalCancelButton: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 2, borderColor: '#2a2f3e', alignItems: 'center' },
  modalCancelText: { color: '#a0a0a0', fontSize: 16 },
  modalAddButton: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#4ade80', alignItems: 'center' },
  modalAddButtonDisabled: { opacity: 0.5 },
  modalAddText: { color: '#0a0e1a', fontSize: 16, fontWeight: 'bold' },

  // ── SKR card ──────────────────────────────────────────────────────────
  skrCard: {
    backgroundColor: '#1a1f2e',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#f4c430',   // gold accent — SKR brand
  },
  skrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  skrLogoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  skrLogo: { fontSize: 28, color: '#f4c430' },
  skrTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  skrSub: { fontSize: 12, color: '#666', marginTop: 1 },

  skrApyBadge: {
    backgroundColor: '#f4c43022',
    borderWidth: 1,
    borderColor: '#f4c430',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  skrApyText: { fontSize: 13, fontWeight: 'bold', color: '#f4c430' },

  // staked/liquid bar
  skrBarBg: { height: 8, backgroundColor: '#0a0e1a', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  skrBarStaked: { height: '100%', backgroundColor: '#f4c430', borderRadius: 4 },
  skrBarLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  skrBarLabelStaked: { fontSize: 12, color: '#f4c430', fontWeight: '600' },
  skrBarLabelLiquid: { fontSize: 12, color: '#666' },

  // 3-col numbers
  skrNumbers: { flexDirection: 'row', marginBottom: 12 },
  skrNumCol: { flex: 1, alignItems: 'center' },
  skrNumLabel: { fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  skrNumValue: { fontSize: 16, fontWeight: 'bold', color: '#fff' },

  // freedom feedback row
  skrFreedomRow: {
    backgroundColor: '#1a2f1e',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  skrFreedomText: { fontSize: 13, color: '#4ade80', lineHeight: 18 },
});
