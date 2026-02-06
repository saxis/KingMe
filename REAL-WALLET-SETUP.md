# Enable Real Crypto Account Syncing

## Step 1: Get Helius API Key (Free)

1. Go to https://www.helius.dev/
2. Sign up for free account
3. Create an API key (free tier gives 100k requests/month)
4. Copy your API key

## Step 2: Add API Key to Your App

Create or update `.env` file in your project root:

```env
EXPO_PUBLIC_HELIUS_API_KEY=your_api_key_here
```

## Step 3: Replace Files

Replace these files in your project:

1. **`src/components/WalletConnect.tsx`** → Use `/outputs/WalletConnect-real.tsx`
2. **`src/services/helius.ts`** → Use `/outputs/helius-real.ts`

## Step 4: Test It

1. Restart your app: `npx expo start --clear`
2. Go to Profile tab
3. Tap "+ Connect Wallet"
4. Enter your Solana wallet address (e.g., from Phantom)
5. Tap "Connect"
6. It will automatically sync all your tokens!

## What It Syncs

✅ SOL balance
✅ All SPL tokens (USDC, USDT, etc.)
✅ Token values in USD
✅ Filters out dust (< $1)
✅ Skips NFTs (only fungible tokens)

## Your Tokens Will Show in Assets Tab

After syncing, go to **Assets tab** and you'll see:
- All your tokens with USD values
- Auto-categorized as "Crypto" type
- Editable (tap to edit if needed)

## Future: DeFi Position Detection

The Helius API can also detect:
- Kamino positions
- MarginFi deposits
- Marinade/Jito staking
- Drift positions

I can add that next if you want to see your $USDC in Kamino automatically!

## Privacy Note

Your wallet address is public blockchain data. The app:
- ✅ Only reads balances (no transactions)
- ✅ No private keys or signing
- ✅ No permissions needed
- ✅ Works in Expo Go (no dev build needed)

## Next: Financial Hints

Once your real balances are synced, I can add smart hints like:

"💡 Your $1,500 USDC is earning 0%. Move to Kamino for 5.8% APY = $7.25/mo passive income"

Want me to add that next?
