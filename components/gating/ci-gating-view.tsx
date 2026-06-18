"use client";

import { useMemo, useState, type CSSProperties } from "react";

import { GateBoard } from "@/components/gating/gate-board";
import { GateDetailPanel } from "@/components/gating/gate-detail-panel";
import { GateHistory } from "@/components/gating/gate-history";
import { OverridePanel } from "@/components/gating/override-panel";
import { Banner } from "@/components/ui/banner";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { SectionLabel } from "@/components/ui/section-label";
import { cn } from "@/lib/cn";
import { type SuiteGate } from "@/lib/queries/gating";

/* ------------------------------------------------------------------ */
/* Shared view types — the props the page assembles from the query plus */
/* the design-canonical CI chrome (PR metadata, history, overrides).    */
/* ------------------------------------------------------------------ */

/** Repo/PR metadata the gate query does not carry, mapped by suite slug. */
export interface GatePrMeta {
  pr: number;
  title: string;
  /** Human "when" for the board, e.g. "12m ago". */
  when: string;
  /** Scorer name to flag as ROOT CAUSE in the detail table (blocked only). */
  rootCauseScorer?: string;
}

/** A board row: a query gate joined with its PR chrome. */
export interface GateRow {
  gate: SuiteGate;
  meta: GatePrMeta;
}

/** The pending PR (#205) — design chrome; it has no completed run to gate. */
export interface PendingPr {
  pr: number;
  title: string;
  suite: string;
}

/** A row in the GATE HISTORY ledger. */
export interface GateHistoryEvent {
  kind: "block" | "pass" | "override";
  pr: number;
  text: string;
  /** "ci" / "nico" / "" — paired with `when` in the readout. */
  actor: string;
  when: string;
}

/** The 7-day override summary surfaced in the status strip. */
export interface OverrideSummary {
  count: number;
  by: string;
  reason: string;
  pr: number;
  at: string;
}

export interface CiGatingViewProps {
  rows: GateRow[];
  blockingCount: number;
  suiteCount: number;
  pending: PendingPr | null;
  overrides: OverrideSummary;
  history: GateHistoryEvent[];
  /** Deep-linked PR to preselect (`?pr=`); falls back to first blocked. */
  initialPr: number | null;
}

/* ------------------------------------------------------------------ */

const HEADER_BTN: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  height: 30,
  padding: "0 11px",
  font: "500 12px/1 var(--font-mono)",
  borderRadius: "var(--radius-control)",
  whiteSpace: "nowrap",
  cursor: "pointer",
};

/** One status-strip stat card. */
function StatCard({
  label,
  labelColor,
  value,
  valueColor,
  unit,
  glow = false,
  borderColor,
}: {
  label: React.ReactNode;
  labelColor: string;
  value: number;
  valueColor: string;
  unit: string;
  glow?: boolean;
  borderColor?: string;
}) {
  return (
    <div
      className={cn("flex flex-col", glow && "rb-blockpulse")}
      style={{
        gap: 9,
        padding: "15px 17px",
        background: "var(--bg-raised)",
        border: `1px solid ${borderColor ?? "var(--border)"}`,
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-card)",
        ...(glow ? { animation: "rb-blockpulse 2s var(--ease-out) infinite" } : {}),
      }}
    >
      <SectionLabel style={{ color: labelColor }}>{label}</SectionLabel>
      <div className="flex items-baseline" style={{ gap: 8 }}>
        <span className="mono" style={{ font: "700 34px/1 var(--font-mono)", color: valueColor }}>
          {value}
        </span>
        <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>
          {unit}
        </span>
      </div>
    </div>
  );
}

/**
 * CI / Gating view — the go/no-go console. Renders the header, the four-up
 * status strip, a blocked banner when any gate is red, the GATES board with
 * row selection, the detail panel for the selected PR, and the override +
 * history pair. All gate numbers come from the query; PR chrome is mapped in.
 */
export function CiGatingView({
  rows,
  blockingCount,
  pending,
  overrides,
  history,
  initialPr,
}: CiGatingViewProps) {
  const passingCount = rows.filter((r) => r.gate.passing).length;
  const pendingCount = pending ? 1 : 0;
  // Open PRs = gated suites + the pending PR (design header reads "4 OPEN PRs").
  const openCount = rows.length + pendingCount;

  const firstBlocked = rows.find((r) => !r.gate.passing) ?? rows[0] ?? null;
  const deepLinked =
    initialPr !== null ? rows.find((r) => r.meta.pr === initialPr) : undefined;
  const [selectedPr, setSelectedPr] = useState<number | null>(
    deepLinked?.meta.pr ?? firstBlocked?.meta.pr ?? null,
  );

  const selected = useMemo(
    () => rows.find((r) => r.meta.pr === selectedPr) ?? firstBlocked,
    [rows, selectedPr, firstBlocked],
  );

  // Empty — no gated suites and nothing pending: every gate is green.
  if (rows.length === 0 && !pending) {
    return (
      <div style={{ padding: 24 }}>
        <div
          className="mx-auto"
          style={{ maxWidth: 1320, display: "flex", flexDirection: "column", gap: 18 }}
        >
          <Header openCount={0} blockingCount={0} />
          <div
            className="flex items-center justify-center"
            style={{
              background: "var(--bg-raised)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-card)",
              boxShadow: "var(--shadow-card)",
              minHeight: 288,
            }}
          >
            <EmptyState
              illustration="empty-board"
              title="No open PRs"
              description="Every gate is green and nothing is waiting."
            />
          </div>
        </div>
      </div>
    );
  }

  const blockedPr = firstBlocked && !firstBlocked.gate.passing ? firstBlocked.meta.pr : null;

  return (
    <div style={{ padding: 24 }}>
      <div
        className="mx-auto"
        style={{ maxWidth: 1320, display: "flex", flexDirection: "column", gap: 18 }}
      >
        <Header openCount={openCount} blockingCount={blockingCount} />

        {/* STATUS STRIP */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          <StatCard
            label="BLOCKED"
            labelColor="var(--red)"
            value={blockingCount}
            valueColor="var(--red)"
            unit={blockingCount === 1 ? "PR" : "PRs"}
            glow={blockingCount > 0}
            borderColor="color-mix(in srgb, var(--red) 34%, transparent)"
          />
          <StatCard
            label="PASSING"
            labelColor="var(--phosphor)"
            value={passingCount}
            valueColor="var(--phosphor)"
            unit={passingCount === 1 ? "PR" : "PRs"}
          />
          <StatCard
            label="PENDING"
            labelColor="var(--amber)"
            value={pendingCount}
            valueColor="var(--amber)"
            unit="running"
          />
          <StatCard
            label={
              <>
                OVERRIDES <span style={{ color: "var(--text-low)" }}>(7d)</span>
              </>
            }
            labelColor="var(--amber)"
            value={overrides.count}
            valueColor="var(--amber)"
            unit="manual merge"
          />
        </div>

        {/* BLOCKED BANNER */}
        {blockingCount > 0 && firstBlocked ? (
          <Banner
            tone="red"
            style={{
              border: "1px solid color-mix(in srgb, var(--red) 36%, transparent)",
              borderRadius: "var(--radius-card)",
            }}
          >
            <b style={{ color: "var(--red)" }}>PR #{firstBlocked.meta.pr} is blocked</b> — schema
            and field-accuracy floors failed.
          </Banner>
        ) : null}

        {/* GATE BOARD */}
        <GateBoard
          rows={rows}
          pending={pending}
          selectedPr={selected?.meta.pr ?? null}
          onSelect={setSelectedPr}
          openCount={openCount}
        />

        {/* GATE DETAIL */}
        {selected ? (
          <GateDetailPanel gate={selected.gate} meta={selected.meta} />
        ) : null}

        {/* OVERRIDE + HISTORY */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "300px 1fr",
            gap: 18,
            alignItems: "start",
          }}
        >
          <OverridePanel pr={blockedPr} />
          <GateHistory events={history} />
        </div>
      </div>
    </div>
  );
}

/** The page header: title, milestone/open/blocked line, and repo controls. */
function Header({
  openCount,
  blockingCount,
}: {
  openCount: number;
  blockingCount: number;
}) {
  return (
    <div
      className="flex flex-wrap items-start justify-between"
      style={{ gap: 16 }}
    >
      <div className="flex flex-col" style={{ gap: 9 }}>
        <h2
          style={{
            font: "700 24px/1.1 var(--font-display)",
            letterSpacing: "-0.02em",
            color: "var(--text-hi)",
            margin: 0,
          }}
        >
          PR Gating
        </h2>
        <SectionLabel>
          M6 · {openCount} OPEN PRs ·{" "}
          <span style={{ color: blockingCount > 0 ? "var(--red)" : "var(--phosphor)" }}>
            {blockingCount} BLOCKED
          </span>
        </SectionLabel>
      </div>
      <div className="flex items-center" style={{ gap: 10 }}>
        <button
          type="button"
          className="transition hover:border-[var(--border-strong)]"
          style={{
            ...HEADER_BTN,
            background: "transparent",
            color: "var(--text-hi)",
            border: "1px solid var(--border-strong)",
          }}
        >
          repo: refund-agent
          <Icon name="chevron-down" size={13} strokeWidth={1.6} />
        </button>
        <button
          type="button"
          className="transition hover:border-[var(--border-strong)]"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            height: 30,
            padding: "0 11px",
            font: "600 12px/1 var(--font-ui)",
            color: "var(--text-body)",
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-control)",
            whiteSpace: "nowrap",
            cursor: "pointer",
          }}
        >
          <Icon name="refresh-cw" size={14} strokeWidth={1.6} />
          Sync from GitHub{" "}
          <span className="mono" style={{ fontSize: 11, color: "var(--text-low)" }}>
            · synced 2m ago
          </span>
        </button>
        <button
          type="button"
          className="transition hover:border-[var(--border-strong)]"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            height: 30,
            padding: "0 11px",
            font: "600 12px/1 var(--font-ui)",
            color: "var(--text-hi)",
            background: "transparent",
            border: "1px solid var(--border-strong)",
            borderRadius: "var(--radius-control)",
            whiteSpace: "nowrap",
            cursor: "pointer",
          }}
        >
          Policy
        </button>
      </div>
    </div>
  );
}
