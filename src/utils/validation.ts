/**
 * Validation helpers for wizard inputs.
 */

export function trim(str: string): string {
  return str.trim();
}

export function maxLength(str: string, max: number): string {
  return str.slice(0, max);
}

export function isNonEmptyAfterTrim(str: string): boolean {
  return trim(str).length > 0;
}

export function sanitizeTeamName(str: string, max = 20): string {
  return maxLength(trim(str), max);
}

export function sanitizePlayerName(str: string, max = 24): string {
  return maxLength(trim(str), max);
}

export function sanitizeCardText(str: string, max = 80): string {
  return maxLength(trim(str), max);
}
