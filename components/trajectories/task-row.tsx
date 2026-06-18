"use client";

import { type CSSProperties, Fragment } from "react";

import  {
  type TrajectoryMatchKind,
  type TrajectoryRow,
} from "@/components/trajectories/trajectories-view";
import { Icon } from "@/components/ui/icon";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/cn";

/** Shared 6-column track for the header and every row. */
export const TASK_GRID_COLS =
  "minmax(0,1.5fr) 92px 76px 64px 52px 96px";

/** A rendered tool chip in the expected-sequence rail. */
type ChipKind = "normal" | "extra" | "removed";

interface Chip {
  label: string;
  kind: ChipKind;
}

/**
 * A short human label for a task, derived from its snake_case id, e.g.
 * "book_flight_multi_leg" → "multi leg booking". Falls back to the suite.
 */
function describeTask(row: TrajectoryRow): string {
  const stripped = row.taskId.replace(/_/g, " ");
  switch (row.match) {
    case "EXACT":
      return stripped;
    case "PARTIAL":
      return `${stripped} · still-correct answer`;
    case "DIVERGED":
      return `${stripped} · diverged`;
  }
}

/**
 * Build the chip rail from the golden sequence plus the outcome:
 *  - EXACT     → the sequence as-is
 *  - PARTIAL   → an inserted "+<first tool>" extra call (the redundant retry)
 *  - DIVERGED  → the second tool struck through (skipped / wrong tool)
 * Mirrors the seeded divergence without needing the per-step detail query.
 */
function buildChips(row: TrajectoryRow): Chip[] {
  const tools = row.expectedTools;
  if (tools.length === 0) return [];

  const first = tools[0];
  if (row.match === "PARTIAL" && first !== undefined) {
    const rest = tools.slice(1);
    return [
      { label: first, kind: "normal" },
      { label: `+${first}`, kind: "extra" },
      ...rest.map((t): Chip => ({ label: t, kind: "normal" })),
    ];
  }

  if (row.match === "DIVERGED") {
    return tools.map((t, i): Chip => ({
      label: t,
      kind: i === 1 ? "removed" : "normal",
    }));
  }

  return tools.map((t): Chip => ({ label: t, kind: "normal" }));
}

const CHIP_BASE: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  padding: "2px 7px",
  borderRadius: "var(--radius-sm)",
  whiteSpace: "nowrap",
};

const CHIP_STYLE: Record<ChipKind, CSSProperties> = {
  normal: {
    ...CHIP_BASE,
    border: "1px solid var(--divider)",
    color: "var(--text-mid)",
    background: "rgba(255,255,255,0.02)",
  },
  extra: {
    ...CHIP_BASE,
    border: "1px solid color-mix(in srgb, var(--amber) 50%, transparent)",
    color: "var(--amber)",
    background: "var(--amber-14)",
  },
  removed: {
    ...CHIP_BASE,
    border: "1px solid color-mix(in srgb, var(--red) 50%, transparent)",
    color: "var(--red)",
    background: "var(--red-14)",
    textDecoration: "line-through",
  },
};

/** MATCH-column badge: EXACT/PARTIAL/DIVERGED as an outline (no fill) badge. */
function MatchBadge({ kind }: { kind: TrajectoryMatchKind }) {
  const color =
    kind === "EXACT"
      ? "var(--phosphor)"
      : kind === "PARTIAL"
        ? "var(--amber)"
        : "var(--red)";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 22,
        padding: "0 8px",
        font: "600 10px/1 var(--font-mono)",
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        color,
        background: "transparent",
        border: `1px solid color-mix(in srgb, ${color} 42%, transparent)`,
        borderRadius: "var(--radius-sm)",
        whiteSpace: "nowrap",
      }}
    >
      {kind}
    </span>
  );
}

/** FINAL-column badge: a violet judge PASS, or a red FAIL when the answer failed. */
function FinalBadge({ pass }: { pass: boolean }) {
  if (!pass) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          height: 22,
          padding: "0 8px",
          font: "600 10px/1 var(--font-mono)",
          letterSpacing: "0.10em",
          color: "var(--red)",
          border: "1px solid color-mix(in srgb, var(--red) 42%, transparent)",
          borderRadius: "var(--radius-sm)",
        }}
      >
        FAIL
      </span>
    );
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        height: 22,
        padding: "0 8px",
        font: "600 10px/1 var(--font-mono)",
        letterSpacing: "0.10em",
        color: "var(--violet)",
        border: "1px solid color-mix(in srgb, var(--violet) 42%, transparent)",
        borderRadius: "var(--radius-sm)",
      }}
    >
      <Icon name="scale" size={9} strokeWidth={2.4} />
      PASS
    </span>
  );
}

/** Tool-acc % color tracks the match grade (violet partial, red diverged, …). */
function accColor(kind: TrajectoryMatchKind): string {
  switch (kind) {
    case "EXACT":
      return "var(--phosphor)";
    case "PARTIAL":
      return "var(--violet)";
    case "DIVERGED":
      return "var(--red)";
  }
}

export interface TaskRowProps {
  row: TrajectoryRow;
  /** Step budget the STEPS column is graded against (from the seeded stats). */
  stepBudget: number;
  /** The first row is the keyboard-selected anchor (amber `.sel` styling). */
  selected?: boolean;
}

/**
 * TaskRow — one golden task: name + short label, the expected-sequence chip
 * rail (with the inserted/struck divergence chips), an optional drift note,
 * then the MATCH / TOOL-ACC / FINAL / STEPS / STATUS columns. The selected
 * anchor gets the amber wash; a DIVERGED row gets the red wash.
 */
export function TaskRow({ row, stepBudget, selected = false }: TaskRowProps) {
  const chips = buildChips(row);
  const diverged = row.match === "DIVERGED";
  const accPct = `${(row.toolSelectionAccuracy * 100).toFixed(
    Number.isInteger(row.toolSelectionAccuracy * 100) ? 0 : 1,
  )}%`;
  const steps = row.expectedTools.length;

  const rowStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: TASK_GRID_COLS,
    alignItems: "start",
    gap: 12,
    padding: "11px 14px",
    background: "var(--surface-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-card)",
    transition: "background var(--dur-fast), border-color var(--dur-fast)",
  };

  if (selected) {
    rowStyle.borderColor = "color-mix(in srgb, var(--amber) 42%, transparent)";
    rowStyle.background = "var(--amber-14)";
    rowStyle.boxShadow =
      "var(--glow-amber, 0 0 14px color-mix(in srgb, var(--amber) 22%, transparent))";
  } else if (diverged) {
    rowStyle.borderColor = "color-mix(in srgb, var(--red) 34%, transparent)";
    rowStyle.background = "var(--red-14)";
  }

  return (
    <div className={cn("group")} style={rowStyle}>
      {/* TASK · EXPECTED SEQUENCE */}
      <div className="flex flex-col" style={{ gap: 6, minWidth: 0 }}>
        <div className="flex flex-col" style={{ gap: 1 }}>
          <span style={{ font: "var(--mono-sm)", fontSize: 12, color: "var(--text-hi)" }}>
            {row.taskId}
          </span>
          <span style={{ font: "var(--mono-sm)", fontSize: 10, color: "var(--text-muted)" }}>
            {describeTask(row)}
          </span>
        </div>
        <div className="flex flex-wrap items-center" style={{ gap: 5 }}>
          {chips.map((chip, i) => (
            <Fragment key={`${chip.label}-${i}`}>
              {i > 0 && chip.kind !== "extra" ? (
                <span aria-hidden="true" style={{ color: "var(--text-low)" }}>
                  →
                </span>
              ) : null}
              <span
                style={CHIP_STYLE[chip.kind]}
                title={chip.kind === "extra" ? "extra call vs golden" : undefined}
              >
                {chip.label}
              </span>
            </Fragment>
          ))}
        </div>
        {row.note ? (
          <span
            style={{
              font: "var(--mono-sm)",
              fontSize: 10,
              color: diverged ? "var(--red)" : "var(--amber)",
            }}
          >
            {row.note}
          </span>
        ) : null}
      </div>

      {/* MATCH */}
      <div>
        <MatchBadge kind={row.match} />
      </div>

      {/* TOOL-ACC */}
      <span
        style={{
          font: "var(--mono-sm)",
          fontSize: 12,
          color: accColor(row.match),
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {accPct}
      </span>

      {/* FINAL */}
      <div>
        <FinalBadge pass={row.finalAnswerPass} />
      </div>

      {/* STEPS */}
      <span
        style={{
          font: "var(--mono-sm)",
          fontSize: 12,
          color: diverged ? "var(--red)" : "var(--text-mid)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {steps}/{stepBudget}
      </span>

      {/* STATUS */}
      <div style={{ textAlign: "right" }}>
        <StatusBadge status={row.status} />
      </div>
    </div>
  );
}
