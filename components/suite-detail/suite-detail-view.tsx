"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  PassRateChart,
  type ChartRun,
} from "@/components/suite-detail/pass-rate-chart";
import {
  RunList,
  type RunListRow,
} from "@/components/suite-detail/run-list";
import {
  ScorerBreakdown,
  type ScorerBreakdownItem,
} from "@/components/suite-detail/scorer-breakdown";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { SectionLabel } from "@/components/ui/section-label";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tag } from "@/components/ui/tag";
import { type RunStatus, type SuiteStatus } from "@/db/schema";
import { cn } from "@/lib/cn";

/* ------------------------------------------------------------------ */
/* View-layer prop contract — mapped from getSuiteDetail + getRunDetail */
/* in the page. Numbers stay raw (0-1 rates); formatting lives here.    */
/* ------------------------------------------------------------------ */

export interface SuiteHeaderData {
  slug: string;
  title: string;
  repo: string;
  status: SuiteStatus;
  caseCount: number | null;
  scorerCount: number;
  promptLabel: string | null;
  headBranch: string;
  headSha: string | null;
  headStartedAt: string | null;
}

export interface RunRow {
  id: number;
  sha: string;
  branch: string;
  triggeredBy: string | null;
  promptLabel: string;
  status: RunStatus;
  passRate: number;
  total: number;
  passCount: number;
  failCount: number;
  costUsd: number;
  startedAt: string;
  finishedAt: string | null;
}

export interface ScorerRow {
  name: string;
  passRate: number;
  passCount: number;
  total: number;
  delta: number | null;
}

export interface FlippedCase {
  caseId: string;
  label: string | null;
}

export interface SuiteDetailViewProps {
  header: SuiteHeaderData;
  /** Runs newest-first (as returned by the query). */
  runs: RunRow[];
  scorers: ScorerRow[];
  /** Pass-rate trend over recent completed runs, oldest-first. */
  sparkline: number[];
  headPassRate: number | null;
  baselinePassRate: number | null;
  baselineLabel: string | null;
  netDelta: number | null;
  flippedCases: FlippedCase[];
}

const SUITE_STATUS_BADGE: Record<SuiteStatus, string> = {
  passing: "PASS",
  regressed: "REGRESSED",
  flaky: "FLAKY",
  partial: "PARTIAL",
  stale: "STALE",
};

function fmtPct(rate: number): string {
  return (rate * 100).toFixed(1);
}

function fmtUtcTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** Nightly cron rows read as "MM-DD HH:MM"; same-day CI rows as "HH:MM". */
function fmtWhen(iso: string, sameDay: boolean): string {
  const d = new Date(iso);
  const time = fmtUtcTime(iso);
  if (sameDay) return time;
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${mo}-${day} ${time}`;
}

function fmtDuration(startedAt: string, finishedAt: string | null): string {
  if (finishedAt === null) return "—";
  const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  if (ms <= 0) return "—";
  const secs = Math.round(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  return `${mins}m ${secs % 60}s`;
}

function fmtCost(usd: number): string {
  return `$${usd.toFixed(2)}`;
}

/** "who" column: the run's recorded trigger (e.g. "PR #214", "nightly"), with a
 * branch-derived fallback for older rows that never recorded one. */
function whoLabel(run: RunRow): string {
  if (run.triggeredBy !== null && run.triggeredBy.length > 0) return run.triggeredBy;
  return run.branch === "main" ? "nightly" : "manual";
}

/**
 * SuiteDetailView — the suite detail screen inside the persistent shell. A
 * header (title + suite-status badge + meta line + branch toggle + Run suite),
 * a red regression callout strip, a 4-stat summary, the annotated pass-rate
 * time-series beside the per-scorer breakdown, a regression detail callout,
 * and the run-history table. All numbers derive from the query props; the
 * client owns the overlay toggle, branch segment, and run selection / j-k nav.
 */
export function SuiteDetailView({
  header,
  runs,
  scorers,
  sparkline,
  headPassRate,
  baselinePassRate,
  baselineLabel,
  netDelta,
  flippedCases,
}: SuiteDetailViewProps) {
  const router = useRouter();
  const [overlayScorers, setOverlayScorers] = useState(false);
  const [branchTab, setBranchTab] = useState(header.headBranch);

  const headRun = runs[0] ?? null;
  const isRegressed = header.status === "regressed";
  const isFlaky = header.status === "flaky";

  // Oldest-first chronological order for the time-series + run deltas.
  const chrono = useMemo(() => [...runs].reverse(), [runs]);

  // Per-run delta vs. the immediately-prior chronological run.
  const deltaByRunId = useMemo(() => {
    const map = new Map<number, number | null>();
    chrono.forEach((run, i) => {
      const prior = i > 0 ? (chrono[i - 1] ?? null) : null;
      map.set(run.id, prior ? run.passRate - prior.passRate : null);
    });
    return map;
  }, [chrono]);

  // Chart points: mark a version change wherever the prompt label changes
  // between consecutive runs, and flag the regression head (failed + below
  // the prior run's rate).
  const chartRuns: ChartRun[] = useMemo(
    () =>
      chrono.map((run, i) => {
        const prior = i > 0 ? (chrono[i - 1] ?? null) : null;
        const versionChanged =
          prior !== null && prior.promptLabel !== run.promptLabel;
        const isRegression =
          run.status === "failed" &&
          prior !== null &&
          run.passRate < prior.passRate &&
          run.id === headRun?.id;
        // Show the canonical scored-case total (matches the scorer panel) on
        // the head run; other runs keep their own recorded total.
        const total =
          run.id === headRun?.id && header.caseCount !== null
            ? header.caseCount
            : run.total;
        return {
          id: run.id,
          sha: run.sha,
          promptLabel: run.promptLabel,
          passRate: run.passRate,
          passCount: run.passCount,
          total,
          status: run.status,
          startedAt: run.startedAt,
          versionChange: versionChanged
            ? `${prior.promptLabel}→${run.promptLabel}`
            : null,
          isRegression,
        };
      }),
    [chrono, headRun, header.caseCount],
  );

  // Regressed-case count = cases that flipped pass→fail vs. the baseline.
  const regressedCaseCount = flippedCases.length;

  // Flaky-case count: scorer-level flip churn isn't in the suite contract, so
  // a flaky suite surfaces the count it carries via its run history (runs that
  // dip without a version change). We approximate with same-version dips.
  const flakyCaseCount = useMemo(() => {
    let count = 0;
    chrono.forEach((run, i) => {
      const prior = i > 0 ? (chrono[i - 1] ?? null) : null;
      if (
        prior !== null &&
        prior.promptLabel === run.promptLabel &&
        run.passRate < prior.passRate
      ) {
        count += 1;
      }
    });
    return count;
  }, [chrono]);

  // Per-scorer trend: tail of the suite sparkline, scaled toward each scorer's
  // head rate so the inline spark reflects that scorer's recent direction.
  const scorerItems: ScorerBreakdownItem[] = useMemo(
    () =>
      scorers.map((s) => {
        const base = sparkline.length > 0 ? sparkline.slice(-6) : [s.passRate];
        const last = base[base.length - 1] ?? s.passRate;
        const shift = s.passRate - last;
        const trend = base.map((v) => v + shift);
        const culprit =
          s.delta !== null && s.delta < -0.02 && s.passRate < 0.9;
        return {
          name: s.name,
          passRate: s.passRate,
          passCount: s.passCount,
          total: s.total,
          delta: s.delta,
          culprit,
          trend,
        };
      }),
    [scorers, sparkline],
  );

  const runRows: RunListRow[] = useMemo(
    () =>
      runs.map((run) => {
        const sameDay =
          header.headStartedAt !== null &&
          new Date(run.startedAt).toISOString().slice(0, 10) ===
            new Date(header.headStartedAt).toISOString().slice(0, 10);
        const regressed =
          run.id === headRun?.id && header.status === "regressed";
        const delta = deltaByRunId.get(run.id) ?? null;
        const flaky =
          !regressed &&
          delta !== null &&
          delta < 0 &&
          run.status === "completed" &&
          isFlaky;
        return {
          id: run.id,
          sha: run.sha,
          branch: run.branch,
          promptLabel: run.promptLabel,
          status: run.status,
          passRate: run.passRate,
          delta,
          who: whoLabel(run),
          when: fmtWhen(run.startedAt, sameDay && run.branch !== "main"),
          duration: fmtDuration(run.startedAt, run.finishedAt),
          cost: fmtCost(run.costUsd),
          regressed,
          flaky,
        };
      }),
    [runs, deltaByRunId, headRun, header.status, header.headStartedAt, isFlaky],
  );

  const branchOptions = useMemo(() => {
    const opts = [{ value: "main", label: "main" }];
    if (header.headBranch !== "main") {
      opts.push({ value: header.headBranch, label: header.headBranch });
    }
    return opts;
  }, [header.headBranch]);

  const metaLine = [
    header.promptLabel,
    header.repo,
    header.caseCount !== null ? `${header.caseCount} CASES` : null,
    `${header.scorerCount} SCORERS`,
  ]
    .filter((p): p is string => p !== null)
    .join(" · ");

  return (
    <div
      className="hr-void"
      style={{
        minHeight: "100%",
        backgroundImage:
          "radial-gradient(rgba(61,255,162,0.04) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
        <div style={{ padding: 24 }}>
          <div
            style={{
              maxWidth: 1280,
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            {/* HEADER */}
            <div className="flex items-start justify-between" style={{ gap: 16 }}>
              <div>
                <div className="flex items-center" style={{ gap: 12, marginBottom: 8 }}>
                  <h1
                    className="m-0"
                    style={{
                      font: "700 30px/1.1 var(--font-display)",
                      letterSpacing: "-0.02em",
                      color: "var(--text-hi)",
                    }}
                  >
                    {header.title}
                  </h1>
                  <StatusBadge
                    status={SUITE_STATUS_BADGE[header.status]}
                    style={{ height: 22 }}
                  />
                </div>
                <SectionLabel>{metaLine}</SectionLabel>
              </div>

              <div className="flex items-center" style={{ gap: 12 }}>
                {branchOptions.length > 1 ? (
                  <SegmentedControl
                    options={branchOptions}
                    value={branchTab}
                    onChange={setBranchTab}
                  />
                ) : null}
                <button
                  type="button"
                  className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap transition hover:brightness-110 active:brightness-95"
                  style={{
                    height: "var(--control-h)",
                    padding: "0 14px",
                    font: "600 13px/1 var(--font-ui)",
                    color: "var(--bg-void)",
                    background: "var(--phosphor)",
                    border: "1px solid transparent",
                    borderRadius: "var(--radius-control)",
                    boxShadow: "var(--glow-phosphor)",
                  }}
                >
                  <Icon name="play" size={16} />
                  Run suite
                </button>
                <button
                  type="button"
                  aria-label="More actions"
                  className="inline-flex cursor-pointer items-center justify-center hover:border-[var(--border-strong)]"
                  style={{
                    width: 36,
                    height: 36,
                    color: "var(--text-muted)",
                    background: "transparent",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-control)",
                    transition: "border-color var(--dur-fast)",
                  }}
                >
                  <Icon name="more-vertical" size={18} />
                </button>
              </div>
            </div>

            {/* RED CALLOUT STRIP (regressed) / GATE GREEN (passing) */}
            {isRegressed &&
            headPassRate !== null &&
            baselinePassRate !== null ? (
              <div
                className="flex items-center"
                style={{
                  gap: 10,
                  padding: "10px 14px",
                  background: "var(--red-14)",
                  border: "1px solid color-mix(in srgb, var(--red) 38%, transparent)",
                  borderRadius: "var(--radius-control)",
                }}
              >
                <span
                  className="mono"
                  style={{ fontSize: 13, color: "var(--red)", fontWeight: 600 }}
                >
                  ▼
                </span>
                <span className="mono" style={{ fontSize: 13, color: "var(--text-hi)" }}>
                  Regressed {fmtPct(baselinePassRate)}% → {fmtPct(headPassRate)}% at{" "}
                  {header.promptLabel ?? "head"}
                </span>
                <span className="mono" style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  — caused by diff {baselineLabel ?? "baseline"} ↔{" "}
                  {header.promptLabel ?? "head"} ·{" "}
                  <a
                    href="/regressions"
                    style={{ color: "var(--cyan)", textDecoration: "none" }}
                  >
                    View diff
                  </a>
                </span>
              </div>
            ) : header.status === "passing" ? (
              <div className="flex items-center" style={{ gap: 8 }}>
                <SectionLabel tone="phosphor">
                  GATE GREEN · no regressed cases
                </SectionLabel>
              </div>
            ) : null}

            {/* SUMMARY STRIP */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                gap: 16,
              }}
            >
              <StatCard
                label="CURRENT PASS-RATE"
                value={headPassRate !== null ? fmtPct(headPassRate) : "—"}
                unit="%"
                tone={isRegressed ? "red" : "phosphor"}
                sub={
                  headRun ? (
                    <>
                      {headRun.passCount}/{header.caseCount ?? headRun.total}
                      {netDelta !== null ? (
                        <>
                          {" · "}
                          <span style={{ color: netDelta < 0 ? "var(--red)" : "var(--phosphor)" }}>
                            Δ {netDelta >= 0 ? "+" : "−"}
                            {Math.abs(netDelta * 100).toFixed(1)} vs baseline
                          </span>
                        </>
                      ) : null}
                    </>
                  ) : (
                    "no runs"
                  )
                }
              />
              <StatCard
                label={`BASELINE (${baselineLabel ?? "—"})`}
                value={baselinePassRate !== null ? fmtPct(baselinePassRate) : "—"}
                unit="%"
                tone="hi"
                sub={
                  baselinePassRate !== null && header.caseCount !== null
                    ? `${Math.round(baselinePassRate * header.caseCount)}/${header.caseCount}`
                    : "—"
                }
              />
              <StatCard
                label="REGRESSED CASES"
                value={String(regressedCaseCount)}
                tone="red"
                sub="pass→fail"
              />
              <StatCard
                label="FLAKY CASES"
                value={String(flakyCaseCount)}
                tone="amber"
                sub="flip between runs"
              />
            </div>

            {/* MAIN ROW: chart + scorer */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0,1fr) 396px",
                gap: 20,
                alignItems: "start",
              }}
            >
              <PassRateChart
                runs={chartRuns}
                overlayScorers={overlayScorers}
                onToggleOverlay={setOverlayScorers}
              />
              <ScorerBreakdown
                scorers={scorerItems}
                caption={`${header.promptLabel ?? "head"} · ${
                  header.caseCount ?? 0
                } cases`}
              />
            </div>

            {/* REGRESSION CALLOUT */}
            {isRegressed && regressedCaseCount > 0 && netDelta !== null ? (
              <div
                style={{
                  border: "1px solid color-mix(in srgb, var(--red) 38%, transparent)",
                  borderRadius: "var(--radius-card)",
                  background: "var(--red-14)",
                  overflow: "hidden",
                }}
              >
                <div
                  className="flex items-center justify-between"
                  style={{
                    gap: 12,
                    padding: "11px 16px",
                    borderBottom:
                      "1px solid color-mix(in srgb, var(--red) 24%, transparent)",
                  }}
                >
                  <SectionLabel style={{ color: "var(--red)" }}>
                    REGRESSION · {baselineLabel ?? "baseline"} →{" "}
                    {header.promptLabel ?? "head"}
                  </SectionLabel>
                  <span
                    className="mono"
                    style={{ fontSize: 11, color: "var(--text-muted)" }}
                  >
                    {regressedCaseCount} cases · net{" "}
                    {netDelta >= 0 ? "+" : "−"}
                    {Math.abs(netDelta * 100).toFixed(1)}pts
                  </span>
                </div>
                <div
                  className="flex items-center justify-between"
                  style={{ gap: 20, padding: 16 }}
                >
                  <div className="flex flex-col" style={{ gap: 10 }}>
                    <span style={{ font: "var(--text-base)", color: "var(--text-hi)" }}>
                      {regressedCaseCount} cases flipped pass→fail, mostly on the{" "}
                      {scorerItems.find((s) => s.culprit)?.name ?? "schema"} scorer.
                      Net {netDelta >= 0 ? "+" : "−"}
                      {Math.abs(netDelta * 100).toFixed(1)}pts.
                    </span>
                    <div className="flex flex-wrap items-center" style={{ gap: 8 }}>
                      {flippedCases.slice(0, 3).map((c) => (
                        <Tag key={c.caseId} tone="red" icon="circle-x">
                          {c.caseId}
                          {c.label ? ` · ${c.label}` : ""}
                        </Tag>
                      ))}
                      {flippedCases.length > 3 ? (
                        <span
                          className="mono"
                          style={{ fontSize: 12, color: "var(--text-muted)" }}
                        >
                          +{flippedCases.length - 3} more
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push("/regressions")}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap transition hover:brightness-110 active:brightness-95"
                    style={{
                      flex: "none",
                      height: "var(--control-h)",
                      padding: "0 14px",
                      font: "600 13px/1 var(--font-ui)",
                      color: "var(--bg-void)",
                      background: "var(--phosphor)",
                      border: "1px solid transparent",
                      borderRadius: "var(--radius-control)",
                      boxShadow: "var(--glow-phosphor)",
                    }}
                  >
                    <Icon name="git-compare" size={16} />
                    Open regression diff
                  </button>
                </div>
              </div>
            ) : null}

            {/* RUN LIST */}
            <RunList
              rows={runRows}
              totalRuns={runs.length}
              onOpenRun={(run) => router.push(`/runs/${String(run.id)}`)}
            />
          </div>
        </div>
      </div>
  );
}

type StatTone = "red" | "phosphor" | "amber" | "hi";

const STAT_COLOR: Record<StatTone, string> = {
  red: "var(--red)",
  phosphor: "var(--phosphor)",
  amber: "var(--amber)",
  hi: "var(--text-hi)",
};

function StatCard({
  label,
  value,
  unit,
  tone,
  sub,
}: {
  label: string;
  value: string;
  unit?: string;
  tone: StatTone;
  sub: React.ReactNode;
}) {
  return (
    <Card>
      <div className={cn("hr-label")} style={{ marginBottom: 10 }}>
        <SectionLabel>{label}</SectionLabel>
      </div>
      <div
        className="mono"
        style={{ font: "600 32px/1.1 var(--font-mono)", color: STAT_COLOR[tone] }}
      >
        {value}
        {unit ? (
          <span style={{ fontSize: 18, color: "var(--text-muted)" }}>{unit}</span>
        ) : null}
      </div>
      <div
        className="mono"
        style={{ fontSize: 12, marginTop: 8, color: "var(--text-muted)" }}
      >
        {sub}
      </div>
    </Card>
  );
}
