// app/(tabs)/trading.tsx
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useState, useMemo } from 'react';
import { useStore } from '../src/store/useStore';
import type { DriftTrade, DriftTradeDirection, DriftTradeAsset } from '../src/types';

// ─── helpers ──────────────────────────────────────────────────────────────────
function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCurrency(amt: number): string {
  return `$${Math.abs(amt).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── component ────────────────────────────────────────────────────────────────
export default function TradingScreen() {
  const driftTrades        = useStore((s) => s.driftTrades || []);
  const addDriftTrade      = useStore((s) => s.addDriftTrade);
  const removeDriftTrade   = useStore((s) => s.removeDriftTrade);
  const bankAccounts       = useStore((s) => s.bankAccounts);

  // ── trade form state ───────────────────────────────────────────────────────
  const [showModal, setShowModal]       = useState(false);
  const [date, setDate]                 = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [asset, setAsset]               = useState<DriftTradeAsset>('ETH');
  const [direction, setDirection]       = useState<DriftTradeDirection>('long');
  const [sizeInTokens, setSizeInTokens] = useState(''); // e.g. "5 ETH" — enter the token amount
  const [entryPrice, setEntryPrice]     = useState('');
  const [exitPrice, setExitPrice]       = useState('');
  const [actualPnL, setActualPnL]       = useState(''); // The real PnL from Drift (after fees)
  const [notes, setNotes]               = useState('');

  // ── profit allocation (only shown when PnL > 0) ────────────────────────────
  const [allocCryptoComCard, setAllocCryptoComCard] = useState('175'); // default $175/day
  const [allocBank, setAllocBank]                   = useState('');
  const [allocCryptoBuys, setAllocCryptoBuys]       = useState('');
  const [allocLeftInDrift, setAllocLeftInDrift]     = useState('');

  // ── derived: USD size, theoretical PnL, and fees ───────────────────────────
  const tokens = parseFloat(sizeInTokens) || 0;
  const entry = parseFloat(entryPrice) || 0;
  const exit = parseFloat(exitPrice) || 0;
  const sizeUsd = tokens * entry; // position size in USD

  // Theoretical PnL (before fees)
  const calcTheoreticalPnL = (): number => {
    if (tokens === 0 || entry === 0 || exit === 0) return 0;
    // PnL = tokens * (exit - entry) for longs
    //       tokens * (entry - exit) for shorts
    return direction === 'long' ? tokens * (exit - entry) : tokens * (entry - exit);
  };

  const theoreticalPnL = calcTheoreticalPnL();
  const realPnL = parseFloat(actualPnL) || 0;
  const fees = theoreticalPnL - realPnL; // fees = what you should have made - what you actually made
  const isProfitable = realPnL > 0;

  // Auto-fill allocation leftInDrift when other fields change
  const totalAllocated = (parseFloat(allocCryptoComCard) || 0)
                       + (parseFloat(allocBank) || 0)
                       + (parseFloat(allocCryptoBuys) || 0)
                       + (parseFloat(allocLeftInDrift) || 0);
  const allocationGap = isProfitable ? realPnL - totalAllocated : 0;

  // ── monthly stats ──────────────────────────────────────────────────────────
  const { thisMonthPnL, thisMonthWins, thisMonthLosses, thisMonthTotalAllocated, thisMonthTotalFees } = useMemo(() => {
    const now = new Date();
    const thisYear = now.getFullYear();
    const thisMonth = now.getMonth();

    const monthTrades = driftTrades.filter((t) => {
      const td = new Date(t.date);
      return td.getFullYear() === thisYear && td.getMonth() === thisMonth;
    });

    const pnl = monthTrades.reduce((sum, t) => sum + t.pnlUsdc, 0);
    const wins = monthTrades.filter((t) => t.pnlUsdc > 0).length;
    const losses = monthTrades.filter((t) => t.pnlUsdc < 0).length;
    const totalAlloc = monthTrades.reduce((sum, t) => {
      if (!t.allocation) return sum;
      return sum + t.allocation.toCryptoComCard + t.allocation.toBankAccounts
                 + t.allocation.toCryptoBuys + t.allocation.leftInDrift;
    }, 0);
    const totalFees = monthTrades.reduce((sum, t) => sum + (t.fees || 0), 0);

    return {
      thisMonthPnL: pnl,
      thisMonthWins: wins,
      thisMonthLosses: losses,
      thisMonthTotalAllocated: totalAlloc,
      thisMonthTotalFees: totalFees
    };
  }, [driftTrades]);

  // ── handlers ───────────────────────────────────────────────────────────────
  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setAsset('ETH');
    setDirection('long');
    setSizeInTokens('');
    setEntryPrice('');
    setExitPrice('');
    setActualPnL('');
    setNotes('');
    setAllocCryptoComCard('175');
    setAllocBank('');
    setAllocCryptoBuys('');
    setAllocLeftInDrift('');
    setShowModal(false);
  };

  const handleAddTrade = () => {
    if (!sizeInTokens || !entryPrice || !exitPrice || !actualPnL) return;

    const trade: DriftTrade = {
      id: Date.now().toString(),
      date: new Date(date).toISOString(),
      asset,
      direction,
      size: sizeUsd, // store the USD size
      entryPrice: entry,
      exitPrice: exit,
      pnlUsdc: realPnL, // store the ACTUAL PnL from Drift
      fees: fees, // calculated difference
      notes: notes || undefined,
      allocation: isProfitable ? {
        toCryptoComCard: parseFloat(allocCryptoComCard) || 0,
        toBankAccounts:  parseFloat(allocBank) || 0,
        toCryptoBuys:    parseFloat(allocCryptoBuys) || 0,
        leftInDrift:     parseFloat(allocLeftInDrift) || 0,
      } : undefined,
    };

    addDriftTrade(trade);
    resetForm();
  };

  const handleRemove = (tradeId: string) => {
    removeDriftTrade(tradeId);
  };

  // Sort trades by date desc (most recent first)
  const sortedTrades = [...driftTrades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ══════════════════════════════════════════════════════════════════════
            MONTHLY SUMMARY
            ══════════════════════════════════════════════════════════════════════ */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>This Month</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Net PnL</Text>
              <Text style={[styles.summaryValue, { color: thisMonthPnL >= 0 ? '#4ade80' : '#ff6b6b' }]}>
                {thisMonthPnL >= 0 ? '+' : ''}{formatCurrency(thisMonthPnL)}
              </Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Fees Paid</Text>
              <Text style={[styles.summaryValue, { fontSize: 16, color: '#ff9f43' }]}>{formatCurrency(thisMonthTotalFees)}</Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>W / L</Text>
              <Text style={styles.summaryValue}>{thisMonthWins} / {thisMonthLosses}</Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Allocated</Text>
              <Text style={[styles.summaryValue, { fontSize: 14 }]}>{formatCurrency(thisMonthTotalAllocated)}</Text>
            </View>
          </View>
        </View>

        {/* ══════════════════════════════════════════════════════════════════════
            TRADE LIST
            ══════════════════════════════════════════════════════════════════════ */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trade Journal</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
            <Text style={styles.addButtonText}>+ Log Trade</Text>
          </TouchableOpacity>
        </View>

        {sortedTrades.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No trades logged yet</Text>
            <Text style={styles.emptySubtext}>Tap "+ Log Trade" to record your first Drift perpetuals trade.</Text>
          </View>
        ) : (
          sortedTrades.map((trade) => (
            <View key={trade.id} style={styles.tradeCard}>
              <View style={styles.tradeHeader}>
                <View style={styles.tradeHeaderLeft}>
                  <Text style={styles.tradeAsset}>{trade.asset}</Text>
                  <View style={[
                    styles.directionBadge,
                    { backgroundColor: trade.direction === 'long' ? '#1a3a2a' : '#3a1a2a' }
                  ]}>
                    <Text style={[
                      styles.directionText,
                      { color: trade.direction === 'long' ? '#4ade80' : '#f87171' }
                    ]}>
                      {trade.direction.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.tradeDate}>{formatDate(trade.date)}</Text>
                </View>
                <TouchableOpacity onPress={() => handleRemove(trade.id)}>
                  <Text style={styles.deleteBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.tradeRow}>
                <View style={styles.tradeDetail}>
                  <Text style={styles.tradeDetailLabel}>Size</Text>
                  <Text style={styles.tradeDetailValue}>{formatCurrency(trade.size)}</Text>
                </View>
                <View style={styles.tradeDetail}>
                  <Text style={styles.tradeDetailLabel}>Entry</Text>
                  <Text style={styles.tradeDetailValue}>{formatCurrency(trade.entryPrice)}</Text>
                </View>
                <View style={styles.tradeDetail}>
                  <Text style={styles.tradeDetailLabel}>Exit</Text>
                  <Text style={styles.tradeDetailValue}>{formatCurrency(trade.exitPrice)}</Text>
                </View>
                <View style={styles.tradeDetail}>
                  <Text style={styles.tradeDetailLabel}>PnL</Text>
                  <Text style={[
                    styles.tradePnL,
                    { color: trade.pnlUsdc >= 0 ? '#4ade80' : '#ff6b6b' }
                  ]}>
                    {trade.pnlUsdc >= 0 ? '+' : ''}{formatCurrency(trade.pnlUsdc)}
                  </Text>
                </View>
              </View>

              {trade.notes && (
                <Text style={styles.tradeNotes}>💭 {trade.notes}</Text>
              )}

              {trade.allocation && (
                <View style={styles.allocationBox}>
                  <Text style={styles.allocationTitle}>Profit Allocation</Text>
                  <View style={styles.allocationRow}>
                    {trade.allocation.toCryptoComCard > 0 && (
                      <Text style={styles.allocationItem}>💳 {formatCurrency(trade.allocation.toCryptoComCard)}</Text>
                    )}
                    {trade.allocation.toBankAccounts > 0 && (
                      <Text style={styles.allocationItem}>🏦 {formatCurrency(trade.allocation.toBankAccounts)}</Text>
                    )}
                    {trade.allocation.toCryptoBuys > 0 && (
                      <Text style={styles.allocationItem}>₿ {formatCurrency(trade.allocation.toCryptoBuys)}</Text>
                    )}
                    {trade.allocation.leftInDrift > 0 && (
                      <Text style={styles.allocationItem}>🎯 {formatCurrency(trade.allocation.leftInDrift)}</Text>
                    )}
                  </View>
                </View>
              )}
            </View>
          ))
        )}

      </ScrollView>

      {/* ═══════════════ ADD TRADE MODAL ═══════════════ */}
      <Modal visible={showModal} animationType="slide" transparent={true} onRequestClose={resetForm}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Log Trade</Text>

              {/* Date */}
              <Text style={styles.label}>Date</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#666"
                value={date}
                onChangeText={setDate}
              />

              {/* Asset */}
              <Text style={styles.label}>Asset</Text>
              <View style={styles.pillRow}>
                {(['ETH', 'SOL', 'BTC', 'other'] as DriftTradeAsset[]).map((a) => (
                  <TouchableOpacity
                    key={a}
                    style={[styles.pill, asset === a && styles.pillActive]}
                    onPress={() => setAsset(a)}
                  >
                    <Text style={[styles.pillText, asset === a && styles.pillTextActive]}>{a}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Direction */}
              <Text style={styles.label}>Direction</Text>
              <View style={styles.pillRow}>
                {(['long', 'short'] as DriftTradeDirection[]).map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.pill, direction === d && styles.pillActive]}
                    onPress={() => setDirection(d)}
                  >
                    <Text style={[styles.pillText, direction === d && styles.pillTextActive]}>
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Size in tokens */}
              <Text style={styles.label}>Position Size ({asset})</Text>
              <Text style={styles.helperText}>Enter the amount in {asset} (e.g., 5 for "5 ETH")</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  value={sizeInTokens}
                  onChangeText={setSizeInTokens}
                />
                <Text style={styles.tokenLabel}>{asset}</Text>
              </View>
              {sizeUsd > 0 && (
                <Text style={styles.sizePreview}>≈ ${sizeUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD</Text>
              )}

              {/* Entry */}
              <Text style={styles.label}>Entry Price</Text>
              <View style={styles.inputRow}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  value={entryPrice}
                  onChangeText={setEntryPrice}
                />
              </View>

              {/* Exit */}
              <Text style={styles.label}>Exit Price</Text>
              <View style={styles.inputRow}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  value={exitPrice}
                  onChangeText={setExitPrice}
                />
              </View>

              {/* Theoretical PnL (before fees) */}
              {sizeInTokens && entryPrice && exitPrice && (
                <View style={styles.pnlTheoryBox}>
                  <Text style={styles.pnlTheoryLabel}>Theoretical PnL (before fees)</Text>
                  <Text style={[styles.pnlTheoryValue, { color: theoreticalPnL >= 0 ? '#4ade80' : '#ff6b6b' }]}>
                    {theoreticalPnL >= 0 ? '+' : ''}{formatCurrency(theoreticalPnL)}
                  </Text>
                </View>
              )}

              {/* Actual PnL from Drift (after fees) */}
              <Text style={styles.label}>Actual PnL (from Drift)</Text>
              <Text style={styles.helperText}>Copy the exact P&L from Drift — this includes fees</Text>
              <View style={styles.inputRow}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  value={actualPnL}
                  onChangeText={setActualPnL}
                />
              </View>

              {/* Fees breakdown */}
              {sizeInTokens && entryPrice && exitPrice && actualPnL && (
                <View style={styles.feesBox}>
                  <View style={styles.feesRow}>
                    <Text style={styles.feesLabel}>Trading Fees:</Text>
                    <Text style={styles.feesValue}>{formatCurrency(fees)}</Text>
                  </View>
                  <Text style={styles.feesSubtext}>
                    = Theoretical ({formatCurrency(theoreticalPnL)}) - Actual ({formatCurrency(realPnL)})
                  </Text>
                </View>
              )}

              {/* Profit Allocation (only when profitable) */}
              {isProfitable && (
                <>
                  <Text style={[styles.label, { marginTop: 20 }]}>Profit Allocation</Text>
                  <Text style={styles.helperText}>Where did the USDC profit go?</Text>

                  <View style={styles.allocRow}>
                    <Text style={styles.allocLabel}>💳 crypto.com Card</Text>
                    <View style={[styles.inputRow, { flex: 1 }]}>
                      <Text style={styles.currencySymbol}>$</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="175"
                        placeholderTextColor="#666"
                        keyboardType="numeric"
                        value={allocCryptoComCard}
                        onChangeText={setAllocCryptoComCard}
                      />
                    </View>
                  </View>

                  <View style={styles.allocRow}>
                    <Text style={styles.allocLabel}>🏦 Bank Transfer</Text>
                    <View style={[styles.inputRow, { flex: 1 }]}>
                      <Text style={styles.currencySymbol}>$</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="0"
                        placeholderTextColor="#666"
                        keyboardType="numeric"
                        value={allocBank}
                        onChangeText={setAllocBank}
                      />
                    </View>
                  </View>

                  <View style={styles.allocRow}>
                    <Text style={styles.allocLabel}>₿ Crypto Buys</Text>
                    <View style={[styles.inputRow, { flex: 1 }]}>
                      <Text style={styles.currencySymbol}>$</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="0"
                        placeholderTextColor="#666"
                        keyboardType="numeric"
                        value={allocCryptoBuys}
                        onChangeText={setAllocCryptoBuys}
                      />
                    </View>
                  </View>

                  <View style={styles.allocRow}>
                    <Text style={styles.allocLabel}>🎯 Left in Drift</Text>
                    <View style={[styles.inputRow, { flex: 1 }]}>
                      <Text style={styles.currencySymbol}>$</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="0"
                        placeholderTextColor="#666"
                        keyboardType="numeric"
                        value={allocLeftInDrift}
                        onChangeText={setAllocLeftInDrift}
                      />
                    </View>
                  </View>

                  {allocationGap !== 0 && (
                    <Text style={[styles.allocationGap, { color: allocationGap > 0 ? '#ff9f43' : '#ff6b6b' }]}>
                      ⚠️ {allocationGap > 0 ? `${formatCurrency(allocationGap)} unallocated` : `Over by ${formatCurrency(allocationGap)}`}
                    </Text>
                  )}
                </>
              )}

              {/* Notes */}
              <Text style={styles.label}>Notes (optional)</Text>
              <TextInput
                style={[styles.modalInput, { height: 80 }]}
                placeholder="e.g., caught the breakout, stopped out early"
                placeholderTextColor="#666"
                multiline
                value={notes}
                onChangeText={setNotes}
              />

              {/* Buttons */}
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={resetForm}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalAddBtn, (!sizeInTokens || !entryPrice || !exitPrice || !actualPnL) && styles.modalBtnDisabled]}
                  onPress={handleAddTrade}
                  disabled={!sizeInTokens || !entryPrice || !exitPrice || !actualPnL}
                >
                  <Text style={styles.modalAddText}>Add Trade</Text>
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
  scroll: { flex: 1, padding: 20 },

  // ── Summary ───────────────────────────────────────────────────────────────
  summaryBox: {
    backgroundColor: '#1a1f2e',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2a2f3e',
  },
  summaryTitle: { fontSize: 13, color: '#666', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryCol: { alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: '#666', marginBottom: 4 },
  summaryValue: { fontSize: 20, fontWeight: 'bold', color: '#fff' },

  // ── Section ───────────────────────────────────────────────────────────────
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  addButton: { backgroundColor: '#4ade80', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  addButtonText: { color: '#0a0e1a', fontWeight: 'bold', fontSize: 14 },

  // ── Empty ─────────────────────────────────────────────────────────────────
  emptyCard: { padding: 30, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#666', marginBottom: 6 },
  emptySubtext: { fontSize: 13, color: '#444', textAlign: 'center' },

  // ── Trade cards ───────────────────────────────────────────────────────────
  tradeCard: {
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#60a5fa',
  },
  tradeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  tradeHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tradeAsset: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  directionBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  directionText: { fontSize: 11, fontWeight: 'bold' },
  tradeDate: { fontSize: 12, color: '#666' },
  deleteBtn: { fontSize: 18, color: '#ff4444', padding: 2 },

  tradeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  tradeDetail: { flex: 1, alignItems: 'center' },
  tradeDetailLabel: { fontSize: 10, color: '#666', marginBottom: 2 },
  tradeDetailValue: { fontSize: 14, fontWeight: '600', color: '#fff' },
  tradePnL: { fontSize: 16, fontWeight: 'bold' },

  tradeNotes: { fontSize: 12, color: '#a0a0a0', marginTop: 6, fontStyle: 'italic' },

  // allocation box
  allocationBox: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#2a2f3e' },
  allocationTitle: { fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
  allocationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  allocationItem: { fontSize: 12, color: '#4ade80', backgroundColor: '#1a2f1e', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },

  // ── Modal ─────────────────────────────────────────────────────────────────
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#0a0e1a', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#4ade80', marginBottom: 18 },

  label: { fontSize: 15, fontWeight: 'bold', color: '#fff', marginBottom: 6, marginTop: 14 },
  helperText: { fontSize: 13, color: '#666', marginBottom: 6, lineHeight: 18 },
  modalInput: { backgroundColor: '#1a1f2e', borderRadius: 12, padding: 14, fontSize: 16, color: '#fff', borderWidth: 2, borderColor: '#2a2f3e' },

  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1f2e', borderRadius: 12, paddingHorizontal: 14, borderWidth: 2, borderColor: '#2a2f3e' },
  currencySymbol: { fontSize: 20, color: '#4ade80', marginRight: 6 },
  input: { flex: 1, fontSize: 20, color: '#fff', paddingVertical: 14 },
  tokenLabel: { fontSize: 16, color: '#a0a0a0', marginLeft: 8, fontWeight: '600' },
  sizePreview: { fontSize: 14, color: '#4ade80', marginTop: 6, fontWeight: '600' },

  // pills
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 2, borderColor: '#2a2f3e', backgroundColor: '#1a1f2e' },
  pillActive: { borderColor: '#4ade80', backgroundColor: '#1a2f1e' },
  pillText: { fontSize: 13, color: '#666' },
  pillTextActive: { color: '#4ade80', fontWeight: 'bold' },

  // Theoretical PnL and Fees
  pnlTheoryBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#1a1f2e',
    borderWidth: 1,
    borderColor: '#2a2f3e',
  },
  pnlTheoryLabel: { fontSize: 11, color: '#666', marginBottom: 4 },
  pnlTheoryValue: { fontSize: 18, fontWeight: 'bold' },

  feesBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#2a1a1a',
    borderWidth: 1,
    borderColor: '#ff9f43',
  },
  feesRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  feesLabel: { fontSize: 13, color: '#a0a0a0' },
  feesValue: { fontSize: 16, fontWeight: 'bold', color: '#ff9f43' },
  feesSubtext: { fontSize: 11, color: '#666', lineHeight: 16 },

  // allocation inputs
  allocRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  allocLabel: { fontSize: 14, color: '#a0a0a0', minWidth: 120 },
  allocationGap: { fontSize: 13, fontWeight: '600', marginTop: 8, textAlign: 'center' },

  // buttons
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 22, marginBottom: 16 },
  modalCancelBtn: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 2, borderColor: '#2a2f3e', alignItems: 'center' },
  modalCancelText: { color: '#a0a0a0', fontSize: 16 },
  modalAddBtn: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#4ade80', alignItems: 'center' },
  modalBtnDisabled: { opacity: 0.4 },
  modalAddText: { color: '#0a0e1a', fontSize: 16, fontWeight: 'bold' },
});
