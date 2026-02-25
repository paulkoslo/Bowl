import React, { useEffect } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius, shadows, spacing, typography } from '@/theme';

export interface BowlScoreBlockProps {
  teamName: string;
  /** Cards in this team's bowl for the current round. */
  inBowlCount: number;
  onLayout?: (event: LayoutChangeEvent) => void;
}

/**
 * Team score block with a bowl symbol — one counter that goes up on Got It (your team) and Pass (other team).
 */
export function BowlScoreBlock({
  teamName,
  inBowlCount,
  onLayout,
}: BowlScoreBlockProps) {
  const scorePulse = useSharedValue(1);
  const bowlSwing = useSharedValue(0);

  useEffect(() => {
    scorePulse.value = withSequence(
      withTiming(1.2, { duration: 140, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 200, easing: Easing.inOut(Easing.quad) })
    );
  }, [inBowlCount, scorePulse]);

  useEffect(() => {
    bowlSwing.value = withRepeat(
      withTiming(1, {
        duration: 2600,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true
    );
  }, [bowlSwing]);

  const scoreAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scorePulse.value }],
  }));

  const bowlAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(bowlSwing.value, [0, 1], [-5, 5])}deg`,
      },
      {
        translateY: interpolate(bowlSwing.value, [0, 1], [-2, 2]),
      },
    ],
  }));

  return (
    <View style={styles.wrapper} onLayout={onLayout} collapsable={false}>
      <Animated.View style={[styles.bowlSymbol, bowlAnimatedStyle]}>
        <View style={styles.bowlRim} />
        <View style={styles.bowlCup} />
        <View style={styles.bowlBase} />
      </Animated.View>
      <Text style={styles.scoreLabel}>{teamName}</Text>
      <Animated.Text style={[styles.inBowlValue, scoreAnimatedStyle]}>
        {inBowlCount}
      </Animated.Text>
      <Text style={styles.inBowlLabel}>in bowl</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.md + 2,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    ...shadows.surfaceSoft,
  },
  bowlSymbol: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFF2CC',
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    position: 'relative',
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  bowlRim: {
    width: 34,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFE3A0',
    borderWidth: 1,
    borderColor: '#FFC86B',
    position: 'absolute',
    top: 16,
  },
  bowlCup: {
    width: 36,
    height: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: '#FFCD71',
    borderWidth: 1,
    borderColor: '#F4A631',
    position: 'absolute',
    top: 20,
  },
  bowlBase: {
    width: 18,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E48C18',
    position: 'absolute',
    bottom: 12,
  },
  scoreLabel: {
    fontSize: typography.captionSize,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  inBowlValue: {
    fontSize: typography.titleSize + 2,
    fontWeight: '900',
    color: colors.text,
  },
  inBowlLabel: {
    fontSize: typography.captionSize,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
