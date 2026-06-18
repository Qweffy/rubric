/* ------------------------------------------------------------------ */
/* Mono formatters for terminal-style report output.                   */
/* Pure functions — no I/O, no Date.now() — so they stay test-friendly. */
/* ------------------------------------------------------------------ */

/** 0.8869 → "88.7%". `digits` controls fraction places (default 1). */
export function pct(n: number, digits = 1): string {
  return `${(n * 100).toFixed(digits)}%`;
}

/** $0.8273 → "$0.83". Always two fraction digits, leading symbol. */
export function cost(n: number): string {
  return `$${n.toFixed(2)}`;
}

/**
 * Signed delta with arrow glyph: 0.008 → "▲0.8", -0.056 → "▼5.6".
 * Value is read as a fraction and rendered as points (×100). Zero is "—".
 * `digits` controls fraction places on the magnitude (default 1).
 */
export function delta(n: number, digits = 1): string {
  if (n === 0) return "—";
  const points = Math.abs(n * 100).toFixed(digits);
  return `${n > 0 ? "▲" : "▼"}${points}`;
}

/** First 7 chars of a git/content sha: "a1b2c3d4e5f6" → "a1b2c3d". */
export function sha(hash: string, length = 7): string {
  return hash.slice(0, length);
}

/** ISO-8601 UTC to the second, no millis: "2026-06-17T22:51:00Z". */
export function utc(date: Date): string {
  return `${date.toISOString().slice(0, 19)}Z`;
}

/** Right-pad `s` with spaces to `width`. Over-width strings pass through. */
export function pad(s: string, width: number): string {
  return s.length >= width ? s : s + " ".repeat(width - s.length);
}

/** Left-pad `s` with spaces to `width` — right-aligns numeric columns. */
export function align(s: string, width: number): string {
  return s.length >= width ? s : " ".repeat(width - s.length) + s;
}
