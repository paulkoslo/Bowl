import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, ScreenContainer, TextInput } from '@/components';
import { useGameStore } from '@/state';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { sanitizeTeamName } from '@/utils';

const MAX_TEAM_NAME = 20;

interface TeamsStepProps {
  onNext: () => void;
}

export function TeamsStep({ onNext }: TeamsStepProps) {
  const [teamA, setTeamA] = useState(useGameStore.getState().wizardTeamNames[0]);
  const [teamB, setTeamB] = useState(useGameStore.getState().wizardTeamNames[1]);
  const setWizardTeams = useGameStore((s) => s.setWizardTeams);

  const nameA = sanitizeTeamName(teamA, MAX_TEAM_NAME);
  const nameB = sanitizeTeamName(teamB, MAX_TEAM_NAME);
  const valid = nameA.length > 0 && nameB.length > 0;

  const handleNext = () => {
    setWizardTeams([nameA, nameB]);
    onNext();
  };

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Text style={styles.title}>Teams</Text>
        <Text style={styles.subtitle}>Name your two teams (max {MAX_TEAM_NAME} chars each)</Text>

        <View style={styles.inputs}>
          <TextInput
            placeholder="Team A"
            value={teamA}
            onChangeText={(t) => setTeamA(sanitizeTeamName(t, MAX_TEAM_NAME))}
            maxLength={MAX_TEAM_NAME}
            autoCapitalize="words"
          />
          <View style={styles.spacer} />
          <TextInput
            placeholder="Team B"
            value={teamB}
            onChangeText={(t) => setTeamB(sanitizeTeamName(t, MAX_TEAM_NAME))}
            maxLength={MAX_TEAM_NAME}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.actions}>
          <PrimaryButton title="Next" onPress={handleNext} disabled={!valid} />
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
  inputs: {
    marginBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.surfaceSoft,
  },
  spacer: {
    height: spacing.md,
  },
  actions: {
    width: '100%',
  },
});
