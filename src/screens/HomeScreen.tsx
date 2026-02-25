import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import {
  PrimaryButton,
  ScreenContainer,
  SecondaryButton,
} from '@/components';
import { ROUTES } from '@/navigation';
import { loadSession, saveLastActiveGameId } from '@/storage';
import { useGameStore } from '@/state';
import { colors, radius, spacing, typography } from '@/theme';
import { waitForButtonAnimation } from '@/utils';

const DEBUG = true;
const log = (step: string, detail?: string) => {
  if (DEBUG) console.log(`[Bowl] HomeScreen: ${step}${detail ? ` — ${detail}` : ''}`);
};

export function HomeScreen() {
  const router = useRouter();
  const lastActiveGameId = useGameStore((s) => s.lastActiveGameId);
  const setCurrentGame = useGameStore((s) => s.setCurrentGame);
  const setLastActiveGameId = useGameStore((s) => s.setLastActiveGameId);
  const heroFloat = useSharedValue(0);
  const ringSpin = useSharedValue(0);

  useEffect(() => {
    log('mounted');
    return () => log('unmounted');
  }, []);

  useEffect(() => {
    heroFloat.value = withRepeat(
      withTiming(1, {
        duration: 2400,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true
    );
    ringSpin.value = withRepeat(
      withTiming(1, {
        duration: 9000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [heroFloat, ringSpin]);

  const titleFloatStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(heroFloat.value, [0, 1], [-8, 8]),
      },
      {
        rotate: `${interpolate(heroFloat.value, [0, 1], [-1.6, 1.6])}deg`,
      },
    ],
  }));

  const ringSpinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(ringSpin.value, [0, 1], [0, 360])}deg` }],
  }));

  const buttonFloatStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(heroFloat.value, [0, 1], [3, -5]),
      },
    ],
  }));

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
    await waitForButtonAnimation();
    router.replace(ROUTES.GAME);
  };

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Animated.View style={[styles.titleBlock, titleFloatStyle]}>
          <Animated.View style={[styles.titleRing, ringSpinStyle]} />
          <View style={[styles.titleOrb, styles.titleOrbLeft]} />
          <View style={[styles.titleOrb, styles.titleOrbRight]} />
          <Text style={styles.title}>Bowl</Text>
          <Text style={styles.tagline}>Shout it. One-word it. Act it out.</Text>
          <View style={styles.badges}>
            <Text style={styles.badge}>Fast Rounds</Text>
            <Text style={styles.badge}>Team Chaos</Text>
          </View>
        </Animated.View>
        <Animated.View style={[styles.buttons, buttonFloatStyle]}>
          <PrimaryButton
            title="New Game"
            onPress={async () => {
              log('New Game pressed', `navigating to ${ROUTES.NEW_GAME}`);
              await waitForButtonAnimation();
              router.push(ROUTES.NEW_GAME);
            }}
          />
          <View style={styles.spacer} />
          <SecondaryButton
            title="Resume"
            onPress={handleResume}
            disabled={!canResume}
          />
        </Animated.View>
      </View>
      <View style={styles.footer}>
        <SecondaryButton
          title="Settings"
          onPress={async () => {
            log('Settings pressed', `navigating to ${ROUTES.SETTINGS}`);
            await waitForButtonAnimation();
            router.push(ROUTES.SETTINGS);
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
    marginBottom: spacing.xl + 6,
    width: '100%',
    maxWidth: 340,
    position: 'relative',
    paddingVertical: spacing.lg,
  },
  titleRing: {
    position: 'absolute',
    width: 280,
    height: 190,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: colors.partyBlue,
    borderStyle: 'dashed',
    opacity: 0.22,
    top: -12,
  },
  titleOrb: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: radius.full,
    opacity: 0.35,
    top: 8,
  },
  titleOrbLeft: {
    left: 18,
    backgroundColor: colors.partyPink,
  },
  titleOrbRight: {
    right: 18,
    backgroundColor: colors.partyMint,
  },
  title: {
    fontSize: typography.displaySize,
    lineHeight: typography.displayLineHeight,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(255, 255, 255, 0.65)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  tagline: {
    fontSize: typography.bodySize,
    lineHeight: typography.captionLineHeight,
    color: colors.textMuted,
    marginTop: spacing.sm,
    fontWeight: '700',
    textAlign: 'center',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  badge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 2,
    borderColor: colors.border,
    color: colors.text,
    fontSize: typography.captionSize,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  buttons: {
    width: '100%',
    maxWidth: 310,
  },
  spacer: {
    height: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm + 2,
    alignItems: 'center',
    width: '100%',
  },
});
