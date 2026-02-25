import { getCardById } from '../engine';
import type { Card, GameSession } from '../models';

export function selectCurrentCard(session: GameSession): Card | null {
  const currentCardId = session.turn?.currentCardId;
  if (!currentCardId) return null;
  return getCardById(session, currentCardId) ?? null;
}

export function selectIsTurnRunning(session: GameSession): boolean {
  return session.turn?.isRunning ?? false;
}

export function selectCanUndo(session: GameSession): boolean {
  return (session.turn?.history.length ?? 0) > 0;
}

export function selectTeams(session: GameSession): {
  teamA: GameSession['teams'][number] | undefined;
  teamB: GameSession['teams'][number] | undefined;
} {
  return {
    teamA: session.teams[0],
    teamB: session.teams[1],
  };
}
