import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** If true, padding uses safe area insets (default true) */
  safe?: boolean;
}

export function ScreenContainer({
  children,
  style,
  safe = true,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={styles.ambientLayer}>
        <View style={styles.ambientTop} />
        <View style={styles.ambientBottom} />
      </View>
      <View
        style={[
          styles.inner,
          safe && {
            paddingTop: Math.max(insets.top, spacing.md),
            paddingBottom: Math.max(insets.bottom, spacing.md),
            paddingLeft: Math.max(insets.left, spacing.md),
            paddingRight: Math.max(insets.right, spacing.md),
          },
          style,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
  },
  ambientLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  ambientTop: {
    position: 'absolute',
    right: -50,
    top: -80,
    width: 220,
    height: 220,
    borderRadius: 9999,
    backgroundColor: colors.accentMuted,
    opacity: 0.25,
  },
  ambientBottom: {
    position: 'absolute',
    left: -70,
    bottom: -90,
    width: 250,
    height: 250,
    borderRadius: 9999,
    backgroundColor: colors.accent,
    opacity: 0.1,
  },
});
