import { Stack } from 'expo-router';
import "../src/polyfills";
import { WalletProvider } from '@/providers/wallet-provider';


export default function RootLayout() {
  return (
    <WalletProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </WalletProvider>
  );
}