// src/utils/assetCalculations.ts - All asset calculation logic
import type { Asset, BankAccount } from '../types';

export interface AssetsByCategory {
  brokerage: Asset[];
  cash: Asset[];
  realEstate: Asset[];
  commodities: Asset[];
  crypto: Asset[];
  retirement: Asset[];
}

export function categorizeAssets(assets: Asset[], bankAccounts: BankAccount[]): AssetsByCategory {
  // Convert bank accounts to asset objects
  const bankAssets: Asset[] = bankAccounts.map((account) => ({
    id: `bank_${account.id}`,
    type: 'bank_account' as const,
    name: account.name,
    value: typeof account.currentBalance === 'number' ? account.currentBalance : 0,
    annualIncome: 0, // We'll calculate based on APY
    metadata: {
      type: 'bank_account' as const,
      accountType: account.type,
      institution: account.institution,
      apy: account.type === 'savings' ? 4.5 : account.type === 'checking' ? 0.5 : 0,
    },
  }));

  return {
    brokerage: assets.filter(a => a.type === 'stocks'),
    cash: bankAssets,
    realEstate: assets.filter(a => a.type === 'real_estate'),
    commodities: assets.filter(a => a.type === 'other' && a.name.toLowerCase().includes('gold')), // Simple heuristic
    crypto: assets.filter(a => a.type === 'crypto' || a.type === 'defi'),
    retirement: assets.filter(a => a.type === 'retirement'),
  };
}

export function calculateCategoryTotal(assets: Asset[]): number {
  return assets.reduce((sum, a) => sum + a.value, 0);
}

export function calculateCategoryIncome(assets: Asset[]): number {
  return assets.reduce((sum, a) => sum + a.annualIncome, 0);
}

export function calculateTotalValue(categorized: AssetsByCategory): number {
  return (
    calculateCategoryTotal(categorized.brokerage) +
    calculateCategoryTotal(categorized.cash) +
    calculateCategoryTotal(categorized.realEstate) +
    calculateCategoryTotal(categorized.commodities) +
    calculateCategoryTotal(categorized.crypto) +
    calculateCategoryTotal(categorized.retirement)
  );
}

export function calculateTotalIncome(categorized: AssetsByCategory): number {
  return (
    calculateCategoryIncome(categorized.brokerage) +
    calculateCategoryIncome(categorized.cash) +
    calculateCategoryIncome(categorized.realEstate) +
    calculateCategoryIncome(categorized.commodities) +
    calculateCategoryIncome(categorized.crypto) +
    calculateCategoryIncome(categorized.retirement)
  );
}

export function getCategoryIcon(category: keyof AssetsByCategory): string {
  const icons = {
    brokerage: '📈',
    cash: '💵',
    realEstate: '🏠',
    commodities: '🥇',
    crypto: '₿',
    retirement: '🏛️',
  };
  return icons[category];
}

export function getCategoryLabel(category: keyof AssetsByCategory): string {
  const labels = {
    brokerage: 'Brokerage',
    cash: 'Cash',
    realEstate: 'Real Estate',
    commodities: 'Commodities',
    crypto: 'Crypto',
    retirement: 'Retirement',
  };
  return labels[category];
}
