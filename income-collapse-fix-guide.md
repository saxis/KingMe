# How to Fix the Collapse Feature in Your Income Tab

Your complete paycheck system IS working. The collapse I added broke it. Here's how to fix it:

## Step 1: Add Collapse State Variables

After line 157 (after the post-tax modal state), add:

```typescript
  // ── collapse state ──────────────────────────────────────────────────────────
  const [waterfallExpanded, setWaterfallExpanded] = useState(false);
  const [preTaxExpanded, setPreTaxExpanded] = useState(false);
  const [taxesExpanded, setTaxesExpanded] = useState(false);
  const [postTaxExpanded, setPostTaxExpanded] = useState(false);
```

## Step 2: Make Waterfall Collapsible

Find this line (around line 320):
```typescript
<Text style={styles.waterfallTitle}>Complete Paycheck Breakdown</Text>
```

Replace it with:
```typescript
<TouchableOpacity
  style={styles.waterfallHeader}
  onPress={() => setWaterfallExpanded(!waterfallExpanded)}
  activeOpacity={0.7}
>
  <Text style={styles.waterfallTitle}>Complete Paycheck Breakdown</Text>
  <Text style={styles.collapseIcon}>{waterfallExpanded ? '▼' : '▶'}</Text>
</TouchableOpacity>

{waterfallExpanded && (
  <>
```

Then find the CLOSING of the waterfall section (should be around line 398, right before the closing `</View>` of waterfallBox). Add:
```typescript
  </>
)}
```

BEFORE that closing `</View>`.

## Step 3: Make Pre-Tax Section Collapsible

Find this section (around line 547):
```typescript
<View style={[styles.sectionHeader, { marginTop: 24 }]}>
  <Text style={styles.sectionTitle}>Pre-Tax Deductions</Text>
  <TouchableOpacity style={styles.addButtonPurple} onPress={() => setShowPreTaxModal(true)}>
```

Replace with:
```typescript
<View style={[styles.sectionHeader, { marginTop: 24 }]}>
  <TouchableOpacity
    style={styles.sectionTitleRow}
    onPress={() => setPreTaxExpanded(!preTaxExpanded)}
    activeOpacity={0.7}
  >
    <Text style={styles.sectionTitle}>Pre-Tax Deductions</Text>
    <Text style={styles.collapseIconPurple}>{preTaxExpanded ? '▼' : '▶'}</Text>
  </TouchableOpacity>
  <TouchableOpacity style={styles.addButtonPurple} onPress={() => setShowPreTaxModal(true)}>
```

Then wrap the content (info box + cards) in:
```typescript
{preTaxExpanded && (
  <>
    ...all the content...
  </>
)}
```

## Step 4: Make Taxes Section Collapsible

Same pattern for the Taxes section (around line 582).

## Step 5: Make Post-Tax Section Collapsible  

Same pattern for Post-Tax Deductions (around line 612).

## Step 6: Add Styles

At the end of the StyleSheet, add:
```typescript
  waterfallHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  collapseIcon: { fontSize: 14, color: '#888', marginLeft: 8 },
  collapseIconPurple: { fontSize: 14, color: '#c084fc', marginLeft: 8 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center' },
```

---

The key issue with my previous attempt: I accidentally replaced your COMPLETE waterfall with the OLD simple waterfall. Your complete waterfall with all the pre-tax/tax/post-tax deductions is perfect - we just need to wrap it in collapse functionality.
