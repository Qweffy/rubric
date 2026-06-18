import  { type SparklineTone } from "@/components/ui/sparkline";
import  { type StatusValue } from "@/components/ui/status-badge";
import  { type SuiteRow } from "@/lib/queries/suites";

/** Pass-rate (0-1) → "88.7%". Null until a run lands → an em-dash. */
export function formatPct(rate: number | null): string {
  if (rate === null) return "—";
  return `${(rate * 100).toFixed(1)}%`;
}

/** USD cost → "$0.83". Null → em-dash. */
export function formatCost(cost: number | null): string {
  if (cost === null) return "—";
  return `$${cost.toFixed(2)}`;
}

/** Delta (0-1 points) → "▲1.3" / "▼5.6" / "0.0". Null → em-dash. */
export interface DeltaDisplay {
  text: string;
  tone: "phosphor" | "red" | "amber" | "muted";
}

export function formatDelta(delta: number | null): DeltaDisplay {
  if (delta === null) return { text: "—", tone: "muted" };
  const pts = delta * 100;
  if (Math.abs(pts) < 0.05) return { text: "0.0", tone: "muted" };
  if (pts > 0) return { text: `▲${pts.toFixed(1)}`, tone: "phosphor" };
  // A drop of ≥ 3pts reads as a regression (red); a softer dip is amber.
  return { text: `▼${Math.abs(pts).toFixed(1)}`, tone: pts <= -3 ? "red" : "amber" };
}

/** Coarse relative time — "12m ago" / "1h ago" / "9d ago" / "just now". */
export function relativeTime(from: Date, nowMs: number): string {
  const diffMs = Math.max(0, nowMs - from.getTime());
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** UTC "YYYY-MM-DD HH:mm UTC" tooltip for a run timestamp. */
export function utcTooltip(from: Date): string {
  const pad = (n: number): string => String(n).padStart(2, "0");
  const y = from.getUTCFullYear();
  const mo = pad(from.getUTCMonth() + 1);
  const d = pad(from.getUTCDate());
  const hh = pad(from.getUTCHours());
  const mm = pad(from.getUTCMinutes());
  return `${y}-${mo}-${d} ${hh}:${mm} UTC`;
}

/**
 * The badge for a suite's status: a known StatusValue key drives the hue/dot,
 * with `label` carrying the displayed word (the design shows "PASSING", which
 * the StatusBadge union spells "PASS" — same phosphor styling, fuller word).
 */
export interface SuiteBadge {
  status: StatusValue;
  label: string;
}

export function suiteBadge(status: SuiteRow["status"]): SuiteBadge {
  switch (status) {
    case "passing":
      return { status: "PASS", label: "PASSING" };
    case "regressed":
      return { status: "REGRESSED", label: "REGRESSED" };
    case "flaky":
      return { status: "FLAKY", label: "FLAKY" };
    case "stale":
      return { status: "STALE", label: "STALE" };
    case "partial":
      return { status: "PARTIAL", label: "PARTIAL" };
    default:
      return { status: "NEUTRAL", label: "NEUTRAL" };
  }
}

/** Sparkline hue keyed off the suite's health, matching the design rows. */
export function sparkTone(status: SuiteRow["status"]): SparklineTone {
  switch (status) {
    case "regressed":
      return "red";
    case "flaky":
    case "stale":
    case "partial":
      return "amber";
    default:
      return "phosphor";
  }
}

/**
 * Pass-rate hue for the big mono number. Green when comfortably passing, amber
 * in the warning band, red below it — the design tints checkout (88.7%) amber,
 * email (78.9%) red, and the healthy suites phosphor.
 */
export function passRateTone(
  rate: number | null,
  status: SuiteRow["status"],
): "phosphor" | "amber" | "red" {
  if (rate === null) return "amber";
  if (status === "regressed") return "amber";
  if (status === "flaky" && rate < 0.8) return "red";
  if (rate >= 0.9) return "phosphor";
  if (rate >= 0.85) return "amber";
  return "red";
}

/** Filter tab keys, in rail order. "all" never filters. */
export type SuiteFilter = "all" | "regressed" | "passing" | "flaky" | "stale";

export const SUITE_FILTERS: SuiteFilter[] = [
  "all",
  "regressed",
  "passing",
  "flaky",
  "stale",
];

/** Whether a suite matches the active filter tab. */
export function matchesFilter(suite: SuiteRow, filter: SuiteFilter): boolean {
  if (filter === "all") return true;
  return suite.status === filter;
}
