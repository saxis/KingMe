# KingMe - Financial Freedom Tracker

A Solana mobile app that tracks your path to financial freedom using the "days of freedom" metric.

## Concept

KingMe measures freedom not in percentages, but in **days** - how many days can your assets sustain your lifestyle?

**Freedom Formula:**

```
Freedom Days = How long your assets can cover (Obligations + Desires + Debt Service)
```

When your asset income >= your daily needs, you're **KINGED** 👑 - you have infinite freedom.

## Features (MVP)

- ✅ **Auto-sync Solana wallets** - Track crypto assets, DeFi positions, staking via Helius ORB
- ✅ **Manual entry** - Add salary, obligations, debts, desires
- ✅ **Days of Freedom** - See exactly how long you can maintain your lifestyle
- ✅ **Visual progression** - Drowning → Struggling → Breaking Surface → Rising → Enthroned
- ✅ **AI-powered desire research** - "I want a dishwasher" → Claude finds options, prices, timing
- ✅ **Opportunity cost analysis** - See what idle assets are costing you
- ✅ **Impact calculator** - "If I buy this, how does it affect my freedom?"
- ✅ **3 avatar options** - Male-medium, Female-medium, Male-dark skin tones
- ✅ **Encrypted local storage** - Your data never leaves your device

## Freedom States (Checkers Metaphor)

| Days of Freedom | State                   | Visual                               |
| --------------- | ----------------------- | ------------------------------------ |
| 0-30 days       | **Drowning** 🌊         | Regular checker piece, underwater    |
| 30-180 days     | **Struggling** 💪       | Swimming upward through water        |
| 180-730 days    | **Breaking Surface** 🌅 | Head breaking through to air         |
| 730-3650 days   | **Rising** ⬆️           | Standing on water, crown appearing   |
| 3650+ days / ∞  | **ENTHRONED** 👑        | Sitting on throne, crowned - KINGED! |

## Tech Stack

- **React Native** (Expo) - Cross-platform mobile
- **TypeScript** - Type safety
- **Solana Mobile Wallet Adapter** - Connect Phantom/Solflare
- **Helius ORB API** - Enriched wallet data (balances, DeFi)
- **Claude API** (Anthropic) - AI desire research
- **AsyncStorage + CryptoJS** - Encrypted local storage
- **Zustand** - State management (to be added)

## Project Structure

```
kingme/
├── src/
│   ├── types/           # TypeScript interfaces
│   ├── utils/           # Calculations, constants
│   ├── services/        # API integrations (Helius, Claude, Storage)
│   ├── store/           # Zustand state management (TBD)
│   ├── components/      # Reusable UI components (TBD)
│   └── screens/         # App screens (TBD)
├── assets/
│   └── images/          # Avatar images (15 total: 3 avatars × 5 states)
└── README.md
```

## Setup Instructions

### 1. Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator or Android Emulator (or physical device)

### 2. Install Dependencies

```bash
cd kingme
npm install

# Core dependencies
npm install @solana/web3.js @solana-mobile/mobile-wallet-adapter-protocol
npm install @react-navigation/native @react-navigation/bottom-tabs
npm install zustand @react-native-async-storage/async-storage crypto-js axios
```

### 3. Environment Variables

Create a `.env` file:

```
EXPO_PUBLIC_HELIUS_API_KEY=your_helius_api_key_here
EXPO_PUBLIC_CLAUDE_API_KEY=your_claude_api_key_here
```

Get API keys:

- **Helius**: https://helius.xyz (free tier available)
- **Claude**: https://console.anthropic.com (API access)

### 4. Run the App

```bash
# Start Expo dev server
npx expo start

# Press 'i' for iOS simulator
# Press 'a' for Android emulator
```

## Development Roadmap

### Phase 1: Core MVP (Hackathon - 5 weeks)

- [x] Type definitions
- [x] Freedom calculation logic
- [x] Storage service (encrypted)
- [x] Helius integration (basic)
- [ ] Wallet connection (Mobile Wallet Adapter)
- [ ] Zustand store setup
- [ ] Onboarding flow (5 screens)
- [ ] Main app screens (Home, Assets, Obligations, Desires, Profile)
- [ ] Freedom score display with avatar
- [ ] AI desire research (Claude API)
- [ ] Basic UI/UX polish

### Phase 2: Enhanced Features (Post-hackathon)

- [ ] One-tap staking (execute Solana transactions)
- [ ] Achievement NFTs (mint on milestones)
- [ ] Notification system
- [ ] Weekly check-ins
- [ ] Export/import data
- [ ] More avatar customization

### Phase 3: Premium Modules (Monetization)

- [ ] Web app with Irys sync ($5-10/mo)
- [ ] Real estate module
- [ ] Leverage calculator
- [ ] Tax optimization
- [ ] Private vault (encrypted cloud)
- [ ] Multi-chain support

## Design Philosophy

**For Kings, Not Peasants:**

- Clean, masculine UI (dark mode default)
- Data-forward, not cutesy
- Respects user intelligence and agency
- Privacy-first (encrypted local storage)
- No micromanagement - focus on what matters
- Gentle nudges, not nagging

**Three Buckets:**

1. **Obligations** - What you must spend (including daily living per diem)
2. **Desires** - What you want to spend
3. **Surplus** - What you deploy into assets

**Goal:** Get KINGED 👑 - When assets generate enough income to cover everything forever.

## Contributing

This is a personal project for the Solana Mobile Hackathon (MONOLITH).
Feedback and suggestions welcome!

## License

TBD

## Contact

Domain: https://kingme.money
Twitter: @KingMeApp (TBD)

---

**"Get to 100% freedom and sit on your throne"** 👑
