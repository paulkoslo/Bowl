import type {
  Card,
  GameSession,
  PhaseResult,
  PhaseState,
  RoundPhase,
} from './models';
import { shuffle } from '../utils/shuffle';

export const PHASE_ORDER: RoundPhase[] = ['describe', 'oneWord', 'charades'];

export function getOtherTeamId(session: GameSession, teamId: string): string {
  const ids = session.teams.map((t) => t.id);
  const other = ids.find((id) => id !== teamId);
  return other ?? ids[0];
}

/** Initialize phaseState for a phase: one main bowl, empty passed buckets. */
export function initPhaseStateForTeams(
  cardIds: string[],
  teamAId: string,
  teamBId: string
): PhaseState {
  const shuffled = shuffle([...cardIds]);
  return {
    mainBowl: shuffled,
    passedToTeam: { [teamAId]: [], [teamBId]: [] },
    scoredByTeam: { [teamAId]: [], [teamBId]: [] },
  };
}

export function createEmptyPhaseResults(): GameSession['phaseResults'] {
  return {
    describe: null,
    oneWord: null,
    charades: null,
  };
}

function mergeUniqueCardIds(...lists: string[][]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const list of lists) {
    for (const id of list) {
      if (!seen.has(id)) {
        seen.add(id);
        merged.push(id);
      }
    }
  }
  return merged;
}

export function snapshotPhaseResult(
  session: GameSession,
  phase: RoundPhase
): PhaseResult {
  const teamIds = session.teams.map((t) => t.id);
  const scored = session.phaseState[phase].scoredByTeam;
  const result: PhaseResult = {};
  for (const teamId of teamIds) {
    result[teamId] = scored[teamId]?.length ?? 0;
  }
  return result;
}

/** Total score for a team across all phases (count of scored card IDs). */
export function getTeamTotalScore(session: GameSession, teamId: string): number {
  let total = 0;
  for (const phase of PHASE_ORDER) {
    const finalized = session.phaseResults[phase]?.[teamId];
    if (typeof finalized === 'number') {
      total += finalized;
    } else {
      total += session.phaseState[phase].scoredByTeam[teamId]?.length ?? 0;
    }
  }
  return total;
}

/** Current phase score for a team. */
export function getTeamPhaseScore(
  session: GameSession,
  teamId: string,
  phase: RoundPhase
): number {
  return session.phaseState[phase].scoredByTeam[teamId]?.length ?? 0;
}

/** Finalized phase score if available; otherwise current in-progress phase score. */
export function getTeamPhaseResult(
  session: GameSession,
  teamId: string,
  phase: RoundPhase
): number {
  const finalized = session.phaseResults[phase]?.[teamId];
  if (typeof finalized === 'number') return finalized;
  return getTeamPhaseScore(session, teamId, phase);
}

/** Phase is complete when main bowl is empty. */
export function isPhaseComplete(session: GameSession, phase: RoundPhase): boolean {
  const state = session.phaseState[phase];
  return (state.mainBowl?.length ?? 0) === 0;
}

/** Ensure phase state has both team keys and migrate legacy passed cards into team bowls. */
function normalizePhaseState(
  state: PhaseState,
  teamAId: string,
  teamBId: string
): PhaseState {
  const teamAPassedLegacy = state.passedToTeam?.[teamAId] ?? [];
  const teamBPassedLegacy = state.passedToTeam?.[teamBId] ?? [];
  const teamAScored = state.scoredByTeam?.[teamAId] ?? [];
  const teamBScored = state.scoredByTeam?.[teamBId] ?? [];

  return {
    mainBowl: Array.isArray(state.mainBowl) ? state.mainBowl : [],
    passedToTeam: {
      [teamAId]: [],
      [teamBId]: [],
    },
    scoredByTeam: {
      [teamAId]: mergeUniqueCardIds(teamAScored, teamAPassedLegacy),
      [teamBId]: mergeUniqueCardIds(teamBScored, teamBPassedLegacy),
    },
  };
}

/** Get next phase or null if game over. */
export function getNextPhase(phase: RoundPhase): RoundPhase | null {
  const idx = PHASE_ORDER.indexOf(phase);
  if (idx < 0 || idx >= PHASE_ORDER.length - 1) return null;
  return PHASE_ORDER[idx + 1];
}

/** Get card text by id from deck. */
export function getCardById(session: GameSession, cardId: string): Card | undefined {
  return session.deck.find((c) => c.id === cardId);
}

/** Count cards still in play this phase (main bowl only). */
export function getCardsInBowlCount(session: GameSession, phase: RoundPhase): number {
  const state = session.phaseState[phase];
  return state.mainBowl?.length ?? 0;
}

/** Migrate old phaseState (drawPileByTeam) to new (mainBowl + passedToTeam). */
function migratePhaseStateFromDrawPileByTeam(
  old: {
    describe: {
      drawPileByTeam: Record<string, string[]>;
      scoredByTeam: Record<string, string[]>;
    };
    oneWord: {
      drawPileByTeam: Record<string, string[]>;
      scoredByTeam: Record<string, string[]>;
    };
    charades: {
      drawPileByTeam: Record<string, string[]>;
      scoredByTeam: Record<string, string[]>;
    };
  },
  teamAId: string,
  teamBId: string
): GameSession['phaseState'] {
  const migrateOne = (phase: keyof typeof old) => {
    const p = old[phase];
    const mainBowl = mergeUniqueCardIds(
      p.drawPileByTeam?.[teamAId] ?? [],
      p.drawPileByTeam?.[teamBId] ?? []
    );
    return {
      mainBowl: [...mainBowl],
      passedToTeam: { [teamAId]: [], [teamBId]: [] },
      scoredByTeam: {
        [teamAId]: p.scoredByTeam?.[teamAId] ?? [],
        [teamBId]: p.scoredByTeam?.[teamBId] ?? [],
      },
    };
  };
  return {
    describe: migrateOne('describe'),
    oneWord: migrateOne('oneWord'),
    charades: migrateOne('charades'),
  };
}

type LegacyPhase = {
  drawPileByTeam: Record<string, string[]>;
  scoredByTeam: Record<string, string[]>;
};

type LegacyPhaseState = {
  describe: LegacyPhase;
  oneWord: LegacyPhase;
  charades: LegacyPhase;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function normalizePhaseResult(
  value: unknown,
  teamIds: string[]
): PhaseResult | null {
  if (!isRecord(value)) return null;
  const result: PhaseResult = {};
  for (const teamId of teamIds) {
    const raw = value[teamId];
    result[teamId] = typeof raw === 'number' && Number.isFinite(raw) ? raw : 0;
  }
  return result;
}

function isModernPhaseState(value: unknown): value is GameSession['phaseState'] {
  if (!isRecord(value)) return false;
  const describe = value.describe;
  return isRecord(describe) && Array.isArray(describe.mainBowl);
}

function isLegacyPhaseState(value: unknown): value is LegacyPhaseState {
  if (!isRecord(value)) return false;
  const describe = value.describe;
  return isRecord(describe) && isRecord(describe.drawPileByTeam);
}

/** Migrate old session format to new (phaseState, settings, turn shape). */
export function migrateSession(raw: unknown): GameSession {
  const s = raw as Record<string, unknown>;
  if (!s || typeof s !== 'object') {
    throw new Error('Invalid session');
  }

  const teams = (s.teams as GameSession['teams']) ?? [];
  const deck = (s.deck as GameSession['deck']) ?? [];
  const teamAId = teams[0]?.id ?? 'teamA';
  const teamBId = teams[1]?.id ?? 'teamB';
  const teamIds = [teamAId, teamBId];
  const cardIds = deck.map((c: Card) => c.id);

  const rawPhaseState = s.phaseState as unknown;
  let phaseState: GameSession['phaseState'];
  if (isModernPhaseState(rawPhaseState)) {
    // Normalize so each phase has both team keys in passedToTeam and scoredByTeam
    phaseState = {
      describe: normalizePhaseState(rawPhaseState.describe, teamAId, teamBId),
      oneWord: normalizePhaseState(rawPhaseState.oneWord, teamAId, teamBId),
      charades: normalizePhaseState(rawPhaseState.charades, teamAId, teamBId),
    };
  } else if (isLegacyPhaseState(rawPhaseState)) {
    phaseState = migratePhaseStateFromDrawPileByTeam(rawPhaseState, teamAId, teamBId);
  } else {
    phaseState = {
      describe: initPhaseStateForTeams(cardIds, teamAId, teamBId),
      oneWord: initPhaseStateForTeams(cardIds, teamAId, teamBId),
      charades: initPhaseStateForTeams(cardIds, teamAId, teamBId),
    };
  }

  const settings: GameSession['settings'] = (s.settings as GameSession['settings']) ?? {
    turnSeconds: 60,
  };

  const gameStatus = (s.gameStatus as GameSession['gameStatus']) ?? 'playing';
  const phase = (s.phase as RoundPhase) ?? 'describe';
  const rawTurn = s.turn as Partial<GameSession['turn']> | undefined | null;
  let turn: GameSession['turn'] = null;
  if (rawTurn && typeof rawTurn === 'object' && rawTurn.activeTeamId) {
    turn = {
      activeTeamId: rawTurn.activeTeamId,
      activePlayerId: rawTurn.activePlayerId,
      secondsRemaining: rawTurn.secondsRemaining ?? settings.turnSeconds,
      isRunning: Boolean(rawTurn.isRunning),
      startedAt: typeof rawTurn.startedAt === 'number' ? rawTurn.startedAt : Date.now(),
      currentCardId: rawTurn.currentCardId,
      history: Array.isArray(rawTurn.history)
        ? (rawTurn.history as NonNullable<GameSession['turn']>['history'])
        : [],
    };
  }

  const phaseResults = createEmptyPhaseResults();
  const rawPhaseResults = s.phaseResults as unknown;
  if (isRecord(rawPhaseResults)) {
    phaseResults.describe = normalizePhaseResult(rawPhaseResults.describe, teamIds);
    phaseResults.oneWord = normalizePhaseResult(rawPhaseResults.oneWord, teamIds);
    phaseResults.charades = normalizePhaseResult(rawPhaseResults.charades, teamIds);
  }

  // Backfill missing snapshots for already-complete phases in older saves.
  for (const p of PHASE_ORDER) {
    if (phaseResults[p]) continue;
    if ((phaseState[p].mainBowl?.length ?? 0) === 0) {
      const result: PhaseResult = {};
      for (const teamId of teamIds) {
        result[teamId] = phaseState[p].scoredByTeam[teamId]?.length ?? 0;
      }
      phaseResults[p] = result;
    }
  }

  const migrated: GameSession = {
    id: String(s.id ?? ''),
    createdAt: Number(s.createdAt ?? 0),
    teams,
    players: (s.players as GameSession['players']) ?? [],
    deck,
    phase,
    turn,
    settings,
    phaseState,
    phaseResults,
    gameStatus,
    lastTeamId: s.lastTeamId as string | undefined,
    phaseCompleteModal: s.phaseCompleteModal as RoundPhase | null | undefined,
    gameOverModal: Boolean(s.gameOverModal),
  };

  if (s.discard) migrated.discard = s.discard as Card[];
  if (s.scoredByTeam) migrated.scoredByTeam = s.scoredByTeam as Record<string, number>;

  return migrated;
}
