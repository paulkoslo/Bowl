import React, { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  PrimaryButton,
  ScreenContainer,
  SecondaryButton,
  TextInput,
} from '@/components';
import { useGameStore, type WizardPlayer } from '@/state';
import {
  colors,
  minTouchTargetSize,
  motion,
  radius,
  shadows,
  spacing,
  typography,
} from '@/theme';
import { sanitizePlayerName } from '@/utils';

const MAX_PLAYER_NAME = 24;

interface PlayersStepProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function PlayersStep({ onNext, onBack, onSkip }: PlayersStepProps) {
  const [name, setName] = useState('');
  const [teamIndex, setTeamIndex] = useState<0 | 1>(0);

  const wizardTeamNames = useGameStore((s) => s.wizardTeamNames);
  const wizardPlayers = useGameStore((s) => s.wizardPlayers);
  const addWizardPlayer = useGameStore((s) => s.addWizardPlayer);
  const removeWizardPlayer = useGameStore((s) => s.removeWizardPlayer);
  const setWizardStep = useGameStore((s) => s.setWizardStep);

  const trimmed = sanitizePlayerName(name, MAX_PLAYER_NAME);
  const lastPressByKeyRef = useRef<Record<string, number>>({});

  const runBuffered = useCallback((key: string, action: () => void) => {
    const now = Date.now();
    const last = lastPressByKeyRef.current[key] ?? 0;
    if (now - last < motion.buttonBufferMs) return;
    lastPressByKeyRef.current[key] = now;
    action();
  }, []);

  const handleAdd = () => {
    if (trimmed.length === 0) return;
    addWizardPlayer({ name: trimmed, teamIndex });
    setName('');
  };

  const handleNext = () => {
    setWizardStep(2);
    onNext();
  };

  const renderPlayer = ({ item }: { item: WizardPlayer }) => (
    <View style={styles.playerRow}>
      <Text style={styles.playerName} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.playerTeam}>
        {wizardTeamNames[item.teamIndex]}
      </Text>
      <Pressable
        onPress={() =>
          runBuffered(`remove-${item.id}`, () => removeWizardPlayer(item.id))
        }
        style={({ pressed }) => [styles.removeBtn, pressed && styles.removeBtnPressed]}
        hitSlop={8}
      >
        <Text style={styles.removeText}>Remove</Text>
      </Pressable>
    </View>
  );

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Text style={styles.title}>Players</Text>
        <Text style={styles.subtitle}>
          Add players and assign to a team (optional)
        </Text>

        <View style={styles.addSection}>
          <Text style={styles.inputLabel}>Player name</Text>
          <TextInput
            placeholder="Type a name, then tap Add"
            value={name}
            onChangeText={(t) => setName(sanitizePlayerName(t, MAX_PLAYER_NAME))}
            maxLength={MAX_PLAYER_NAME}
            onSubmitEditing={handleAdd}
            style={styles.playerNameInput}
          />
          <View style={styles.teamToggle}>
            <Pressable
              onPress={() => runBuffered('team-0', () => setTeamIndex(0))}
              style={({ pressed }) => [
                styles.toggleBtn,
                teamIndex === 0 && styles.toggleBtnActive,
                pressed && styles.toggleBtnPressed,
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  teamIndex === 0 && styles.toggleTextActive,
                ]}
              >
                {wizardTeamNames[0]}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => runBuffered('team-1', () => setTeamIndex(1))}
              style={({ pressed }) => [
                styles.toggleBtn,
                teamIndex === 1 && styles.toggleBtnActive,
                pressed && styles.toggleBtnPressed,
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  teamIndex === 1 && styles.toggleTextActive,
                ]}
              >
                {wizardTeamNames[1]}
              </Text>
            </Pressable>
          </View>
          <PrimaryButton
            title="Add"
            onPress={handleAdd}
            disabled={trimmed.length === 0}
          />
        </View>

        <FlatList
          data={wizardPlayers}
          keyExtractor={(item) => item.id}
          renderItem={renderPlayer}
          style={styles.list}
          contentContainerStyle={wizardPlayers.length === 0 ? styles.listContentEmpty : undefined}
          ListEmptyComponent={
            <Text style={styles.empty}>No players yet. Add some or skip.</Text>
          }
        />

        <View style={styles.actions}>
          <SecondaryButton title="Skip" onPress={onSkip} />
          <SecondaryButton title="Back" onPress={onBack} />
          <PrimaryButton title="Next" onPress={handleNext} />
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
    marginBottom: spacing.md,
  },
  addSection: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.surfaceSoft,
  },
  inputLabel: {
    fontSize: typography.captionSize,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  playerNameInput: {
    minHeight: minTouchTargetSize,
    marginBottom: spacing.md,
  },
  teamToggle: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  toggleBtn: {
    flex: 1,
    minHeight: minTouchTargetSize,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.border,
  },
  toggleBtnActive: {
    backgroundColor: colors.secondary,
  },
  toggleBtnPressed: {
    opacity: 0.85,
  },
  toggleText: {
    fontSize: typography.bodySize,
    color: colors.textMuted,
  },
  toggleTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  list: {
    flex: 1,
    marginBottom: spacing.md,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  playerName: {
    flex: 1,
    fontSize: typography.bodySize,
    color: colors.text,
  },
  playerTeam: {
    fontSize: typography.captionSize,
    color: colors.textMuted,
    marginRight: spacing.sm,
  },
  removeBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: '#F8E3DD',
  },
  removeBtnPressed: {
    opacity: 0.8,
  },
  removeText: {
    fontSize: typography.captionSize,
    color: colors.primary,
    fontWeight: '700',
  },
  empty: {
    fontSize: typography.bodySize,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  actions: {
    width: '100%',
    gap: spacing.sm,
  },
});
