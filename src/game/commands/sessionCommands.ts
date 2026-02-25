import {
  createEmptyPhaseResults,
  initPhaseStateForTeams,
} from '../engine';
import type { Card, GameSession, Player, Team } from '../models';
import { shuffle } from '../../utils/shuffle';

export interface WizardPlayerSeed {
  id: string;
  name: string;
  teamIndex: 0 | 1;
}

export interface WizardCardSeed {
  id: string;
  text: string;
  createdByPlayerId?: string;
}

export interface CreateSessionInput {
  teamNames: [string, string];
  players: WizardPlayerSeed[];
  cards: WizardCardSeed[];
}

export interface CreateSessionDeps {
  generateId: () => string;
  now?: () => number;
}

/**
 * Build a new game session from wizard inputs using pure data transforms.
 */
export function createSessionFromWizard(
  input: CreateSessionInput,
  deps: CreateSessionDeps
): GameSession {
  const now = deps.now ?? Date.now;

  const teamAId = deps.generateId();
  const teamBId = deps.generateId();

  const teams: Team[] = [
    { id: teamAId, name: input.teamNames[0], score: 0 },
    { id: teamBId, name: input.teamNames[1], score: 0 },
  ];

  const teamIds = [teamAId, teamBId];
  const players: Player[] =
    input.players.length > 0
      ? input.players.map((player) => ({
          id: player.id,
          name: player.name,
          teamId: teamIds[player.teamIndex],
        }))
      : [
          { id: deps.generateId(), name: 'Player 1', teamId: teamAId },
          { id: deps.generateId(), name: 'Player 2', teamId: teamBId },
        ];

  const deckCards: Card[] = input.cards.map((card) => ({
    id: card.id,
    text: card.text,
    createdByPlayerId: card.createdByPlayerId,
  }));

  const deck = shuffle([...deckCards]);
  const cardIds = deck.map((card) => card.id);

  const phaseState = {
    describe: initPhaseStateForTeams(cardIds, teamAId, teamBId),
    oneWord: initPhaseStateForTeams(cardIds, teamAId, teamBId),
    charades: initPhaseStateForTeams(cardIds, teamAId, teamBId),
  };

  return {
    id: deps.generateId(),
    createdAt: now(),
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
}

/**
 * Reconcile a persisted running turn using wall time elapsed while app was inactive.
 */
export function hydrateRunningTurn(
  session: GameSession,
  nowMs = Date.now()
): GameSession {
  const turn = session.turn;
  if (!turn?.isRunning) return session;

  const elapsed = Math.floor((nowMs - turn.startedAt) / 1000);
  if (elapsed <= 0) return session;

  const remaining = Math.max(0, turn.secondsRemaining - elapsed);
  if (remaining === turn.secondsRemaining) return session;

  if (remaining === 0) {
    return {
      ...session,
      turn: {
        ...turn,
        isRunning: false,
        secondsRemaining: 0,
      },
    };
  }

  return {
    ...session,
    turn: {
      ...turn,
      secondsRemaining: remaining,
      startedAt: nowMs,
    },
  };
}
