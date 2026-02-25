import { create } from 'zustand';
import type { GameSession } from '@/game';
import {
  advancePhaseIfCompleteCommand,
  createSessionFromWizard,
  dismissGameOverModalCommand,
  dismissPhaseCompleteModalCommand,
  endTurnCommand,
  gotItCommand,
  hydrateRunningTurn,
  passCommand,
  startTurnCommand,
  tickTurnCommand,
  undoCommand,
} from '@/game/commands';
import {
  clearAllGameData,
  loadLastActiveGameId,
  loadSession,
  saveLastActiveGameId,
  saveSession,
} from '@/storage';
import { generateId } from '@/utils/id';

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
  addWizardPlayer: (player: Omit<WizardPlayer, 'id'>) => void;
  removeWizardPlayer: (id: string) => void;
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
  gotIt: () => void;
  pass: () => void;
  undo: () => void;
  advancePhaseIfComplete: () => void;
  dismissPhaseCompleteModal: () => void;
  dismissGameOverModal: () => void;
}

const DEFAULT_TEAM_NAMES: [string, string] = ['Team A', 'Team B'];

const defaultWizard = () => ({
  wizardStep: 0 as WizardStep,
  wizardTeamNames: DEFAULT_TEAM_NAMES,
  wizardPlayers: [] as WizardPlayer[],
  wizardCards: [] as WizardCard[],
  wizardSelectedPlayerId: null as string | null,
});

export const useGameStore = create<GameState>((set, get) => ({
  currentGame: null,
  lastActiveGameId: null,

  ...defaultWizard(),

  setWizardStep: (wizardStep) => set({ wizardStep }),

  setWizardTeams: (wizardTeamNames) => set({ wizardTeamNames }),

  addWizardPlayer: (player) =>
    set((state) => ({
      wizardPlayers: [...state.wizardPlayers, { ...player, id: generateId() }],
    })),

  removeWizardPlayer: (id) =>
    set((state) => ({
      wizardPlayers: state.wizardPlayers.filter((player) => player.id !== id),
      wizardSelectedPlayerId:
        state.wizardSelectedPlayerId === id ? null : state.wizardSelectedPlayerId,
    })),

  addWizardCard: (card) =>
    set((state) => ({
      wizardCards: [...state.wizardCards, { ...card, id: generateId() }],
    })),

  removeWizardCard: (id) =>
    set((state) => ({
      wizardCards: state.wizardCards.filter((card) => card.id !== id),
    })),

  setWizardSelectedPlayerId: (wizardSelectedPlayerId) =>
    set({ wizardSelectedPlayerId }),

  resetWizard: () => set(defaultWizard()),

  createNewSession: () => {
    const { wizardTeamNames, wizardPlayers, wizardCards } = get();

    const session = createSessionFromWizard(
      {
        teamNames: wizardTeamNames,
        players: wizardPlayers,
        cards: wizardCards,
      },
      {
        generateId,
        now: Date.now,
      }
    );

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

    const hydratedSession = hydrateRunningTurn(session, Date.now());
    set({ currentGame: hydratedSession, lastActiveGameId: id });
    log('hydrateLastGame()', id);
    return true;
  },

  resetAll: async () => {
    await clearAllGameData();
    set({ currentGame: null, lastActiveGameId: null, ...defaultWizard() });
    log('resetAll()');
  },

  setLastActiveGameId: (lastActiveGameId) => set({ lastActiveGameId }),

  startTurn: () => {
    const { currentGame } = get();
    if (!currentGame) return;

    const result = startTurnCommand(currentGame, Date.now());
    if (!result.changed) {
      if (result.shouldAdvancePhase) get().advancePhaseIfComplete();
      return;
    }

    set({ currentGame: result.session });
    void get().persistCurrentGame();
    log('startTurn()', result.session.turn?.activeTeamId);
  },

  tick: () => {
    const { currentGame } = get();
    if (!currentGame) return;

    const result = tickTurnCommand(currentGame);
    if (result.shouldEndTurn) {
      get().endTurn('time');
      return;
    }

    if (!result.changed) return;
    set({ currentGame: result.session });
  },

  endTurn: (reason: 'time' | 'manual') => {
    const { currentGame } = get();
    if (!currentGame) return;

    const result = endTurnCommand(currentGame);
    if (!result.changed) return;

    set({ currentGame: result.session });
    void get().persistCurrentGame();
    if (result.shouldAdvancePhase) get().advancePhaseIfComplete();
    log('endTurn()', reason);
  },

  gotIt: () => {
    const { currentGame } = get();
    if (!currentGame) return;

    const result = gotItCommand(currentGame);
    if (!result.changed) return;

    set({ currentGame: result.session });
    void get().persistCurrentGame();
    if (result.shouldAdvancePhase) get().advancePhaseIfComplete();
  },

  pass: () => {
    const { currentGame } = get();
    if (!currentGame) return;

    const result = passCommand(currentGame);
    if (!result.changed) return;

    set({ currentGame: result.session });
    void get().persistCurrentGame();
    if (result.shouldAdvancePhase) get().advancePhaseIfComplete();
  },

  undo: () => {
    const { currentGame } = get();
    if (!currentGame) return;

    const result = undoCommand(currentGame);
    if (!result.changed) return;

    set({ currentGame: result.session });
    void get().persistCurrentGame();
  },

  advancePhaseIfComplete: () => {
    const { currentGame } = get();
    if (!currentGame) return;

    const result = advancePhaseIfCompleteCommand(currentGame);
    if (!result.changed) return;

    set({ currentGame: result.session });
    void get().persistCurrentGame();
  },

  dismissPhaseCompleteModal: () => {
    const { currentGame } = get();
    if (!currentGame) return;

    const result = dismissPhaseCompleteModalCommand(currentGame);
    if (!result.changed) return;

    set({ currentGame: result.session });
    void get().persistCurrentGame();
  },

  dismissGameOverModal: () => {
    const { currentGame } = get();
    if (!currentGame) return;

    const result = dismissGameOverModalCommand(currentGame);
    if (!result.changed) return;

    set({ currentGame: result.session });
    void get().persistCurrentGame();
  },
}));
