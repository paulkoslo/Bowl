/**
 * Navigation constants (screen paths).
 * This folder is named "navigation" (not "app") so Expo Router does not
 * treat it as the file-based route root — routes live in src/app/.
 */

export const ROUTES = {
  HOME: '/',
  NEW_GAME: '/new-game',
  GAME: '/game',
  SETTINGS: '/settings',
} as const;
