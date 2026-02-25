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

/** Per-phase state: one main bowl + team bowls (scored card IDs). */
export interface PhaseState {
  /** Single shared bowl for this round; all words appear once until guessed/passed. */
  mainBowl: string[];
  /**
   * @deprecated legacy field from older rules.
   * Always empty under the current rules (pass goes directly to the other team's bowl).
   */
  passedToTeam: Record<string, string[]>;
  /** Team id -> list of card IDs in that team's bowl for this phase. */
  scoredByTeam: Record<string, string[]>;
}

/** Team id -> final score count for a phase. */
export type PhaseResult = Record<string, number>;

/** Snapshot of finalized phase results. Null means phase is not finalized yet. */
export interface PhaseResults {
  describe: PhaseResult | null;
  oneWord: PhaseResult | null;
  charades: PhaseResult | null;
}

/** Single turn action for undo (limit 50). */
export type TurnAction =
  | {
      type: 'gotIt';
      cardId: string;
      teamId: string;
      phase: RoundPhase;
      /** Card that was auto-drawn right after this action (if any). */
      nextCardId?: string;
    }
  | {
      type: 'passToOther';
      cardId: string;
      fromTeamId: string;
      toTeamId: string;
      phase: RoundPhase;
      /** Card that was auto-drawn right after this action (if any). */
      nextCardId?: string;
    };

export interface TurnState {
  activeTeamId: string;
  activePlayerId?: string;
  secondsRemaining: number;
  isRunning: boolean;
  startedAt: number;
  currentCardId?: string;
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
  /** Finalized results per phase, captured when a phase ends. */
  phaseResults: PhaseResults;
  gameStatus: GameStatus;
  /** Last team that had a turn (for alternating). */
  lastTeamId?: string;
  /** Phase that just completed; show modal until dismissed. */
  phaseCompleteModal?: RoundPhase | null;
  /** Game over; show winner modal. */
  gameOverModal?: boolean;
}
