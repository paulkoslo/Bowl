import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, ScreenContainer, SecondaryButton } from '@/components';
import { useGameStore } from '@/state';
import { colors, spacing, typography } from '@/theme';

interface ReviewStepProps {
  onStartGame: () => void;
  onBack: () => void;
}

export function ReviewStep({ onStartGame, onBack }: ReviewStepProps) {
  const wizardTeamNames = useGameStore((s) => s.wizardTeamNames);
  const wizardPlayers = useGameStore((s) => s.wizardPlayers);
  const wizardCards = useGameStore((s) => s.wizardCards);

  const teamACount = wizardPlayers.filter((p) => p.teamIndex === 0).length;
  const teamBCount = wizardPlayers.filter((p) => p.teamIndex === 1).length;

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Text style={styles.title}>Review</Text>
        <Text style={styles.subtitle}>Check everything, then start.</Text>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Teams</Text>
            <Text style={styles.summaryValue}>
              {wizardTeamNames[0]} ({teamACount} players) · {wizardTeamNames[1]} (
              {teamBCount} players)
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Cards</Text>
            <Text style={styles.summaryValue}>{wizardCards.length} total</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <SecondaryButton title="Back" onPress={onBack} />
          <View style={styles.spacer} />
          <PrimaryButton title="Start Game" onPress={onStartGame} />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  title: {
    fontSize: typography.titleSize,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.bodySize,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  summary: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  summaryRow: {
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: typography.captionSize,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: typography.bodySize,
    color: colors.text,
  },
  actions: {
    width: '100%',
    flexDirection: 'row',
  },
  spacer: {
    width: spacing.md,
  },
});
