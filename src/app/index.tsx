import { useEffect } from 'react';
import { HomeScreen } from '@/screens';

const DEBUG = true;
const log = (step: string, detail?: string) => {
  if (DEBUG) console.log(`[Bowl] ${step}${detail ? ` — ${detail}` : ''}`);
};

export default function Index() {
  useEffect(() => {
    log('Route: index (Home) mounted');
    return () => log('Route: index (Home) unmounted');
  }, []);

  return <HomeScreen />;
}
