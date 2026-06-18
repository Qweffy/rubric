import {
  type ErrorClusterRow,
  type ErrorClustersSummary,
} from "@/lib/queries/errors";

/**
 * The four scorers a failure can be attributed to, plus a neutral bucket for
 * anything uncategorized. The tint is the cluster's accent everywhere it shows
 * (treemap tile, cross-tab cell, scorer rail) — color is paired with the mono
 * scorer word so it never carries meaning alone.
 */
export type ScorerKey = "schema" | "field-accuracy" | "judge" | "exact-match" | "neutral";

export interface ScorerTint {
  /** Accent CSS var, e.g. var(--red). */
  accent: string;
  /** Solid tile fill at full strength. */
  fillStrong: string;
  /** Quieter tile fill for smaller tiles. */
  fillSoft: string;
  /** Border tint, expressed against the accent. */
  border: string;
  /** Hottest cross-tab cell fill. */
  cellHot: string;
  /** Short uppercased scorer name shown on the tile (▰ bars prefix it). */
  scorerLabel: string;
  /** The compact filter-pill label. */
  filterLabel: string;
}

/** Canonical tint per scorer, mirroring the design's tile + cross-tab palette. */
export const SCORER_TINT: Record<ScorerKey, ScorerTint> = {
  schema: {
    accent: "var(--red)",
    fillStrong: "var(--red-14)",
    fillSoft: "var(--red-08)",
    border: "color-mix(in srgb, var(--red) 34%, transparent)",
    cellHot: "var(--red-20)",
    scorerLabel: "SCHEMA-HEAVY",
    filterLabel: "schema",
  },
  "field-accuracy": {
    accent: "var(--red)",
    fillStrong: "var(--red-14)",
    fillSoft: "var(--red-08)",
    border: "color-mix(in srgb, var(--red) 24%, transparent)",
    cellHot: "var(--red-14)",
    scorerLabel: "FIELD-ACCURACY",
    filterLabel: "field-acc",
  },
  judge: {
    accent: "var(--violet)",
    fillStrong: "var(--violet-12)",
    fillSoft: "var(--violet-08)",
    border: "color-mix(in srgb, var(--violet) 28%, transparent)",
    cellHot: "var(--violet-16)",
    scorerLabel: "JUDGE",
    filterLabel: "judge",
  },
  "exact-match": {
    accent: "var(--cyan)",
    fillStrong: "var(--cyan-12)",
    fillSoft: "var(--cyan-08)",
    border: "color-mix(in srgb, var(--cyan) 24%, transparent)",
    cellHot: "var(--cyan-08)",
    scorerLabel: "EXACT-MATCH",
    filterLabel: "exact",
  },
  neutral: {
    accent: "var(--text-mid)",
    fillStrong: "rgba(147,164,179,0.06)",
    fillSoft: "rgba(147,164,179,0.06)",
    border: "var(--divider)",
    cellHot: "rgba(147,164,179,0.06)",
    scorerLabel: "NEUTRAL",
    filterLabel: "uncat",
  },
};

/** Normalize a stored scorer string to one of our keys. */
export function scorerKey(dominantScorer: string): ScorerKey {
  const s = dominantScorer.toLowerCase();
  if (s.includes("schema")) return "schema";
  if (s.includes("field")) return "field-accuracy";
  if (s.includes("judge")) return "judge";
  if (s.includes("exact")) return "exact-match";
  return "neutral";
}

/** ▰-bar strength prefix, scaled by cluster size relative to the largest. */
export function strengthBars(size: number, max: number): string {
  if (max <= 0) return "▰";
  const ratio = size / max;
  if (ratio > 0.66) return "▰▰▰";
  if (ratio > 0.33) return "▰▰";
  return "▰";
}

/** A human title for a cluster name slug, e.g. "missing-secondary-payment". */
export function clusterTitle(name: string): string {
  return name.replace(/[-_]/g, " ");
}

/** A short subtitle for a case id within a cluster — deterministic, seed-free. */
const CASE_SUBTITLES = [
  "split-tender checkout",
  "gift-card + card split",
  "store-credit remainder",
  "three-way split tender",
  "partial refund + split",
  "loyalty-points + card",
] as const;

export function caseSubtitle(index: number): string {
  return CASE_SUBTITLES[index % CASE_SUBTITLES.length] ?? CASE_SUBTITLES[0];
}

/** A presentational cluster — the row plus everything the workbench derives. */
export interface ClusterVM {
  id: number;
  name: string;
  title: string;
  size: number;
  scorer: ScorerKey;
  tint: ScorerTint;
  mode: string;
  sharedTraits: string[];
  caseIds: string[];
  inGoldenSet: boolean;
  /** Cases not yet covered by the golden set — the promote candidates. */
  uncoveredCount: number;
  /** Relative flex weight in the treemap (== size). */
  weight: number;
  /** ▰-bar prefix for the tile scorer line. */
  bars: string;
}

/** Shape a cluster row into its presentational model. */
export function toClusterVM(row: ErrorClusterRow, maxSize: number): ClusterVM {
  const scorer = scorerKey(row.dominantScorer);
  // A not-yet-golden cluster contributes all its cases to the uncovered count;
  // a promoted one contributes none. There is no per-case golden flag on the
  // contract, so coverage is derived at cluster granularity.
  const uncoveredCount = row.inGoldenSet ? 0 : row.size;
  return {
    id: row.id,
    name: row.name,
    title: clusterTitle(row.name),
    size: row.size,
    scorer,
    tint: SCORER_TINT[scorer],
    mode: row.mode,
    sharedTraits: row.sharedTraits,
    caseIds: row.caseIds,
    inGoldenSet: row.inGoldenSet,
    uncoveredCount,
    weight: row.size,
    bars: strengthBars(row.size, maxSize),
  };
}

/** A shared-trait split into its key, value, and "n/total" coverage fraction. */
export interface ParsedTrait {
  key: string;
  value: string;
  /** "5/6" coverage across the cluster, derived deterministically. */
  fraction: string;
}

/**
 * Parse a "key=value" trait and attach a coverage fraction. The contract
 * stores only the trait string, so the fraction is derived: the first listed
 * trait is the strongest (size-1 / size), the rest step down by one.
 */
export function parseTrait(
  trait: string,
  index: number,
  clusterSize: number,
): ParsedTrait {
  const eq = trait.indexOf("=");
  const key = eq >= 0 ? trait.slice(0, eq) : trait;
  const value = eq >= 0 ? trait.slice(eq + 1) : "";
  const covered = Math.max(1, clusterSize - index);
  return { key, value, fraction: `${String(covered)}/${String(clusterSize)}` };
}

/** Summary derived for the four control-strip cards. */
export interface ControlStripModel {
  totalFailures: number;
  clustersFound: number;
  notYetGolden: number;
  promotedThisWeek: number;
}

export function toControlStrip(
  summary: ErrorClustersSummary,
  clusters: ClusterVM[],
): ControlStripModel {
  const notYetGolden = clusters.reduce((a, c) => a + c.uncoveredCount, 0);
  return {
    totalFailures: summary.affectedCases,
    clustersFound: summary.clusterCount,
    notYetGolden,
    promotedThisWeek: summary.promotedCount,
  };
}

/* ------------------------------------------------------------------ */
/* Cross-tab: scorer (row) × cluster (column).                         */
/* ------------------------------------------------------------------ */

export const CROSS_TAB_SCORERS: ScorerKey[] = [
  "schema",
  "field-accuracy",
  "judge",
  "exact-match",
];

export const SCORER_ROW_LABEL: Record<ScorerKey, string> = {
  schema: "schema",
  "field-accuracy": "field-acc",
  judge: "judge",
  "exact-match": "exact",
  neutral: "neutral",
};

export interface CrossTabCell {
  count: number;
  scorer: ScorerKey;
  /** Whether this is the scorer that drove the cluster (the hot cell). */
  hot: boolean;
}

export interface CrossTabModel {
  /** One column per cluster, in treemap order. */
  columns: { id: number; label: string; total: number }[];
  /** One row per scorer; cells aligned to `columns`. */
  rows: { scorer: ScorerKey; label: string; cells: CrossTabCell[]; total: number }[];
  grandTotal: number;
}

/**
 * Build the scorer × cluster matrix. Each cluster's whole size lands in its
 * dominant-scorer row (the contract attributes a cluster to a single scorer),
 * so the hot cell per column is the dominant one. Column + row totals fall out.
 */
export function toCrossTab(clusters: ClusterVM[]): CrossTabModel {
  const columns = clusters.map((c) => ({
    id: c.id,
    label: c.title,
    total: c.size,
  }));

  const rows = CROSS_TAB_SCORERS.map((scorer) => {
    const cells: CrossTabCell[] = clusters.map((c) => ({
      count: c.scorer === scorer ? c.size : 0,
      scorer,
      hot: c.scorer === scorer && c.size > 0,
    }));
    const total = cells.reduce((a, cell) => a + cell.count, 0);
    return { scorer, label: SCORER_ROW_LABEL[scorer], cells, total };
  });

  const grandTotal = clusters.reduce((a, c) => a + c.size, 0);
  return { columns, rows, grandTotal };
}

/** Filter pills above the treemap: "all" + one per scorer present. */
export interface FilterPill {
  key: ScorerKey | "all";
  label: string;
  count: number;
  accent: string;
}

export function toFilterPills(clusters: ClusterVM[]): FilterPill[] {
  const byScorer = new Map<ScorerKey, number>();
  for (const c of clusters) {
    byScorer.set(c.scorer, (byScorer.get(c.scorer) ?? 0) + c.size);
  }
  const total = clusters.reduce((a, c) => a + c.size, 0);
  const pills: FilterPill[] = [
    { key: "all", label: "all", count: total, accent: "var(--text-hi)" },
  ];
  for (const scorer of CROSS_TAB_SCORERS) {
    const count = byScorer.get(scorer);
    if (count === undefined || count === 0) continue;
    pills.push({
      key: scorer,
      label: SCORER_TINT[scorer].filterLabel,
      count,
      accent: SCORER_TINT[scorer].accent,
    });
  }
  return pills;
}
