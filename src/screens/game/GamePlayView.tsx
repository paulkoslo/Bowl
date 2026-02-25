import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  BowlScoreBlock,
  FlyingWord,
  PrimaryButton,
  SecondaryButton,
  type LayoutRect,
} from '@/components';
import {
  getCardsInBowlCount,
  getTeamPhaseScore,
  type GameSession,
} from '@/game';
import {
  colors,
  minTouchTargetSize,
  radius,
  shadows,
  spacing,
  typography,
} from '@/theme';
import { PHASE_LABELS } from './constants';

interface FlyingWordView {
  id: string;
  text: string;
  seed: number;
  from: LayoutRect;
  to: LayoutRect;
}

interface GamePlayViewProps {
  session: GameSession;
  width: number;
  currentCardText: string | null;
  canUndo: boolean;
  isTurnRunning: boolean;
  secondsRemaining: number;
  flyingWords: FlyingWordView[];
  overlayHostRef: React.RefObject<View | null>;
  cardAreaRef: React.RefObject<View | null>;
  bowlARef: React.RefObject<View | null>;
  bowlBRef: React.RefObject<View | null>;
  onPass: () => void;
  onGotIt: () => void;
  onUndo: () => void;
  onStartTurn: () => void;
  onEndTurn: () => void;
  onEndGame: () => void;
  onRemoveFlyingWord: (id: string) => void;
}

export function GamePlayView({
  session,
  width,
  currentCardText,
  canUndo,
  isTurnRunning,
  secondsRemaining,
  flyingWords,
  overlayHostRef,
  cardAreaRef,
  bowlARef,
  bowlBRef,
  onPass,
  onGotIt,
  onUndo,
  onStartTurn,
  onEndTurn,
  onEndGame,
  onRemoveFlyingWord,
}: GamePlayViewProps) {
  const teamA = session.teams[0];
  const teamB = session.teams[1];
  const compactButtons = width < 390;
  const compactBowls = width < 360;

  return (
    <View ref={overlayHostRef} style={styles.content} collapsable={false}>
      <View style={styles.header}>
        <View style={styles.phasePill}>
          <Text style={styles.phasePillText}>{PHASE_LABELS[session.phase]}</Text>
        </View>
        <Text style={styles.helperText}>
          Pass sends the card directly to the other team&apos;s bowl.
        </Text>
        <Text style={styles.helperText}>
          Cards in main bowl: {getCardsInBowlCount(session, session.phase)}
          {session.turn?.currentCardId ? ' (+ 1 in hand)' : ''}
        </Text>
      </View>

      {isTurnRunning && (
        <View style={styles.timerBlock}>
          <Text style={styles.timerText}>{secondsRemaining}</Text>
        </View>
      )}

      <View ref={cardAreaRef} style={styles.cardArea} collapsable={false}>
        {currentCardText ? (
          <Text style={styles.cardText}>{currentCardText}</Text>
        ) : (
          <Text style={styles.cardPlaceholder}>
            {isTurnRunning ? 'No card' : 'Tap Start Turn'}
          </Text>
        )}
      </View>

      <View style={styles.controls}>
        <View style={[styles.row, compactButtons && styles.rowStacked]}>
          <SecondaryButton
            title="PASS"
            onPress={onPass}
            disabled={!currentCardText}
            style={styles.actionButton}
          />
          <View
            style={[styles.controlSpacer, compactButtons && styles.controlSpacerStacked]}
          />
          <PrimaryButton
            title="GOT IT"
            onPress={onGotIt}
            disabled={!currentCardText}
            style={styles.actionButton}
          />
        </View>
        <View style={styles.undoRow}>
          <SecondaryButton
            title="UNDO"
            onPress={onUndo}
            disabled={!canUndo}
            style={styles.fullWidthButton}
          />
        </View>
        <View style={styles.startRow}>
          {!isTurnRunning ? (
            <PrimaryButton
              title="Start Turn"
              onPress={onStartTurn}
              style={styles.fullWidthButton}
            />
          ) : (
            <SecondaryButton
              title="End Turn"
              onPress={onEndTurn}
              style={styles.fullWidthButton}
            />
          )}
        </View>
      </View>

      <View style={[styles.scoresRow, compactBowls && styles.scoresRowStacked]}>
        <View ref={bowlARef} style={styles.bowlWrapper} collapsable={false}>
          <BowlScoreBlock
            teamName={teamA?.name ?? 'Team A'}
            inBowlCount={getTeamPhaseScore(session, teamA?.id ?? '', session.phase)}
          />
        </View>
        <View ref={bowlBRef} style={styles.bowlWrapper} collapsable={false}>
          <BowlScoreBlock
            teamName={teamB?.name ?? 'Team B'}
            inBowlCount={getTeamPhaseScore(session, teamB?.id ?? '', session.phase)}
          />
        </View>
      </View>

      <View style={styles.flyingLayer} pointerEvents="none">
        {flyingWords.map((word) => (
          <FlyingWord
            key={word.id}
            text={word.text}
            seed={word.seed}
            from={word.from}
            to={word.to}
            onDone={() => onRemoveFlyingWord(word.id)}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <SecondaryButton title="End Game" onPress={onEndGame} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    position: 'relative',
  },
  header: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    ...shadows.surfaceSoft,
  },
  phasePill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.secondary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    marginBottom: spacing.xs,
  },
  phasePillText: {
    fontSize: typography.captionSize,
    fontWeight: '600',
    color: '#fff',
  },
  helperText: {
    fontSize: typography.captionSize,
    color: colors.textMuted,
    lineHeight: typography.captionLineHeight,
  },
  timerBlock: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  timerText: {
    fontSize: 56,
    fontWeight: '800',
    color: colors.text,
  },
  cardArea: {
    minHeight: minTouchTargetSize * 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.surfaceSoft,
  },
  cardText: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  cardPlaceholder: {
    fontSize: typography.bodySize,
    color: colors.textMuted,
  },
  controls: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: spacing.md,
  },
  controlSpacer: {
    width: spacing.md,
  },
  rowStacked: {
    flexDirection: 'column',
    marginBottom: spacing.sm,
  },
  controlSpacerStacked: {
    width: 0,
    height: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  undoRow: {
    marginBottom: spacing.md,
  },
  startRow: {
    marginBottom: spacing.sm,
  },
  fullWidthButton: {
    width: '100%',
  },
  scoresRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  scoresRowStacked: {
    flexDirection: 'column',
  },
  bowlWrapper: {
    flex: 1,
  },
  flyingLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
});
