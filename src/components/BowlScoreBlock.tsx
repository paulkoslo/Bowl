import React from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
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
  return (
    <View style={styles.wrapper} onLayout={onLayout} collapsable={false}>
      <View style={styles.bowlSymbol}>
        <Text style={styles.bowlEmoji} allowFontScaling={false}>
          🥣
        </Text>
      </View>
      <Text style={styles.scoreLabel}>{teamName}</Text>
      <Text style={styles.inBowlValue}>{inBowlCount}</Text>
      <Text style={styles.inBowlLabel}>in bowl</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.surfaceSoft,
  },
  bowlSymbol: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  bowlEmoji: {
    fontSize: 28,
  },
  scoreLabel: {
    fontSize: typography.captionSize,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  inBowlValue: {
    fontSize: typography.titleSize + 2,
    fontWeight: '800',
    color: colors.text,
  },
  inBowlLabel: {
    fontSize: typography.captionSize,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
