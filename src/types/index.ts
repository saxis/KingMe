// KingMe - Type Definitions

export type AvatarType = 'male-medium' | 'female-medium' | 'male-dark';

export type FreedomState = 'drowning' | 'struggling' | 'breaking' | 'rising' | 'enthroned';

export interface Income {
  salary: number; // annual active income
  otherIncome: number; // annual (side gigs, consulting, etc.)
  assetIncome: number; // auto-calculated from assets
}

export type AssetType = 'crypto' | 'defi' | 'real_estate' | 'stocks' | 'business' | 'other';

export interface Asset {
  id: string;
  type: AssetType;
  name: string;
  value: number; // current market value
  annualIncome: number; // what it generates per year
  metadata: CryptoAsset | RealEstateAsset | StockAsset | BusinessAsset | OtherAsset;
}

// Crypto-specific (auto-tracked via Solana)
export interface CryptoAsset {
  type: 'crypto';
  tokenMint?: string; // for SPL tokens
  quantity: number;
  protocol?: string; // 'Kamino', 'MarginFi', 'Marinade', etc.
  apy?: number;
  isStaked: boolean;
  walletAddress: string; // which connected wallet
}

// Real estate (manual entry, post-hackathon module)
export interface RealEstateAsset {
  type: 'real_estate';
  address: string;
  purchasePrice: number;
  currentValue: number;
  monthlyRentalIncome?: number;
  monthlyExpenses?: number; // mortgage, taxes, insurance, maintenance
}

// Stocks/bonds (manual entry)
export interface StockAsset {
  type: 'stocks';
  ticker?: string;
  shares: number;
  currentPrice: number;
  dividendYield?: number;
}

// Business interests (manual entry)
export interface BusinessAsset {
  type: 'business';
  equityPercent: number;
  valuation: number;
  annualDistributions: number;
}

// Other assets
export interface OtherAsset {
  type: 'other';
  description: string;
}

export type ObligationCategory = 'housing' | 'utilities' | 'insurance' | 'debt_service' | 'daily_living' | 'other';

export interface Obligation {
  id: string;
  name: string;
  amount: number; // monthly
  category: ObligationCategory;
  isRecurring: boolean;
}

export type DesirePriority = 'high' | 'medium' | 'low';

export interface Desire {
  id: string;
  name: string;
  estimatedCost: number;
  priority: DesirePriority;
  targetDate?: string; // ISO date string
  notes?: string;
  researchedProduct?: {
    name: string;
    price: number;
    url?: string;
    description?: string;
  };
  createdAt: string;
  completedAt?: string;
}

export interface Debt {
  id: string;
  name: string;
  principal: number;
  interestRate: number; // as decimal (0.07 for 7%)
  monthlyPayment: number;
  minimumPayment: number;
}

export interface FreedomScoreHistory {
  date: string; // ISO date string
  days: number;
  assetIncome: number;
  totalNeeds: number;
}

export interface UserSettings {
  avatarType: AvatarType;
  notificationsEnabled: boolean;
  syncFrequency: 'realtime' | 'hourly' | 'daily';
  darkMode: boolean;
}

export interface UserProfile {
  wallets: string[]; // Solana pubkeys
  income: Income;
  assets: Asset[]; // both auto-tracked and manual
  obligations: Obligation[];
  desires: Desire[];
  debts: Debt[];
  freedomHistory: FreedomScoreHistory[];
  settings: UserSettings;
  lastSynced?: string; // ISO timestamp
  onboardingComplete: boolean;
}

// Helius ORB API response types (simplified)
export interface HeliusToken {
  mint: string;
  symbol: string;
  balance: number;
  price: number;
  decimals: number;
}

export interface HeliusDeFiPosition {
  protocol: string;
  type: 'staked' | 'lending' | 'liquidity';
  positionId: string;
  value: number;
  amount: number;
  underlyingToken: string;
  apy: number;
}

export interface HeliusWalletData {
  address: string;
  tokens: HeliusToken[];
  defiPositions?: HeliusDeFiPosition[];
  nativeBalance: number; // SOL balance
}

// Freedom calculation result
export interface FreedomResult {
  days: number; // days of freedom
  formatted: string; // "32 days", "2 years", "Forever"
  state: FreedomState; // which avatar state to show
  dailyAssetIncome: number;
  dailyNeeds: number;
  isKinged: boolean; // true if infinite freedom
}
