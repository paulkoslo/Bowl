import { useEffect } from 'react';
import { NewGameScreen } from '@/screens';

const DEBUG = true;
const log = (step: string, detail?: string) => {
  if (DEBUG) console.log(`[Bowl] ${step}${detail ? ` — ${detail}` : ''}`);
};

export default function NewGame() {
  useEffect(() => {
    log('Route: new-game mounted');
    return () => log('Route: new-game unmounted');
  }, []);

  return <NewGameScreen />;
}
