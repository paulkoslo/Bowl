import React from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';

export interface BowlScoreBlockProps {
  teamName: string;
  /** Total game points (for winner). */
  totalScore: number;
  /** Cards in this team's bowl this round = scored + passed to them. One counter for Got It & Pass. */
  inBowlCount: number;
  onLayout?: (event: LayoutChangeEvent) => void;
}

/**
 * Team score block with a bowl symbol — one counter that goes up on Got It (your team) and Pass (other team).
 */
export function BowlScoreBlock({
  teamName,
  totalScore,
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
      <Text style={styles.totalLine}>Total points: {totalScore}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  bowlSymbol: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
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
  },
  inBowlValue: {
    fontSize: typography.titleSize,
    fontWeight: '700',
    color: colors.text,
  },
  inBowlLabel: {
    fontSize: typography.captionSize,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  totalLine: {
    fontSize: typography.captionSize,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
