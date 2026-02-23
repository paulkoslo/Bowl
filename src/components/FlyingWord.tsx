import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, typography } from '@/theme';

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
  onDone: () => void;
}

const SPRING_CONFIG = {
  damping: 14,
  stiffness: 120,
  mass: 0.8,
};

/**
 * Animates a word from the card area to a team's bowl with an arc and scale.
 */
export function FlyingWord({ text, from, to, onDone }: FlyingWordProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(
      1,
      SPRING_CONFIG,
      (finished) => {
        if (finished) runOnJS(onDone)();
      }
    );
  }, [onDone]);

  const animatedStyle = useAnimatedStyle(() => {
    const arcLift = 56;
    const startX = from.x;
    const endX = to.x + (to.width - from.width) / 2;
    const startY = from.y;
    const endY = to.y + (to.height - from.height) / 2;
    const midY = (startY + endY) / 2 - arcLift;

    const x = interpolate(progress.value, [0, 1], [startX, endX]);
    const y = interpolate(progress.value, [0, 0.5, 1], [startY, midY, endY]);
    const scale = interpolate(progress.value, [0, 0.6, 1], [1, 1.08, 0.55]);
    const opacity = interpolate(progress.value, [0, 0.8, 1], [1, 1, 0.9]);
    const rotate = interpolate(progress.value, [0, 1], [0, 8]);

    return {
      position: 'absolute' as const,
      left: from.x,
      top: from.y,
      width: from.width,
      height: from.height,
      transform: [
        { translateX: x - from.x },
        { translateY: y - from.y },
        { scale },
        { rotate: `${rotate}deg` },
      ],
      opacity,
      justifyContent: 'center',
      alignItems: 'center',
    };
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      <Animated.View style={animatedStyle}>
        <Text style={styles.word} numberOfLines={1}>
          {text}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  word: {
    fontSize: typography.titleSize,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});
