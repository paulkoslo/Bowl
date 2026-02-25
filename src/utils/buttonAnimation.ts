import { motion } from '@/theme';

/**
 * Let tap animation finish before route transitions.
 * Keep short to preserve snappy interaction.
 */
export function waitForButtonAnimation(ms = motion.buttonNavigateDelayMs) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}
