// src/services/drift-income-sync.ts
// Auto-syncs Drift trading PnL to Income tab as a "Drift Trading" source

import type { DriftTrade, IncomeSource } from '../types';

const DRIFT_INCOME_SOURCE_ID = 'drift_trading_income';

/**
 * Calculate current month's total PnL from all drift trades
 */
export function calculateMonthlyDriftPnL(trades: DriftTrade[]): number {
  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth();

  return trades
    .filter((t) => {
      const td = new Date(t.date);
      return td.getFullYear() === thisYear && td.getMonth() === thisMonth;
    })
    .reduce((sum, t) => sum + t.pnlUsdc, 0);
}

/**
 * Sync monthly Drift PnL to income sources.
 * Called automatically after adding/removing/updating a trade.
 * 
 * Strategy:
 * - If monthly PnL > 0: create/update "Drift Trading" income source with amount = monthly PnL
 * - If monthly PnL <= 0: remove the "Drift Trading" income source (losses don't count as income)
 * 
 * @param trades - All drift trades
 * @param incomeSources - Current income sources
 * @param bankAccountId - Which account the Drift profits deposit into (user's primary or Drift collateral account)
 * @returns Updated income sources array
 */
export function syncDriftIncomeSource(
  trades: DriftTrade[],
  incomeSources: IncomeSource[],
  bankAccountId: string
): IncomeSource[] {
  const monthlyPnL = calculateMonthlyDriftPnL(trades);
  
  // Remove existing Drift income source if present
  const otherSources = incomeSources.filter((s) => s.id !== DRIFT_INCOME_SOURCE_ID);

  // If profitable this month, add/update the Drift income source
  if (monthlyPnL > 0) {
    const driftSource: IncomeSource = {
      id: DRIFT_INCOME_SOURCE_ID,
      source: 'trading',
      name: 'Drift Trading (This Month)',
      amount: monthlyPnL,
      frequency: 'monthly',
      bankAccountId,
    };
    return [...otherSources, driftSource];
  }

  // If monthly PnL <= 0, just return sources without Drift (it's removed)
  return otherSources;
}

/**
 * Get the appropriate bank account ID for Drift income.
 * Priority:
 * 1. User's crypto.com card account (if exists and named appropriately)
 * 2. First checking account
 * 3. First account of any type
 * 4. Empty string (user will need to set manually)
 */
export function getDefaultDriftIncomeAccount(bankAccounts: Array<{ id: string; name: string; type: string }>): string {
  // Try to find crypto.com card account
  const cryptoComCard = bankAccounts.find((a) => 
    a.name.toLowerCase().includes('crypto.com') || a.name.toLowerCase().includes('cryptocom')
  );
  if (cryptoComCard) return cryptoComCard.id;

  // Fall back to first checking account
  const checking = bankAccounts.find((a) => a.type === 'checking');
  if (checking) return checking.id;

  // Fall back to any account
  if (bankAccounts.length > 0) return bankAccounts[0].id;

  return '';
}
