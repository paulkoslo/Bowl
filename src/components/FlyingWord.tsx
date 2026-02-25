import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors, motion, radius, shadows, spacing, typography } from '@/theme';

export interface LayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FlyingWordProps {
  text: string;
  from: LayoutRect;
  to: LayoutRect;
  seed?: number;
  onDone: () => void;
}

const FLIGHT_DURATION = motion.flightDurationMs;

/**
 * Fast non-blocking "paper slip" animation from card area to bowl.
 */
export function FlyingWord({ text, from, to, seed = 0.5, onDone }: FlyingWordProps) {
  const progress = useSharedValue(0);
  const normalizedSeed = Math.max(0, Math.min(seed, 1));

  const paperWidth = useMemo(
    () => Math.max(118, Math.min(230, text.length * 11 + 56)),
    [text]
  );
  const paperHeight = 52;
  const arcLift = 38 + normalizedSeed * 24;
  const sideBend = (normalizedSeed - 0.5) * 46;
  const rotateSign = normalizedSeed > 0.5 ? 1 : -1;

  useEffect(() => {
    progress.value = withTiming(
      1,
      {
        duration: FLIGHT_DURATION,
        easing: Easing.bezier(0.2, 0.8, 0.15, 1),
      },
      (finished) => {
        if (finished) runOnJS(onDone)();
      }
    );
  }, [onDone, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const startX = from.x + from.width / 2 - paperWidth / 2;
    const startY = from.y + from.height / 2 - paperHeight / 2;
    const endX = to.x + to.width / 2 - paperWidth / 2;
    const endY = to.y + to.height / 2 - paperHeight / 2;
    const midX = (startX + endX) / 2 + sideBend;
    const midY = (startY + endY) / 2 - arcLift;

    const x = interpolate(progress.value, [0, 0.48, 1], [startX, midX, endX]);
    const y = interpolate(progress.value, [0, 0.48, 1], [startY, midY, endY]);
    const scale = interpolate(progress.value, [0, 0.2, 1], [0.96, 1.03, 0.62]);
    const scaleY = interpolate(progress.value, [0, 0.7, 1], [1, 0.98, 0.42]);
    const opacity = interpolate(progress.value, [0, 0.86, 1], [1, 0.98, 0.1]);
    const rotateZ = interpolate(
      progress.value,
      [0, 0.3, 0.8, 1],
      [0, -10 * rotateSign, 9 * rotateSign, 14 * rotateSign]
    );
    const rotateX = interpolate(progress.value, [0, 0.78, 1], [0, 8, 72]);

    return {
      position: 'absolute' as const,
      left: startX,
      top: startY,
      width: paperWidth,
      height: paperHeight,
      transform: [
        { translateX: x - startX },
        { translateY: y - startY },
        { perspective: 900 },
        { rotateX: `${rotateX}deg` },
        { rotateZ: `${rotateZ}deg` },
        { scaleY },
        { scale },
      ],
      opacity,
      justifyContent: 'center',
      alignItems: 'center',
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => {
    const scramble = interpolate(progress.value, [0, 0.35, 0.7, 1], [0, 3, -2, 0]);
    const letterSpacing = interpolate(progress.value, [0, 0.6, 1], [0.2, 0.7, 0.05]);
    const textOpacity = interpolate(progress.value, [0, 0.9, 1], [1, 1, 0.6]);
    return {
      transform: [{ translateX: scramble }],
      letterSpacing,
      opacity: textOpacity,
    };
  });

  const foldAnimatedStyle = useAnimatedStyle(() => {
    const foldScale = interpolate(progress.value, [0, 0.55, 1], [1, 0.9, 0.28]);
    const foldOpacity = interpolate(progress.value, [0, 0.85, 1], [0.85, 0.85, 0.15]);
    return {
      transform: [{ scale: foldScale }, { rotate: `${6 + normalizedSeed * 10}deg` }],
      opacity: foldOpacity,
    };
  });

  return (
    <Animated.View style={animatedStyle} pointerEvents="none">
      <View style={styles.paper}>
        <Animated.View style={[styles.foldCorner, foldAnimatedStyle]} />
        <Animated.Text style={[styles.word, textAnimatedStyle]} numberOfLines={1}>
          {text}
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  paper: {
    width: '100%',
    height: '100%',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    ...shadows.surfaceSoft,
  },
  foldCorner: {
    position: 'absolute',
    right: 6,
    top: 6,
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: colors.accentMuted,
    transform: [{ rotate: '40deg' }],
    opacity: 0.9,
  },
  word: {
    fontSize: typography.headlineSize,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    paddingHorizontal: spacing.xs,
  },
});
