import { pct } from "@/lib/format";
import { type GateMetric } from "@/lib/queries/gating";

/**
 * Display contract for a single gate metric row. The gate query keys metrics by
 * scorer name ("schema", "field-accuracy", …); the design renders friendlier
 * labels and two display modes:
 *  - `percent` — schema / overall pass-rate, shown as "79.6%" against "floor 90.0%".
 *  - `score`   — field-accuracy / judge, shown as "0.84" against "floor 0.95".
 * Color derives from the scorer family (phosphor pass, red fail, violet judge).
 */
export type MetricFormat = "percent" | "score";

export interface MetricView {
  /** Scorer name from the query (stable React key). */
  key: string;
  /** Human label, e.g. "schema pass-rate", "field-accuracy". */
  label: string;
  /** Optional dim suffix after the label, e.g. "(0–1 score)" or "(k=3)". */
  labelNote?: string;
  /** Measured value (0-1). */
  value: number;
  /** Gate floor (0-1). */
  threshold: number;
  pass: boolean;
  format: MetricFormat;
  /** Bar / value hue. Failing rows are always red regardless of family. */
  tone: "phosphor" | "red" | "violet";
}

/** Per-scorer display config. Scorers absent here fall back to a percent row. */
const METRIC_DISPLAY: Record<
  string,
  { label: string; note?: string; format: MetricFormat; passTone: "phosphor" | "violet" }
> = {
  schema: { label: "schema pass-rate", format: "percent", passTone: "phosphor" },
  "json-schema": { label: "schema pass-rate", format: "percent", passTone: "phosphor" },
  "field-accuracy": {
    label: "field-accuracy",
    note: "(0–1 score)",
    format: "score",
    passTone: "phosphor",
  },
  "exact-match": { label: "exact-match", format: "percent", passTone: "phosphor" },
  judge: { label: "judge κ", format: "score", passTone: "violet" },
};

/**
 * Truncate (not round) a 0-1 score to 2 places: 0.8451 → "0.84". The gate
 * compares against the floor, so a value below threshold must never round UP to
 * look like it cleared it (0.8451 reads "0.84", not "0.85"). Mirrors the design
 * handoff, which shows the regressed field-accuracy as "0.84".
 */
function truncScore(value: number): string {
  return (Math.trunc(value * 100) / 100).toFixed(2);
}

/** Format a metric value for display per its mode. */
export function formatMetricValue(value: number, format: MetricFormat): string {
  return format === "percent" ? pct(value) : truncScore(value);
}

/** Format a gate floor for display per its mode ("floor 90.0%" / "floor 0.95"). */
export function formatThreshold(threshold: number, format: MetricFormat): string {
  // Floors are authored at 2 places (0.95, 0.90) — plain fixed is exact here.
  return format === "percent" ? pct(threshold) : threshold.toFixed(2);
}

/** Map a raw gate metric to its display view. */
export function toMetricView(metric: GateMetric): MetricView {
  const display = METRIC_DISPLAY[metric.metric] ?? {
    label: metric.metric,
    format: "percent" as const,
    passTone: "phosphor" as const,
  };
  const pass = metric.status === "pass";
  return {
    key: metric.metric,
    label: display.label,
    labelNote: display.note,
    value: metric.value,
    threshold: metric.threshold,
    pass,
    format: display.format,
    tone: pass ? display.passTone : "red",
  };
}

/** The synthetic "overall pass-rate" row, derived from the run's pass-rate. */
export function overallMetricView(passRate: number, floor = 0.85): MetricView {
  return {
    key: "overall",
    label: "overall pass-rate",
    value: passRate,
    threshold: floor,
    pass: passRate >= floor,
    format: "percent",
    tone: passRate >= floor ? "phosphor" : "red",
  };
}

const TONE_COLOR: Record<MetricView["tone"], string> = {
  phosphor: "var(--phosphor)",
  red: "var(--red)",
  violet: "var(--violet)",
};

const TONE_GLOW: Record<MetricView["tone"], string> = {
  phosphor: "var(--glow-phosphor-sm)",
  red: "var(--glow-red)",
  violet: "var(--glow-violet-sm)",
};

export function metricColor(tone: MetricView["tone"]): string {
  return TONE_COLOR[tone];
}

export function metricGlow(tone: MetricView["tone"]): string {
  return TONE_GLOW[tone];
}
