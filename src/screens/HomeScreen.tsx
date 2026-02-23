import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  PrimaryButton,
  ScreenContainer,
  SecondaryButton,
} from '@/components';
import { loadSession, saveLastActiveGameId } from '@/storage';
import { useGameStore } from '@/state';
import { colors, radius, spacing, typography } from '@/theme';

const DEBUG = true;
const log = (step: string, detail?: string) => {
  if (DEBUG) console.log(`[Bowl] HomeScreen: ${step}${detail ? ` — ${detail}` : ''}`);
};

export function HomeScreen() {
  const router = useRouter();
  const lastActiveGameId = useGameStore((s) => s.lastActiveGameId);
  const setCurrentGame = useGameStore((s) => s.setCurrentGame);
  const setLastActiveGameId = useGameStore((s) => s.setLastActiveGameId);

  useEffect(() => {
    log('mounted');
    return () => log('unmounted');
  }, []);

  const canResume = lastActiveGameId !== null;

  const handleResume = async () => {
    if (!lastActiveGameId) return;
    log('Resume pressed', 'loading session');
    const session = await loadSession(lastActiveGameId);
    if (!session) {
      await saveLastActiveGameId(null);
      setLastActiveGameId(null);
      return;
    }
    setCurrentGame(session);
    router.replace('/game');
  };

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <View style={styles.titleBlock}>
          <View style={styles.titleBlob} />
          <Text style={styles.title}>Bowl</Text>
          <Text style={styles.tagline}>The party game for your living room</Text>
        </View>
        <View style={styles.buttons}>
          <PrimaryButton
            title="New Game"
            onPress={() => {
              log('New Game pressed', 'navigating to /new-game');
              router.push('/new-game');
            }}
          />
          <View style={styles.spacer} />
          <SecondaryButton
            title="Resume"
            onPress={handleResume}
            disabled={!canResume}
          />
        </View>
      </View>
      <View style={styles.footer}>
        <SecondaryButton
          title="Settings"
          onPress={() => {
            log('Settings pressed', 'navigating to /settings');
            router.push('/settings');
          }}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleBlock: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  titleBlob: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: radius.full,
    backgroundColor: colors.accentMuted,
    opacity: 0.6,
    top: -40,
  },
  title: {
    fontSize: typography.displaySize,
    lineHeight: typography.displayLineHeight,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: typography.captionSize,
    lineHeight: typography.captionLineHeight,
    color: colors.textMuted,
    marginTop: spacing.sm,
    fontWeight: '500',
  },
  buttons: {
    width: '100%',
    maxWidth: 280,
  },
  spacer: {
    height: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    alignItems: 'center',
  },
});
