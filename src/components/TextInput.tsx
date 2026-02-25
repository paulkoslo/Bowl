import React from 'react';
import {
  StyleSheet,
  TextInput as RNTextInput,
  type TextInputProps,
} from 'react-native';
import {
  colors,
  minTouchTargetSize,
  radius,
  shadows,
  spacing,
  typography,
} from '@/theme';

export function TextInput({
  style,
  ...props
}: TextInputProps) {
  return (
    <RNTextInput
      placeholderTextColor={colors.textMuted}
      style={[styles.input, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.accent,
    borderRadius: radius.lg,
    borderWidth: 2,
    color: colors.text,
    fontSize: typography.bodySize,
    minHeight: minTouchTargetSize,
    fontWeight: '600',
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm + 1,
    ...shadows.surfaceSoft,
  },
});
