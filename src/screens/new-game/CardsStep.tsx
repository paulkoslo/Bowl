import React, { useState } from 'react';
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
import { MIN_CARDS, STARTER_CARDS } from '@/game';
import { useGameStore, type WizardCard } from '@/state';
import { sanitizeCardText } from '@/utils';
import { colors, spacing, typography } from '@/theme';

const MAX_CARD_TEXT = 80;

interface CardsStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function CardsStep({ onNext, onBack }: CardsStepProps) {
  const [text, setText] = useState('');

  const wizardCards = useGameStore((s) => s.wizardCards);
  const wizardPlayers = useGameStore((s) => s.wizardPlayers);
  const wizardSelectedPlayerId = useGameStore((s) => s.wizardSelectedPlayerId);
  const addWizardCard = useGameStore((s) => s.addWizardCard);
  const removeWizardCard = useGameStore((s) => s.removeWizardCard);
  const setWizardSelectedPlayerId = useGameStore((s) => s.setWizardSelectedPlayerId);
  const setWizardStep = useGameStore((s) => s.setWizardStep);

  const trimmed = sanitizeCardText(text, MAX_CARD_TEXT);
  const canReview = wizardCards.length >= MIN_CARDS;

  const handleAdd = () => {
    if (trimmed.length === 0) return;
    addWizardCard({
      text: trimmed,
      createdByPlayerId: wizardPlayers.length > 0 ? wizardSelectedPlayerId ?? undefined : undefined,
    });
    setText('');
  };

  const handleRandomPack = () => {
    STARTER_CARDS.forEach((t) =>
      addWizardCard({
        text: t,
        createdByPlayerId:
          wizardPlayers.length > 0 ? wizardSelectedPlayerId ?? undefined : undefined,
      })
    );
  };

  const handleReview = () => {
    setWizardStep(3);
    onNext();
  };

  const renderCard = ({ item }: { item: WizardCard }) => (
    <View style={styles.cardRow}>
      <Text style={styles.cardText} numberOfLines={1}>
        {item.text}
      </Text>
      <Pressable
        onPress={() => removeWizardCard(item.id)}
        style={styles.removeBtn}
        hitSlop={8}
      >
        <Text style={styles.removeText}>Delete</Text>
      </Pressable>
    </View>
  );

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Text style={styles.title}>Cards</Text>
        <Text style={styles.subtitle}>
          Add words or phrases to play with (min {MIN_CARDS})
        </Text>

        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {wizardCards.length} cards (min {MIN_CARDS})
          </Text>
        </View>

        {wizardPlayers.length > 0 && (
          <View style={styles.playerPicker}>
            <Text style={styles.pickerLabel}>Added by:</Text>
            <View style={styles.pickerRow}>
              {wizardPlayers.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => setWizardSelectedPlayerId(p.id)}
                  style={[
                    styles.pickerChip,
                    wizardSelectedPlayerId === p.id && styles.pickerChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.pickerChipText,
                      wizardSelectedPlayerId === p.id && styles.pickerChipTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {p.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <View style={styles.addRow}>
          <View style={styles.inputWrap}>
            <TextInput
              placeholder="Word or phrase"
              value={text}
              onChangeText={(t) => setText(sanitizeCardText(t, MAX_CARD_TEXT))}
              maxLength={MAX_CARD_TEXT}
              onSubmitEditing={handleAdd}
            />
          </View>
          <PrimaryButton
            title="Add"
            onPress={handleAdd}
            disabled={trimmed.length === 0}
          />
        </View>

        <SecondaryButton
          title="Random pack (20 cards)"
          onPress={handleRandomPack}
        />
        <View style={styles.spacer} />

        <FlatList
          data={wizardCards}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          style={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>No cards yet. Add at least {MIN_CARDS}.</Text>
          }
        />

        <View style={styles.actions}>
          <SecondaryButton title="Back" onPress={onBack} />
          <View style={styles.spacer} />
          <PrimaryButton
            title="Review"
            onPress={handleReview}
            disabled={!canReview}
          />
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
    marginBottom: spacing.sm,
  },
  counter: {
    marginBottom: spacing.sm,
  },
  counterText: {
    fontSize: typography.captionSize,
    color: colors.textMuted,
  },
  playerPicker: {
    marginBottom: spacing.md,
  },
  pickerLabel: {
    fontSize: typography.captionSize,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pickerChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.border,
  },
  pickerChipActive: {
    backgroundColor: colors.secondary,
  },
  pickerChipText: {
    fontSize: typography.captionSize,
    color: colors.textMuted,
  },
  pickerChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  inputWrap: {
    flex: 1,
  },
  spacer: {
    height: spacing.sm,
  },
  list: {
    flex: 1,
    marginBottom: spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  cardText: {
    flex: 1,
    fontSize: typography.bodySize,
    color: colors.text,
  },
  removeBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  removeText: {
    fontSize: typography.captionSize,
    color: colors.primary,
  },
  empty: {
    fontSize: typography.bodySize,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  actions: {
    width: '100%',
    flexDirection: 'row',
  },
});
