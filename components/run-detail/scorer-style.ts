import { type ScorerColumn } from "@/lib/queries/runs";

/** A per-scorer pass-rate below this reads as a failing column (red chip). */
const HEALTHY_PASS_RATE = 0.9;

export interface ScorerTone {
  color: string;
  fill: string;
  border: string;
}

const RED: ScorerTone = {
  color: "var(--red)",
  fill: "var(--red-14)",
  border: "color-mix(in srgb, var(--red) 36%, transparent)",
};
const PHOSPHOR: ScorerTone = {
  color: "var(--phosphor)",
  fill: "var(--phosphor-12)",
  border: "color-mix(in srgb, var(--phosphor) 30%, transparent)",
};
const VIOLET: ScorerTone = {
  color: "var(--violet)",
  fill: "var(--violet-16)",
  border: "color-mix(in srgb, var(--violet) 40%, transparent)",
};

/**
 * The chip/header tone for a scorer column. The judge scorer is always violet
 * (it is the AI-judge axis). For the deterministic scorers, a pass-rate at or
 * above {@link HEALTHY_PASS_RATE} reads phosphor (healthy); below it reads red
 * (the column is dragging the run down). Mirrors the design's BY-SCORER chips:
 * schema 79.6% red · exact-match 95.1% phosphor · field-accuracy 84.5% red ·
 * judge 91.5% violet.
 */
export function scorerTone(column: ScorerColumn): ScorerTone {
  if (column.name === "judge") return VIOLET;
  return column.passRate >= HEALTHY_PASS_RATE ? PHOSPHOR : RED;
}

/** Format a 0-1 rate as a one-decimal percentage, e.g. 0.796 → "79.6%". */
export function formatPct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}
