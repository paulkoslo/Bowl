import {
  getNextPhase,
  getOtherTeamId,
  initPhaseStateForTeams,
  isPhaseComplete,
  snapshotPhaseResult,
} from '../engine';
import type {
  GameSession,
  PhaseState,
  TurnAction,
  TurnState,
} from '../models';

const TURN_HISTORY_LIMIT = 50;

export interface CommandResult {
  session: GameSession;
  changed: boolean;
}

export interface StartTurnResult extends CommandResult {
  shouldAdvancePhase: boolean;
}

export interface TickTurnResult extends CommandResult {
  shouldEndTurn: boolean;
}

function createEmptyPassedBuckets(teamIds: string[]): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const teamId of teamIds) {
    result[teamId] = [];
  }
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

export function startTurnCommand(
  session: GameSession,
  nowMs = Date.now()
): StartTurnResult {
  if (session.gameStatus !== 'playing') {
    return { session, changed: false, shouldAdvancePhase: false };
  }

  const teamAId = session.teams[0]?.id;
  const teamBId = session.teams[1]?.id;
  if (!teamAId || !teamBId) {
    return { session, changed: false, shouldAdvancePhase: false };
  }

  const phase = session.phase;
  const phaseState = session.phaseState[phase];
  const lastTeamId = session.lastTeamId;
  const activeTeamId = lastTeamId ? getOtherTeamId(session, lastTeamId) : teamAId;
  const teamPlayers = session.players.filter((player) => player.teamId === activeTeamId);
  const activePlayerId = teamPlayers.length > 0 ? teamPlayers[0]?.id : undefined;

  const { nextPhaseState, nextCardId } = drawFromMainBowl(phaseState);
  if (!nextCardId) {
    return { session, changed: false, shouldAdvancePhase: true };
  }

  const nextState: PhaseState = {
    ...nextPhaseState,
    // Legacy bucket is unused under current rules, keep it normalized/empty.
    passedToTeam: createEmptyPassedBuckets(session.teams.map((team) => team.id)),
  };

  const turn: TurnState = {
    activeTeamId,
    activePlayerId,
    secondsRemaining: session.settings.turnSeconds,
    isRunning: true,
    startedAt: nowMs,
    currentCardId: nextCardId,
    history: [],
  };

  return {
    changed: true,
    shouldAdvancePhase: false,
    session: {
      ...session,
      phaseState: { ...session.phaseState, [phase]: nextState },
      turn,
      lastTeamId: activeTeamId,
    },
  };
}

export function tickTurnCommand(session: GameSession): TickTurnResult {
  if (!session.turn?.isRunning) {
    return { session, changed: false, shouldEndTurn: false };
  }

  const turn = session.turn;
  const nextRemaining = Math.max(0, turn.secondsRemaining - 1);
  if (nextRemaining === 0) {
    return { session, changed: false, shouldEndTurn: true };
  }

  return {
    changed: true,
    shouldEndTurn: false,
    session: {
      ...session,
      turn: {
        ...turn,
        secondsRemaining: nextRemaining,
      },
    },
  };
}

export function endTurnCommand(session: GameSession): StartTurnResult {
  if (!session.turn) {
    return { session, changed: false, shouldAdvancePhase: false };
  }

  const phase = session.phase;
  const phaseState = session.phaseState[phase];
  const currentCardId = session.turn.currentCardId;

  const nextPhaseState = currentCardId
    ? {
        ...phaseState,
        mainBowl: [currentCardId, ...(phaseState.mainBowl ?? [])],
        passedToTeam: createEmptyPassedBuckets(session.teams.map((team) => team.id)),
      }
    : phaseState;

  return {
    changed: true,
    shouldAdvancePhase: true,
    session: {
      ...session,
      phaseState: {
        ...session.phaseState,
        [phase]: nextPhaseState,
      },
      turn: null,
    },
  };
}

export function gotItCommand(session: GameSession): StartTurnResult {
  if (!session.turn?.currentCardId) {
    return { session, changed: false, shouldAdvancePhase: false };
  }

  const phase = session.phase;
  const phaseState = session.phaseState[phase];
  const activeTeamId = session.turn.activeTeamId;
  const cardId = session.turn.currentCardId;
  const scored = [...(phaseState.scoredByTeam[activeTeamId] ?? []), cardId];

  const { nextPhaseState, nextCardId } = drawFromMainBowl(phaseState);
  const action: TurnAction = {
    type: 'gotIt',
    cardId,
    teamId: activeTeamId,
    phase,
    nextCardId,
  };

  const history = [...session.turn.history, action].slice(-TURN_HISTORY_LIMIT);

  const nextState: PhaseState = {
    ...nextPhaseState,
    passedToTeam: createEmptyPassedBuckets(session.teams.map((team) => team.id)),
    scoredByTeam: {
      ...phaseState.scoredByTeam,
      [activeTeamId]: scored,
    },
  };

  return {
    changed: true,
    shouldAdvancePhase: !nextCardId,
    session: {
      ...session,
      phaseState: {
        ...session.phaseState,
        [phase]: nextState,
      },
      turn: {
        ...session.turn,
        currentCardId: nextCardId,
        isRunning: nextCardId ? session.turn.isRunning : false,
        secondsRemaining: nextCardId ? session.turn.secondsRemaining : 0,
        history,
      },
    },
  };
}

export function passCommand(session: GameSession): StartTurnResult {
  if (!session.turn?.currentCardId) {
    return { session, changed: false, shouldAdvancePhase: false };
  }

  const phase = session.phase;
  const phaseState = session.phaseState[phase];
  const activeTeamId = session.turn.activeTeamId;
  const otherTeamId = getOtherTeamId(session, activeTeamId);
  const cardId = session.turn.currentCardId;
  const credited = [...(phaseState.scoredByTeam[otherTeamId] ?? []), cardId];

  const { nextPhaseState, nextCardId } = drawFromMainBowl(phaseState);
  const action: TurnAction = {
    type: 'passToOther',
    cardId,
    fromTeamId: activeTeamId,
    toTeamId: otherTeamId,
    phase,
    nextCardId,
  };

  const history = [...session.turn.history, action].slice(-TURN_HISTORY_LIMIT);

  const nextState: PhaseState = {
    ...nextPhaseState,
    passedToTeam: createEmptyPassedBuckets(session.teams.map((team) => team.id)),
    scoredByTeam: {
      ...phaseState.scoredByTeam,
      [otherTeamId]: credited,
    },
  };

  return {
    changed: true,
    shouldAdvancePhase: !nextCardId,
    session: {
      ...session,
      phaseState: {
        ...session.phaseState,
        [phase]: nextState,
      },
      turn: {
        ...session.turn,
        currentCardId: nextCardId,
        isRunning: nextCardId ? session.turn.isRunning : false,
        secondsRemaining: nextCardId ? session.turn.secondsRemaining : 0,
        history,
      },
    },
  };
}

export function undoCommand(session: GameSession): CommandResult {
  if (!session.turn || session.turn.history.length === 0) {
    return { session, changed: false };
  }

  const phase = session.phase;
  const phaseState = session.phaseState[phase];
  const history = [...session.turn.history];
  const action = history.pop();

  if (!action) {
    return { session, changed: false };
  }

  const rewoundMainBowl = [...(phaseState.mainBowl ?? [])];
  if (action.nextCardId) {
    if (session.turn.currentCardId !== action.nextCardId) {
      // Prevent corruption if state and history drift unexpectedly.
      return { session, changed: false };
    }
    rewoundMainBowl.unshift(action.nextCardId);
  }

  if (action.type === 'gotIt') {
    const scored = phaseState.scoredByTeam[action.teamId] ?? [];
    const idx = scored.lastIndexOf(action.cardId);
    if (idx < 0) return { session, changed: false };

    const newScored = [...scored];
    newScored.splice(idx, 1);

    const nextState: PhaseState = {
      ...phaseState,
      mainBowl: rewoundMainBowl,
      passedToTeam: createEmptyPassedBuckets(session.teams.map((team) => team.id)),
      scoredByTeam: {
        ...phaseState.scoredByTeam,
        [action.teamId]: newScored,
      },
    };

    return {
      changed: true,
      session: {
        ...session,
        phaseState: {
          ...session.phaseState,
          [phase]: nextState,
        },
        turn: {
          ...session.turn,
          currentCardId: action.cardId,
          history,
        },
      },
    };
  }

  const credited = phaseState.scoredByTeam[action.toTeamId] ?? [];
  const idx = credited.lastIndexOf(action.cardId);
  if (idx < 0) return { session, changed: false };

  const newCredited = [...credited];
  newCredited.splice(idx, 1);

  const nextState: PhaseState = {
    ...phaseState,
    mainBowl: rewoundMainBowl,
    passedToTeam: createEmptyPassedBuckets(session.teams.map((team) => team.id)),
    scoredByTeam: {
      ...phaseState.scoredByTeam,
      [action.toTeamId]: newCredited,
    },
  };

  return {
    changed: true,
    session: {
      ...session,
      phaseState: {
        ...session.phaseState,
        [phase]: nextState,
      },
      turn: {
        ...session.turn,
        currentCardId: action.cardId,
        history,
      },
    },
  };
}

export function advancePhaseIfCompleteCommand(session: GameSession): CommandResult {
  if (!isPhaseComplete(session, session.phase)) {
    return { session, changed: false };
  }

  const phase = session.phase;
  const next = getNextPhase(phase);
  const finalizedPhaseResult = snapshotPhaseResult(session, phase);
  const nextPhaseResults = {
    ...session.phaseResults,
    [phase]: finalizedPhaseResult,
  };

  if (next) {
    return {
      changed: true,
      session: {
        ...session,
        phaseResults: nextPhaseResults,
        phaseCompleteModal: phase,
        turn: null,
      },
    };
  }

  return {
    changed: true,
    session: {
      ...session,
      phaseResults: nextPhaseResults,
      gameStatus: 'finished',
      gameOverModal: true,
      turn: null,
    },
  };
}

export function dismissPhaseCompleteModalCommand(session: GameSession): CommandResult {
  if (!session.phaseCompleteModal) {
    return { session, changed: false };
  }

  const next = getNextPhase(session.phaseCompleteModal);
  if (!next) {
    return { session, changed: false };
  }

  const teamAId = session.teams[0]?.id;
  const teamBId = session.teams[1]?.id;
  if (!teamAId || !teamBId) {
    return { session, changed: false };
  }

  const cardIds = session.deck.map((card) => card.id);
  const nextPhaseState = initPhaseStateForTeams(cardIds, teamAId, teamBId);

  return {
    changed: true,
    session: {
      ...session,
      phase: next,
      phaseState: {
        ...session.phaseState,
        [next]: nextPhaseState,
      },
      phaseCompleteModal: undefined,
      turn: null,
    },
  };
}

export function dismissGameOverModalCommand(session: GameSession): CommandResult {
  if (!session.gameOverModal) {
    return { session, changed: false };
  }

  return {
    changed: true,
    session: {
      ...session,
      gameOverModal: false,
    },
  };
}
