import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  AppStateStatus,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  BowlScoreBlock,
  FlyingWord,
  type LayoutRect,
  PrimaryButton,
  ScreenContainer,
  SecondaryButton,
} from '@/components';
import {
  getCardById,
  getCardsInBowlCount,
  getOtherTeamId,
  getTeamPhaseResult,
  getTeamPhaseScore,
  getTeamTotalScore,
  type GameSession,
  type RoundPhase,
} from '@/game';
import { useGameStore } from '@/state';
import {
  colors,
  minTouchTargetSize,
  motion,
  radius,
  shadows,
  spacing,
  typography,
} from '@/theme';
import { generateId, waitForButtonAnimation } from '@/utils';

const DEBUG = true;
const log = (step: string, detail?: string) => {
  if (DEBUG) console.log(`[Bowl] GameScreen: ${step}${detail ? ` — ${detail}` : ''}`);
};

const PHASE_LABELS: Record<RoundPhase, string> = {
  describe: 'Describe',
  oneWord: 'One Word',
  charades: 'Charades',
};

export function GameScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const currentGame = useGameStore((s) => s.currentGame);
  const persistCurrentGame = useGameStore((s) => s.persistCurrentGame);
  const resetAll = useGameStore((s) => s.resetAll);
  const startTurn = useGameStore((s) => s.startTurn);
  const tick = useGameStore((s) => s.tick);
  const endTurn = useGameStore((s) => s.endTurn);
  const gotIt = useGameStore((s) => s.gotIt);
  const pass = useGameStore((s) => s.pass);
  const undo = useGameStore((s) => s.undo);
  const dismissPhaseCompleteModal = useGameStore((s) => s.dismissPhaseCompleteModal);
  const dismissGameOverModal = useGameStore((s) => s.dismissGameOverModal);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [flyingWords, setFlyingWords] = useState<
    Array<{
      id: string;
      text: string;
      seed: number;
      from: LayoutRect;
      to: LayoutRect;
    }>
  >([]);
  const overlayHostRef = useRef<View>(null);
  const cardAreaRef = useRef<View>(null);
  const bowlARef = useRef<View>(null);
  const bowlBRef = useRef<View>(null);

  const pushFlyingWord = useCallback((
    text: string,
    targetRef: React.RefObject<View | null>
  ) => {
    requestAnimationFrame(() => {
      const overlayHost = overlayHostRef.current;
      const cardArea = cardAreaRef.current;
      const bowl = targetRef.current;
      if (!overlayHost || !cardArea || !bowl) return;

      cardArea.measureLayout(
        overlayHost,
        (cardX, cardY, cardW, cardH) => {
          bowl.measureLayout(
            overlayHost,
            (bowlX, bowlY, bowlW, bowlH) => {
              // Keep only recent particles for performance on rapid taps.
              setFlyingWords((prev) => [
                ...prev.slice(-5),
                {
                  id: generateId(),
                  text,
                  seed: Math.random(),
                  from: { x: cardX, y: cardY, width: cardW, height: cardH },
                  to: { x: bowlX, y: bowlY, width: bowlW, height: bowlH },
                },
              ]);
            },
            () => {}
          );
        },
        () => {}
      );
    });
  }, []);

  const removeFlyingWord = useCallback((id: string) => {
    setFlyingWords((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const lastActionAtRef = useRef(0);

  useEffect(() => {
    log('mounted', currentGame ? `gameId=${currentGame.id}` : 'no current game');
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      log('unmounted');
    };
  }, [currentGame?.id]);

  useEffect(() => {
    if (!currentGame?.turn?.isRunning) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = setInterval(() => {
      tick();
    }, 1000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentGame?.turn?.isRunning, currentGame?.turn?.secondsRemaining, tick]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'background') {
        persistCurrentGame();
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
      if (state === 'active') {
        persistCurrentGame();
      }
    });
    return () => sub.remove();
  }, [persistCurrentGame]);

  const confirmAction = useCallback(
    (
      title: string,
      message: string,
      confirmText: string,
      destructive: boolean,
      onConfirm: () => void | Promise<void>
    ) => {
      if (typeof globalThis.confirm === 'function') {
        const ok = globalThis.confirm(`${title}\n\n${message}`);
        if (ok) void onConfirm();
        return;
      }
      Alert.alert(title, message, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: confirmText,
          style: destructive ? 'destructive' : 'default',
          onPress: () => {
            void onConfirm();
          },
        },
      ]);
    },
    []
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (e.data.action.type !== 'GO_BACK') return;
      e.preventDefault();
      const turnRunning = currentGame?.turn?.isRunning;
      confirmAction(
        turnRunning ? 'End turn and leave?' : 'Leave game?',
        turnRunning
          ? 'The turn will end. Progress is saved.'
          : 'Your progress is saved. You can resume from Home.',
        'Leave',
        true,
        () => {
          if (turnRunning) endTurn('manual');
          router.back();
        }
      );
    });
    return unsubscribe;
  }, [confirmAction, navigation, currentGame?.turn?.isRunning, endTurn, router]);

  const handleEndGame = () => {
    confirmAction(
      'End Game',
      'This will end the current game and clear saved progress. Continue?',
      'End Game',
      true,
      async () => {
        await resetAll();
        await waitForButtonAnimation();
        router.replace('/');
      }
    );
  };

  const handleEndTurn = () => {
    confirmAction(
      'End Turn?',
      'Time will stop for this turn.',
      'End Turn',
      false,
      () => endTurn('manual')
    );
  };

  if (!currentGame) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <Text style={styles.title}>No active game</Text>
          <Text style={styles.subtitle}>Start a new game from Home.</Text>
          <PrimaryButton
            title="Go Home"
            onPress={async () => {
              await waitForButtonAnimation();
              router.replace('/');
            }}
          />
        </View>
      </ScreenContainer>
    );
  }

  if (currentGame.gameOverModal) {
    return (
      <ScreenContainer>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Game Over</Text>
          <Text style={styles.modalSubtitle}>
            {getWinnerText(currentGame)}
          </Text>
          <View style={styles.modalScores}>
            {currentGame.teams.map((t) => (
              <Text key={t.id} style={styles.modalScoreRow}>
                {t.name}: {getTeamTotalScore(currentGame, t.id)} pts
              </Text>
            ))}
          </View>
          <PrimaryButton
            title="Back to Home"
            onPress={async () => {
              dismissGameOverModal();
              await resetAll();
              await waitForButtonAnimation();
              router.replace('/');
            }}
          />
        </View>
      </ScreenContainer>
    );
  }

  if (currentGame.phaseCompleteModal) {
    const phase = currentGame.phaseCompleteModal;
    const nextLabel =
      phase === 'describe' ? 'One Word' : phase === 'oneWord' ? 'Charades' : null;
    return (
      <ScreenContainer>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Round complete: {PHASE_LABELS[phase]}</Text>
          <View style={styles.modalScores}>
            {currentGame.teams.map((t) => (
              <Text key={t.id} style={styles.modalScoreRow}>
                {t.name}: {getTeamPhaseResult(currentGame, t.id, phase)} this round
              </Text>
            ))}
          </View>
          <PrimaryButton
            title={nextLabel ? `Start ${nextLabel} Round` : 'See Results'}
            onPress={() => dismissPhaseCompleteModal()}
          />
        </View>
      </ScreenContainer>
    );
  }

  const turn = currentGame.turn;
  const isTurnRunning = turn?.isRunning ?? false;
  const currentCard = turn?.currentCardId
    ? getCardById(currentGame, turn.currentCardId)
    : null;
  const teamA = currentGame.teams[0];
  const teamB = currentGame.teams[1];
  const canUndo = (turn?.history.length ?? 0) > 0;
  const compactButtons = width < 390;
  const compactBowls = width < 360;

  const runPassWithAnimation = useCallback(() => {
    const word = currentCard?.text;
    if (!word || !currentCard || !teamA || !teamB || !turn) return;
    if (Date.now() - lastActionAtRef.current < motion.buttonBufferMs) return;
    lastActionAtRef.current = Date.now();
    const otherId = getOtherTeamId(currentGame, turn.activeTeamId);
    const bowlRef = otherId === teamA.id ? bowlARef : bowlBRef;
    pass();
    pushFlyingWord(word, bowlRef);
  }, [currentCard, currentGame, pass, pushFlyingWord, teamA, teamB, turn]);

  const runGotItWithAnimation = useCallback(() => {
    const word = currentCard?.text;
    if (!word || !currentCard || !teamA || !teamB || !turn) return;
    if (Date.now() - lastActionAtRef.current < motion.buttonBufferMs) return;
    lastActionAtRef.current = Date.now();
    const activeId = turn.activeTeamId;
    const bowlRef = activeId === teamA.id ? bowlARef : bowlBRef;
    gotIt();
    pushFlyingWord(word, bowlRef);
  }, [currentCard, gotIt, pushFlyingWord, teamA, teamB, turn]);

  return (
    <ScreenContainer>
      <View ref={overlayHostRef} style={styles.content} collapsable={false}>
        <View style={styles.header}>
          <View style={styles.phasePill}>
            <Text style={styles.phasePillText}>
              {PHASE_LABELS[currentGame.phase]}
            </Text>
          </View>
          <Text style={styles.helperText}>
            Pass sends the card directly to the other team's bowl.
          </Text>
          <Text style={styles.helperText}>
            Cards in main bowl: {getCardsInBowlCount(currentGame, currentGame.phase)}
            {turn?.currentCardId ? ' (+ 1 in hand)' : ''}
          </Text>
        </View>

        {isTurnRunning && (
          <View style={styles.timerBlock}>
            <Text style={styles.timerText}>{turn?.secondsRemaining ?? 0}</Text>
          </View>
        )}

        <View ref={cardAreaRef} style={styles.cardArea} collapsable={false}>
          {currentCard ? (
            <Text style={styles.cardText}>{currentCard.text}</Text>
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
              onPress={runPassWithAnimation}
              disabled={!currentCard}
              style={styles.actionButton}
            />
            <View style={[styles.controlSpacer, compactButtons && styles.controlSpacerStacked]} />
            <PrimaryButton
              title="GOT IT"
              onPress={runGotItWithAnimation}
              disabled={!currentCard}
              style={styles.actionButton}
            />
          </View>
          <View style={styles.undoRow}>
            <SecondaryButton
              title="UNDO"
              onPress={undo}
              disabled={!canUndo}
              style={styles.fullWidthButton}
            />
          </View>
          <View style={styles.startRow}>
            {!isTurnRunning ? (
              <PrimaryButton title="Start Turn" onPress={startTurn} style={styles.fullWidthButton} />
            ) : (
              <SecondaryButton title="End Turn" onPress={handleEndTurn} style={styles.fullWidthButton} />
            )}
          </View>
        </View>

        <View style={[styles.scoresRow, compactBowls && styles.scoresRowStacked]}>
          <View ref={bowlARef} style={styles.bowlWrapper} collapsable={false}>
            <BowlScoreBlock
              teamName={teamA?.name ?? 'Team A'}
              inBowlCount={getTeamPhaseScore(currentGame, teamA?.id ?? '', currentGame.phase)}
            />
          </View>
          <View ref={bowlBRef} style={styles.bowlWrapper} collapsable={false}>
            <BowlScoreBlock
              teamName={teamB?.name ?? 'Team B'}
              inBowlCount={getTeamPhaseScore(currentGame, teamB?.id ?? '', currentGame.phase)}
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
              onDone={() => removeFlyingWord(word.id)}
            />
          ))}
        </View>

        <View style={styles.footer}>
          <SecondaryButton title="End Game" onPress={handleEndGame} />
        </View>
      </View>
    </ScreenContainer>
  );
}

function getWinnerText(session: GameSession): string {
  if (session.teams.length < 2) return 'Game complete.';
  const a = getTeamTotalScore(session, session.teams[0].id);
  const b = getTeamTotalScore(session, session.teams[1].id);
  if (a > b) return `${session.teams[0].name} wins!`;
  if (b > a) return `${session.teams[1].name} wins!`;
  return "It's a tie!";
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
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
  title: {
    fontSize: typography.titleSize,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  subtitle: {
    fontSize: typography.bodySize,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.titleSize,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: typography.bodySize,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  modalScores: {
    marginBottom: spacing.xl,
  },
  modalScoreRow: {
    fontSize: typography.bodySize,
    color: colors.text,
    marginBottom: spacing.xs,
  },
});
