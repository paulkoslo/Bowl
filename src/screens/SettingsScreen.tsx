import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, ScreenContainer, SecondaryButton } from '@/components';
import { ROUTES } from '@/navigation';
import { useGameStore } from '@/state';
import { colors, spacing, typography } from '@/theme';
import { waitForButtonAnimation } from '@/utils';

const DEBUG = true;
const log = (step: string, detail?: string) => {
  if (DEBUG) console.log(`[Bowl] SettingsScreen: ${step}${detail ? ` — ${detail}` : ''}`);
};

export function SettingsScreen() {
  const router = useRouter();
  const resetAll = useGameStore((s) => s.resetAll);

  useEffect(() => {
    log('mounted');
    return () => log('unmounted');
  }, []);

  const handleResetGameData = () => {
    Alert.alert(
      'Reset Game Data',
      'This will clear all saved games and cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetAll();
            await waitForButtonAnimation();
            router.replace(ROUTES.HOME);
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>
          Timer, rounds, and other options (coming soon).
        </Text>
        <View style={styles.actions}>
          <SecondaryButton
            title="Back"
            onPress={async () => {
              log('Back pressed');
              await waitForButtonAnimation();
              router.back();
            }}
          />
          <View style={styles.spacer} />
          <PrimaryButton
            title="Reset Game Data"
            onPress={handleResetGameData}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: typography.titleSize,
    lineHeight: typography.titleLineHeight,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.bodySize,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  actions: {
    width: '100%',
    maxWidth: 280,
  },
  spacer: {
    height: spacing.md,
  },
});
