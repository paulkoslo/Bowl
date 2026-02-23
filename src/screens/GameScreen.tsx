import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  AppStateStatus,
  Modal,
  StyleSheet,
  Text,
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
  getTeamPhaseScore,
  getTeamTotalScore,
  type GameSession,
  type RoundPhase,
} from '@/game';
import { useGameStore } from '@/state';
import { colors, minTouchTargetSize, spacing, typography } from '@/theme';

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

  const [flyingWord, setFlyingWord] = useState<{
    text: string;
    from: LayoutRect;
    to: LayoutRect;
  } | null>(null);
  const cardAreaRef = useRef<View>(null);
  const bowlARef = useRef<View>(null);
  const bowlBRef = useRef<View>(null);

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

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (e.data.action.type !== 'GO_BACK') return;
      e.preventDefault();
      const turnRunning = currentGame?.turn?.isRunning;
      Alert.alert(
        turnRunning ? 'End turn and leave?' : 'Leave game?',
        turnRunning
          ? 'The turn will end. Progress is saved.'
          : 'Your progress is saved. You can resume from Home.',
        [
          { text: 'Stay', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: () => {
              if (turnRunning) endTurn('manual');
              router.back();
            },
          },
        ]
      );
    });
    return unsubscribe;
  }, [navigation, currentGame?.turn?.isRunning, endTurn]);

  const handleEndGame = () => {
    Alert.alert(
      'End Game',
      'This will end the current game and clear saved progress. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Game',
          style: 'destructive',
          onPress: async () => {
            await resetAll();
            router.replace('/');
          },
        },
      ]
    );
  };

  const handleEndTurn = () => {
    Alert.alert('End turn?', 'Time will stop for this turn.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'End Turn', onPress: () => endTurn('manual') },
    ]);
  };

  if (!currentGame) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <Text style={styles.title}>No active game</Text>
          <Text style={styles.subtitle}>Start a new game from Home.</Text>
          <PrimaryButton title="Go Home" onPress={() => router.replace('/')} />
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
            onPress={() => {
              dismissGameOverModal();
              resetAll();
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
                {t.name}: {getTeamPhaseScore(currentGame, t.id, phase)} this round
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

  const runPassWithAnimation = useCallback(() => {
    const word = currentCard?.text;
    if (!word || !currentCard || !teamA || !teamB) return;
    const otherId = getOtherTeamId(currentGame, turn!.activeTeamId);
    const bowlRef = otherId === teamA.id ? bowlARef : bowlBRef;
    cardAreaRef.current?.measureInWindow((cardX, cardY, cardW, cardH) => {
      bowlRef.current?.measureInWindow((bowlX, bowlY, bowlW, bowlH) => {
        pass();
        setFlyingWord({
          text: word,
          from: { x: cardX, y: cardY, width: cardW, height: cardH },
          to: { x: bowlX, y: bowlY, width: bowlW, height: bowlH },
        });
      });
    });
  }, [currentCard, currentGame, pass, teamA, teamB, turn]);

  const runGotItWithAnimation = useCallback(() => {
    const word = currentCard?.text;
    if (!word || !currentCard || !teamA || !teamB) return;
    const activeId = turn!.activeTeamId;
    const bowlRef = activeId === teamA.id ? bowlARef : bowlBRef;
    cardAreaRef.current?.measureInWindow((cardX, cardY, cardW, cardH) => {
      bowlRef.current?.measureInWindow((bowlX, bowlY, bowlW, bowlH) => {
        gotIt();
        setFlyingWord({
          text: word,
          from: { x: cardX, y: cardY, width: cardW, height: cardH },
          to: { x: bowlX, y: bowlY, width: bowlW, height: bowlH },
        });
      });
    });
  }, [currentCard, gotIt, teamA, teamB, turn]);

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.phasePill}>
            <Text style={styles.phasePillText}>
              {PHASE_LABELS[currentGame.phase]}
            </Text>
          </View>
          <Text style={styles.helperText}>
            Pass gives the card to the other team. One bowl this round — each word once.
          </Text>
          <Text style={styles.helperText}>
            Cards in bowl: {getCardsInBowlCount(currentGame, currentGame.phase)}
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
          <View style={styles.row}>
            <SecondaryButton
              title="PASS → OTHER TEAM"
              onPress={runPassWithAnimation}
              disabled={!currentCard}
            />
            <View style={styles.controlSpacer} />
            <PrimaryButton
              title="GOT IT"
              onPress={runGotItWithAnimation}
              disabled={!currentCard}
            />
          </View>
          <View style={styles.undoRow}>
            <SecondaryButton
              title="UNDO"
              onPress={undo}
              disabled={!canUndo}
            />
          </View>
          <View style={styles.startRow}>
            {!isTurnRunning ? (
              <PrimaryButton title="Start Turn" onPress={startTurn} />
            ) : (
              <SecondaryButton title="End Turn" onPress={handleEndTurn} />
            )}
          </View>
        </View>

        <View style={styles.scoresRow}>
          <View ref={bowlARef} style={styles.bowlWrapper} collapsable={false}>
            <BowlScoreBlock
              teamName={teamA?.name ?? 'Team A'}
              totalScore={getTeamTotalScore(currentGame, teamA?.id ?? '')}
              inBowlCount={
                (getTeamPhaseScore(currentGame, teamA?.id ?? '', currentGame.phase) ?? 0) +
                (currentGame.phaseState[currentGame.phase].passedToTeam[teamA?.id ?? '']?.length ?? 0)
              }
            />
          </View>
          <View ref={bowlBRef} style={styles.bowlWrapper} collapsable={false}>
            <BowlScoreBlock
              teamName={teamB?.name ?? 'Team B'}
              totalScore={getTeamTotalScore(currentGame, teamB?.id ?? '')}
              inBowlCount={
                (getTeamPhaseScore(currentGame, teamB?.id ?? '', currentGame.phase) ?? 0) +
                (currentGame.phaseState[currentGame.phase].passedToTeam[teamB?.id ?? '']?.length ?? 0)
              }
            />
          </View>
        </View>

        <Modal visible={!!flyingWord} transparent animationType="none" statusBarTranslucent>
          {flyingWord && (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <FlyingWord
                text={flyingWord.text}
                from={flyingWord.from}
                to={flyingWord.to}
                onDone={() => setFlyingWord(null)}
              />
            </View>
          )}
        </Modal>

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
  },
  header: {
    marginBottom: spacing.md,
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
  },
  timerBlock: {
    alignItems: 'center',
    marginBottom: spacing.lg,
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
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  cardText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  cardPlaceholder: {
    fontSize: typography.bodySize,
    color: colors.textMuted,
  },
  controls: {
    marginBottom: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  controlSpacer: {
    width: spacing.md,
  },
  undoRow: {
    marginBottom: spacing.md,
  },
  startRow: {
    marginBottom: spacing.sm,
  },
  scoresRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  bowlWrapper: {
    flex: 1,
  },
  scoreBlock: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
  },
  scoreLabel: {
    fontSize: typography.captionSize,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  scoreValue: {
    fontSize: typography.titleSize,
    fontWeight: '700',
    color: colors.text,
  },
  scorePhase: {
    fontSize: typography.captionSize,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  footer: {
    alignItems: 'center',
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
