import { useEffect } from 'react';
import { SettingsScreen } from '@/screens';

const DEBUG = true;
const log = (step: string, detail?: string) => {
  if (DEBUG) console.log(`[Bowl] ${step}${detail ? ` — ${detail}` : ''}`);
};

export default function Settings() {
  useEffect(() => {
    log('Route: settings mounted');
    return () => log('Route: settings unmounted');
  }, []);

  return <SettingsScreen />;
}
