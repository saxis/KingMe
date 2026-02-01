# Wallet Connection Setup for Expo

## The Issue

Solana Mobile Wallet Adapter requires native modules that aren't available in Expo Go. You need to create a **development build**.

## Option 1: Create Development Build (Recommended for Hackathon)

### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

### 2. Login to Expo
```bash
eas login
```

### 3. Configure Project

Add to `app.json`:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-build-properties",
        {
          "android": {
            "minSdkVersion": 23
          }
        }
      ]
    ],
    "scheme": "kingme"
  }
}
```

### 4. Install Dependencies
```bash
npm install @solana-mobile/mobile-wallet-adapter-protocol
npm install @solana-mobile/mobile-wallet-adapter-protocol-web3js
npm install @solana/web3.js
npm install expo-dev-client
npm install expo-build-properties
```

### 5. Create Development Build
```bash
# For Android (Seeker)
eas build --profile development --platform android

# This will take 10-15 minutes
# Download and install the APK on your Seeker when done
```

### 6. Run Development Build
```bash
npx expo start --dev-client
```

## Option 2: Quick Demo Without Wallet (For Testing)

If you want to demo the app quickly without waiting for the build, you can use a **mock wallet connection** for now:

### Create Mock Wallet Service

```typescript
// src/services/wallet-mock.ts
export async function connectWallet() {
  // Simulate wallet connection
  return {
    address: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
    publicKey: null as any,
    name: 'Demo Wallet',
  };
}

export async function disconnectWallet() {}

export async function signMessage() {
  return new Uint8Array();
}

export async function getSolBalance() {
  return 10.5; // Mock balance
}
```

Then in your WalletConnect component, temporarily import from `wallet-mock` instead of `wallet`.

## Option 3: Use QR Code Wallet Connect (Alternative)

Install WalletConnect instead:
```bash
npm install @walletconnect/react-native-compat
npm install @walletconnect/modal-react-native
npm install @walletconnect/universal-provider
```

This works in Expo Go but has a worse UX than Mobile Wallet Adapter.

## Recommendation for Hackathon

**Best approach:**

1. **Now:** Use mock wallet (Option 2) to keep developing and testing on Expo Go
2. **Week before deadline:** Create development build (Option 1) and test real wallet connection
3. **Demo video:** Show real wallet connection working on Seeker with development build

This way you don't block development while waiting for builds.

## Testing the Mock Version

1. Copy `wallet-mock.ts` to `src/services/`
2. In `WalletConnect.tsx`, change:
   ```typescript
   import { connectWallet } from '../services/wallet-mock'; // Use mock
   ```
3. When you connect, it will use the demo wallet address
4. You can manually add some crypto assets to test the UI

## What Works Without Real Wallet

✅ All UI/UX
✅ Freedom calculations
✅ Asset/Obligation/Debt tracking
✅ Onboarding flow
✅ Tab navigation
✅ Data persistence

❌ Real wallet connection (need dev build)
❌ Helius ORB sync (need real wallet)

## Timeline Suggestion

- **Weeks 1-3:** Build features with mock wallet
- **Week 4:** Create dev build, test real wallet
- **Week 5:** Polish, demo video, submission

Want me to create the mock wallet service so you can keep developing?
