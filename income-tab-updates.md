# Income Tab Updates for Complete Paycheck Tracking

## 1. UPDATE IMPORTS (line 7)

```typescript
import type { IncomeSource, PaycheckDeduction, PaycheckDeductionType, PreTaxDeduction, PreTaxDeductionType, Tax, TaxType, PostTaxDeduction, PostTaxDeductionType } from '../../src/types';
```

## 2. ADD NEW LABELS (after line 44)

```typescript
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
```

## 3. ADD STORE ACTIONS (after line 62)

```typescript
  const preTaxDeductions      = useStore((s) => s.preTaxDeductions || []);
  const taxes                 = useStore((s) => s.taxes || []);
  const postTaxDeductions     = useStore((s) => s.postTaxDeductions || []);
  const addPreTaxDeduction    = useStore((s) => s.addPreTaxDeduction);
  const removePreTaxDeduction = useStore((s) => s.removePreTaxDeduction);
  const addTax                = useStore((s) => s.addTax);
  const removeTax             = useStore((s) => s.removeTax);
  const addPostTaxDeduction   = useStore((s) => s.addPostTaxDeduction);
  const removePostTaxDeduction = useStore((s) => s.removePostTaxDeduction);
```

## 4. ADD NEW MODAL STATE (after line 91)

```typescript
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
```

## 5. ADD NEW HANDLERS (after handleAddDeduction, around line 122)

```typescript
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
```

## 6. UPDATE DERIVED NUMBERS (replace lines 124-139)

```typescript
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
```

## 7. REPLACE WATERFALL SECTION (replace lines 180-225 with this)

```tsx
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
```

## 8. ADD THREE NEW SECTIONS (after SKR section, before the old Pre-Tax Deductions section around line 450)

```tsx
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
```

## 9. ADD THREE NEW MODALS (before closing </View>, after existing deduction modal around line 780)

```tsx
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
```

## 10. ADD NEW STYLES (at end of styles object, before closing })

```typescript
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
```

This gives you complete paycheck tracking with the full waterfall!
