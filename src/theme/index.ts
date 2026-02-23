/**
 * Bowl theme: living room, game night, friends.
 * Warm, inviting, fun — cream, terracotta, sage, gold.
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const typography = {
  /** Hero title, e.g. "Bowl" on home */
  displaySize: 40,
  displayLineHeight: 48,
  /** Screen titles */
  titleSize: 28,
  titleLineHeight: 36,
  /** Buttons and section headers */
  headlineSize: 18,
  headlineLineHeight: 24,
  /** Body text */
  bodySize: 16,
  bodyLineHeight: 24,
  /** Captions, taglines */
  captionSize: 14,
  captionLineHeight: 20,
} as const;

/** Minimum touch target size (accessibility) */
export const minTouchTargetSize = 44;

/** Border radius tokens */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

/**
 * Living room palette:
 * - Warm cream background (cozy)
 * - Terracotta/coral primary (fun, inviting)
 * - Sage secondary (calm, natural)
 * - Gold accent (game night, warmth)
 * - Warm brown text (readable, soft)
 */
export const colors = {
  // Surfaces
  background: '#FAF7F2',
  surface: '#FFFBF7',
  surfaceElevated: '#FFFFFF',

  // Primary – terracotta/coral (main CTAs)
  primary: '#E07A5F',
  primaryPressed: '#C96850',

  // Secondary – sage (secondary actions)
  secondary: '#81B29A',
  secondaryPressed: '#6B9B85',

  // Accent – warm gold (highlights, fun)
  accent: '#F2CC8F',
  accentMuted: '#E8D4A8',

  // Text
  text: '#2D2A26',
  textMuted: '#6B5B4F',

  // Borders & dividers
  border: '#E8E2DA',
} as const;
