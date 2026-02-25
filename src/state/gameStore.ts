import { create } from 'zustand';
import type {
  Card,
  GameSession,
  PhaseState,
  Player,
  Team,
  TurnAction,
  TurnState,
} from '@/game';
import {
  createEmptyPhaseResults,
  getNextPhase,
  getOtherTeamId,
  initPhaseStateForTeams,
  isPhaseComplete,
  snapshotPhaseResult,
} from '@/game';
import {
  clearAllGameData,
  loadLastActiveGameId,
  loadSession,
  saveLastActiveGameId,
  saveSession,
} from '@/storage';
import { generateId } from '@/utils/id';
import { shuffle } from '@/utils/shuffle';

const TURN_HISTORY_LIMIT = 50;

const DEBUG = true;
const log = (step: string, detail?: string) => {
  if (DEBUG) console.log(`[Bowl] gameStore: ${step}${detail ? ` — ${detail}` : ''}`);
};

/** Wizard step: 0=teams, 1=players, 2=cards, 3=review */
export type WizardStep = 0 | 1 | 2 | 3;

/** teamIndex 0 = first team, 1 = second team */
export interface WizardPlayer {
  id: string;
  name: string;
  teamIndex: 0 | 1;
}

export interface WizardCard {
  id: string;
  text: string;
  createdByPlayerId?: string;
}

interface GameState {
  currentGame: GameSession | null;
  lastActiveGameId: string | null;

  // Wizard state
  wizardStep: WizardStep;
  wizardTeamNames: [string, string];
  wizardPlayers: WizardPlayer[];
  wizardCards: WizardCard[];
  wizardSelectedPlayerId: string | null;

  // Wizard actions
  setWizardStep: (step: WizardStep) => void;
  setWizardTeams: (names: [string, string]) => void;
  setWizardPlayers: (players: WizardPlayer[]) => void;
  addWizardPlayer: (player: Omit<WizardPlayer, 'id'>) => void;
  removeWizardPlayer: (id: string) => void;
  setWizardCards: (cards: WizardCard[]) => void;
  addWizardCard: (card: Omit<WizardCard, 'id'>) => void;
  removeWizardCard: (id: string) => void;
  setWizardSelectedPlayerId: (id: string | null) => void;
  resetWizard: () => void;

  // Session actions
  createNewSession: () => GameSession;
  setCurrentGame: (session: GameSession | null) => void;
  persistCurrentGame: () => Promise<void>;
  hydrateLastGame: () => Promise<boolean>;
  resetAll: () => Promise<void>;

  setLastActiveGameId: (id: string | null) => void;

  // Gameplay
  startTurn: () => void;
  tick: () => void;
  endTurn: (reason: 'time' | 'manual') => void;
  drawNextCard: () => void;
  gotIt: () => void;
  pass: () => void;
  undo: () => void;
  advancePhaseIfComplete: () => void;
  dismissPhaseCompleteModal: () => void;
  dismissGameOverModal: () => void;

  resetGame: () => void;
}

const DEFAULT_TEAM_NAMES: [string, string] = ['Team A', 'Team B'];

const defaultWizard = () => ({
  wizardStep: 0 as WizardStep,
  wizardTeamNames: DEFAULT_TEAM_NAMES,
  wizardPlayers: [] as WizardPlayer[],
  wizardCards: [] as WizardCard[],
  wizardSelectedPlayerId: null as string | null,
});

function createEmptyPassedBuckets(teamIds: string[]): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const id of teamIds) result[id] = [];
  return result;
}

function drawFromMainBowl(phaseState: PhaseState): {
  nextPhaseState: PhaseState;
  nextCardId?: string;
} {
  const mainBowl = phaseState.mainBowl ?? [];
  if (mainBowl.length === 0) {
    return {
      nextPhaseState: phaseState,
      nextCardId: undefined,
    };
  }
  const nextCardId = mainBowl[0];
  return {
    nextPhaseState: {
      ...phaseState,
      mainBowl: mainBowl.slice(1),
    },
    nextCardId,
  };
}

export const useGameStore = create<GameState>((set, get) => ({
  currentGame: null,
  lastActiveGameId: null,

  ...defaultWizard(),

  setWizardStep: (wizardStep) => set({ wizardStep }),

  setWizardTeams: (wizardTeamNames) => set({ wizardTeamNames }),

  setWizardPlayers: (wizardPlayers) => set({ wizardPlayers }),

  addWizardPlayer: (player) =>
    set((state) => ({
      wizardPlayers: [
        ...state.wizardPlayers,
        { ...player, id: generateId() },
      ],
    })),

  removeWizardPlayer: (id) =>
    set((state) => ({
      wizardPlayers: state.wizardPlayers.filter((p) => p.id !== id),
      wizardSelectedPlayerId:
        state.wizardSelectedPlayerId === id ? null : state.wizardSelectedPlayerId,
    })),

  setWizardCards: (wizardCards) => set({ wizardCards }),

  addWizardCard: (card) =>
    set((state) => ({
      wizardCards: [...state.wizardCards, { ...card, id: generateId() }],
    })),

  removeWizardCard: (id) =>
    set((state) => ({
      wizardCards: state.wizardCards.filter((c) => c.id !== id),
    })),

  setWizardSelectedPlayerId: (wizardSelectedPlayerId) =>
    set({ wizardSelectedPlayerId }),

  resetWizard: () => set(defaultWizard()),

  createNewSession: () => {
    const {
      wizardTeamNames,
      wizardPlayers,
      wizardCards,
    } = get();

    const teamAId = generateId();
    const teamBId = generateId();
    const teams: Team[] = [
      { id: teamAId, name: wizardTeamNames[0], score: 0 },
      { id: teamBId, name: wizardTeamNames[1], score: 0 },
    ];

    const teamIds = [teamAId, teamBId];
    const players: Player[] =
      wizardPlayers.length > 0
        ? wizardPlayers.map((p) => ({
            id: p.id,
            name: p.name,
            teamId: teamIds[p.teamIndex],
          }))
        : [
            { id: generateId(), name: 'Player 1', teamId: teamAId },
            { id: generateId(), name: 'Player 2', teamId: teamBId },
          ];

    const deckCards: Card[] = wizardCards.map((c) => ({
      id: c.id,
      text: c.text,
      createdByPlayerId: c.createdByPlayerId,
    }));
    const deck = shuffle([...deckCards]);
    const cardIds = deck.map((c) => c.id);

    const phaseState = {
      describe: initPhaseStateForTeams(cardIds, teamAId, teamBId),
      oneWord: initPhaseStateForTeams(cardIds, teamAId, teamBId),
      charades: initPhaseStateForTeams(cardIds, teamAId, teamBId),
    };

    const session: GameSession = {
      id: generateId(),
      createdAt: Date.now(),
      teams,
      players,
      deck,
      phase: 'describe',
      turn: null,
      settings: { turnSeconds: 60 },
      phaseState,
      phaseResults: createEmptyPhaseResults(),
      gameStatus: 'playing',
    };

    log('createNewSession()', session.id);
    set({ currentGame: session });
    return session;
  },

  setCurrentGame: (currentGame) => set({ currentGame }),

  persistCurrentGame: async () => {
    const { currentGame } = get();
    if (!currentGame) return;
    await saveSession(currentGame);
    await saveLastActiveGameId(currentGame.id);
    set({ lastActiveGameId: currentGame.id });
    log('persistCurrentGame()', currentGame.id);
  },

  hydrateLastGame: async () => {
    const id = await loadLastActiveGameId();
    if (!id) {
      set({ lastActiveGameId: null, currentGame: null });
      return false;
    }
    const session = await loadSession(id);
    if (!session) {
      await saveLastActiveGameId(null);
      set({ lastActiveGameId: null, currentGame: null });
      return false;
    }
    if (session.turn?.isRunning) {
      const now = Date.now();
      const startedAt = session.turn.startedAt;
      const elapsed = Math.floor((now - startedAt) / 1000);
      const remaining = Math.max(0, session.turn.secondsRemaining - elapsed);
      if (remaining === 0) {
        session.turn.isRunning = false;
        session.turn.secondsRemaining = 0;
      } else {
        session.turn.secondsRemaining = remaining;
        session.turn.startedAt = now;
      }
    }
    set({ currentGame: session, lastActiveGameId: id });
    log('hydrateLastGame()', id);
    return true;
  },

  resetAll: async () => {
    await clearAllGameData();
    set({ currentGame: null, lastActiveGameId: null, ...defaultWizard() });
    log('resetAll()');
  },

  setLastActiveGameId: (lastActiveGameId) => set({ lastActiveGameId }),

  resetGame: () => {
    set({ currentGame: null });
    log('resetGame()');
  },

  startTurn: () => {
    const { currentGame } = get();
    if (!currentGame || currentGame.gameStatus !== 'playing') return;
    const teamAId = currentGame.teams[0]?.id;
    const teamBId = currentGame.teams[1]?.id;
    if (!teamAId || !teamBId) return;
    const phase = currentGame.phase;
    const state = currentGame.phaseState[phase];
    const lastTeamId = currentGame.lastTeamId;
    const activeTeamId = lastTeamId
      ? getOtherTeamId(currentGame, lastTeamId)
      : teamAId;
    const teamPlayers = currentGame.players.filter((p) => p.teamId === activeTeamId);
    const activePlayerId =
      teamPlayers.length > 0
        ? teamPlayers[0]?.id
        : undefined;
    const { nextPhaseState, nextCardId } = drawFromMainBowl(state);
    if (!nextCardId) {
      get().advancePhaseIfComplete();
      return;
    }

    const nextState: PhaseState = {
      ...nextPhaseState,
      // Legacy bucket is unused under current rules, keep it normalized/empty.
      passedToTeam: createEmptyPassedBuckets(currentGame.teams.map((t) => t.id)),
    };

    const turn: TurnState = {
      activeTeamId,
      activePlayerId,
      secondsRemaining: currentGame.settings.turnSeconds,
      isRunning: true,
      startedAt: Date.now(),
      currentCardId: nextCardId,
      history: [],
    };
    set({
      currentGame: {
        ...currentGame,
        phaseState: { ...currentGame.phaseState, [phase]: nextState },
        turn,
        lastTeamId: activeTeamId,
      },
    });
    get().persistCurrentGame();
    log('startTurn()', activeTeamId);
  },

  tick: () => {
    const { currentGame } = get();
    if (!currentGame?.turn?.isRunning) return;
    const turn = currentGame.turn;
    const newRemaining = Math.max(0, turn.secondsRemaining - 1);
    if (newRemaining === 0) {
      get().endTurn('time');
      return;
    }
    set({
      currentGame: {
        ...currentGame,
        turn: { ...turn, secondsRemaining: newRemaining },
      },
    });
  },

  endTurn: (reason: 'time' | 'manual') => {
    const { currentGame } = get();
    if (!currentGame?.turn) return;
    const phase = currentGame.phase;
    const phaseState = currentGame.phaseState[phase];
    const currentCardId = currentGame.turn.currentCardId;
    const nextPhaseState = currentCardId
      ? {
          ...phaseState,
          mainBowl: [currentCardId, ...(phaseState.mainBowl ?? [])],
          passedToTeam: createEmptyPassedBuckets(currentGame.teams.map((t) => t.id)),
        }
      : phaseState;

    set({
      currentGame: {
        ...currentGame,
        phaseState: { ...currentGame.phaseState, [phase]: nextPhaseState },
        turn: null,
      },
    });
    get().persistCurrentGame();
    get().advancePhaseIfComplete();
    log('endTurn()', reason);
  },

  drawNextCard: () => {
    const { currentGame } = get();
    if (!currentGame?.turn) return;
    const phase = currentGame.phase;
    const state = currentGame.phaseState[phase];
    const { nextPhaseState, nextCardId } = drawFromMainBowl(state);
    if (!nextCardId) {
      set({
        currentGame: {
          ...currentGame,
          turn: {
            ...currentGame.turn,
            currentCardId: undefined,
            isRunning: false,
            secondsRemaining: 0,
          },
        },
      });
      get().persistCurrentGame();
      get().advancePhaseIfComplete();
      return;
    }

    set({
      currentGame: {
        ...currentGame,
        phaseState: {
          ...currentGame.phaseState,
          [phase]: {
            ...nextPhaseState,
            passedToTeam: createEmptyPassedBuckets(currentGame.teams.map((t) => t.id)),
          },
        },
        turn: { ...currentGame.turn, currentCardId: nextCardId },
      },
    });
    get().persistCurrentGame();
  },

  gotIt: () => {
    const { currentGame } = get();
    if (!currentGame?.turn?.currentCardId) return;
    const phase = currentGame.phase;
    const state = currentGame.phaseState[phase];
    const activeTeamId = currentGame.turn.activeTeamId;
    const cardId = currentGame.turn.currentCardId;
    const scored = [...(state.scoredByTeam[activeTeamId] ?? []), cardId];
    const { nextPhaseState, nextCardId } = drawFromMainBowl(state);
    const action: TurnAction = {
      type: 'gotIt',
      cardId,
      teamId: activeTeamId,
      phase,
      nextCardId,
    };
    const history = [...currentGame.turn.history, action].slice(
      -TURN_HISTORY_LIMIT
    );
    const newState = {
      ...nextPhaseState,
      passedToTeam: createEmptyPassedBuckets(currentGame.teams.map((t) => t.id)),
      scoredByTeam: { ...state.scoredByTeam, [activeTeamId]: scored },
    };
    set({
      currentGame: {
        ...currentGame,
        phaseState: { ...currentGame.phaseState, [phase]: newState },
        turn: {
          ...currentGame.turn,
          currentCardId: nextCardId,
          isRunning: nextCardId ? currentGame.turn.isRunning : false,
          secondsRemaining: nextCardId ? currentGame.turn.secondsRemaining : 0,
          history,
        },
      },
    });
    get().persistCurrentGame();
    if (!nextCardId) get().advancePhaseIfComplete();
  },

  pass: () => {
    const { currentGame } = get();
    if (!currentGame?.turn?.currentCardId) return;
    const phase = currentGame.phase;
    const state = currentGame.phaseState[phase];
    const activeTeamId = currentGame.turn.activeTeamId;
    const otherTeamId = getOtherTeamId(currentGame, activeTeamId);
    const cardId = currentGame.turn.currentCardId;
    const credited = [...(state.scoredByTeam[otherTeamId] ?? []), cardId];
    const { nextPhaseState, nextCardId } = drawFromMainBowl(state);
    const action: TurnAction = {
      type: 'passToOther',
      cardId,
      fromTeamId: activeTeamId,
      toTeamId: otherTeamId,
      phase,
      nextCardId,
    };
    const history = [...currentGame.turn.history, action].slice(-TURN_HISTORY_LIMIT);
    const newState = {
      ...nextPhaseState,
      passedToTeam: createEmptyPassedBuckets(currentGame.teams.map((t) => t.id)),
      scoredByTeam: { ...state.scoredByTeam, [otherTeamId]: credited },
    };
    set({
      currentGame: {
        ...currentGame,
        phaseState: { ...currentGame.phaseState, [phase]: newState },
        turn: {
          ...currentGame.turn,
          currentCardId: nextCardId,
          isRunning: nextCardId ? currentGame.turn.isRunning : false,
          secondsRemaining: nextCardId ? currentGame.turn.secondsRemaining : 0,
          history,
        },
      },
    });
    get().persistCurrentGame();
    if (!nextCardId) get().advancePhaseIfComplete();
  },

  undo: () => {
    const { currentGame } = get();
    if (!currentGame?.turn || currentGame.turn.history.length === 0) return;
    const phase = currentGame.phase;
    const state = currentGame.phaseState[phase];
    const history = [...currentGame.turn.history];
    const action = history.pop()!;

    const rewoundMainBowl = [...(state.mainBowl ?? [])];
    if (action.nextCardId) {
      if (currentGame.turn.currentCardId !== action.nextCardId) {
        // Prevent corruption if state and history drifted unexpectedly.
        return;
      }
      rewoundMainBowl.unshift(action.nextCardId);
    }

    if (action.type === 'gotIt') {
      const scored = state.scoredByTeam[action.teamId] ?? [];
      const idx = scored.lastIndexOf(action.cardId);
      if (idx < 0) return;
      const newScored = [...scored];
      newScored.splice(idx, 1);
      const newState = {
        ...state,
        mainBowl: rewoundMainBowl,
        passedToTeam: createEmptyPassedBuckets(currentGame.teams.map((t) => t.id)),
        scoredByTeam: { ...state.scoredByTeam, [action.teamId]: newScored },
      };
      set({
        currentGame: {
          ...currentGame,
          phaseState: { ...currentGame.phaseState, [phase]: newState },
          turn: { ...currentGame.turn, currentCardId: action.cardId, history },
        },
      });
    } else {
      const credited = state.scoredByTeam[action.toTeamId] ?? [];
      const idx = credited.lastIndexOf(action.cardId);
      if (idx < 0) return;
      const newCredited = [...credited];
      newCredited.splice(idx, 1);
      const newState = {
        ...state,
        mainBowl: rewoundMainBowl,
        passedToTeam: createEmptyPassedBuckets(currentGame.teams.map((t) => t.id)),
        scoredByTeam: { ...state.scoredByTeam, [action.toTeamId]: newCredited },
      };
      set({
        currentGame: {
          ...currentGame,
          phaseState: { ...currentGame.phaseState, [phase]: newState },
          turn: { ...currentGame.turn, currentCardId: action.cardId, history },
        },
      });
    }
    get().persistCurrentGame();
  },

  advancePhaseIfComplete: () => {
    const { currentGame } = get();
    if (!currentGame || !isPhaseComplete(currentGame, currentGame.phase)) return;
    const phase = currentGame.phase;
    const next = getNextPhase(phase);
    const finalizedPhaseResult = snapshotPhaseResult(currentGame, phase);
    const nextPhaseResults = {
      ...currentGame.phaseResults,
      [phase]: finalizedPhaseResult,
    };
    if (next) {
      set({
        currentGame: {
          ...currentGame,
          phaseResults: nextPhaseResults,
          phaseCompleteModal: phase,
          turn: null,
        },
      });
    } else {
      set({
        currentGame: {
          ...currentGame,
          phaseResults: nextPhaseResults,
          gameStatus: 'finished',
          gameOverModal: true,
          turn: null,
        },
      });
    }
    get().persistCurrentGame();
  },

  dismissPhaseCompleteModal: () => {
    const { currentGame } = get();
    if (!currentGame?.phaseCompleteModal) return;
    const next = getNextPhase(currentGame.phaseCompleteModal);
    if (!next) return;
    const cardIds = currentGame.deck.map((c) => c.id);
    const teamAId = currentGame.teams[0]?.id!;
    const teamBId = currentGame.teams[1]?.id!;
    const nextPhaseState = initPhaseStateForTeams(cardIds, teamAId, teamBId);
    set({
      currentGame: {
        ...currentGame,
        phase: next,
        phaseState: { ...currentGame.phaseState, [next]: nextPhaseState },
        phaseCompleteModal: undefined,
        turn: null,
      },
    });
    get().persistCurrentGame();
  },

  dismissGameOverModal: () => {
    const { currentGame } = get();
    if (!currentGame) return;
    set({
      currentGame: { ...currentGame, gameOverModal: false },
    });
    get().persistCurrentGame();
  },
}));
