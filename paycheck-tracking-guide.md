# Complete Paycheck Tracking Implementation

## Overview
You need accurate paycheck tracking with the full waterfall:
**Gross Pay → Pre-Tax Deductions → Taxable Income → Taxes → Post-Tax Deductions → Net Pay**

## Types Updated (`types-with-bank-accounts.ts`)

### New Types Added:
```typescript
PreTaxDeduction   // Medical, Vision, Dental, Life, AD&D, 401k contribution
Tax               // Federal W/H, Social Security, Medicare, State W/H  
PostTaxDeduction  // 401k loan, Enhanced LTD
```

### UserProfile New Fields:
```typescript
preTaxDeductions: PreTaxDeduction[];
taxes: Tax[];
postTaxDeductions: PostTaxDeduction[];
```

## Store Updates Needed (`useStore.ts`)

### 1. Add to initialState:
```typescript
preTaxDeductions: [],
taxes: [],
postTaxDeductions: [],
```

### 2. Add CRUD actions for each:
```typescript
// Pre-tax deductions
addPreTaxDeduction: (deduction: PreTaxDeduction) => void;
removePreTaxDeduction: (id: string) => void;
updatePreTaxDeduction: (id: string, update: Partial<PreTaxDeduction>) => void;

// Taxes  
addTax: (tax: Tax) => void;
removeTax: (id: string) => void;
updateTax: (id: string, update: Partial<Tax>) => void;

// Post-tax deductions
addPostTaxDeduction: (deduction: PostTaxDeduction) => void;
removePostTaxDeduction: (id: string) => void;
updatePostTaxDeduction: (id: string, update: Partial<PostTaxDeduction>) => void;
```

### 3. Add to saveProfile:
```typescript
preTaxDeductions: state.preTaxDeductions || [],
taxes: state.taxes || [],
postTaxDeductions: state.postTaxDeductions || [],
```

### 4. Add to loadProfile merge:
```typescript
preTaxDeductions: saved.preTaxDeductions ?? initialState.preTaxDeductions,
taxes: saved.taxes ?? initialState.taxes,
postTaxDeductions: saved.postTaxDeductions ?? initialState.postTaxDeductions,
```

## Income Tab UI (`tabs-income.tsx`)

### Update Paycheck Waterfall Display:

```tsx
{/* PAYCHECK WATERFALL */}
<View style={styles.waterfallCard}>
  <Text style={styles.waterfallTitle}>Paycheck Breakdown</Text>
  
  {/* Gross */}
  <WaterfallRow label="Gross Pay" amount={grossPay} color="#fff" />
  
  {/* Pre-tax deductions */}
  {preTaxDeductions.map(d => (
    <WaterfallRow key={d.id} label={`  - ${d.name}`} amount={-toMonthly(d)} color="#60a5fa" isIndent />
  ))}
  <WaterfallRow label="= Taxable Income" amount={taxableIncome} color="#4ade80" isBold />
  
  {/* Taxes */}
  {taxes.map(t => (
    <WaterfallRow key={t.id} label={`  - ${t.name}`} amount={-toMonthly(t)} color="#f87171" isIndent />
  ))}
  <WaterfallRow label="= After-Tax Income" amount={afterTaxIncome} color="#4ade80" isBold />
  
  {/* Post-tax deductions */}
  {postTaxDeductions.map(d => (
    <WaterfallRow key={d.id} label={`  - ${d.name}`} amount={-toMonthly(d)} color="#fb923c" isIndent />
  ))}
  <WaterfallRow label="= Net Pay to Bank" amount={netPay} color="#4ade80" isBold isLarge />
</View>
```

### Add Three Sections for Management:

**Section 1: Pre-Tax Deductions**
- List all pre-tax deductions
- "+ Add" button → modal with type dropdown (Medical, Vision, Dental, Life, AD&D, 401k Contribution, Other)
- Each has: name, amount per paycheck, frequency

**Section 2: Taxes**
- List all taxes  
- "+ Add" button → modal with type dropdown (Federal W/H, Social Security, Medicare, State W/H)
- Each has: name, amount per paycheck, frequency

**Section 3: Post-Tax Deductions**
- List all post-tax deductions
- "+ Add" button → modal with type dropdown (401k Loan, Enhanced LTD, Other)
- Each has: name, amount per paycheck, frequency

## 401k Contribution Migration

**IMPORTANT:** 401k contributions need to move from the retirement asset metadata to pre-tax deductions:

1. When user creates a 401k asset with a contribution amount, also create a PreTaxDeduction:
```typescript
{
  id: `pretax_401k_${Date.now()}`,
  name: '401k PreTax BasePay',
  type: '401k_contribution',
  perPayPeriod: contributionAmount,
  frequency: contributionFrequency,
}
```

2. The retirement asset still tracks the contribution for display purposes, but the paycheck waterfall uses the PreTaxDeduction.

## Your Specific Entries

Based on your paycheck, here's what you'll enter:

### Pre-Tax Deductions:
1. Medical Coverage - $X per paycheck
2. Vision Coverage - $X per paycheck
3. Dental Coverage - $X per paycheck
4. Life Insurance - $X per paycheck
5. AD&D Pre-Tax - $X per paycheck
6. 401k PreTax BasePay - $X per paycheck

### Taxes:
1. Federal W/H - $X per paycheck
2. Social Security - $X per paycheck
3. Medicare - $X per paycheck
4. AZ W/H - $X per paycheck

### Post-Tax Deductions:
1. 401k Loan - $X per paycheck
2. Enhanced LTD - $X per paycheck

## Calculation Helper

Add this helper to convert per-paycheck amounts to monthly:
```typescript
function toMonthly(item: { perPayPeriod: number; frequency: string }): number {
  switch (item.frequency) {
    case 'weekly': return (item.perPayPeriod * 52) / 12;
    case 'biweekly': return (item.perPayPeriod * 26) / 12;
    case 'twice_monthly': return item.perPayPeriod * 2;
    case 'monthly': return item.perPayPeriod;
    default: return 0;
  }
}
```

## Priority Implementation Order

1. **Update types** ✓ (done)
2. **Update store** (add new arrays, CRUD actions, save/load)
3. **Update Income tab** (add three sections with management UI)
4. **Add paycheck waterfall display** (visual breakdown)
5. **Test with your actual paycheck data**

This gives you complete, accurate paycheck tracking that matches your actual pay stub.
