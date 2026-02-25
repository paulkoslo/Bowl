import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, ScreenContainer } from '@/components';
import {
  getTeamPhaseResult,
  getTeamTotalScore,
  type GameSession,
  type RoundPhase,
} from '@/game';
import { ROUTES } from '@/navigation';
import { colors, spacing, typography } from '@/theme';
import { waitForButtonAnimation } from '@/utils';
import { PHASE_LABELS } from './constants';

interface NoActiveGameProps {
  onGoHome: () => Promise<void>;
}

export function NoActiveGameView({ onGoHome }: NoActiveGameProps) {
  return (
    <ScreenContainer>
      <View style={styles.center}>
        <Text style={styles.title}>No active game</Text>
        <Text style={styles.subtitle}>Start a new game from Home.</Text>
        <PrimaryButton title="Go Home" onPress={onGoHome} />
      </View>
    </ScreenContainer>
  );
}

interface GameOverModalProps {
  session: GameSession;
  onDismiss: () => void;
  onResetAll: () => Promise<void>;
  onNavigateHome: (path: typeof ROUTES.HOME) => void;
}

export function GameOverModalView({
  session,
  onDismiss,
  onResetAll,
  onNavigateHome,
}: GameOverModalProps) {
  return (
    <ScreenContainer>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Game Over</Text>
        <Text style={styles.modalSubtitle}>{getWinnerText(session)}</Text>
        <View style={styles.modalScores}>
          {session.teams.map((team) => (
            <Text key={team.id} style={styles.modalScoreRow}>
              {team.name}: {getTeamTotalScore(session, team.id)} pts
            </Text>
          ))}
        </View>
        <PrimaryButton
          title="Back to Home"
          onPress={async () => {
            onDismiss();
            await onResetAll();
            await waitForButtonAnimation();
            onNavigateHome(ROUTES.HOME);
          }}
        />
      </View>
    </ScreenContainer>
  );
}

interface PhaseCompleteModalProps {
  session: GameSession;
  phase: RoundPhase;
  onStartNextPhase: () => void;
}

export function PhaseCompleteModalView({
  session,
  phase,
  onStartNextPhase,
}: PhaseCompleteModalProps) {
  const nextLabel =
    phase === 'describe' ? 'One Word' : phase === 'oneWord' ? 'Charades' : null;

  return (
    <ScreenContainer>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Round complete: {PHASE_LABELS[phase]}</Text>
        <View style={styles.modalScores}>
          {session.teams.map((team) => (
            <Text key={team.id} style={styles.modalScoreRow}>
              {team.name}: {getTeamPhaseResult(session, team.id, phase)} this round
            </Text>
          ))}
        </View>
        <PrimaryButton
          title={nextLabel ? `Start ${nextLabel} Round` : 'See Results'}
          onPress={onStartNextPhase}
        />
      </View>
    </ScreenContainer>
  );
}

function getWinnerText(session: GameSession): string {
  if (session.teams.length < 2) return 'Game complete.';

  const first = getTeamTotalScore(session, session.teams[0].id);
  const second = getTeamTotalScore(session, session.teams[1].id);

  if (first > second) return `${session.teams[0].name} wins!`;
  if (second > first) return `${session.teams[1].name} wins!`;
  return 'It\'s a tie!';
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: typography.titleSize,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  subtitle: {
    fontSize: typography.bodySize,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.titleSize,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: typography.bodySize,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  modalScores: {
    marginBottom: spacing.xl,
  },
  modalScoreRow: {
    fontSize: typography.bodySize,
    color: colors.text,
    marginBottom: spacing.xs,
  },
});
