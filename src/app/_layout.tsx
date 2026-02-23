import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import { useGameStore } from '@/state';

const DEBUG = true;
const log = (step: string, detail?: string) => {
  if (DEBUG) {
    console.log(`[Bowl] ${step}${detail ? ` — ${detail}` : ''}`);
  }
};

export default function RootLayout() {
  const hydrateLastGame = useGameStore((s) => s.hydrateLastGame);

  useEffect(() => {
    log('RootLayout mounted', 'navigation stack is ready');
    hydrateLastGame().then((ok) => log('hydrateLastGame', ok ? 'ok' : 'no saved game'));
    return () => log('RootLayout unmounted');
  }, [hydrateLastGame]);

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="new-game" />
        <Stack.Screen name="game" />
        <Stack.Screen name="settings" />
      </Stack>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
