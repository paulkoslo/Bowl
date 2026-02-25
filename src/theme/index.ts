/**
 * Bowl theme: loud party-game energy.
 * Bright candy colors + high-contrast surfaces.
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
  displaySize: 48,
  displayLineHeight: 54,
  /** Screen titles */
  titleSize: 30,
  titleLineHeight: 38,
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
  md: 14,
  lg: 18,
  xl: 24,
  full: 9999,
} as const;

/**
 * Party palette:
 * - Warm bright background (keeps readability)
 * - Punchy pink + teal CTAs
 * - Neon accents for motion and highlights
 */
export const colors = {
  // Surfaces
  background: '#FFF5D8',
  surface: '#FFF9EA',
  surfaceElevated: '#FFFFFF',

  // Primary – hot pink-red (main CTAs)
  primary: '#FF3D6E',
  primaryPressed: '#E12F5E',

  // Secondary – electric teal
  secondary: '#00B7A8',
  secondaryPressed: '#009B8F',

  // Accent – sunny yellow/orange
  accent: '#FFBE0B',
  accentMuted: '#FFE18A',

  // Text
  text: '#2F1D54',
  textMuted: '#62418A',

  // Borders & dividers
  border: '#FFD58D',

  // Party backdrop accents
  partyBlue: '#2F7CFF',
  partyPink: '#FF5C9A',
  partyMint: '#28D7B8',
  partyOrange: '#FF8C42',
  partyLime: '#B4F341',
  partySky: '#7BDFFF',
} as const;

export const shadows = {
  buttonPrimary: {
    shadowColor: '#9B174D',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonSecondary: {
    shadowColor: '#00786F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 7,
    elevation: 3,
  },
  surfaceSoft: {
    shadowColor: '#692B8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 9,
    elevation: 2,
  },
} as const;

export const motion = {
  buttonBufferMs: 90,
  flightDurationMs: 250,
  buttonNavigateDelayMs: 190,
  backdropPulseMs: 3800,
  backdropDriftMs: 7200,
  backdropStrobeMs: 1400,
} as const;
