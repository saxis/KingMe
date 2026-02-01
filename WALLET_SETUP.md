# Wallet Connection Setup Instructions

## 1. Install Required Packages

Run these commands in your project directory:

```bash
# Solana Mobile Wallet Adapter
npm install @solana-mobile/mobile-wallet-adapter-protocol
npm install @solana-mobile/mobile-wallet-adapter-protocol-web3js

# Solana Web3.js (if not already installed)
npm install @solana/web3.js

# Additional dependencies
npm install buffer
```

## 2. Add Polyfills (Required for React Native)

Create or update `metro.config.js`:

```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  crypto: require.resolve('expo-crypto'),
  stream: require.resolve('readable-stream'),
  buffer: require.resolve('buffer'),
};

module.exports = config;
```

## 3. Get Helius API Key

1. Go to https://helius.xyz
2. Sign up for free account
3. Create an API key
4. Add to your `.env` file:

```
HELIUS_API_KEY=your_api_key_here
```

## 4. Update Constants

Update `src/utils/constants.ts` to add:

```typescript
export const API_KEYS = {
  HELIUS: process.env.HELIUS_API_KEY || '',
  // ... other keys
};

export const API_ENDPOINTS = {
  HELIUS_ORB: 'https://api.helius.xyz/v0',
  // ... other endpoints
};
```

## 5. Copy Files to Your Project

- `wallet-service.ts` → `src/services/wallet.ts`
- `WalletConnect.tsx` → `src/components/WalletConnect.tsx`
- `tabs-profile.tsx` → `app/(tabs)/profile.tsx` (updated with wallet component)

## 6. Test on Real Device

**IMPORTANT:** Wallet adapter only works on real devices, not in emulator!

1. Make sure you have Phantom or Solflare installed on your Seeker
2. Run the app on your device
3. Go to Profile tab
4. Tap "Connect Wallet"
5. Approve in Phantom/Solflare
6. Tap "Sync All" to fetch your assets

## 7. What This Does

- **Connect Wallet**: Opens Phantom/Solflare to authorize connection
- **Auto-Sync Assets**: Fetches all your SOL, tokens, and DeFi positions from Helius ORB
- **Track Yields**: Automatically detects staked SOL and DeFi positions with APY
- **Update Freedom Score**: Your crypto assets automatically update your freedom calculation
- **Multiple Wallets**: You can connect multiple wallets and track them all

## Troubleshooting

**"No compatible wallet app found"**
- Install Phantom or Solflare from Play Store

**"Failed to fetch wallet data"**
- Check your Helius API key
- Make sure you have internet connection

**"Wallet connection failed"**
- Make sure Phantom/Solflare is installed and updated
- Try restarting the wallet app

## Next Steps After Setup

1. Connect your wallet
2. Sync to pull in all your assets
3. See your real freedom score with actual Solana holdings!
4. Demo this in your hackathon video - it's a key feature
