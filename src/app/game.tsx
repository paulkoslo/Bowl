import { useEffect } from 'react';
import { GameScreen } from '@/screens';

const DEBUG = true;
const log = (step: string, detail?: string) => {
  if (DEBUG) console.log(`[Bowl] ${step}${detail ? ` — ${detail}` : ''}`);
};

export default function Game() {
  useEffect(() => {
    log('Route: game mounted');
    return () => log('Route: game unmounted');
  }, []);

  return <GameScreen />;
}
