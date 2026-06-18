"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { useRowNavRegistration } from "@/components/shell/keyboard-nav";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { Kbd } from "@/components/ui/kbd";
import { SectionLabel } from "@/components/ui/section-label";
import { cn } from "@/lib/cn";
import  { type SuiteKpis, type SuiteRow as SuiteRowData } from "@/lib/queries/suites";

import {
  matchesFilter,
  SUITE_FILTERS,
  type SuiteFilter,
} from "./format";
import { SuiteRow, SUITE_GRID } from "./suite-row";
import { SuitesKpiStrip } from "./suites-kpi-strip";

export interface SuitesOverviewViewProps {
  kpis: SuiteKpis;
  suites: SuiteRowData[];
  /** Server-resolved "now" so relative-time labels are hydration-stable. */
  nowMs: number;
  /** "HH:mm UTC" of the freshest run, for the header / SYNC readout. */
  syncLabel: string;
  /** Active filter tab from the URL, or null for "all". */
  initialFilter: string | null;
}

const COLUMN_HEADERS = [
  "SUITE",
  "STATUS",
  "PASS-RATE",
  "Δ",
  "TREND",
  "SCORERS",
  "LAST RUN",
  "VERSION",
  "COST",
] as const;

type SortKey = "pass-rate" | "name" | "cost";

const SORT_LABEL: Record<SortKey, string> = {
  "pass-rate": "by pass-rate",
  name: "by name",
  cost: "by cost",
};

const FILTER_LABEL: Record<SuiteFilter, string> = {
  all: "All",
  regressed: "Regressed",
  passing: "Passing",
  flaky: "Flaky",
  stale: "Stale",
};

function isFilter(value: string | null): value is SuiteFilter {
  return value !== null && (SUITE_FILTERS as string[]).includes(value);
}

/** Synthesise a ⌘K so the shell's global key handler opens the palette. */
function openPalette(): void {
  window.dispatchEvent(
    new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }),
  );
}

const HEADER_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: SUITE_GRID,
  alignItems: "center",
  gap: 14,
  padding: "8px 16px",
  borderBottom: "1px solid var(--divider)",
};

/**
 * Suites Overview — the control tower. Renders the page header, the KPI strip,
 * a filter/sort bar, and the suites table over the seeded overview data. Owns
 * the active filter tab (mirrored to the URL `?filter=` so it survives reload),
 * the sort order, and the selected row; registers its rows with the shell's
 * j/k/↵ row-nav (↵ opens a suite). A regression banner surfaces when a suite is
 * in the red. Reduced-motion is inherited from the shared primitives.
 */
export function SuitesOverviewView({
  kpis,
  suites,
  nowMs,
  syncLabel,
  initialFilter,
}: SuitesOverviewViewProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<SuiteFilter>(
    isFilter(initialFilter) ? initialFilter : "all",
  );
  const [sort, setSort] = useState<SortKey>("pass-rate");
  const [selected, setSelected] = useState<string | null>(null);

  // Ordered row nodes for the shell's j/k/↵ row-nav. A ref array (not state) so
  // collecting nodes during commit never triggers a re-render — mirrors the
  // run-list row-nav wiring. Keyed by render index, kept in sync with `visible`.
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Counts per tab come from the KPI strip — same data contract, never recounted
  // by hand. "Passing" reflects the query's passingCount (latest-run green).
  const tabCounts: Record<SuiteFilter, number> = useMemo(
    () => ({
      all: kpis.suiteCount,
      regressed: kpis.regressedCount,
      passing: kpis.passingCount,
      flaky: kpis.flakyCount,
      stale: kpis.staleCount,
    }),
    [kpis],
  );

  const visible = useMemo(() => {
    const filtered = suites.filter((s) => matchesFilter(s, filter));
    const byKey = [...filtered].sort((a, b) => {
      if (sort === "name") return a.slug.localeCompare(b.slug);
      if (sort === "cost") return (b.costUsd ?? -1) - (a.costUsd ?? -1);
      // pass-rate: highest first, nulls last.
      const ar = a.passRate ?? -1;
      const br = b.passRate ?? -1;
      return br - ar;
    });
    return byKey;
  }, [suites, filter, sort]);

  const openSuite = useCallback(
    (index: number) => {
      const suite = visible[index];
      if (suite) router.push(`/suites/${suite.slug}`);
    },
    [visible, router],
  );

  // The row-nav hook reads the collected node array inside its own effect; we
  // hand it the ref object and the visible row count so it re-registers when the
  // filtered set changes, without reading the ref during render.
  const highlighted = useRowNavRegistration(
    rowRefs,
    visible.length,
    openSuite,
  );

  const applyFilter = useCallback(
    (next: SuiteFilter) => {
      setFilter(next);
      const query = next === "all" ? "/suites" : `/suites?filter=${next}`;
      router.replace(query, { scroll: false });
    },
    [router],
  );

  const cycleSort = useCallback(() => {
    setSort((prev) =>
      prev === "pass-rate" ? "name" : prev === "name" ? "cost" : "pass-rate",
    );
  }, []);

  const regressed = suites.find((s) => s.status === "regressed");

  return (
    <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* PAGE HEADER */}
        <div className="flex items-end justify-between" style={{ gap: 16 }}>
          <div>
            <h1
              style={{
                font: "700 30px/1.1 var(--font-display)",
                letterSpacing: "-0.02em",
                color: "var(--text-hi)",
                margin: "0 0 8px",
              }}
            >
              Suites
            </h1>
            <SectionLabel>
              REGRESSION GATING · {kpis.suiteCount} SUITES · LAST RUN {syncLabel}
            </SectionLabel>
          </div>
          <div className="flex items-center" style={{ gap: 10 }}>
            <button
              type="button"
              onClick={openPalette}
              className="mono inline-flex cursor-pointer items-center"
              style={{
                gap: 7,
                height: 36,
                padding: "0 14px",
                font: "600 13px/1 var(--font-ui)",
                color: "var(--text-body)",
                background: "transparent",
                border: "1px solid transparent",
                borderRadius: "var(--radius-control)",
              }}
            >
              Search <Kbd>⌘K</Kbd>
            </button>
            <button
              type="button"
              className="inline-flex cursor-pointer items-center justify-center hover:brightness-110 active:brightness-95"
              style={{
                gap: 8,
                height: 36,
                padding: "0 14px",
                font: "600 13px/1 var(--font-ui)",
                color: "var(--bg-void)",
                background: "var(--phosphor)",
                border: "1px solid transparent",
                borderRadius: "var(--radius-control)",
                boxShadow: "var(--glow-phosphor)",
              }}
            >
              <Icon name="play" size={16} strokeWidth={1.5} />
              Run all
            </button>
          </div>
        </div>

        {/* KPI STRIP */}
        <SuitesKpiStrip kpis={kpis} suites={suites} />

        {/* REGRESSION BANNER */}
        {regressed && (
          <div
            className="flex items-center"
            style={{
              gap: 12,
              padding: "11px 14px",
              background: "var(--red-14)",
              border: "1px solid color-mix(in srgb, var(--red) 40%, transparent)",
              borderRadius: "var(--radius-card)",
            }}
          >
            <Icon
              name="circle-x"
              size={16}
              strokeWidth={1.5}
              style={{ color: "var(--red)", flex: "none" }}
            />
            <span style={{ flex: 1, font: "var(--text-sm)", color: "var(--text-hi)" }}>
              {tabCounts.regressed} suite
              {tabCounts.regressed === 1 ? "" : "s"} regressed —{" "}
              <span className="mono">{regressed.slug}</span> dropped below its
              gate. PR #214 is blocked.
            </span>
            <button
              type="button"
              onClick={() => router.push("/regressions")}
              className="cursor-pointer"
              style={{
                height: 30,
                padding: "0 11px",
                font: "600 12px/1 var(--font-ui)",
                color: "var(--red)",
                background: "transparent",
                border: "1px solid color-mix(in srgb, var(--red) 42%, transparent)",
                borderRadius: "var(--radius-control)",
              }}
            >
              Open diff
            </button>
          </div>
        )}

        {/* FILTER BAR */}
        <Card padding={false}>
          <div
            className="flex items-center justify-between"
            style={{ gap: 16, padding: "0 14px" }}
          >
            <div role="tablist" className="flex items-center" style={{ gap: 2 }}>
              {SUITE_FILTERS.map((key) => {
                const active = key === filter;
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => applyFilter(key)}
                    className="inline-flex cursor-pointer items-center"
                    style={{
                      gap: 7,
                      padding: "9px 11px",
                      font: "500 13px/1 var(--font-ui)",
                      color: active ? "var(--text-hi)" : "var(--text-body)",
                      background: "transparent",
                      border: "none",
                      borderBottom: `2px solid ${active ? "var(--phosphor)" : "transparent"}`,
                      transition: "color var(--dur-fast)",
                    }}
                  >
                    {FILTER_LABEL[key]}
                    <span
                      className="mono"
                      style={{
                        font: "500 11px/1 var(--font-mono)",
                        fontVariantNumeric: "tabular-nums",
                        padding: "1px 6px",
                        borderRadius: "var(--radius-sm)",
                        background: active ? "var(--phosphor-12)" : "var(--divider)",
                        color: active ? "var(--phosphor)" : "var(--text-muted)",
                      }}
                    >
                      {tabCounts[key]}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center" style={{ gap: 10, padding: "9px 0" }}>
              <div
                className="mono flex items-center"
                style={{
                  gap: 8,
                  width: 180,
                  height: 32,
                  padding: "0 11px",
                  background: "var(--surface-panel)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-control)",
                  color: "var(--text-muted)",
                  font: "500 12px/1 var(--font-mono)",
                }}
              >
                <Icon
                  name="search"
                  size={14}
                  strokeWidth={1.5}
                  style={{ color: "var(--text-label)" }}
                />
                <span style={{ flex: 1 }}>filter suites…</span>
              </div>
              <span
                className="mono inline-flex items-center"
                style={{
                  gap: 6,
                  height: 24,
                  padding: "0 6px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid color-mix(in srgb, var(--cyan) 38%, transparent)",
                  color: "var(--cyan)",
                  font: "500 11px/1 var(--font-mono)",
                }}
              >
                branch: all
                <Icon name="x" size={11} strokeWidth={1.8} />
              </span>
              <button
                type="button"
                onClick={cycleSort}
                className="mono inline-flex cursor-pointer items-center"
                style={{
                  gap: 6,
                  height: 30,
                  padding: "0 11px",
                  font: "500 12px/1 var(--font-mono)",
                  color: "var(--text-body)",
                  background: "transparent",
                  border: "1px solid transparent",
                  borderRadius: "var(--radius-control)",
                }}
              >
                {SORT_LABEL[sort]}
                <Icon name="chevron-down" size={13} strokeWidth={1.6} />
              </button>
            </div>
          </div>
        </Card>

        {/* SUITES TABLE */}
        <Card padding={false}>
          <div
            className="flex items-center justify-between"
            style={{ padding: "11px 16px", borderBottom: "1px solid var(--divider)" }}
          >
            <SectionLabel>SUITES</SectionLabel>
            <span
              className="mono"
              style={{ fontSize: 11, color: "var(--text-muted)" }}
            >
              {visible.length} of {kpis.suiteCount} · sorted {SORT_LABEL[sort]}
            </span>
          </div>

          {visible.length > 0 && (
            <div style={HEADER_GRID}>
              {COLUMN_HEADERS.map((label) => (
                <SectionLabel
                  key={label}
                  style={{ font: "600 10px/1.2 var(--font-mono)", letterSpacing: "0.10em" }}
                >
                  {label}
                </SectionLabel>
              ))}
              <span />
            </div>
          )}

          {visible.length > 0 ? (
            <div
              className="flex flex-col"
              style={{ padding: 10, gap: 8 }}
            >
              {visible.map((suite, i) => (
                <SuiteRow
                  key={suite.slug}
                  ref={(node) => {
                    rowRefs.current[i] = node;
                  }}
                  suite={suite}
                  nowMs={nowMs}
                  highlighted={highlighted === i}
                  selected={selected === suite.slug}
                  onSelect={() => {
                    setSelected(suite.slug);
                    router.push(`/suites/${suite.slug}`);
                  }}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              illustration={kpis.suiteCount === 0 ? "empty-board" : "flatline-stale"}
              title={
                kpis.suiteCount === 0
                  ? "No suites yet"
                  : `Nothing ${FILTER_LABEL[filter].toLowerCase()}`
              }
              description={
                kpis.suiteCount === 0
                  ? "Point rubric at a YAML repo and your first eval run will appear here."
                  : "No suites match this filter. Clear it to see everything."
              }
              action={kpis.suiteCount === 0 ? "Connect a project" : "Clear filter"}
              actionIcon={kpis.suiteCount === 0 ? "server" : undefined}
              onAction={
                kpis.suiteCount === 0 ? undefined : () => applyFilter("all")
              }
              className={cn("my-2")}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
