"use client";

import { type CSSProperties } from "react";

import { type GateRow, type PendingPr } from "@/components/gating/ci-gating-view";
import {
  formatMetricValue,
  formatThreshold,
  toMetricView,
} from "@/components/gating/gate-metric";
import { Icon } from "@/components/ui/icon";
import { SectionLabel } from "@/components/ui/section-label";
import { cn } from "@/lib/cn";
import { sha as shortSha } from "@/lib/format";
import { type SuiteGate } from "@/lib/queries/gating";


const GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "88px 1fr 150px 132px 200px 96px 88px 92px",
  alignItems: "center",
  gap: 14,
  padding: "0 18px",
};

const COLH: CSSProperties = {
  font: "600 10px/1 var(--font-mono)",
  letterSpacing: "0.10em",
  textTransform: "uppercase",
  color: "var(--text-low)",
};

/** The three per-row link affordances (graph, video/run, GitHub). */
function RowLinks({ withGraph = true }: { withGraph?: boolean }) {
  const cell: CSSProperties = {
    width: 26,
    height: 26,
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--cyan)",
  };
  return (
    <span className="flex justify-end" style={{ gap: 6 }}>
      {withGraph ? (
        <span style={cell}>
          <Icon name="git-branch" size={14} strokeWidth={1.7} />
        </span>
      ) : null}
      <span style={cell}>
        <svg
          viewBox="0 0 24 24"
          width={14}
          height={14}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m22 8-6 4 6 4V8Z" />
          <rect width="14" height="12" x="2" y="6" rx="2" />
        </svg>
      </span>
      <span style={cell}>
        <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.36-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05a9.4 9.4 0 0 1 5 0c1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.59.69.49A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
        </svg>
      </span>
    </span>
  );
}

/** A go/no-go board badge — phosphor PASSING, red BLOCKED, amber PENDING. */
function GateBadge({ tone }: { tone: "blocked" | "passing" | "pending" }) {
  const spec = {
    blocked: {
      color: "var(--red)",
      bg: "var(--red-14)",
      border: "color-mix(in srgb, var(--red) 46%, transparent)",
      label: "BLOCKED",
    },
    passing: {
      color: "var(--phosphor)",
      bg: "var(--phosphor-08)",
      border: "color-mix(in srgb, var(--phosphor) 40%, transparent)",
      label: "PASSING",
    },
    pending: {
      color: "var(--amber)",
      bg: "var(--amber-08)",
      border: "color-mix(in srgb, var(--amber) 40%, transparent)",
      label: "PENDING",
    },
  }[tone];
  return (
    <span
      className={cn(tone === "blocked" && "rb-blockpulse")}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 26,
        padding: "0 11px",
        font: "700 11px/1 var(--font-mono)",
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        color: spec.color,
        background: spec.bg,
        border: `1px solid ${spec.border}`,
        borderRadius: "var(--radius-sm)",
        whiteSpace: "nowrap",
        ...(tone === "blocked"
          ? { animation: "rb-blockpulse 2s var(--ease-out) infinite" }
          : {}),
      }}
    >
      <span
        aria-hidden="true"
        className={cn(tone === "pending" && "rb-ping")}
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "currentColor",
          flex: "none",
          position: tone === "pending" ? "relative" : undefined,
        }}
      />
      {spec.label}
    </span>
  );
}

/** Regressed-metric copy for a gate: the worst failing scorer vs its floor. */
function regressedMetricLabel(gate: SuiteGate): string | null {
  const worst = gate.metrics.find((m) => m.status === "fail");
  if (!worst) return null;
  const view = toMetricView(worst);
  const value = formatMetricValue(view.value, view.format);
  const floor = formatThreshold(view.threshold, view.format);
  return `${worst.metric} ${value} < ${floor} floor`;
}

function GateRowView({
  row,
  selected,
  onSelect,
  last,
}: {
  row: GateRow;
  selected: boolean;
  onSelect: () => void;
  last: boolean;
}) {
  const { gate, meta } = row;
  const blocked = !gate.passing;
  const regressed = regressedMetricLabel(gate);

  const rowStyle: CSSProperties = {
    ...GRID,
    height: 62,
    cursor: "pointer",
    borderBottom: last ? "none" : "1px solid var(--divider)",
    transition: "background 120ms var(--ease-out)",
    ...(blocked && selected
      ? { background: "var(--red-08)", boxShadow: "inset 2px 0 0 var(--red)" }
      : {}),
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className="rb-gaterow"
      style={rowStyle}
    >
      <span className="mono" style={{ fontSize: 13, color: "var(--text-hi)" }}>
        #{meta.pr}
      </span>
      <span
        className="truncate"
        style={{
          font: "var(--text-sm)",
          color: blocked ? "var(--text-hi)" : "var(--text-body)",
        }}
      >
        {meta.title}
      </span>
      <span className="mono" style={{ fontSize: 12, color: "var(--text-mid)" }}>
        {gate.suiteSlug}
      </span>
      <span>
        <GateBadge tone={blocked ? "blocked" : "passing"} />
      </span>
      <span
        className="mono"
        style={{ fontSize: 11.5, color: regressed ? "var(--red)" : "var(--text-low)" }}
      >
        {regressed ?? "—"}
      </span>
      <span className="mono" style={{ fontSize: 12, color: "var(--cyan)" }}>
        {shortSha(gate.sha)}
      </span>
      <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>
        {meta.when}
      </span>
      <RowLinks />
    </div>
  );
}

/** The PENDING row (#205) — chrome from the design (no completed run to gate). */
function PendingRowView({ pending }: { pending: PendingPr }) {
  return (
    <div className="rb-gaterow" style={{ ...GRID, height: 62, borderBottom: "none" }}>
      <span className="mono" style={{ fontSize: 13, color: "var(--text-hi)" }}>
        #{pending.pr}
      </span>
      <span className="truncate" style={{ font: "var(--text-sm)", color: "var(--text-body)" }}>
        {pending.title}
      </span>
      <span className="mono" style={{ fontSize: 12, color: "var(--text-mid)" }}>
        {pending.suite}
      </span>
      <span>
        <GateBadge tone="pending" />
      </span>
      <span className="mono" style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
        evaluating…
      </span>
      <span className="mono" style={{ fontSize: 12, color: "var(--text-low)" }}>
        running
      </span>
      <span className="mono" style={{ fontSize: 11, color: "var(--amber)" }}>
        running now
      </span>
      <RowLinks withGraph={false} />
    </div>
  );
}

export interface GateBoardProps {
  rows: GateRow[];
  pending: PendingPr | null;
  selectedPr: number | null;
  onSelect: (pr: number) => void;
  openCount: number;
}

/**
 * The GATES board — one row per open PR, blocked first (the query already sorts
 * blocked suites to the top). Clicking a row selects it for the detail panel;
 * the pending row is appended as design chrome. Pure presentation over the
 * gate rows the page assembled.
 */
export function GateBoard({ rows, pending, selectedPr, onSelect, openCount }: GateBoardProps) {
  const totalRows = rows.length + (pending ? 1 : 0);
  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        background: "var(--bg-raised)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div
        className="flex items-center justify-between gap-3"
        style={{ padding: "11px 16px", borderBottom: "1px solid var(--divider)" }}
      >
        <SectionLabel style={{ color: "var(--text-mid)" }}>GATES</SectionLabel>
        <span className="mono" style={{ fontSize: 11, color: "var(--text-low)" }}>
          go / no-go · {openCount} open PRs
        </span>
      </div>

      {/* column header row */}
      <div
        className="mono"
        style={{
          ...GRID,
          height: 34,
          background: "rgba(255,255,255,0.012)",
          borderBottom: "1px solid var(--divider)",
        }}
      >
        <span style={COLH}>PR</span>
        <span style={COLH}>TITLE</span>
        <span style={COLH}>SUITE</span>
        <span style={COLH}>GATE</span>
        <span style={COLH}>REGRESSED METRIC</span>
        <span style={COLH}>SHA</span>
        <span style={COLH}>WHEN</span>
        <span style={{ ...COLH, textAlign: "right" }}>LINKS</span>
      </div>

      {rows.map((row, i) => (
        <GateRowView
          key={row.meta.pr}
          row={row}
          selected={selectedPr === row.meta.pr}
          onSelect={() => onSelect(row.meta.pr)}
          last={!pending && i === totalRows - 1}
        />
      ))}
      {pending ? <PendingRowView pending={pending} /> : null}

      <style href="rb-gaterow-hover" precedence="default">
        {`.rb-gaterow:hover{background:rgba(255,255,255,0.015);}
          .rb-gaterow:focus-visible{outline:1px solid var(--border-strong);outline-offset:-1px;}`}
      </style>
    </div>
  );
}
