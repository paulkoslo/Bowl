import type { Card, GameSession, PhaseState, RoundPhase } from './models';
import { shuffle } from '@/utils/shuffle';

export const PHASE_ORDER: RoundPhase[] = ['describe', 'oneWord', 'charades'];

export function getOtherTeamId(session: GameSession, teamId: string): string {
  const ids = session.teams.map((t) => t.id);
  const other = ids.find((id) => id !== teamId);
  return other ?? ids[0];
}

/** Initialize one phase: one main bowl (all words once), empty passed buckets. */
export function initPhaseState(cardIds: string[]): PhaseState {
  const shuffled = shuffle([...cardIds]);
  const teamAId = 'teamA';
  const teamBId = 'teamB';
  return {
    mainBowl: shuffled,
    passedToTeam: { [teamAId]: [], [teamBId]: [] },
    scoredByTeam: { [teamAId]: [], [teamBId]: [] },
  };
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

/** Total score for a team across all phases (count of scored card IDs). */
export function getTeamTotalScore(session: GameSession, teamId: string): number {
  let total = 0;
  for (const phase of PHASE_ORDER) {
    const arr = session.phaseState[phase].scoredByTeam[teamId];
    if (arr) total += arr.length;
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

/** Phase is complete when main bowl and both passed buckets are empty. */
export function isPhaseComplete(session: GameSession, phase: RoundPhase): boolean {
  const state = session.phaseState[phase];
  if ((state.mainBowl?.length ?? 0) > 0) return false;
  const teamIds = session.teams.map((t) => t.id);
  return teamIds.every(
    (id) => (state.passedToTeam[id]?.length ?? 0) === 0
  );
}

/** Ensure phase state has both team keys for passedToTeam and scoredByTeam. */
function normalizePhaseState(
  state: PhaseState,
  teamAId: string,
  teamBId: string
): PhaseState {
  return {
    mainBowl: Array.isArray(state.mainBowl) ? state.mainBowl : [],
    passedToTeam: {
      [teamAId]: state.passedToTeam?.[teamAId] ?? [],
      [teamBId]: state.passedToTeam?.[teamBId] ?? [],
    },
    scoredByTeam: {
      [teamAId]: state.scoredByTeam?.[teamAId] ?? [],
      [teamBId]: state.scoredByTeam?.[teamBId] ?? [],
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

/** Count cards still in play this phase (main bowl + passed to both teams). Single bowl: each word appears once. */
export function getCardsInBowlCount(session: GameSession, phase: RoundPhase): number {
  const state = session.phaseState[phase];
  const main = state.mainBowl?.length ?? 0;
  const teamIds = session.teams.map((t) => t.id);
  const passed = teamIds.reduce((sum, id) => sum + (state.passedToTeam[id]?.length ?? 0), 0);
  return main + passed;
}

/** Migrate old phaseState (drawPileByTeam) to new (mainBowl + passedToTeam). */
function migratePhaseStateFromDrawPileByTeam(
  old: { describe: { drawPileByTeam: Record<string, string[]>; scoredByTeam: Record<string, string[]> }; oneWord: { drawPileByTeam: Record<string, string[]>; scoredByTeam: Record<string, string[]> }; charades: { drawPileByTeam: Record<string, string[]>; scoredByTeam: Record<string, string[]> } },
  teamAId: string,
  teamBId: string
): GameSession['phaseState'] {
  const migrateOne = (phase: keyof typeof old) => {
    const p = old[phase];
    const mainBowl = p.drawPileByTeam[teamAId] ?? [];
    return {
      mainBowl: [...mainBowl],
      passedToTeam: { [teamAId]: [], [teamBId]: [] },
      scoredByTeam: { ...(p.scoredByTeam ?? {}), [teamAId]: p.scoredByTeam?.[teamAId] ?? [], [teamBId]: p.scoredByTeam?.[teamBId] ?? [] },
    };
  };
  return {
    describe: migrateOne('describe'),
    oneWord: migrateOne('oneWord'),
    charades: migrateOne('charades'),
  };
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
  const cardIds = deck.map((c: Card) => c.id);

  const rawPhaseState = s.phaseState as GameSession['phaseState'] | undefined;
  let phaseState: GameSession['phaseState'];
  if (rawPhaseState?.describe?.mainBowl != null) {
    // Normalize so each phase has both team keys in passedToTeam and scoredByTeam
    phaseState = {
      describe: normalizePhaseState(rawPhaseState.describe, teamAId, teamBId),
      oneWord: normalizePhaseState(rawPhaseState.oneWord, teamAId, teamBId),
      charades: normalizePhaseState(rawPhaseState.charades, teamAId, teamBId),
    };
  } else if (rawPhaseState?.describe?.drawPileByTeam != null) {
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
      drawnFrom: rawTurn.drawnFrom ?? 'main',
      history: Array.isArray(rawTurn.history) ? rawTurn.history : [],
    };
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
    gameStatus,
    lastTeamId: s.lastTeamId as string | undefined,
    phaseCompleteModal: s.phaseCompleteModal as RoundPhase | null | undefined,
    gameOverModal: Boolean(s.gameOverModal),
  };

  if (s.discard) migrated.discard = s.discard as Card[];
  if (s.scoredByTeam) migrated.scoredByTeam = s.scoredByTeam as Record<string, number>;

  return migrated;
}
