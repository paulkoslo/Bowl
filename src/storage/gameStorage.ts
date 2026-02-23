import AsyncStorage from '@react-native-async-storage/async-storage';
import { migrateSession } from '@/game';
import type { GameSession } from '@/game';

const PREFIX = 'bowl:';
const LAST_ACTIVE_KEY = `${PREFIX}lastActiveGameId`;
const sessionKey = (id: string) => `${PREFIX}session:${id}`;

export async function saveSession(session: GameSession): Promise<void> {
  await AsyncStorage.setItem(sessionKey(session.id), JSON.stringify(session));
}

export async function loadSession(id: string): Promise<GameSession | null> {
  const raw = await AsyncStorage.getItem(sessionKey(id));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return migrateSession(parsed);
  } catch {
    return null;
  }
}

export async function saveLastActiveGameId(id: string | null): Promise<void> {
  if (id === null) {
    await AsyncStorage.removeItem(LAST_ACTIVE_KEY);
  } else {
    await AsyncStorage.setItem(LAST_ACTIVE_KEY, id);
  }
}

export async function loadLastActiveGameId(): Promise<string | null> {
  return AsyncStorage.getItem(LAST_ACTIVE_KEY);
}

export async function clearAllGameData(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const bowlKeys = keys.filter((k) => k.startsWith(PREFIX));
  if (bowlKeys.length > 0) {
    await AsyncStorage.multiRemove(bowlKeys);
  }
}
