import React, { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors, motion } from '@/theme';

interface OrbSpec {
  id: string;
  color: string;
  size: number;
  x: number;
  y: number;
  driftX: number;
  driftY: number;
  opacity: number;
  duration: number;
  delay: number;
}

interface StreamerSpec {
  id: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotate: number;
  swingX: number;
  swingY: number;
  duration: number;
  delay: number;
}

interface AccentSpec {
  id: string;
  color: string;
  kind: 'dot' | 'diamond' | 'dash';
  x: number;
  y: number;
  size: number;
  float: number;
  rotate: number;
  duration: number;
  delay: number;
}

export function PartyBackdrop() {
  const { width, height } = useWindowDimensions();

  const orbSpecs = useMemo<OrbSpec[]>(
    () => [
      {
        id: 'orb-a',
        color: colors.partyPink,
        size: Math.max(width * 0.9, 310),
        x: -width * 0.35,
        y: -height * 0.2,
        driftX: 24,
        driftY: 34,
        opacity: 0.25,
        duration: motion.backdropDriftMs,
        delay: 0,
      },
      {
        id: 'orb-b',
        color: colors.partyBlue,
        size: Math.max(width * 0.75, 250),
        x: width * 0.42,
        y: -height * 0.14,
        driftX: 19,
        driftY: 26,
        opacity: 0.2,
        duration: motion.backdropDriftMs + 1200,
        delay: 300,
      },
      {
        id: 'orb-c',
        color: colors.partyMint,
        size: Math.max(width * 0.84, 290),
        x: -width * 0.25,
        y: height * 0.58,
        driftX: 22,
        driftY: 28,
        opacity: 0.18,
        duration: motion.backdropDriftMs + 900,
        delay: 900,
      },
      {
        id: 'orb-d',
        color: colors.partyOrange,
        size: Math.max(width * 0.62, 210),
        x: width * 0.54,
        y: height * 0.48,
        driftX: 16,
        driftY: 22,
        opacity: 0.2,
        duration: motion.backdropDriftMs + 1800,
        delay: 600,
      },
    ],
    [height, width]
  );

  const streamerSpecs = useMemo<StreamerSpec[]>(
    () => [
      {
        id: 'streamer-a',
        color: colors.partyBlue,
        x: width * 0.08,
        y: height * 0.12,
        width: 78,
        height: 10,
        rotate: -18,
        swingX: 10,
        swingY: 9,
        duration: motion.backdropPulseMs,
        delay: 0,
      },
      {
        id: 'streamer-b',
        color: colors.partyPink,
        x: width * 0.75,
        y: height * 0.16,
        width: 92,
        height: 12,
        rotate: 24,
        swingX: 12,
        swingY: 8,
        duration: motion.backdropPulseMs + 450,
        delay: 230,
      },
      {
        id: 'streamer-c',
        color: colors.partyLime,
        x: width * 0.18,
        y: height * 0.42,
        width: 68,
        height: 9,
        rotate: 17,
        swingX: 9,
        swingY: 7,
        duration: motion.backdropPulseMs + 300,
        delay: 680,
      },
      {
        id: 'streamer-d',
        color: colors.partyOrange,
        x: width * 0.69,
        y: height * 0.5,
        width: 74,
        height: 10,
        rotate: -20,
        swingX: 11,
        swingY: 7,
        duration: motion.backdropPulseMs + 800,
        delay: 360,
      },
      {
        id: 'streamer-e',
        color: colors.partySky,
        x: width * 0.37,
        y: height * 0.75,
        width: 64,
        height: 9,
        rotate: -12,
        swingX: 9,
        swingY: 8,
        duration: motion.backdropPulseMs + 640,
        delay: 950,
      },
      {
        id: 'streamer-f',
        color: colors.accent,
        x: width * 0.82,
        y: height * 0.78,
        width: 70,
        height: 10,
        rotate: 14,
        swingX: 10,
        swingY: 10,
        duration: motion.backdropPulseMs + 1050,
        delay: 740,
      },
    ],
    [height, width]
  );

  const accentSpecs = useMemo<AccentSpec[]>(
    () => [
      {
        id: 'accent-a',
        color: colors.partyPink,
        kind: 'diamond',
        x: width * 0.05,
        y: height * 0.24,
        size: 20,
        float: 10,
        rotate: -12,
        duration: motion.backdropPulseMs + 350,
        delay: 0,
      },
      {
        id: 'accent-b',
        color: colors.partyBlue,
        kind: 'dot',
        x: width * 0.82,
        y: height * 0.3,
        size: 18,
        float: 12,
        rotate: 9,
        duration: motion.backdropPulseMs + 500,
        delay: 260,
      },
      {
        id: 'accent-c',
        color: colors.partyLime,
        kind: 'dash',
        x: width * 0.45,
        y: height * 0.14,
        size: 22,
        float: 8,
        rotate: 0,
        duration: motion.backdropPulseMs + 300,
        delay: 600,
      },
      {
        id: 'accent-d',
        color: colors.partySky,
        kind: 'dot',
        x: width * 0.12,
        y: height * 0.7,
        size: 16,
        float: 11,
        rotate: -8,
        duration: motion.backdropPulseMs + 120,
        delay: 840,
      },
      {
        id: 'accent-e',
        color: colors.partyOrange,
        kind: 'diamond',
        x: width * 0.72,
        y: height * 0.66,
        size: 21,
        float: 9,
        rotate: 13,
        duration: motion.backdropPulseMs + 620,
        delay: 980,
      },
    ],
    [height, width]
  );

  return (
    <View pointerEvents="none" style={styles.layer}>
      <View style={styles.baseWash} />
      <PulseWash />
      {orbSpecs.map((spec) => (
        <PartyOrb key={spec.id} spec={spec} />
      ))}
      {streamerSpecs.map((spec) => (
        <PartyStreamer key={spec.id} spec={spec} />
      ))}
      {accentSpecs.map((spec) => (
        <PartyAccent key={spec.id} spec={spec} />
      ))}
    </View>
  );
}

function PartyOrb({ spec }: { spec: OrbSpec }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      spec.delay,
      withRepeat(
        withTiming(1, {
          duration: spec.duration,
          easing: Easing.inOut(Easing.quad),
        }),
        -1,
        true
      )
    );
  }, [progress, spec.delay, spec.duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(progress.value, [0, 1], [-spec.driftX, spec.driftX]),
      },
      {
        translateY: interpolate(progress.value, [0, 1], [-spec.driftY, spec.driftY]),
      },
      { scale: interpolate(progress.value, [0, 0.5, 1], [0.92, 1.04, 0.94]) },
    ],
    opacity: interpolate(
      progress.value,
      [0, 0.5, 1],
      [spec.opacity - 0.04, spec.opacity + 0.03, spec.opacity - 0.03]
    ),
  }));

  return (
    <Animated.View
      style={[
        styles.orb,
        {
          backgroundColor: spec.color,
          width: spec.size,
          height: spec.size,
          borderRadius: spec.size / 2,
          left: spec.x,
          top: spec.y,
        },
        animatedStyle,
      ]}
    />
  );
}

function PartyStreamer({ spec }: { spec: StreamerSpec }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      spec.delay,
      withRepeat(
        withTiming(1, {
          duration: spec.duration,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    );
  }, [progress, spec.delay, spec.duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(progress.value, [0, 1], [-spec.swingX, spec.swingX]),
      },
      {
        translateY: interpolate(progress.value, [0, 1], [-spec.swingY, spec.swingY]),
      },
      {
        rotate: `${spec.rotate + interpolate(progress.value, [0, 1], [-9, 9])}deg`,
      },
      { scale: interpolate(progress.value, [0, 0.5, 1], [0.94, 1.06, 0.96]) },
    ],
    opacity: interpolate(progress.value, [0, 0.5, 1], [0.82, 1, 0.86]),
  }));

  return (
    <Animated.View
      style={[
        styles.streamer,
        {
          backgroundColor: spec.color,
          width: spec.width,
          height: spec.height,
          left: spec.x,
          top: spec.y,
        },
        animatedStyle,
      ]}
    />
  );
}

function PartyAccent({ spec }: { spec: AccentSpec }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      spec.delay,
      withRepeat(
        withTiming(1, {
          duration: spec.duration,
          easing: Easing.inOut(Easing.quad),
        }),
        -1,
        true
      )
    );
  }, [progress, spec.delay, spec.duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(progress.value, [0, 1], [-spec.float, spec.float]),
      },
      {
        rotate: `${spec.rotate + interpolate(progress.value, [0, 1], [-8, 8])}deg`,
      },
      { scale: interpolate(progress.value, [0, 0.5, 1], [0.95, 1.14, 0.96]) },
    ],
    opacity: interpolate(progress.value, [0, 0.5, 1], [0.75, 1, 0.8]),
  }));

  const shapeStyle =
    spec.kind === 'dot'
      ? {
          width: spec.size,
          height: spec.size,
          borderRadius: spec.size / 2,
        }
      : spec.kind === 'diamond'
        ? {
            width: spec.size,
            height: spec.size,
            borderRadius: 3,
          }
        : {
            width: spec.size * 1.4,
            height: Math.max(6, spec.size * 0.28),
            borderRadius: 999,
          };

  return (
    <Animated.View
      style={[
        styles.accent,
        {
          backgroundColor: spec.color,
        },
        {
          left: spec.x,
          top: spec.y,
          ...shapeStyle,
        },
        animatedStyle,
      ]}
    />
  );
}

function PulseWash() {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, {
        duration: motion.backdropStrobeMs,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true
    );
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.05, 0.17]),
  }));

  return <Animated.View style={[styles.pulseWash, animatedStyle]} />;
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  baseWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFE8B0',
    opacity: 0.24,
  },
  pulseWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFBE7',
  },
  orb: {
    position: 'absolute',
  },
  streamer: {
    position: 'absolute',
    borderRadius: 999,
    shadowColor: '#4F1D80',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 2,
  },
  accent: {
    position: 'absolute',
    shadowColor: '#4F1D80',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 1,
  },
});
