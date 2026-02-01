# Onboarding Flow Setup Instructions

## Files to create in your project:

1. Create the onboarding directory:
```bash
mkdir -p app/onboarding
```

2. Copy these files to your project:
- `onboarding-welcome.tsx` → `app/onboarding/welcome.tsx`
- `onboarding-income.tsx` → `app/onboarding/income.tsx`
- `onboarding-obligations.tsx` → `app/onboarding/obligations.tsx`
- `onboarding-reveal.tsx` → `app/onboarding/reveal.tsx`

3. Update your `app/index.tsx` to redirect to onboarding on first launch:

```typescript
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
// ... rest of imports

export default function HomeScreen() {
  const router = useRouter();
  
  // TODO: Check if onboarding is complete (from Zustand store)
  const onboardingComplete = false; // Change this once we add Zustand
  
  useEffect(() => {
    if (!onboardingComplete) {
      router.replace('/onboarding/welcome');
    }
  }, []);
  
  // ... rest of your existing code
}
```

## Testing the onboarding flow:

1. Start the app
2. Navigate manually to test:
   - In your app, add a button temporarily: `router.push('/onboarding/welcome')`
   - Or change the URL in Expo to: `exp://....:8081/onboarding/welcome`

3. Flow should be:
   - Welcome (avatar selection) → Income → Obligations → Reveal

## What's working:
- ✅ Avatar selection (2 options)
- ✅ Income input (salary + other)
- ✅ Obligations input (rent, utilities, insurance, daily allowance)
- ✅ Freedom score reveal with animation
- ✅ Navigation between screens

## What needs to be added (next steps):
- [ ] Zustand store to actually save the data
- [ ] Calculate real freedom score from input data
- [ ] Mark onboarding as complete
- [ ] Add debts screen (optional)
- [ ] Add desires during onboarding (optional)

## Quick test:

After adding the files, you can test by manually navigating:
```typescript
// Add this button temporarily to your current index.tsx
<TouchableOpacity onPress={() => router.push('/onboarding/welcome')}>
  <Text>Test Onboarding</Text>
</TouchableOpacity>
```

Then reload the app and tap the button!
