/**
 * Domain models for Bowl (Fishbowl-style party game).
 * Type-safe, local-only.
 */

export type RoundPhase = 'describe' | 'oneWord' | 'charades';

export interface Team {
  id: string;
  name: string;
  score: number;
}

export interface Player {
  id: string;
  name: string;
  teamId: string;
}

export interface Card {
  id: string;
  text: string;
  createdByPlayerId?: string;
}

/** Per-phase state: one main bowl + passed-to-team buckets + scored (card IDs only). */
export interface PhaseState {
  /** Single shared bowl for this round; all words appear once. Guessed words leave; passed words go to passedToTeam. */
  mainBowl: string[];
  /** Cards passed to each team this round (they draw from here on their turn when non-empty). */
  passedToTeam: Record<string, string[]>;
  /** Team id -> list of card IDs scored this phase. */
  scoredByTeam: Record<string, string[]>;
}

/** Where the current card was drawn from (for undo). */
export type DrawnFrom = 'main' | string;

/** Single turn action for undo (limit 50). */
export type TurnAction =
  | { type: 'gotIt'; cardId: string; teamId: string; phase: RoundPhase; drawnFrom: DrawnFrom }
  | {
      type: 'passToOther';
      cardId: string;
      fromTeamId: string;
      toTeamId: string;
      phase: RoundPhase;
      drawnFrom: DrawnFrom;
    };

export interface TurnState {
  activeTeamId: string;
  activePlayerId?: string;
  secondsRemaining: number;
  isRunning: boolean;
  startedAt: number;
  currentCardId?: string;
  /** Where current card was drawn from ('main' or teamId for passed pile). */
  drawnFrom?: DrawnFrom;
  history: TurnAction[];
}

/** Game status for UI. */
export type GameStatus = 'playing' | 'finished';

export interface GameSession {
  id: string;
  createdAt: number;
  teams: Team[];
  players: Player[];
  /** All cards in the game (for lookup by id). */
  deck: Card[];
  /** @deprecated kept for migration only */
  discard?: Card[];
  /** @deprecated use phaseState[*].scoredByTeam and compute totals */
  scoredByTeam?: Record<string, number>;
  phase: RoundPhase;
  turn: TurnState | null;
  settings: {
    turnSeconds: number;
  };
  phaseState: {
    describe: PhaseState;
    oneWord: PhaseState;
    charades: PhaseState;
  };
  gameStatus: GameStatus;
  /** Last team that had a turn (for alternating). */
  lastTeamId?: string;
  /** Phase that just completed; show modal until dismissed. */
  phaseCompleteModal?: RoundPhase | null;
  /** Game over; show winner modal. */
  gameOverModal?: boolean;
}
