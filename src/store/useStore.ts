// src/store/useStore.ts
import { create } from 'zustand';
import type { UserProfile, Asset, Obligation, Desire, Debt, Income, AvatarType } from '../types';
import { saveUserProfile, loadUserProfile } from '../services/storage';
import { calculateFreedom } from '../utils/calculations';

interface AppState extends UserProfile {
  // Actions
  setAvatarType: (avatarType: AvatarType) => void;
  setIncome: (income: Partial<Income>) => void;
  addAsset: (asset: Asset) => void;
  removeAsset: (assetId: string) => void;
  updateAsset: (assetId: string, asset: Partial<Asset>) => void;
  addObligation: (obligation: Obligation) => void;
  removeObligation: (obligationId: string) => void;
  updateObligation: (obligationId: string, obligation: Partial<Obligation>) => void;
  addDesire: (desire: Desire) => void;
  removeDesire: (desireId: string) => void;
  updateDesire: (desireId: string, desire: Partial<Desire>) => void;
  addDebt: (debt: Debt) => void;
  removeDebt: (debtId: string) => void;
  updateDebt: (debtId: string, debt: Partial<Debt>) => void;
  completeOnboarding: () => void;
  loadProfile: (walletAddress: string) => Promise<void>;
  saveProfile: () => Promise<void>;
  resetStore: () => void;
}

const initialState: UserProfile = {
  wallets: [],
  income: {
    salary: 0,
    otherIncome: 0,
    assetIncome: 0,
  },
  assets: [],
  obligations: [],
  desires: [],
  debts: [],
  freedomHistory: [],
  settings: {
    avatarType: 'male-medium',
    notificationsEnabled: true,
    syncFrequency: 'hourly',
    darkMode: true,
  },
  onboardingComplete: false,
};

export const useStore = create<AppState>((set, get) => ({
  ...initialState,

  setAvatarType: (avatarType) =>
    set((state) => ({
      settings: { ...state.settings, avatarType },
    })),

  setIncome: (income) =>
    set((state) => ({
      income: { ...state.income, ...income },
    })),

  addAsset: (asset) =>
    set((state) => {
      const newAssets = [...state.assets, asset];
      return { assets: newAssets };
    }),

  removeAsset: (assetId) =>
    set((state) => ({
      assets: state.assets.filter((a) => a.id !== assetId),
    })),

  updateAsset: (assetId, assetUpdate) =>
    set((state) => ({
      assets: state.assets.map((a) =>
        a.id === assetId ? { ...a, ...assetUpdate } : a
      ),
    })),

  addObligation: (obligation) =>
    set((state) => ({
      obligations: [...state.obligations, obligation],
    })),

  removeObligation: (obligationId) =>
    set((state) => ({
      obligations: state.obligations.filter((o) => o.id !== obligationId),
    })),

  updateObligation: (obligationId, obligationUpdate) =>
    set((state) => ({
      obligations: state.obligations.map((o) =>
        o.id === obligationId ? { ...o, ...obligationUpdate } : o
      ),
    })),

  addDesire: (desire) =>
    set((state) => ({
      desires: [...state.desires, desire],
    })),

  removeDesire: (desireId) =>
    set((state) => ({
      desires: state.desires.filter((d) => d.id !== desireId),
    })),

  updateDesire: (desireId, desireUpdate) =>
    set((state) => ({
      desires: state.desires.map((d) =>
        d.id === desireId ? { ...d, ...desireUpdate } : d
      ),
    })),

  addDebt: (debt) =>
    set((state) => ({
      debts: [...state.debts, debt],
    })),

  removeDebt: (debtId) =>
    set((state) => ({
      debts: state.debts.filter((d) => d.id !== debtId),
    })),

  updateDebt: (debtId, debtUpdate) =>
    set((state) => ({
      debts: state.debts.map((d) =>
        d.id === debtId ? { ...d, ...debtUpdate } : d
      ),
    })),

  completeOnboarding: () => {
    const state = get();
    
    // Calculate and save freedom score
    const freedom = calculateFreedom(state);
    const newHistory = [
      ...state.freedomHistory,
      {
        date: new Date().toISOString(),
        days: freedom.days,
        assetIncome: freedom.dailyAssetIncome * 365,
        totalNeeds: freedom.dailyNeeds * 365,
      },
    ];

    set({
      onboardingComplete: true,
      freedomHistory: newHistory,
    });

    // Save to storage
    get().saveProfile();
  },

  loadProfile: async (walletAddress: string) => {
    try {
      // For now, load unencrypted
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const profileJson = await AsyncStorage.default.getItem('kingme_profile');
      
      if (profileJson) {
        const profile = JSON.parse(profileJson);
        set(profile);
        console.log('Profile loaded successfully');
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  },

  saveProfile: async () => {
    try {
      const state = get();
      const profile: UserProfile = {
        wallets: state.wallets,
        income: state.income,
        assets: state.assets,
        obligations: state.obligations,
        desires: state.desires,
        debts: state.debts,
        freedomHistory: state.freedomHistory,
        settings: state.settings,
        onboardingComplete: state.onboardingComplete,
        lastSynced: new Date().toISOString(),
      };
      
      // For now, save unencrypted until we add wallet
      const profileJson = JSON.stringify(profile);
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.default.setItem('kingme_profile', profileJson);
      console.log('Profile saved successfully');
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  },

  resetStore: () => set(initialState),
}));

// Helper hook to get current freedom score
export const useFreedomScore = () => {
  const profile = useStore((state) => ({
    assets: state.assets,
    obligations: state.obligations,
    desires: state.desires,
    debts: state.debts,
  }));
  
  return calculateFreedom(profile as UserProfile);
};
