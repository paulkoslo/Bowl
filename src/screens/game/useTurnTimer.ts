import { useCallback, useEffect, useRef } from 'react';

/**
 * Manages the turn countdown interval with stable cleanup semantics.
 */
export function useTurnTimer(isRunning: boolean, tick: () => void) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (!timerRef.current) return;
    clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  useEffect(() => {
    if (!isRunning) {
      clearTimer();
      return;
    }

    timerRef.current = setInterval(() => {
      tick();
    }, 1000);

    return clearTimer;
  }, [clearTimer, isRunning, tick]);

  useEffect(
    () => () => {
      clearTimer();
    },
    [clearTimer]
  );

  return { clearTimer };
}
