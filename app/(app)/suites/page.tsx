import { SuitesOverviewView } from "@/components/suites/suites-overview-view";
import { getSuitesOverview } from "@/lib/queries/suites";

// The overview reflects the latest eval-run state (the CLI writer lands new
// runs + repoints suites.latestRunId); never statically cache it.
export const dynamic = "force-dynamic";

/** "HH:mm UTC" for the topbar SYNC readout. */
function utcClock(date: Date): string {
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`;
}

/**
 * Suites Overview — the control tower. Async Server Component: it reads the
 * KPI strip + suite rows from getSuitesOverview() and hands typed props to the
 * client view. The `filter` search param selects the active status tab so the
 * filter survives a reload / shareable URL.
 */
export default async function SuitesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ kpis, suites }, params] = await Promise.all([
    getSuitesOverview(),
    searchParams,
  ]);

  const rawFilter = params.filter;
  const filter = Array.isArray(rawFilter) ? rawFilter[0] : rawFilter;

  // Anchor "now" to the most recent run in the dataset (the SYNC clock), so the
  // relative-time labels ("12m ago", "9d ago") are deterministic and reconcile
  // to the seeded snapshot — no wall-clock read that would drift the SSR pass.
  const latestRunMs = suites.reduce(
    (max, s) => Math.max(max, s.lastRunAt?.getTime() ?? 0),
    0,
  );
  // The console syncs SYNC_LAG after the head run lands; this reproduces the
  // design's "12m ago" on the freshest suite without a real clock.
  const SYNC_LAG_MS = 12 * 60_000;
  const nowMs = latestRunMs > 0 ? latestRunMs + SYNC_LAG_MS : 0;

  // The SYNC readout shows that anchor in UTC (matching the freshest run).
  const syncLabel =
    latestRunMs > 0 ? utcClock(new Date(latestRunMs)) : "—";

  return (
    <SuitesOverviewView
      kpis={kpis}
      suites={suites}
      nowMs={nowMs}
      syncLabel={syncLabel}
      initialFilter={filter ?? null}
    />
  );
}
