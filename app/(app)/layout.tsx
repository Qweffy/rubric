import { type ReactNode } from "react";

import { RubricShell } from "@/components/shell/rubric-shell";
import { type SyncStatus as TopbarSyncStatus, type SyncTone } from "@/components/shell/topbar";
import {
  getNavBadges,
  getSyncStatus,
  type NavBadges,
  type SyncStatus,
} from "@/lib/queries/shell";

/** "HH:mm UTC" for the topbar SYNC readout. */
function utcClock(date: Date): string {
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`;
}

/**
 * Map the store sync read onto the topbar's dot+label. A run in flight is amber
 * "syncing…"; a failed head run is red; otherwise phosphor "synced" anchored to
 * the freshest completed timestamp (falling back to the last run's start).
 */
function topbarSync(sync: SyncStatus): TopbarSyncStatus {
  if (sync.state === "running") {
    return { tone: "syncing", label: "syncing…" };
  }

  const tone: SyncTone = sync.lastRunStatus === "failed" ? "failed" : "synced";
  const at = sync.lastCompletedAt ?? sync.lastRunAt;
  const label = at !== null ? utcClock(at) : "—";

  return { tone, label };
}

/**
 * Sidebar badge counts as a string map (the shell's `navBadges` contract). Only
 * non-zero counts are surfaced so the sidebar never shows a "0" pip.
 */
function navBadgeMap(badges: NavBadges): Record<string, string> {
  const entries: [string, number][] = [
    ["regressedSuites", badges.regressedSuites],
    ["flakySuites", badges.flakySuites],
    ["runningRuns", badges.runningRuns],
    ["uncalibratedJudges", badges.uncalibratedJudges],
    ["openErrorClusters", badges.openErrorClusters],
  ];

  return Object.fromEntries(
    entries
      .filter(([, count]) => count > 0)
      .map(([key, count]) => [key, String(count)]),
  );
}

// The shell reflects live store state (in-flight runs, freshness, alert counts);
// never statically cache it.
export const dynamic = "force-dynamic";

/**
 * App shell layout. Reads the cross-cutting store status + nav badge counts on
 * every request and renders the persistent chrome (sidebar, glass topbar, ⌘K
 * palette, key-hint strip) around the routed page.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const [sync, badges] = await Promise.all([getSyncStatus(), getNavBadges()]);

  return (
    <RubricShell syncStatus={topbarSync(sync)} navBadges={navBadgeMap(badges)}>
      {children}
    </RubricShell>
  );
}
