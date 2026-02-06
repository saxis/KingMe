// app/(tabs)/income.tsx
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useState, useMemo, useEffect } from 'react';
import { useStore } from '../../src/store/useStore';
import { getMonthlyPreTaxDeductions } from '../../src/services/cashflow';
import { fetchSKRHolding, calcSKRIncome } from '../../src/services/skr';
//import type { IncomeSource, PaycheckDeduction, PaycheckDeductionType } from '../../src/types';
import type { IncomeSource, PaycheckDeduction, PaycheckDeductionType, PreTaxDeduction, PreTaxDeductionType, Tax, TaxType, PostTaxDeduction, PostTaxDeductionType } from '../../src/types';
import type { SKRHolding, SKRIncomeSnapshot } from '../../src/services/skr';

// ─── helpers ──────────────────────────────────────────────────────────────────
function toMonthly(amount: number, freq: string): number {
  switch (freq) {
    case 'weekly':        return (amount * 52) / 12;
    case 'biweekly':      return (amount * 26) / 12;
    case 'twice_monthly': return amount * 2;
    case 'monthly':       return amount;
    case 'quarterly':     return amount / 3;
    default:              return amount;
  }
}

// Sources that come from a paycheck (pre-tax deductions apply)
const PAYCHECK_SOURCES = new Set<string>(['salary', 'freelance', 'business']);

const SOURCE_LABELS: Record<string, string> = {
  salary:    '💼 Salary',
  freelance: '💻 Freelance',
  business:  '🏢 Business',
  trading:   '📊 Trading',
  other:     '💰 Other',
};

const DEDUCTION_LABELS: Record<PaycheckDeductionType, string> = {
  retirement_loan: '🏛️ 401k Loan',
  healthcare:      '🏥 Healthcare',
  other_pretax:    '📋 Other Pre-Tax',
};

const FREQ_LABELS: Record<string, string> = {
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  twice_monthly: '2x/mo',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
};

const PRETAX_LABELS: Record<PreTaxDeductionType, string> = {
  medical_coverage: '🏥 Medical',
  vision_coverage: '👓 Vision',
  dental_coverage: '🦷 Dental',
  life_insurance: '🛡️ Life Insurance',
  add_insurance: '🚑 AD&D',
  '401k_contribution': '💰 401k Contribution',
  other_pretax: '📋 Other Pre-Tax',
};

const TAX_LABELS: Record<TaxType, string> = {
  federal_withholding: '🇺🇸 Federal W/H',
  social_security: '👴 Social Security',
  medicare: '🏥 Medicare',
  state_withholding: '🏛️ State W/H',
};

const POSTTAX_LABELS: Record<PostTaxDeductionType, string> = {
  '401k_loan': '🏛️ 401k Loan',
  enhanced_ltd: '🛡️ Enhanced LTD',
  other_posttax: '📋 Other Post-Tax',
};

// ─── component ────────────────────────────────────────────────────────────────
export default function IncomeScreen() {
  // ── store ───────────────────────────────────────────────────────────────────
  const incomeSources           = useStore((s) => s.income.sources || []);
  const bankAccounts            = useStore((s) => s.bankAccounts);
  const assets                  = useStore((s) => s.assets);
  const paycheckDeductions      = useStore((s) => s.paycheckDeductions || []);
  const addIncomeSource         = useStore((s) => s.addIncomeSource);
  const removeIncomeSource      = useStore((s) => s.removeIncomeSource);
  const addPaycheckDeduction    = useStore((s) => s.addPaycheckDeduction);
  const removePaycheckDeduction = useStore((s) => s.removePaycheckDeduction);
  const preTaxDeductions      = useStore((s) => s.preTaxDeductions || []);
  const taxes                 = useStore((s) => s.taxes || []);
  const postTaxDeductions     = useStore((s) => s.postTaxDeductions || []);
  const addPreTaxDeduction    = useStore((s) => s.addPreTaxDeduction);
  const removePreTaxDeduction = useStore((s) => s.removePreTaxDeduction);
  const addTax                = useStore((s) => s.addTax);
  const removeTax             = useStore((s) => s.removeTax);
  const addPostTaxDeduction   = useStore((s) => s.addPostTaxDeduction);
  const removePostTaxDeduction = useStore((s) => s.removePostTaxDeduction);

  // ── SKR staking yield (auto-detected) ─────────────────────────────────────
  const wallets = useStore((s) => s.wallets);
  const [skrIncome, setSKRIncome] = useState<SKRIncomeSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      let holding: SKRHolding | null = null;
      if (wallets.length > 0) {
        for (const addr of wallets) {
          holding = await fetchSKRHolding(addr);
          if (holding) break;
        }
      }
      if (!cancelled) setSKRIncome(holding ? calcSKRIncome(holding) : null);
    }
    load();
    return () => { cancelled = true; };
  }, [wallets]);

  // ── income source modal state ───────────────────────────────────────────────
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [srcName, setSrcName]                 = useState('');
  const [srcType, setSrcType]                 = useState<IncomeSource['source']>('salary');
  const [srcAmount, setSrcAmount]             = useState('');
  const [srcFreq, setSrcFreq]                 = useState<IncomeSource['frequency']>('biweekly');
  const [srcAccountId, setSrcAccountId]       = useState('');

  // ── deduction modal state ───────────────────────────────────────────────────
  const [showDeductionModal, setShowDeductionModal] = useState(false);
  const [dedName, setDedName]                       = useState('');
  const [dedType, setDedType]                       = useState<PaycheckDeductionType>('healthcare');
  const [dedAmount, setDedAmount]                   = useState('');
  const [dedFreq, setDedFreq]                       = useState<PaycheckDeduction['frequency']>('biweekly');
  const [dedNotes, setDedNotes]                     = useState('');

  // ── pre-tax deduction modal ─────────────────────────────────────────────
  const [showPreTaxModal, setShowPreTaxModal] = useState(false);
  const [preTaxName, setPreTaxName] = useState('');
  const [preTaxType, setPreTaxType] = useState<PreTaxDeductionType>('medical_coverage');
  const [preTaxAmount, setPreTaxAmount] = useState('');
  const [preTaxFreq, setPreTaxFreq] = useState<'weekly' | 'biweekly' | 'twice_monthly' | 'monthly'>('biweekly');

  // ── tax modal ───────────────────────────────────────────────────────────
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [taxName, setTaxName] = useState('');
  const [taxType, setTaxType] = useState<TaxType>('federal_withholding');
  const [taxAmount, setTaxAmount] = useState('');
  const [taxFreq, setTaxFreq] = useState<'weekly' | 'biweekly' | 'twice_monthly' | 'monthly'>('biweekly');

  // ── post-tax deduction modal ────────────────────────────────────────────
  const [showPostTaxModal, setShowPostTaxModal] = useState(false);
  const [postTaxName, setPostTaxName] = useState('');
  const [postTaxType, setPostTaxType] = useState<PostTaxDeductionType>('401k_loan');
  const [postTaxAmount, setPostTaxAmount] = useState('');
  const [postTaxFreq, setPostTaxFreq] = useState<'weekly' | 'biweekly' | 'twice_monthly' | 'monthly'>('biweekly');

  // ── handlers ────────────────────────────────────────────────────────────────
  const handleAddIncome = () => {
    if (!srcName || !srcAmount || !srcAccountId) return;
    addIncomeSource({
      id: Date.now().toString(),
      source: srcType,
      name: srcName,
      amount: parseFloat(srcAmount),
      frequency: srcFreq,
      bankAccountId: srcAccountId,
    });
    setSrcName(''); setSrcAmount(''); setSrcType('salary'); setSrcFreq('biweekly'); setSrcAccountId('');
    setShowIncomeModal(false);
  };

  const handleAddDeduction = () => {
    if (!dedName || !dedAmount) return;
    addPaycheckDeduction({
      id: Date.now().toString(),
      name: dedName,
      type: dedType,
      perPayPeriod: parseFloat(dedAmount),
      frequency: dedFreq,
      notes: dedNotes || undefined,
    });
    setDedName(''); setDedAmount(''); setDedType('healthcare'); setDedFreq('biweekly'); setDedNotes('');
    setShowDeductionModal(false);
  };

  const handleAddPreTax = () => {
    if (!preTaxName || !preTaxAmount) return;
    addPreTaxDeduction({
      id: Date.now().toString(),
      name: preTaxName,
      type: preTaxType,
      perPayPeriod: parseFloat(preTaxAmount),
      frequency: preTaxFreq,
    });
    setPreTaxName(''); setPreTaxAmount(''); setPreTaxType('medical_coverage'); setPreTaxFreq('biweekly');
    setShowPreTaxModal(false);
  };

  const handleAddTax = () => {
    if (!taxName || !taxAmount) return;
    addTax({
      id: Date.now().toString(),
      name: taxName,
      type: taxType,
      perPayPeriod: parseFloat(taxAmount),
      frequency: taxFreq,
    });
    setTaxName(''); setTaxAmount(''); setTaxType('federal_withholding'); setTaxFreq('biweekly');
    setShowTaxModal(false);
  };

  const handleAddPostTax = () => {
    if (!postTaxName || !postTaxAmount) return;
    addPostTaxDeduction({
      id: Date.now().toString(),
      name: postTaxName,
      type: postTaxType,
      perPayPeriod: parseFloat(postTaxAmount),
      frequency: postTaxFreq,
    });
    setPostTaxName(''); setPostTaxAmount(''); setPostTaxType('401k_loan'); setPostTaxFreq('biweekly');
    setShowPostTaxModal(false);
  };

  // ── derived numbers ─────────────────────────────────────────────────────────
  const { paycheckSources, otherSources, paycheckMonthly, otherMonthly } = useMemo(() => {
    const paycheck: IncomeSource[] = [];
    const other: IncomeSource[]    = [];
    let paycheckM = 0, otherM = 0;

    incomeSources.forEach((s) => {
      const m = toMonthly(s.amount, s.frequency);
      if (PAYCHECK_SOURCES.has(s.source)) { paycheck.push(s); paycheckM += m; }
      else                                { other.push(s);    otherM   += m; }
    });
    return { paycheckSources: paycheck, otherSources: other, paycheckMonthly: paycheckM, otherMonthly: otherM };
  }, [incomeSources]);

  // Calculate NEW paycheck waterfall
  const preTaxMonthly = preTaxDeductions.reduce((sum, d) => sum + toMonthly(d.perPayPeriod, d.frequency), 0);
  const taxesMonthly = taxes.reduce((sum, t) => sum + toMonthly(t.perPayPeriod, t.frequency), 0);
  const postTaxMonthly = postTaxDeductions.reduce((sum, d) => sum + toMonthly(d.perPayPeriod, d.frequency), 0);
  

  // OLD pre-tax (deprecated paycheckDeductions + 401k from assets)
  const paycheckDeductionMonthly = paycheckDeductions.reduce((sum, d) => sum + toMonthly(d.perPayPeriod, d.frequency), 0);
  const { contributions: ret401kMonthly, employerMatch: employerMatchMonthly } = useMemo(() => getMonthlyPreTaxDeductions(assets), [assets]);
  const oldPreTaxTotal = ret401kMonthly + paycheckDeductionMonthly;

  // NEW waterfall calculation
  const grossPay = paycheckMonthly + preTaxMonthly + taxesMonthly + postTaxMonthly;
  const taxableIncome = grossPay - preTaxMonthly;
  const afterTaxIncome = taxableIncome - taxesMonthly;
  const netPay = afterTaxIncome - postTaxMonthly;

  // Fallback to OLD waterfall if no new deductions entered yet
  const useNewWaterfall = preTaxDeductions.length > 0 || taxes.length > 0 || postTaxDeductions.length > 0;
  const displayGrossPay = useNewWaterfall ? grossPay : (paycheckMonthly + oldPreTaxTotal);

  const totalNetToBank = paycheckMonthly + otherMonthly; // everything that actually hits accounts

  const getAccountName = (id: string) => bankAccounts.find((a) => a.id === id)?.name || 'Unknown';

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ══════════════════════════════════════════════════════════════════════
            SUMMARY HEADER
            ══════════════════════════════════════════════════════════════════════ */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryTopRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total to Bank</Text>
              <Text style={styles.summaryValueGreen}>${totalNetToBank.toLocaleString(undefined, { maximumFractionDigits: 0 })}<Text style={styles.summaryPerMo}>/mo</Text></Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Pre-Tax Out</Text>
              <Text style={styles.summaryValuePurple}>${(useNewWaterfall ? preTaxMonthly : oldPreTaxTotal).toLocaleString(undefined, { maximumFractionDigits: 0 })}<Text style={styles.summaryPerMo}>/mo</Text></Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Employer Match</Text>
              <Text style={[styles.summaryValueGreen, { fontSize: 18 }]}>+${employerMatchMonthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}<Text style={styles.summaryPerMo}>/mo</Text></Text>
            </View>
          </View>
        </View>

        {/* ══════════════════════════════════════════════════════════════════════
            PAYCHECK WATERFALL
            ══════════════════════════════════════════════════════════════════════ */}
        {paycheckMonthly > 0 && useNewWaterfall && (
          <View style={styles.waterfallBox}>
            <Text style={styles.waterfallTitle}>Complete Paycheck Breakdown</Text>

            {/* Gross Pay */}
            <View style={styles.waterfallRow}>
              <Text style={styles.waterfallLabel}>Gross Pay</Text>
              <Text style={styles.waterfallAmount}>${grossPay.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo</Text>
            </View>

            {/* Pre-tax deductions */}
            {preTaxDeductions.map((d) => (
              <View key={d.id} style={styles.waterfallRow}>
                <Text style={styles.waterfallDeductLabel}>  − {d.name}</Text>
                <Text style={styles.waterfallDeductAmount}>−${toMonthly(d.perPayPeriod, d.frequency).toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
              </View>
            ))}

            {/* Taxable Income */}
            <View style={[styles.waterfallRow, { marginTop: 6 }]}>
              <Text style={[styles.waterfallLabel, { color: '#4ade80' }]}>= Taxable Income</Text>
              <Text style={[styles.waterfallAmount, { color: '#4ade80' }]}>${taxableIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo</Text>
            </View>

            {/* Taxes */}
            {taxes.map((t) => (
              <View key={t.id} style={styles.waterfallRow}>
                <Text style={[styles.waterfallDeductLabel, { color: '#f87171' }]}>  − {t.name}</Text>
                <Text style={[styles.waterfallDeductAmount, { color: '#f87171' }]}>−${toMonthly(t.perPayPeriod, t.frequency).toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
              </View>
            ))}

            {/* After-Tax Income */}
            <View style={[styles.waterfallRow, { marginTop: 6 }]}>
              <Text style={[styles.waterfallLabel, { color: '#4ade80' }]}>= After-Tax Income</Text>
              <Text style={[styles.waterfallAmount, { color: '#4ade80' }]}>${afterTaxIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo</Text>
            </View>

            {/* Post-tax deductions */}
            {postTaxDeductions.map((d) => (
              <View key={d.id} style={styles.waterfallRow}>
                <Text style={[styles.waterfallDeductLabel, { color: '#fb923c' }]}>  − {d.name}</Text>
                <Text style={[styles.waterfallDeductAmount, { color: '#fb923c' }]}>−${toMonthly(d.perPayPeriod, d.frequency).toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
              </View>
            ))}

            {/* Divider */}
            <View style={styles.waterfallDivider} />

            {/* Net Pay */}
            <View style={styles.waterfallRow}>
              <Text style={styles.waterfallNetLabel}>= Net Pay to Bank</Text>
              <Text style={styles.waterfallNetAmount}>${netPay.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo</Text>
            </View>

            {/* Employer match (if any) */}
            {employerMatchMonthly > 0 && (
              <View style={[styles.waterfallRow, { marginTop: 8 }]}>
                <Text style={[styles.waterfallOtherLabel, { color: '#4ade80' }]}>  + Employer 401k Match</Text>
                <Text style={[styles.waterfallOtherAmount, { color: '#4ade80' }]}>+${employerMatchMonthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo</Text>
              </View>
            )}

            {/* Trading/other income */}
            {otherMonthly > 0 && (
              <View style={styles.waterfallRow}>
                <Text style={styles.waterfallOtherLabel}>  + Other Deposits</Text>
                <Text style={styles.waterfallOtherAmount}>+${otherMonthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo</Text>
              </View>
            )}
          </View>
        )}

        {/* OLD WATERFALL - fallback when new system not used yet */}
        {paycheckMonthly > 0 && !useNewWaterfall && oldPreTaxTotal > 0 && (
          <View style={styles.waterfallBox}>
            <Text style={styles.waterfallTitle}>Paycheck Waterfall (Legacy)</Text>
            <Text style={styles.helperText}>⚠️ Using old pre-tax tracking. Add items to the new sections below for complete breakdown.</Text>

            {/* ... keep your old waterfall code here for backwards compatibility ... */}
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            PAYCHECK INCOME SOURCES (salary / freelance / business)
            ══════════════════════════════════════════════════════════════════════ */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Paycheck Income</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => { setSrcType('salary'); setShowIncomeModal(true); }}>
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {paycheckSources.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No paycheck income yet</Text>
            <Text style={styles.emptySubtext}>Add your salary, freelance, or business income here. Enter the net amount that lands in your bank.</Text>
          </View>
        ) : (
          paycheckSources.map((src) => (
            <View key={src.id} style={styles.incomeCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardName}>{src.name}</Text>
                  <Text style={styles.cardMeta}>
                    {SOURCE_LABELS[src.source] || src.source}  ·  → {getAccountName(src.bankAccountId)}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeIncomeSource(src.id)}>
                  <Text style={styles.deleteBtn}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.cardNumbers}>
                <Text style={styles.cardAmount}>${src.amount.toLocaleString()}</Text>
                <Text style={styles.cardFreq}>{FREQ_LABELS[src.frequency]}</Text>
                <Text style={styles.cardMonthly}>${toMonthly(src.amount, src.frequency).toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo</Text>
              </View>
            </View>
          ))
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TRADING / OTHER INCOME (Drift wins, crypto, etc.)
            ══════════════════════════════════════════════════════════════════════ */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Trading & Other</Text>
          <TouchableOpacity style={styles.addButtonBlue} onPress={() => { setSrcType('trading'); setShowIncomeModal(true); }}>
            <Text style={styles.addButtonBlueText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {otherSources.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No trading income yet</Text>
            <Text style={styles.emptySubtext}>Log Drift perpetuals wins, crypto income, or any non-paycheck deposits here.</Text>
          </View>
        ) : (
          otherSources.map((src) => (
            <View key={src.id} style={styles.incomeCard}>
              <View style={[styles.incomeCard, { borderLeftColor: '#60a5fa', margin: 0, padding: 0 }]}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardName}>{src.name}</Text>
                    <Text style={[styles.cardMeta, { color: '#60a5fa' }]}>
                      {SOURCE_LABELS[src.source] || src.source}  ·  → {getAccountName(src.bankAccountId)}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => removeIncomeSource(src.id)}>
                    <Text style={styles.deleteBtn}>✕</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.cardNumbers}>
                  <Text style={styles.cardAmount}>${src.amount.toLocaleString()}</Text>
                  <Text style={styles.cardFreq}>{FREQ_LABELS[src.frequency]}</Text>
                  <Text style={[styles.cardMonthly, { color: '#60a5fa' }]}>${toMonthly(src.amount, src.frequency).toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo</Text>
                </View>
              </View>
            </View>
          ))
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            SKR STAKING YIELD — auto-detected passive income
            ══════════════════════════════════════════════════════════════════════ */}
        {skrIncome && skrIncome.monthlyYieldUsd > 0 && (
          <View style={styles.skrYieldCard}>
            <View style={styles.skrYieldHeader}>
              <View style={styles.skrYieldTitleRow}>
                <Text style={styles.skrYieldLogo}>◎</Text>
                <View>
                  <Text style={styles.skrYieldTitle}>$SKR Staking Yield</Text>
                  <Text style={styles.skrYieldSub}>Auto-detected · Passive income</Text>
                </View>
              </View>
              <View style={styles.skrYieldApyBadge}>
                <Text style={styles.skrYieldApyText}>{(skrIncome.apyUsed * 100).toFixed(0)}% APY</Text>
              </View>
            </View>

            <View style={styles.skrYieldNumbers}>
              <View style={styles.skrYieldNumCol}>
                <Text style={styles.skrYieldNumLabel}>Monthly Yield</Text>
                <Text style={styles.skrYieldNumValue}>
                  {skrIncome.monthlyYieldSkr.toLocaleString(undefined, { maximumFractionDigits: 1 })} SKR
                </Text>
                <Text style={styles.skrYieldNumSub}>
                  ${skrIncome.monthlyYieldUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
                </Text>
              </View>
              <View style={styles.skrYieldDivider} />
              <View style={styles.skrYieldNumCol}>
                <Text style={styles.skrYieldNumLabel}>Annual Yield</Text>
                <Text style={styles.skrYieldNumValue}>
                  ${skrIncome.annualYieldUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </Text>
                <Text style={styles.skrYieldNumSub}>compounds automatically</Text>
              </View>
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            NEW: PRE-TAX DEDUCTIONS (Medical, Dental, 401k Contributions)
            ══════════════════════════════════════════════════════════════════════ */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Pre-Tax Deductions</Text>
          <TouchableOpacity style={styles.addButtonPurple} onPress={() => setShowPreTaxModal(true)}>
            <Text style={styles.addButtonPurpleText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.pretaxInfoBox}>
          <Text style={styles.pretaxInfoText}>
            These come OUT of your gross pay BEFORE taxes are calculated: Medical, Dental, Vision, Life Insurance, AD&D, 401k contributions.
          </Text>
        </View>

        {preTaxDeductions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No pre-tax deductions</Text>
            <Text style={styles.emptySubtext}>Add Medical, Dental, Vision, Life, AD&D, 401k contributions</Text>
          </View>
        ) : (
          preTaxDeductions.map((ded) => (
            <View key={ded.id} style={styles.deductionCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardName}>{ded.name}</Text>
                  <Text style={styles.cardMetaPurple}>
                    {PRETAX_LABELS[ded.type]}  ·  {FREQ_LABELS[ded.frequency]}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removePreTaxDeduction(ded.id)}>
                  <Text style={styles.deleteBtn}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.cardNumbers}>
                <Text style={styles.cardAmountPurple}>${ded.perPayPeriod.toLocaleString()}</Text>
                <Text style={styles.cardFreq}>per pay</Text>
                <Text style={styles.cardMonthlyPurple}>${toMonthly(ded.perPayPeriod, ded.frequency).toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo</Text>
              </View>
            </View>
          ))
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            NEW: TAXES (Federal W/H, Social Security, Medicare, State W/H)
            ══════════════════════════════════════════════════════════════════════ */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Taxes</Text>
          <TouchableOpacity style={styles.addButtonRed} onPress={() => setShowTaxModal(true)}>
            <Text style={styles.addButtonRedText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.pretaxInfoBox}>
          <Text style={styles.pretaxInfoText}>
            Taxes taken from your taxable income: Federal W/H, Social Security, Medicare, State W/H.
          </Text>
        </View>

        {taxes.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No taxes tracked</Text>
            <Text style={styles.emptySubtext}>Add Federal W/H, Social Security, Medicare, State W/H</Text>
          </View>
        ) : (
          taxes.map((tax) => (
            <View key={tax.id} style={[styles.deductionCard, { borderLeftColor: '#f87171' }]}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardName}>{tax.name}</Text>
                  <Text style={[styles.cardMetaPurple, { color: '#f87171' }]}>
                    {TAX_LABELS[tax.type]}  ·  {FREQ_LABELS[tax.frequency]}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeTax(tax.id)}>
                  <Text style={styles.deleteBtn}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.cardNumbers}>
                <Text style={[styles.cardAmountPurple, { color: '#f87171' }]}>${tax.perPayPeriod.toLocaleString()}</Text>
                <Text style={styles.cardFreq}>per pay</Text>
                <Text style={[styles.cardMonthlyPurple, { color: '#f87171' }]}>${toMonthly(tax.perPayPeriod, tax.frequency).toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo</Text>
              </View>
            </View>
          ))
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            NEW: POST-TAX DEDUCTIONS (401k Loan, Enhanced LTD)
            ══════════════════════════════════════════════════════════════════════ */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Post-Tax Deductions</Text>
          <TouchableOpacity style={styles.addButtonOrange} onPress={() => setShowPostTaxModal(true)}>
            <Text style={styles.addButtonOrangeText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.pretaxInfoBox}>
          <Text style={styles.pretaxInfoText}>
            These come OUT after taxes: 401k loan repayments, Enhanced LTD, and other post-tax deductions.
          </Text>
        </View>

        {postTaxDeductions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No post-tax deductions</Text>
            <Text style={styles.emptySubtext}>Add 401k loan, Enhanced LTD, etc.</Text>
          </View>
        ) : (
          postTaxDeductions.map((ded) => (
            <View key={ded.id} style={[styles.deductionCard, { borderLeftColor: '#fb923c' }]}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardName}>{ded.name}</Text>
                  <Text style={[styles.cardMetaPurple, { color: '#fb923c' }]}>
                    {POSTTAX_LABELS[ded.type]}  ·  {FREQ_LABELS[ded.frequency]}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removePostTaxDeduction(ded.id)}>
                  <Text style={styles.deleteBtn}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.cardNumbers}>
                <Text style={[styles.cardAmountPurple, { color: '#fb923c' }]}>${ded.perPayPeriod.toLocaleString()}</Text>
                <Text style={styles.cardFreq}>per pay</Text>
                <Text style={[styles.cardMonthlyPurple, { color: '#fb923c' }]}>${toMonthly(ded.perPayPeriod, ded.frequency).toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo</Text>
              </View>
            </View>
          ))
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            PRE-TAX DEDUCTIONS (401k loan, healthcare, etc.)
            ══════════════════════════════════════════════════════════════════════ */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Pre-Tax Deductions</Text>
          <TouchableOpacity style={styles.addButtonPurple} onPress={() => setShowDeductionModal(true)}>
            <Text style={styles.addButtonPurpleText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.pretaxInfoBox}>
          <Text style={styles.pretaxInfoText}>
            These come out of your paycheck before your net deposit. 401k loan repayments, healthcare premiums, etc. Your 401k contribution (from the Assets tab) is also shown in the waterfall above.
          </Text>
        </View>

        {paycheckDeductions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No pre-tax deductions</Text>
            <Text style={styles.emptySubtext}>Add 401k loan repayments, healthcare plans, etc.</Text>
          </View>
        ) : (
          paycheckDeductions.map((ded) => (
            <View key={ded.id} style={styles.deductionCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardName}>{ded.name}</Text>
                  <Text style={styles.cardMetaPurple}>
                    {DEDUCTION_LABELS[ded.type]}  ·  {FREQ_LABELS[ded.frequency]}
                  </Text>
                  {ded.notes && <Text style={styles.cardNotes}>{ded.notes}</Text>}
                </View>
                <TouchableOpacity onPress={() => removePaycheckDeduction(ded.id)}>
                  <Text style={styles.deleteBtn}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.cardNumbers}>
                <Text style={styles.cardAmountPurple}>${ded.perPayPeriod.toLocaleString()}</Text>
                <Text style={styles.cardFreq}>per pay</Text>
                <Text style={styles.cardMonthlyPurple}>${toMonthly(ded.perPayPeriod, ded.frequency).toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo</Text>
              </View>
            </View>
          ))
        )}

      </ScrollView>

      {/* ═══════════════ ADD INCOME SOURCE MODAL ═══════════════ */}
      <Modal visible={showIncomeModal} animationType="slide" transparent={true} onRequestClose={() => setShowIncomeModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Add Income Source</Text>

              {/* Type picker */}
              <Text style={styles.label}>Type</Text>
              <View style={styles.pillRow}>
                {(['salary', 'freelance', 'business', 'trading', 'other'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.pill, srcType === t && styles.pillActive]}
                    onPress={() => setSrcType(t)}
                  >
                    <Text style={[styles.pillText, srcType === t && styles.pillTextActive]}>{SOURCE_LABELS[t]}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Context-sensitive helper per type */}
              {srcType === 'salary' && (
                <Text style={styles.helperText}>Enter the net amount that actually deposits into your bank each pay period — after taxes, 401k, healthcare, and other deductions have been taken out.</Text>
              )}
              {srcType === 'trading' && (
                <Text style={styles.helperText}>Log your Drift perpetuals or other trading P&L. Enter the amount you actually withdrew or deposited into your account.</Text>
              )}
              {srcType === 'freelance' && (
                <Text style={styles.helperText}>Enter what you actually receive per payment after any taxes or fees.</Text>
              )}
              {srcType === 'business' && (
                <Text style={styles.helperText}>Enter the net distribution or payment you receive.</Text>
              )}

              {/* Name */}
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder={
                  srcType === 'trading'   ? 'e.g., Drift Perps – Jan wins' :
                  srcType === 'salary'    ? 'e.g., Acme Corp Salary' :
                  srcType === 'freelance' ? 'e.g., Freelance – Client X' :
                  srcType === 'business'  ? 'e.g., LLC Distribution' :
                                            'e.g., Side income'
                }
                placeholderTextColor="#666"
                value={srcName}
                onChangeText={setSrcName}
              />

              {/* Amount */}
              <Text style={styles.label}>Amount per Payment</Text>
              <View style={styles.inputRow}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput style={styles.input} placeholder="0" placeholderTextColor="#666" keyboardType="numeric" value={srcAmount} onChangeText={setSrcAmount} />
              </View>

              {/* Frequency */}
              <Text style={styles.label}>How Often?</Text>
              <View style={styles.pillRow}>
                {(['weekly', 'biweekly', 'twice_monthly', 'monthly', 'quarterly'] as const).map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.pill, srcFreq === f && styles.pillActive]}
                    onPress={() => setSrcFreq(f)}
                  >
                    <Text style={[styles.pillText, srcFreq === f && styles.pillTextActive]}>{FREQ_LABELS[f]}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Live monthly preview */}
              {parseFloat(srcAmount) > 0 && (
                <Text style={styles.monthlyPreview}>= ${toMonthly(parseFloat(srcAmount), srcFreq).toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo</Text>
              )}

              {/* Destination account */}
              <Text style={styles.label}>Deposits Into</Text>
              {srcType === 'trading' && (
                <Text style={styles.helperText}>Pick where your trading wins land — e.g., Crypto.com Cash.</Text>
              )}
              {bankAccounts.length === 0 ? (
                <Text style={styles.noAccountsWarn}>⚠️ No bank accounts added yet — add one in Profile first.</Text>
              ) : (
                <View style={styles.accountList}>
                  {bankAccounts.map((acct) => (
                    <TouchableOpacity
                      key={acct.id}
                      style={[styles.accountOption, srcAccountId === acct.id && styles.accountOptionActive]}
                      onPress={() => setSrcAccountId(acct.id)}
                    >
                      <View>
                        <Text style={[styles.accountOptionName, srcAccountId === acct.id && styles.accountOptionNameActive]}>{acct.name}</Text>
                        <Text style={styles.accountOptionSub}>{acct.institution}  ·  ${(acct.currentBalance ?? 0).toLocaleString()}</Text>
                      </View>
                      {srcAccountId === acct.id && <Text style={styles.checkMark}>✓</Text>}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Buttons */}
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowIncomeModal(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalAddBtn, (!srcName || !srcAmount || !srcAccountId) && styles.modalBtnDisabled]}
                  onPress={handleAddIncome}
                  disabled={!srcName || !srcAmount || !srcAccountId}
                >
                  <Text style={styles.modalAddText}>Add</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═══════════════ ADD DEDUCTION MODAL ═══════════════ */}
      <Modal visible={showDeductionModal} animationType="slide" transparent={true} onRequestClose={() => setShowDeductionModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={[styles.modalTitle, { color: '#c084fc' }]}>Add Pre-Tax Deduction</Text>

              {/* Type picker */}
              <Text style={styles.label}>Type</Text>
              <View style={styles.pillRow}>
                {(['retirement_loan', 'healthcare', 'other_pretax'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.pill, dedType === t && styles.pillActivePurple]}
                    onPress={() => setDedType(t)}
                  >
                    <Text style={[styles.pillText, dedType === t && styles.pillTextActivePurple]}>{DEDUCTION_LABELS[t]}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {dedType === 'retirement_loan' && (
                <Text style={styles.helperText}>The 401k loan repayment taken from each paycheck — separate from your 401k contribution (which lives in Assets).</Text>
              )}
              {dedType === 'healthcare' && (
                <Text style={styles.helperText}>Your health insurance premium deducted from each paycheck before net pay.</Text>
              )}
              {dedType === 'other_pretax' && (
                <Text style={styles.helperText}>Any other pre-tax deduction from your paycheck.</Text>
              )}

              {/* Name */}
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder={dedType === 'retirement_loan' ? '401k Loan Repayment' : dedType === 'healthcare' ? 'Blue Cross Health Plan' : 'Pre-tax deduction'}
                placeholderTextColor="#666"
                value={dedName}
                onChangeText={setDedName}
              />

              {/* Amount per paycheck */}
              <Text style={styles.label}>Amount Per Paycheck</Text>
              <View style={styles.inputRow}>
                <Text style={[styles.currencySymbol, { color: '#c084fc' }]}>$</Text>
                <TextInput style={styles.input} placeholder="0" placeholderTextColor="#666" keyboardType="numeric" value={dedAmount} onChangeText={setDedAmount} />
              </View>

              {/* Frequency */}
              <Text style={styles.label}>Pay Frequency</Text>
              <View style={styles.pillRow}>
                {(['weekly', 'biweekly', 'twice_monthly', 'monthly'] as const).map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.pill, dedFreq === f && styles.pillActivePurple]}
                    onPress={() => setDedFreq(f)}
                  >
                    <Text style={[styles.pillText, dedFreq === f && styles.pillTextActivePurple]}>{FREQ_LABELS[f]}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Monthly preview */}
              {parseFloat(dedAmount) > 0 && (
                <Text style={[styles.monthlyPreview, { color: '#c084fc' }]}>= ${toMonthly(parseFloat(dedAmount), dedFreq).toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo pre-tax</Text>
              )}

              {/* Notes */}
              <Text style={styles.label}>Notes (optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., 5-year repayment, family plan"
                placeholderTextColor="#666"
                value={dedNotes}
                onChangeText={setDedNotes}
              />

              {/* Buttons */}
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowDeductionModal(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalAddBtnPurple, (!dedName || !dedAmount) && styles.modalBtnDisabled]}
                  onPress={handleAddDeduction}
                  disabled={!dedName || !dedAmount}
                >
                  <Text style={styles.modalAddText}>Add</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═══════════════ ADD PRE-TAX DEDUCTION MODAL ═══════════════ */}
      <Modal visible={showPreTaxModal} animationType="slide" transparent={true} onRequestClose={() => setShowPreTaxModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={[styles.modalTitle, { color: '#c084fc' }]}>Add Pre-Tax Deduction</Text>

              <Text style={styles.label}>Type</Text>
              <View style={styles.pillRow}>
                {(['medical_coverage', 'vision_coverage', 'dental_coverage', 'life_insurance', 'add_insurance', '401k_contribution', 'other_pretax'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.pill, preTaxType === t && styles.pillActivePurple]}
                    onPress={() => setPreTaxType(t)}
                  >
                    <Text style={[styles.pillText, preTaxType === t && styles.pillTextActivePurple]}>{PRETAX_LABELS[t]}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., Medical Coverage, Vision Plan"
                placeholderTextColor="#666"
                value={preTaxName}
                onChangeText={setPreTaxName}
              />

              <Text style={styles.label}>Amount Per Paycheck</Text>
              <View style={styles.inputRow}>
                <Text style={[styles.currencySymbol, { color: '#c084fc' }]}>$</Text>
                <TextInput style={styles.input} placeholder="0" placeholderTextColor="#666" keyboardType="numeric" value={preTaxAmount} onChangeText={setPreTaxAmount} />
              </View>

              <Text style={styles.label}>Pay Frequency</Text>
              <View style={styles.pillRow}>
                {(['weekly', 'biweekly', 'twice_monthly', 'monthly'] as const).map((f) => (
                  <TouchableOpacity key={f} style={[styles.pill, preTaxFreq === f && styles.pillActivePurple]} onPress={() => setPreTaxFreq(f)}>
                    <Text style={[styles.pillText, preTaxFreq === f && styles.pillTextActivePurple]}>{FREQ_LABELS[f]}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {parseFloat(preTaxAmount) > 0 && (
                <Text style={[styles.monthlyPreview, { color: '#c084fc' }]}>= ${toMonthly(parseFloat(preTaxAmount), preTaxFreq).toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo pre-tax</Text>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowPreTaxModal(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalAddBtnPurple, (!preTaxName || !preTaxAmount) && styles.modalBtnDisabled]}
                  onPress={handleAddPreTax}
                  disabled={!preTaxName || !preTaxAmount}
                >
                  <Text style={styles.modalAddText}>Add</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═══════════════ ADD TAX MODAL ═══════════════ */}
      <Modal visible={showTaxModal} animationType="slide" transparent={true} onRequestClose={() => setShowTaxModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={[styles.modalTitle, { color: '#f87171' }]}>Add Tax</Text>

              <Text style={styles.label}>Type</Text>
              <View style={styles.pillRow}>
                {(['federal_withholding', 'social_security', 'medicare', 'state_withholding'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.pill, taxType === t && styles.pillActiveRed]}
                    onPress={() => setTaxType(t)}
                  >
                    <Text style={[styles.pillText, taxType === t && styles.pillTextActiveRed]}>{TAX_LABELS[t]}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., Federal W/H, Social Security"
                placeholderTextColor="#666"
                value={taxName}
                onChangeText={setTaxName}
              />

              <Text style={styles.label}>Amount Per Paycheck</Text>
              <View style={styles.inputRow}>
                <Text style={[styles.currencySymbol, { color: '#f87171' }]}>$</Text>
                <TextInput style={styles.input} placeholder="0" placeholderTextColor="#666" keyboardType="numeric" value={taxAmount} onChangeText={setTaxAmount} />
              </View>

              <Text style={styles.label}>Pay Frequency</Text>
              <View style={styles.pillRow}>
                {(['weekly', 'biweekly', 'twice_monthly', 'monthly'] as const).map((f) => (
                  <TouchableOpacity key={f} style={[styles.pill, taxFreq === f && styles.pillActiveRed]} onPress={() => setTaxFreq(f)}>
                    <Text style={[styles.pillText, taxFreq === f && styles.pillTextActiveRed]}>{FREQ_LABELS[f]}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {parseFloat(taxAmount) > 0 && (
                <Text style={[styles.monthlyPreview, { color: '#f87171' }]}>= ${toMonthly(parseFloat(taxAmount), taxFreq).toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo tax</Text>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowTaxModal(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalAddBtnRed, (!taxName || !taxAmount) && styles.modalBtnDisabled]}
                  onPress={handleAddTax}
                  disabled={!taxName || !taxAmount}
                >
                  <Text style={styles.modalAddText}>Add</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═══════════════ ADD POST-TAX DEDUCTION MODAL ═══════════════ */}
      <Modal visible={showPostTaxModal} animationType="slide" transparent={true} onRequestClose={() => setShowPostTaxModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={[styles.modalTitle, { color: '#fb923c' }]}>Add Post-Tax Deduction</Text>

              <Text style={styles.label}>Type</Text>
              <View style={styles.pillRow}>
                {(['401k_loan', 'enhanced_ltd', 'other_posttax'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.pill, postTaxType === t && styles.pillActiveOrange]}
                    onPress={() => setPostTaxType(t)}
                  >
                    <Text style={[styles.pillText, postTaxType === t && styles.pillTextActiveOrange]}>{POSTTAX_LABELS[t]}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., 401k Loan, Enhanced LTD"
                placeholderTextColor="#666"
                value={postTaxName}
                onChangeText={setPostTaxName}
              />

              <Text style={styles.label}>Amount Per Paycheck</Text>
              <View style={styles.inputRow}>
                <Text style={[styles.currencySymbol, { color: '#fb923c' }]}>$</Text>
                <TextInput style={styles.input} placeholder="0" placeholderTextColor="#666" keyboardType="numeric" value={postTaxAmount} onChangeText={setPostTaxAmount} />
              </View>

              <Text style={styles.label}>Pay Frequency</Text>
              <View style={styles.pillRow}>
                {(['weekly', 'biweekly', 'twice_monthly', 'monthly'] as const).map((f) => (
                  <TouchableOpacity key={f} style={[styles.pill, postTaxFreq === f && styles.pillActiveOrange]} onPress={() => setPostTaxFreq(f)}>
                    <Text style={[styles.pillText, postTaxFreq === f && styles.pillTextActiveOrange]}>{FREQ_LABELS[f]}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {parseFloat(postTaxAmount) > 0 && (
                <Text style={[styles.monthlyPreview, { color: '#fb923c' }]}>= ${toMonthly(parseFloat(postTaxAmount), postTaxFreq).toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo post-tax</Text>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowPostTaxModal(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalAddBtnOrange, (!postTaxName || !postTaxAmount) && styles.modalBtnDisabled]}
                  onPress={handleAddPostTax}
                  disabled={!postTaxName || !postTaxAmount}
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

// ─── styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e1a' },
  scroll:    { flex: 1, padding: 20 },

  // ── Summary ───────────────────────────────────────────────────────────────
  summaryBox: {
    backgroundColor: '#1a1f2e',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2a2f3e',
  },
  summaryTopRow:     { flexDirection: 'row', alignItems: 'center' },
  summaryItem:       { flex: 1, alignItems: 'center' },
  summaryDivider:    { width: 1, height: 44, backgroundColor: '#2a2f3e' },
  summaryLabel:      { fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  summaryValueGreen: { fontSize: 20, fontWeight: 'bold', color: '#4ade80' },
  summaryValuePurple:{ fontSize: 20, fontWeight: 'bold', color: '#c084fc' },
  summaryPerMo:      { fontSize: 11, fontWeight: '400', color: '#666' },

  // ── Waterfall ─────────────────────────────────────────────────────────────
  waterfallBox: {
    backgroundColor: '#141825',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2a2f3e',
  },
  waterfallTitle: { fontSize: 13, fontWeight: 'bold', color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  waterfallRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },

  waterfallLabel:       { fontSize: 15, color: '#fff', fontWeight: '600' },
  waterfallAmount:      { fontSize: 15, color: '#fff', fontWeight: '600' },

  waterfallDeductLabel: { fontSize: 14, color: '#c084fc', paddingLeft: 12 },
  waterfallDeductAmount:{ fontSize: 14, color: '#c084fc' },

  waterfallDivider: { height: 1, backgroundColor: '#2a2f3e', marginVertical: 8 },

  waterfallNetLabel:    { fontSize: 15, color: '#4ade80', fontWeight: 'bold' },
  waterfallNetAmount:   { fontSize: 15, color: '#4ade80', fontWeight: 'bold' },

  waterfallOtherLabel:  { fontSize: 14, color: '#60a5fa', paddingLeft: 0 },
  waterfallOtherAmount: { fontSize: 14, color: '#60a5fa' },

  // ── Section headers ───────────────────────────────────────────────────────
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle:  { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },

  addButton:     { backgroundColor: '#4ade80', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  addButtonText: { color: '#0a0e1a', fontWeight: 'bold', fontSize: 14 },

  addButtonPurple:     { backgroundColor: '#c084fc', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  addButtonPurpleText: { color: '#0a0e1a', fontWeight: 'bold', fontSize: 14 },

  addButtonBlue:     { backgroundColor: '#60a5fa', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  addButtonBlueText: { color: '#0a0e1a', fontWeight: 'bold', fontSize: 14 },

  addButtonRed:          { backgroundColor: '#f87171', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  addButtonRedText:      { color: '#0a0e1a', fontWeight: 'bold', fontSize: 14 },
  addButtonOrange:       { backgroundColor: '#fb923c', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  addButtonOrangeText:   { color: '#0a0e1a', fontWeight: 'bold', fontSize: 14 },
  
  pillActiveRed:         { borderColor: '#f87171', backgroundColor: '#3a1a1e' },
  pillTextActiveRed:     { color: '#f87171', fontWeight: 'bold' },
  pillActiveOrange:      { borderColor: '#fb923c', backgroundColor: '#3a2a1e' },
  pillTextActiveOrange:  { color: '#fb923c', fontWeight: 'bold' },
  
  modalAddBtnRed:        { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#f87171', alignItems: 'center' },
  modalAddBtnOrange:     { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#fb923c', alignItems: 'center' },

  // ── Income cards ──────────────────────────────────────────────────────────
  incomeCard: {
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4ade80',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardName:   { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 3 },
  cardMeta:   { fontSize: 13, color: '#4ade80' },
  deleteBtn:  { fontSize: 18, color: '#ff4444', padding: 2 },

  cardNumbers:   { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  cardAmount:    { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  cardFreq:      { fontSize: 12, color: '#666' },
  cardMonthly:   { fontSize: 15, color: '#4ade80', fontWeight: '600', marginLeft: 'auto' },

  // ── Deduction cards ───────────────────────────────────────────────────────
  deductionCard: {
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#c084fc',
  },
  cardMetaPurple:    { fontSize: 13, color: '#c084fc' },
  cardNotes:         { fontSize: 12, color: '#666', marginTop: 2, fontStyle: 'italic' },
  cardAmountPurple:  { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  cardMonthlyPurple: { fontSize: 15, color: '#c084fc', fontWeight: '600', marginLeft: 'auto' },

  // ── Pre-tax info box ──────────────────────────────────────────────────────
  pretaxInfoBox: {
    backgroundColor: '#1e1a2e',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#c084fc44',
  },
  pretaxInfoText: { fontSize: 13, color: '#a0a0a0', lineHeight: 18 },

  // ── Empty states ──────────────────────────────────────────────────────────
  emptyCard:    { padding: 30, alignItems: 'center' },
  emptyText:    { fontSize: 16, color: '#666', marginBottom: 6 },
  emptySubtext: { fontSize: 13, color: '#444', textAlign: 'center' },

  // ── Modals (shared) ───────────────────────────────────────────────────────
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#0a0e1a', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
  modalTitle:   { fontSize: 22, fontWeight: 'bold', color: '#4ade80', marginBottom: 18 },
  label:        { fontSize: 15, fontWeight: 'bold', color: '#fff', marginBottom: 6, marginTop: 14 },
  helperText:   { fontSize: 13, color: '#666', marginBottom: 6, lineHeight: 18 },
  modalInput:   { backgroundColor: '#1a1f2e', borderRadius: 12, padding: 14, fontSize: 16, color: '#fff', borderWidth: 2, borderColor: '#2a2f3e' },

  inputRow:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1f2e', borderRadius: 12, paddingHorizontal: 14, borderWidth: 2, borderColor: '#2a2f3e' },
  currencySymbol:  { fontSize: 20, color: '#4ade80', marginRight: 6 },
  input:           { flex: 1, fontSize: 20, color: '#fff', paddingVertical: 14 },

  // Pill row
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#2a2f3e',
    backgroundColor: '#1a1f2e',
  },
  pillActive:            { borderColor: '#4ade80', backgroundColor: '#1a2f1e' },
  pillActivePurple:      { borderColor: '#c084fc', backgroundColor: '#2a1e3e' },
  pillText:              { fontSize: 13, color: '#666' },
  pillTextActive:        { color: '#4ade80', fontWeight: 'bold' },
  pillTextActivePurple:  { color: '#c084fc', fontWeight: 'bold' },

  monthlyPreview: { fontSize: 14, color: '#4ade80', marginTop: 8, fontWeight: '600' },

  // Account picker
  noAccountsWarn: { fontSize: 14, color: '#ff6b6b', padding: 12, backgroundColor: '#2a1a1e', borderRadius: 8, marginTop: 4 },
  accountList:    { gap: 8 },
  accountOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2a2f3e',
    backgroundColor: '#1a1f2e',
  },
  accountOptionActive:     { borderColor: '#4ade80', backgroundColor: '#1a2f1e' },
  accountOptionName:       { fontSize: 15, color: '#fff', marginBottom: 2 },
  accountOptionNameActive: { color: '#4ade80', fontWeight: 'bold' },
  accountOptionSub:        { fontSize: 12, color: '#666' },
  checkMark:               { fontSize: 18, color: '#4ade80', fontWeight: 'bold' },

  // Modal buttons
  modalButtons:     { flexDirection: 'row', gap: 12, marginTop: 22, marginBottom: 16 },
  modalCancelBtn:   { flex: 1, padding: 16, borderRadius: 12, borderWidth: 2, borderColor: '#2a2f3e', alignItems: 'center' },
  modalCancelText:  { color: '#a0a0a0', fontSize: 16 },
  modalAddBtn:      { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#4ade80', alignItems: 'center' },
  modalAddBtnPurple:{ flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#c084fc', alignItems: 'center' },
  modalBtnDisabled: { opacity: 0.4 },
  modalAddText:     { color: '#0a0e1a', fontSize: 16, fontWeight: 'bold' },

  // ── SKR staking yield card ────────────────────────────────────────────
  skrYieldCard: {
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#f4c430',
  },
  skrYieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  skrYieldTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  skrYieldLogo: { fontSize: 22, color: '#f4c430' },
  skrYieldTitle: { fontSize: 15, fontWeight: 'bold', color: '#fff' },
  skrYieldSub: { fontSize: 12, color: '#666', marginTop: 1 },

  skrYieldApyBadge: {
    backgroundColor: '#f4c43022',
    borderWidth: 1,
    borderColor: '#f4c430',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  skrYieldApyText: { fontSize: 12, fontWeight: 'bold', color: '#f4c430' },

  skrYieldNumbers: { flexDirection: 'row', alignItems: 'center' },
  skrYieldNumCol: { flex: 1, alignItems: 'center' },
  skrYieldNumLabel: { fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 3 },
  skrYieldNumValue: { fontSize: 16, fontWeight: 'bold', color: '#4ade80' },
  skrYieldNumSub: { fontSize: 11, color: '#666', marginTop: 2 },
  skrYieldDivider: { width: 1, height: 40, backgroundColor: '#2a2f3e' },
});
