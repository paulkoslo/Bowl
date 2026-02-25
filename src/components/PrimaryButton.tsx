import React, { useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {
  colors,
  minTouchTargetSize,
  motion,
  radius,
  shadows,
  spacing,
  typography,
} from '@/theme';

interface PrimaryButtonProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  /** Ignore accidental rapid double taps under this duration. */
  bufferMs?: number;
}

export function PrimaryButton({
  title,
  onPress,
  disabled = false,
  style,
  textStyle,
  bufferMs = motion.buttonBufferMs,
}: PrimaryButtonProps) {
  const lastPressAtRef = useRef(0);
  const pressProgress = useSharedValue(0);
  const tapPulse = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const pressScale = interpolate(pressProgress.value, [0, 1], [1, 0.968]);
    const pulseScale = interpolate(tapPulse.value, [0, 1], [1, 1.042]);
    const scale = pressScale * pulseScale;
    const translateY =
      interpolate(pressProgress.value, [0, 1], [0, 2.8]) -
      interpolate(tapPulse.value, [0, 1], [0, 1.1]);
    const rotateZ = interpolate(tapPulse.value, [0, 1], [0, 0.35]);
    return {
      transform: [{ translateY }, { scale }, { rotateZ: `${rotateZ}deg` }],
    };
  });

  const handlePressIn = () => {
    if (disabled) return;
    pressProgress.value = withTiming(1, {
      duration: 90,
      easing: Easing.out(Easing.cubic),
    });
  };

  const handlePressOut = () => {
    if (disabled) return;
    pressProgress.value = withTiming(0, {
      duration: 170,
      easing: Easing.out(Easing.back(1.8)),
    });
  };

  const runTapPulse = () => {
    tapPulse.value = 0;
    tapPulse.value = withSequence(
      withTiming(1, { duration: 85, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 165, easing: Easing.out(Easing.back(2.1)) })
    );
  };

  const handlePress = (event: GestureResponderEvent) => {
    const now = Date.now();
    if (now - lastPressAtRef.current < bufferMs) return;
    lastPressAtRef.current = now;
    runTapPulse();
    onPress(event);
  };

  return (
    <Animated.View style={[styles.wrapper, animatedStyle, style]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.pressed,
          disabled && styles.disabled,
        ]}
        hitSlop={6}
        pressRetentionOffset={8}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled }}
      >
        <View pointerEvents="none" style={styles.highlightStrip} />
        <View pointerEvents="none" style={styles.sparkDot} />
        <Text style={[styles.text, textStyle]}>{title}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'stretch',
  },
  button: {
    width: '100%',
    backgroundColor: colors.primary,
    minHeight: Math.max(minTouchTargetSize, 56),
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#B4184D',
    borderBottomWidth: 6,
    borderBottomColor: '#9E123F',
    position: 'relative',
    overflow: 'hidden',
    ...shadows.buttonPrimary,
  },
  pressed: {
    backgroundColor: colors.primaryPressed,
    borderBottomWidth: 4,
  },
  disabled: {
    opacity: 0.45,
  },
  highlightStrip: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 7,
    height: 12,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.24)',
  },
  sparkDot: {
    position: 'absolute',
    right: 14,
    top: 9,
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.accentMuted,
    opacity: 0.9,
  },
  text: {
    color: '#ffffff',
    fontSize: typography.headlineSize,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    zIndex: 1,
  },
});
