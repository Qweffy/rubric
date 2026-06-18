"use client";

import { useMemo, useState } from "react";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { Kbd } from "@/components/ui/kbd";
import { SectionLabel } from "@/components/ui/section-label";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tag } from "@/components/ui/tag";
import { useCountUp } from "@/components/ui/use-count-up";
import { cn } from "@/lib/cn";
import {
  type ErrorClusterRow,
  type ErrorClustersSummary,
} from "@/lib/queries/errors";

import { ClusterTreemap } from "./cluster-treemap";
import { PromoteFlow } from "./promote-flow";
import { ScorerCrossTab } from "./scorer-cross-tab";
import {
  caseSubtitle,
  parseTrait,
  toClusterVM,
  toControlStrip,
  toCrossTab,
  toFilterPills,
  type ClusterVM,
} from "./view-model";

export interface ErrorWorkbenchViewProps {
  summary: ErrorClustersSummary;
  clusters: ErrorClusterRow[];
  suiteSlug: string;
  runId: number | null;
  exportedAt: string;
  /** Optionally pre-select a cluster (deep-link). */
  initialClusterId: number | null;
}

/**
 * ErrorWorkbenchView — the M5 Error Analysis Workbench. Failure clusters are
 * laid out as a count-sized, scorer-tinted treemap; selecting a tile drives a
 * detail panel (failure mode, shared traits, coverage, representative cases)
 * and a three-step promote-to-golden flow. A scorer × cluster cross-tab shows
 * where failures concentrate, and a sticky bar commits the selected cases into
 * the regression golden set. Everything derives from the seeded query — no
 * cluster count, size, or case is hardcoded.
 */
export function ErrorWorkbenchView({
  summary,
  clusters,
  suiteSlug,
  runId,
  exportedAt,
  initialClusterId,
}: ErrorWorkbenchViewProps) {
  const maxSize = useMemo(
    () => clusters.reduce((m, c) => Math.max(m, c.size), 0),
    [clusters],
  );
  const vms = useMemo<ClusterVM[]>(
    () => clusters.map((c) => toClusterVM(c, maxSize)),
    [clusters, maxSize],
  );

  const strip = useMemo(() => toControlStrip(summary, vms), [summary, vms]);
  const crossTab = useMemo(() => toCrossTab(vms), [vms]);
  const filterPills = useMemo(() => toFilterPills(vms), [vms]);

  const defaultId =
    (initialClusterId !== null
      ? vms.find((c) => c.id === initialClusterId)?.id
      : undefined) ?? vms[0]?.id ?? null;

  const [selectedId, setSelectedId] = useState<number | null>(defaultId);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const selected = vms.find((c) => c.id === selectedId) ?? null;

  // Case-row selection lives keyed by case id; defaults to every uncovered case
  // in the selected cluster (the promote candidates).
  const [selectedCases, setSelectedCases] = useState<Set<string>>(() =>
    selected ? new Set(selected.caseIds.slice(0, selected.uncoveredCount)) : new Set(),
  );

  const selectCluster = (id: number): void => {
    setSelectedId(id);
    const next = vms.find((c) => c.id === id);
    setSelectedCases(
      next ? new Set(next.caseIds.slice(0, next.uncoveredCount)) : new Set(),
    );
  };

  const toggleCase = (caseId: string): void => {
    setSelectedCases((prev) => {
      const next = new Set(prev);
      if (next.has(caseId)) next.delete(caseId);
      else next.add(caseId);
      return next;
    });
  };

  if (vms.length === 0) {
    return (
      <div className="relative flex h-full min-h-0 flex-col">
        <ContentScroll>
          <Card variant="flush" padding={false}>
            <div className="flex flex-col items-center justify-center" style={{ minHeight: 430 }}>
              <EmptyState
                illustration="clean-signal"
                title="No failures to analyze"
                description={`Run ${runId !== null ? `#${String(runId)}` : ""} passed everything — nothing to cluster.`}
              />
              <div style={{ marginTop: 4 }}>
                <StatusBadge status="PASS" label="GATE OPEN" />
              </div>
            </div>
          </Card>
        </ContentScroll>
      </div>
    );
  }

  const selectedCaseList = selected
    ? selected.caseIds.filter((id) => selectedCases.has(id))
    : [];

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <ContentScroll>
        {/* HEADER */}
        <div className="flex flex-wrap items-start justify-between" style={{ gap: 16 }}>
          <div className="flex flex-col" style={{ gap: 8 }}>
            <h2
              style={{
                font: "700 26px/1.05 var(--font-display)",
                letterSpacing: "-0.02em",
                color: "var(--text-hi)",
                margin: 0,
              }}
            >
              Error Analysis
            </h2>
            <SectionLabel>
              {`M5 · ${String(strip.totalFailures)} FAILURES${runId !== null ? ` · RUN #${String(runId)}` : ""} · EXPORT ${exportedAt}`}
            </SectionLabel>
          </div>

          <div className="flex items-center" style={{ gap: 12 }}>
            <FilterStrip
              pills={filterPills}
              active={activeFilter}
              onChange={setActiveFilter}
            />
            <button
              type="button"
              className={cn(
                "inline-flex cursor-pointer items-center whitespace-nowrap",
                "[transition:border-color_var(--dur-fast),color_var(--dur-fast)]",
                "hover:border-[var(--border-strong)] hover:text-[var(--text-hi)]",
              )}
              style={{
                gap: 7,
                height: 30,
                padding: "0 11px",
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-control)",
                color: "var(--text-body)",
                font: "600 12px/1 var(--font-ui)",
              }}
            >
              <Icon name="refresh-cw" size={15} strokeWidth={1.6} />
              Re-cluster
            </button>
          </div>
        </div>

        {/* CONTROL STRIP */}
        <div className="grid" style={{ gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          <StatCard label="TOTAL FAILURES" value={strip.totalFailures} />
          <StatCard label="CLUSTERS FOUND" value={strip.clustersFound} />
          <StatCard
            label="NOT-YET-GOLDEN"
            value={strip.notYetGolden}
            accent="var(--amber)"
            borderAccent="color-mix(in srgb, var(--amber) 30%, transparent)"
            sub="uncovered"
          />
          <StatCard
            label="PROMOTED THIS WEEK"
            value={strip.promotedThisWeek}
            accent="var(--phosphor)"
            borderAccent="var(--border-strong)"
            sub={`golden set +${String(strip.promotedThisWeek)}`}
          />
        </div>

        {/* TREEMAP + DETAIL */}
        <div className="flex items-stretch" style={{ gap: 18 }}>
          <Card
            header="FAILURE CLUSTERS"
            actions={
              <span style={{ font: "var(--mono-sm)", fontSize: 11, color: "var(--text-low)" }}>
                sized by count · tinted by mode
              </span>
            }
            padding={false}
            style={{ flex: "1 1 55%" }}
          >
            <div style={{ padding: 14 }}>
              <ClusterTreemap
                clusters={vms}
                selectedId={selectedId}
                onSelect={selectCluster}
              />
            </div>
          </Card>

          {selected ? (
            <ClusterDetail
              cluster={selected}
              selectedCases={selectedCases}
              onToggleCase={toggleCase}
            />
          ) : null}
        </div>

        {/* CROSS-TAB */}
        <Card
          header="SCORER × CATEGORY"
          actions={
            <span style={{ font: "var(--mono-sm)", fontSize: 11, color: "var(--text-low)" }}>
              where failures concentrate
            </span>
          }
        >
          <ScorerCrossTab model={crossTab} />
        </Card>

        {/* PROMOTE FLOW */}
        {selected ? (
          <PromoteFlow selectedCaseIds={selectedCaseList} suiteSlug={suiteSlug} />
        ) : null}
      </ContentScroll>

      {/* STICKY PROMOTE BAR */}
      {selected && selectedCaseList.length > 0 ? (
        <PromoteBar
          count={selectedCaseList.length}
          clusterTitle={selected.title}
          onCancel={() => setSelectedCases(new Set())}
        />
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Content scroll wrapper — matches the design's 24px / 96px insets.    */
/* ------------------------------------------------------------------ */

function ContentScroll({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-auto" style={{ padding: "24px 24px 96px" }}>
        <div
          className="mx-auto flex flex-col"
          style={{ maxWidth: 1320, gap: 18 }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Filter strip — "all" + per-scorer pills with colored counts.         */
/* ------------------------------------------------------------------ */

interface FilterStripProps {
  pills: ReturnType<typeof toFilterPills>;
  active: string;
  onChange: (key: string) => void;
}

function FilterStrip({ pills, active, onChange }: FilterStripProps) {
  return (
    <div
      className="flex items-center"
      style={{
        gap: 4,
        padding: 4,
        background: "var(--surface-panel)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-control)",
      }}
    >
      {pills.map((pill) => {
        const selected = pill.key === active;
        return (
          <button
            key={pill.key}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(pill.key)}
            className="inline-flex cursor-pointer items-center whitespace-nowrap"
            style={{
              gap: 6,
              height: 28,
              padding: pill.key === "all" ? "0 11px" : "0 10px",
              borderRadius: "var(--radius-sm)",
              border: selected ? "1px solid var(--border-strong)" : "1px solid transparent",
              background: selected ? "var(--surface-card)" : "transparent",
              color: selected ? "var(--text-hi)" : "var(--text-mid)",
              font: `${selected ? "600" : "400"} 12px/1 var(--font-mono)`,
            }}
          >
            {pill.label}
            {pill.key !== "all" ? (
              <span style={{ color: pill.accent, fontWeight: 700 }}>{pill.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Control-strip stat card.                                             */
/* ------------------------------------------------------------------ */

interface StatCardProps {
  label: string;
  value: number;
  accent?: string;
  borderAccent?: string;
  sub?: string;
}

function StatCard({ label, value, accent, borderAccent, sub }: StatCardProps) {
  const shown = useCountUp(value);
  return (
    <div
      className="flex flex-col"
      style={{
        gap: sub ? 6 : 9,
        padding: "15px 17px",
        background: "var(--bg-raised)",
        border: `1px solid ${borderAccent ?? "var(--border)"}`,
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <SectionLabel style={accent ? { color: accent } : undefined}>{label}</SectionLabel>
      <span
        style={{
          font: "700 30px/1 var(--font-mono)",
          color: accent ?? "var(--text-hi)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {shown}
      </span>
      {sub ? (
        <span
          style={{
            font: "var(--mono-sm)",
            fontSize: 10,
            letterSpacing: "0.06em",
            color: "var(--text-low)",
          }}
        >
          {sub}
        </span>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cluster detail panel.                                                */
/* ------------------------------------------------------------------ */

interface ClusterDetailProps {
  cluster: ClusterVM;
  selectedCases: Set<string>;
  onToggleCase: (caseId: string) => void;
}

function ClusterDetail({ cluster, selectedCases, onToggleCase }: ClusterDetailProps) {
  const traits = cluster.sharedTraits.map((t, i) => parseTrait(t, i, cluster.size));
  // Up to three representative cases — the canonical one first.
  const reps = cluster.caseIds.slice(0, 3);

  return (
    <Card padding={false} style={{ flex: "1 1 45%" }}>
      <div
        className="flex items-center justify-between"
        style={{ gap: 12, padding: "11px 16px", borderBottom: "1px solid var(--divider)" }}
      >
        <span style={{ font: "600 14px/1 var(--font-mono)", color: "var(--text-hi)" }}>
          {cluster.title}
        </span>
        <StatusBadge
          status="FAIL"
          label={`${String(cluster.size)} CASES`}
          style={{
            color: "var(--red)",
            background: "var(--red-14)",
            border: "1px solid color-mix(in srgb, var(--red) 40%, transparent)",
          }}
        />
      </div>

      <div className="flex flex-col" style={{ padding: "16px 18px", gap: 16 }}>
        {/* FAILURE MODE */}
        <div className="flex flex-col" style={{ gap: 8 }}>
          <SectionLabel>FAILURE MODE</SectionLabel>
          <p
            className="m-0"
            style={{ font: "var(--mono-sm)", fontSize: 13, lineHeight: 1.55, color: "var(--text-mid)" }}
          >
            {cluster.mode}
          </p>
          <div className="flex items-center" style={{ gap: 8, marginTop: 2 }}>
            <Tag tone={cluster.scorer === "judge" ? "violet" : "red"}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "currentColor",
                  display: "inline-block",
                }}
              />
              {cluster.scorer.toUpperCase().replace("-ACCURACY", "")} · DOMINANT
            </Tag>
          </div>
        </div>

        <div style={{ height: 1, background: "var(--divider)" }} />

        {/* SHARED TRAITS */}
        {traits.length > 0 ? (
          <div className="flex flex-col" style={{ gap: 9 }}>
            <SectionLabel>SHARED TRAITS</SectionLabel>
            <div className="flex flex-wrap" style={{ gap: 8 }}>
              {traits.map((t) => (
                <Tag key={t.key}>
                  <span style={{ color: "var(--text-hi)" }}>
                    <span style={{ color: "var(--cyan)" }}>{t.key}</span>
                    {t.value ? `=${t.value}` : ""}{" "}
                    <span style={{ color: "var(--text-low)" }}>·</span>{" "}
                    <span style={{ color: "var(--amber)" }}>{t.fraction}</span>
                  </span>
                </Tag>
              ))}
            </div>
          </div>
        ) : null}

        {/* COVERAGE */}
        <div
          className="flex items-center"
          style={{
            gap: 10,
            padding: "11px 13px",
            background: "var(--amber-08)",
            border: "1px solid color-mix(in srgb, var(--amber) 26%, transparent)",
            borderRadius: "var(--radius-control)",
          }}
        >
          <Icon name="alert-triangle" size={16} strokeWidth={1.7} style={{ color: "var(--amber)" }} />
          <SectionLabel tone="amber" style={{ letterSpacing: "0.08em" }}>
            COVERAGE
          </SectionLabel>
          <span
            style={{
              font: "var(--mono-sm)",
              fontSize: 13,
              color: "var(--text-hi)",
              marginLeft: "auto",
            }}
          >
            {cluster.uncoveredCount} of {cluster.size}{" "}
            <span style={{ color: "var(--text-muted)" }}>not yet in golden set</span>
          </span>
        </div>

        {/* REPRESENTATIVE CASES */}
        <div className="flex flex-col" style={{ gap: 9 }}>
          <div className="flex items-center justify-between">
            <SectionLabel>REPRESENTATIVE CASES</SectionLabel>
            <span style={{ font: "var(--mono-sm)", fontSize: 10, color: "var(--text-low)" }}>
              ⏎ open · ☑ select
            </span>
          </div>
          <div className="flex flex-col" style={{ gap: 8 }}>
            {reps.map((caseId, i) => (
              <CaseRow
                key={caseId}
                caseId={caseId}
                subtitle={caseSubtitle(i)}
                canonical={i === 0}
                scorer={cluster.scorer}
                selected={selectedCases.has(caseId)}
                onToggle={() => onToggleCase(caseId)}
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

interface CaseRowProps {
  caseId: string;
  subtitle: string;
  canonical: boolean;
  scorer: ClusterVM["scorer"];
  selected: boolean;
  onToggle: () => void;
}

function CaseRow({ caseId, subtitle, canonical, scorer, selected, onToggle }: CaseRowProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      className="flex cursor-pointer items-center [transition:border-color_var(--dur-fast),background_var(--dur-fast)]"
      style={{
        gap: 12,
        padding: "0 13px",
        height: 48,
        borderRadius: "var(--radius-control)",
        border: `1px solid ${selected ? "var(--border-strong)" : "var(--border)"}`,
        background: selected ? "var(--phosphor-08)" : "var(--bg-raised)",
      }}
    >
      <Checkbox checked={selected} />
      <span style={{ font: "600 13px/1 var(--font-mono)", color: "var(--text-hi)" }}>{caseId}</span>
      <span style={{ font: "var(--text-sm)", color: "var(--text-mid)" }}>{subtitle}</span>
      <span style={{ marginLeft: "auto" }}>
        {canonical ? (
          <StatusBadge status="NEUTRAL" label="CANONICAL" />
        ) : (
          <Tag tone={scorer === "judge" ? "violet" : "red"}>
            {scorer === "judge" ? "judge" : scorer === "exact-match" ? "exact" : "schema"}
          </Tag>
        )}
      </span>
      <Kbd>⏎</Kbd>
    </div>
  );
}

/** Phosphor checkbox — checked draws the ✓ glyph on a phosphor fill. */
function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center"
      style={{
        width: 18,
        height: 18,
        borderRadius: 5,
        border: `1.5px solid ${checked ? "var(--phosphor)" : "var(--border-strong)"}`,
        background: checked ? "var(--phosphor)" : "transparent",
        boxShadow: checked ? "var(--glow-phosphor-sm)" : undefined,
      }}
    >
      {checked ? (
        <Icon name="check" size={12} strokeWidth={3} style={{ color: "var(--bg-void)" }} />
      ) : null}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Sticky promote bar.                                                  */
/* ------------------------------------------------------------------ */

interface PromoteBarProps {
  count: number;
  clusterTitle: string;
  onCancel: () => void;
}

function PromoteBar({ count, clusterTitle, onCancel }: PromoteBarProps) {
  return (
    <div
      className="absolute inset-x-0 bottom-0 flex items-center"
      style={{
        gap: 16,
        height: 72,
        padding: "0 24px",
        background: "var(--glass)",
        backdropFilter: "blur(var(--blur-glass))",
        WebkitBackdropFilter: "blur(var(--blur-glass))",
        borderTop: "1px solid var(--border-strong)",
        zIndex: "var(--z-sticky)",
      }}
    >
      <div className="flex items-center" style={{ gap: 10 }}>
        <StatusBadge status="NEUTRAL" label={`${String(count)} CASES SELECTED`} style={{ height: 24 }} />
        <span style={{ font: "var(--mono-sm)", fontSize: 12, color: "var(--text-muted)" }}>
          from {clusterTitle}
        </span>
      </div>
      <div className="flex-1" />
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex cursor-pointer items-center justify-center"
        style={{
          height: "var(--control-h)",
          padding: "0 14px",
          background: "transparent",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-control)",
          color: "var(--text-body)",
          font: "600 13px/1 var(--font-ui)",
        }}
      >
        Cancel
      </button>
      <button
        type="button"
        className="inline-flex cursor-pointer items-center justify-center [transition:filter_var(--dur-fast)] hover:brightness-110"
        style={{
          gap: 8,
          height: "var(--control-h)",
          padding: "0 14px",
          background: "var(--phosphor)",
          color: "var(--bg-void)",
          border: "1px solid transparent",
          borderRadius: "var(--radius-control)",
          boxShadow: "var(--glow-phosphor)",
          font: "600 13px/1 var(--font-ui)",
        }}
      >
        <Icon name="star" size={16} strokeWidth={1.8} />
        Confirm promotion · {count} cases
      </button>
    </div>
  );
}
