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
import { MIN_CARDS, STARTER_CARDS } from '@/game';
import { useGameStore, type WizardCard } from '@/state';
import { sanitizeCardText } from '@/utils';
import { colors, motion, radius, shadows, spacing, typography } from '@/theme';

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

  const trimmed = sanitizeCardText(text, MAX_CARD_TEXT);
  const canReview = wizardCards.length >= MIN_CARDS;
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
    onNext();
  };

  const renderCard = ({ item }: { item: WizardCard }) => (
    <View style={styles.cardRow}>
      <Text style={styles.cardText} numberOfLines={1}>
        {item.text}
      </Text>
      <Pressable
        onPress={() =>
          runBuffered(`remove-${item.id}`, () => removeWizardCard(item.id))
        }
        style={({ pressed }) => [styles.removeBtn, pressed && styles.removeBtnPressed]}
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
                  onPress={() =>
                    runBuffered(`picker-${p.id}`, () => setWizardSelectedPlayerId(p.id))
                  }
                  style={({ pressed }) => [
                    styles.pickerChip,
                    wizardSelectedPlayerId === p.id && styles.pickerChipActive,
                    pressed && styles.pickerChipPressed,
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
          contentContainerStyle={wizardCards.length === 0 ? styles.listContentEmpty : undefined}
          ListEmptyComponent={
            <Text style={styles.empty}>No cards yet. Add at least {MIN_CARDS}.</Text>
          }
        />

        <View style={styles.actions}>
          <SecondaryButton title="Back" onPress={onBack} style={styles.actionButton} />
          <PrimaryButton
            title="Review"
            onPress={handleReview}
            disabled={!canReview}
            style={styles.actionButton}
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
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  counterText: {
    fontSize: typography.captionSize,
    color: colors.textMuted,
    fontWeight: '600',
  },
  playerPicker: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
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
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  pickerChipActive: {
    backgroundColor: colors.secondary,
  },
  pickerChipPressed: {
    opacity: 0.82,
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
    width: spacing.sm,
  },
  list: {
    flex: 1,
    marginBottom: spacing.md,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    ...shadows.surfaceSoft,
  },
  cardText: {
    flex: 1,
    fontSize: typography.bodySize,
    color: colors.text,
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
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
