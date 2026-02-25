import { useRouter } from 'expo-router';
import React, { useLayoutEffect } from 'react';
import { useGameStore } from '@/state';
import {
  CardsStep,
  PlayersStep,
  ReviewStep,
  TeamsStep,
} from '@/screens/new-game';
import { waitForButtonAnimation } from '@/utils';

const DEBUG = true;
const log = (step: string, detail?: string) => {
  if (DEBUG) console.log(`[Bowl] NewGameScreen: ${step}${detail ? ` — ${detail}` : ''}`);
};

export function NewGameScreen() {
  const router = useRouter();
  const wizardStep = useGameStore((s) => s.wizardStep);
  const setWizardStep = useGameStore((s) => s.setWizardStep);
  const resetWizard = useGameStore((s) => s.resetWizard);
  const createNewSession = useGameStore((s) => s.createNewSession);
  const persistCurrentGame = useGameStore((s) => s.persistCurrentGame);

  useLayoutEffect(() => {
    log('mounted', 'resetting wizard');
    resetWizard();
    return () => log('unmounted');
  }, [resetWizard]);

  const handleBack = async () => {
    if (wizardStep === 0) {
      await waitForButtonAnimation();
      router.back();
      return;
    }
    setWizardStep((wizardStep - 1) as 0 | 1 | 2 | 3);
  };

  const handleNext = () => {
    if (wizardStep < 3) setWizardStep((wizardStep + 1) as 0 | 1 | 2 | 3);
  };

  const handleSkip = () => {
    setWizardStep(2);
  };

  const handleStartGame = async () => {
    createNewSession();
    await persistCurrentGame();
    resetWizard();
    await waitForButtonAnimation();
    router.replace('/game');
  };

  if (wizardStep === 0) {
    return <TeamsStep onNext={handleNext} onBack={handleBack} />;
  }
  if (wizardStep === 1) {
    return (
      <PlayersStep
        onNext={handleNext}
        onBack={handleBack}
        onSkip={handleSkip}
      />
    );
  }
  if (wizardStep === 2) {
    return <CardsStep onNext={handleNext} onBack={handleBack} />;
  }
  return (
    <ReviewStep onStartGame={handleStartGame} onBack={handleBack} />
  );
}
