import React, { useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type GestureResponderEvent,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import {
  colors,
  minTouchTargetSize,
  motion,
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

  const handlePress = (event: GestureResponderEvent) => {
    const now = Date.now();
    if (now - lastPressAtRef.current < bufferMs) return;
    lastPressAtRef.current = now;
    onPress(event);
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressedScale,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      hitSlop={6}
      pressRetentionOffset={8}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
    >
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    minHeight: Math.max(minTouchTargetSize, 50),
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C96850',
    overflow: 'hidden',
    ...shadows.buttonPrimary,
  },
  pressed: {
    backgroundColor: colors.primaryPressed,
  },
  pressedScale: {
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.45,
  },
  text: {
    color: '#ffffff',
    fontSize: typography.bodySize,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
