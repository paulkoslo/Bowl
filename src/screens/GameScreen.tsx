import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef } from 'react';
import { Alert, AppState, AppStateStatus, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '@/components';
import {
  getOtherTeamId,
  selectCanUndo,
  selectCurrentCard,
  selectIsTurnRunning,
  selectTeams,
} from '@/game';
import { ROUTES } from '@/navigation';
import { useGameStore } from '@/state';
import { motion } from '@/theme';
import { waitForButtonAnimation } from '@/utils';
import {
  GameOverModalView,
  GamePlayView,
  NoActiveGameView,
  PhaseCompleteModalView,
  useFlyingWords,
  useTurnTimer,
} from './game';

const DEBUG = true;
const log = (step: string, detail?: string) => {
  if (DEBUG) console.log(`[Bowl] GameScreen: ${step}${detail ? ` — ${detail}` : ''}`);
};

export function GameScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();

  const currentGame = useGameStore((state) => state.currentGame);
  const persistCurrentGame = useGameStore((state) => state.persistCurrentGame);
  const resetAll = useGameStore((state) => state.resetAll);
  const startTurn = useGameStore((state) => state.startTurn);
  const tick = useGameStore((state) => state.tick);
  const endTurn = useGameStore((state) => state.endTurn);
  const gotIt = useGameStore((state) => state.gotIt);
  const pass = useGameStore((state) => state.pass);
  const undo = useGameStore((state) => state.undo);
  const dismissPhaseCompleteModal = useGameStore(
    (state) => state.dismissPhaseCompleteModal
  );
  const dismissGameOverModal = useGameStore((state) => state.dismissGameOverModal);

  const {
    flyingWords,
    overlayHostRef,
    cardAreaRef,
    bowlARef,
    bowlBRef,
    pushFlyingWord,
    removeFlyingWord,
  } = useFlyingWords();

  const turn = currentGame?.turn;
  const currentGameId = currentGame?.id;
  const isTurnRunning = currentGame ? selectIsTurnRunning(currentGame) : false;
  const currentCard = currentGame ? selectCurrentCard(currentGame) : null;
  const canUndo = currentGame ? selectCanUndo(currentGame) : false;
  const { teamA, teamB } = currentGame
    ? selectTeams(currentGame)
    : { teamA: undefined, teamB: undefined };

  const { clearTimer } = useTurnTimer(isTurnRunning, tick);

  const lastActionAtRef = useRef(0);

  useEffect(() => {
    log('mounted', currentGameId ? `gameId=${currentGameId}` : 'no current game');
    return () => {
      clearTimer();
      log('unmounted');
    };
  }, [clearTimer, currentGameId]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'background') {
        void persistCurrentGame();
        clearTimer();
      }
      if (state === 'active') {
        void persistCurrentGame();
      }
    });

    return () => subscription.remove();
  }, [clearTimer, persistCurrentGame]);

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
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (event.data.action.type !== 'GO_BACK') return;

      event.preventDefault();
      const turnRunning = currentGame?.turn?.isRunning;

      confirmAction(
        turnRunning ? 'End turn and leave?' : 'Leave game?',
        turnRunning
          ? 'The turn will end. Progress is saved.'
          : 'Your progress is saved. You can resume from Home.',
        'Leave',
        true,
        async () => {
          if (turnRunning) endTurn('manual');
          await waitForButtonAnimation();
          router.back();
        }
      );
    });

    return unsubscribe;
  }, [confirmAction, currentGame?.turn?.isRunning, endTurn, navigation, router]);

  const handleEndGame = useCallback(() => {
    confirmAction(
      'End Game',
      'This will end the current game and clear saved progress. Continue?',
      'End Game',
      true,
      async () => {
        await resetAll();
        await waitForButtonAnimation();
        router.replace(ROUTES.HOME);
      }
    );
  }, [confirmAction, resetAll, router]);

  const handleEndTurn = useCallback(() => {
    confirmAction('End Turn?', 'Time will stop for this turn.', 'End Turn', false, () =>
      endTurn('manual')
    );
  }, [confirmAction, endTurn]);

  const runPassWithAnimation = useCallback(() => {
    const word = currentCard?.text;
    if (!currentGame || !word || !teamA || !teamB || !turn) return;

    if (Date.now() - lastActionAtRef.current < motion.buttonBufferMs) return;
    lastActionAtRef.current = Date.now();

    const otherTeamId = getOtherTeamId(currentGame, turn.activeTeamId);
    const bowlRef = otherTeamId === teamA.id ? bowlARef : bowlBRef;

    pass();
    pushFlyingWord(word, bowlRef);
  }, [bowlARef, bowlBRef, currentCard, currentGame, pass, pushFlyingWord, teamA, teamB, turn]);

  const runGotItWithAnimation = useCallback(() => {
    const word = currentCard?.text;
    if (!word || !teamA || !teamB || !turn) return;

    if (Date.now() - lastActionAtRef.current < motion.buttonBufferMs) return;
    lastActionAtRef.current = Date.now();

    const bowlRef = turn.activeTeamId === teamA.id ? bowlARef : bowlBRef;

    gotIt();
    pushFlyingWord(word, bowlRef);
  }, [bowlARef, bowlBRef, currentCard, gotIt, pushFlyingWord, teamA, teamB, turn]);

  if (!currentGame) {
    return (
      <NoActiveGameView
        onGoHome={async () => {
          await waitForButtonAnimation();
          router.replace(ROUTES.HOME);
        }}
      />
    );
  }

  if (currentGame.gameOverModal) {
    return (
      <GameOverModalView
        session={currentGame}
        onDismiss={dismissGameOverModal}
        onResetAll={resetAll}
        onNavigateHome={async (path) => {
          await waitForButtonAnimation();
          router.replace(path);
        }}
      />
    );
  }

  if (currentGame.phaseCompleteModal) {
    return (
      <PhaseCompleteModalView
        session={currentGame}
        phase={currentGame.phaseCompleteModal}
        onStartNextPhase={dismissPhaseCompleteModal}
      />
    );
  }

  return (
    <ScreenContainer>
      <GamePlayView
        session={currentGame}
        width={width}
        currentCardText={currentCard?.text ?? null}
        canUndo={canUndo}
        isTurnRunning={isTurnRunning}
        secondsRemaining={turn?.secondsRemaining ?? 0}
        flyingWords={flyingWords}
        overlayHostRef={overlayHostRef}
        cardAreaRef={cardAreaRef}
        bowlARef={bowlARef}
        bowlBRef={bowlBRef}
        onPass={runPassWithAnimation}
        onGotIt={runGotItWithAnimation}
        onUndo={undo}
        onStartTurn={startTurn}
        onEndTurn={handleEndTurn}
        onEndGame={handleEndGame}
        onRemoveFlyingWord={removeFlyingWord}
      />
    </ScreenContainer>
  );
}
