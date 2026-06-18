import {
  SettingsView,
  type JudgeRow,
  type ProjectRow,
  type ThresholdRow,
  type VersionItem,
} from "@/components/settings/settings-view";
import { getModelComparison } from "@/lib/queries/calibration";
import { GATE_THRESHOLDS } from "@/lib/queries/gating";
import { getConnections } from "@/lib/queries/settings";
import { getSuitesOverview } from "@/lib/queries/suites";

/**
 * Settings · Connections (provenance / source-of-truth). Async Server Component:
 * reads the store connection stats (getConnections — the canonical contract for
 * this screen), the per-judge calibration rows (getModelComparison) that drive
 * the JUDGE CONFIG table, and the suite roster (getSuitesOverview) that drives
 * the REGISTERED PROJECTS table, then hands typed props to the client view.
 *
 * force-dynamic: the panel reflects the live seeded store (run counts, suite
 * freshness, judge defaults) and must never be frozen at build time. Next 16:
 * params and searchParams are Promises and are awaited before use.
 */
export const dynamic = "force-dynamic";

/** "HH:mm UTC" for the sync readouts. */
function utcClock(date: Date): string {
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`;
}

/** "YYYY-MM-DD" for the last-sync line. */
function isoDate(date: Date): string {
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The request timestamp, resolved as data (not read during render) so the
 * stale-day / sync-clock derivations stay a pure render. force-dynamic means
 * this is evaluated fresh per request; it is only the fallback when the seeded
 * store somehow carries no runs.
 */
function requestNow(): Promise<number> {
  return Promise.resolve(Date.now());
}

/**
 * Canonical store identity the connection stats don't carry. The seeded store
 * is the acme run bucket read through DuckDB; the URI is the design's fixture.
 */
const STORE_BACKEND = "S3 + DuckDB";
const STORE_URI = "s3://acme-rubric-runs";

/** A rising 10-point sync cadence (design's SYNC HISTORY sparkline shape). */
const SYNC_CADENCE = [4, 8, 6, 16, 12, 22, 14, 26, 22, 30];

/** rubric CLI + store schema, mirrored from the seed's store-schema v3 line. */
const CLI_VERSION = "v1.4.2";
const STORE_SCHEMA = "v3";

/**
 * The read-only gate floors, in the design's order. The numeric floors for the
 * scorers rubric tracks come from the gate-threshold map (lib/queries/gating);
 * the operator, scope, and the policy-level rows (pass-rate, cost/run) are the
 * canonical gate policy the map does not enumerate.
 */
function buildThresholds(): ThresholdRow[] {
  const fieldAccuracy = GATE_THRESHOLDS["field-accuracy"] ?? 0.95;
  const schema = GATE_THRESHOLDS.schema ?? GATE_THRESHOLDS["json-schema"] ?? 0.9;

  return [
    { metric: "overall pass-rate", op: "≥", floor: "85.0%", scope: "all projects" },
    {
      metric: "schema pass-rate",
      op: "≥",
      floor: `${(schema * 100).toFixed(1)}%`,
      scope: "all projects",
    },
    {
      metric: "field-accuracy",
      hint: "(0–1 score)",
      op: "≥",
      floor: fieldAccuracy.toFixed(2),
      scope: "checkout",
    },
    { metric: "recall@k", hint: "(k=3)", op: "≥", floor: "0.90", scope: "all projects" },
    { metric: "judge κ", op: "≥", floor: "0.75", scope: "all projects" },
    { metric: "cost/run", op: "≤", floor: "$2.00", scope: "all projects" },
  ];
}

export default async function SettingsPage({
  params,
  searchParams,
}: {
  params: Promise<Record<string, never>>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await params;
  await searchParams;

  const [connections, judgeRows, overview, requestMs] = await Promise.all([
    getConnections(),
    getModelComparison(),
    getSuitesOverview(),
    requestNow(),
  ]);

  // Anchor "now" to the freshest run so the sync clock + stale-day counts are
  // deterministic against the seeded snapshot (no wall-clock drift in SSR).
  const latestRunMs = overview.suites.reduce(
    (max, s) => Math.max(max, s.lastRunAt?.getTime() ?? 0),
    0,
  );
  const nowMs = latestRunMs > 0 ? latestRunMs : requestMs;
  const lastSync = new Date(nowMs);

  const projects: ProjectRow[] = overview.suites.map((s) => {
    const stale = s.status === "stale";
    const staleDays =
      s.lastRunAt !== null
        ? Math.max(0, Math.round((nowMs - s.lastRunAt.getTime()) / DAY_MS))
        : null;
    const slug = s.repo.split("/").pop() ?? s.slug;
    return {
      repo: `github.com/${s.repo}`,
      branch: "main",
      suiteCount: 1,
      configPath: `.rubric/${slug}.yaml`,
      sha: s.sha ?? "—",
      state: stale ? "stale" : "connected",
      staleDays: stale ? staleDays : null,
    };
  });

  const judges: JudgeRow[] = judgeRows.map((j) => ({
    id: j.judgeId,
    model: j.judgeName,
    agreement: j.agreement,
    kappa: j.kappa,
    costPer1k: j.costPer1k,
    isDefault: j.isDefault,
    // Default + aligned judges are enabled; the cost-flagged one is off by
    // default in the design. Derived from calibration status.
    enabled: j.status === "aligned" || j.isDefault,
    status: j.status,
    flagged: j.status === "under-calibrated",
  }));

  const versions: VersionItem[] = [
    { label: "rubric CLI", value: CLI_VERSION },
    { label: "dashboard", value: CLI_VERSION },
    { label: "store schema", value: STORE_SCHEMA },
    { label: "last migration", value: "2026-06-10" },
  ];

  // The header status trio: one dot per synced source + the trailing amber
  // (stale) source. Sources = the providers the store reads through.
  const syncedSources = Math.max(1, connections.connections.length - 1);

  return (
    <SettingsView
      store={{
        backend: STORE_BACKEND,
        uri: STORE_URI,
        runCount: connections.stats.runs,
        suiteCount: connections.stats.suites,
        lastSyncUtc: utcClock(lastSync),
        lastSyncDate: isoDate(lastSync),
        cadence: SYNC_CADENCE,
      }}
      projects={projects}
      judges={judges}
      thresholds={buildThresholds()}
      gateFile="rubric.gates.yaml"
      versions={versions}
      syncedSources={syncedSources}
      syncedAgo="2m ago"
      cliVersion={CLI_VERSION}
      storeSchema={STORE_SCHEMA}
    />
  );
}
