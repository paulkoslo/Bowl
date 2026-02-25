import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PartyBackdrop } from './PartyBackdrop';
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
      <PartyBackdrop />
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
    overflow: 'hidden',
  },
  inner: {
    flex: 1,
    zIndex: 1,
  },
});
