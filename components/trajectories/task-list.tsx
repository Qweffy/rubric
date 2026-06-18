"use client";

import { type CSSProperties } from "react";

import { TaskRow, TASK_GRID_COLS } from "@/components/trajectories/task-row";
import  { type TrajectoryRow } from "@/components/trajectories/trajectories-view";
import { Card } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { StatusBadge } from "@/components/ui/status-badge";

export interface TaskListProps {
  /** Rows already scoped to the active filter. */
  rows: TrajectoryRow[];
  /** Size of the full golden set (drives the "+ N more" footer). */
  total: number;
  /** Number of diverged (non-EXACT) tasks — the segmented toggle's count. */
  divergedCount: number;
  scope: "all" | "diverged";
  onScopeChange: (scope: "all" | "diverged") => void;
}

const COL_HEAD: CSSProperties = {
  font: "600 10px/1 var(--font-mono)",
  letterSpacing: "0.10em",
  textTransform: "uppercase",
  color: "var(--text-low)",
};

const LEGEND_TEXT: CSSProperties = {
  font: "var(--mono-sm)",
  fontSize: 10,
  color: "var(--text-muted)",
};

/**
 * One entry of the EXACT/PARTIAL/DIVERGED legend bar — the badge plus its gloss.
 */
function LegendItem({
  status,
  gloss,
}: {
  status: "EXACT" | "PARTIAL" | "DIVERGED";
  gloss: string;
}) {
  // EXACT/PARTIAL/DIVERGED map onto the phosphor/amber/red status styling.
  const badgeStatus = status === "EXACT" ? "PASS" : status;
  return (
    <span className="flex items-center" style={{ ...LEGEND_TEXT, gap: 6 }}>
      <StatusBadge status={badgeStatus} label={status} style={{ height: 18 }} />
      {gloss}
    </span>
  );
}

/**
 * TaskList — the golden-task table. Header carries the j/k hint and the
 * All / Diverged segmented filter; a legend bar defines the three match
 * grades; then the column header and the scored rows, capped by a
 * "+ N more golden tasks" footer when the visible set is shorter than the
 * full golden target.
 */
export function TaskList({
  rows,
  total,
  divergedCount,
  scope,
  onScopeChange,
}: TaskListProps) {
  const goldenTarget = Math.max(total, rows.length);
  const remaining = goldenTarget - rows.length;

  return (
    <Card
      header="TASKS"
      actions={
        <div className="flex items-center" style={{ gap: 10 }}>
          <span style={{ font: "var(--mono-sm)", fontSize: 11, color: "var(--text-muted)" }}>
            j/k to move · ↵ open
          </span>
          <SegmentedControl
            size="sm"
            value={scope}
            onChange={(value) => onScopeChange(value as "all" | "diverged")}
            options={[
              { value: "all", label: `All ${total}` },
              { value: "diverged", label: `Diverged ${divergedCount}` },
            ]}
          />
        </div>
      }
      padding={false}
    >
      {/* legend bar */}
      <div
        className="flex"
        style={{
          gap: 16,
          padding: "9px 16px",
          borderBottom: "1px solid var(--divider)",
          background: "rgba(255,255,255,0.012)",
        }}
      >
        <LegendItem status="EXACT" gloss="step-for-step" />
        <LegendItem status="PARTIAL" gloss="extra/re-ordered, still correct" />
        <LegendItem status="DIVERGED" gloss="wrong/missing tool" />
      </div>

      {/* column header */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: TASK_GRID_COLS,
          gap: 10,
          padding: "8px 16px",
          borderBottom: "1px solid var(--divider)",
        }}
      >
        <span style={COL_HEAD}>TASK · EXPECTED SEQUENCE</span>
        <span style={COL_HEAD}>MATCH</span>
        <span style={COL_HEAD}>TOOL-ACC</span>
        <span style={COL_HEAD}>FINAL</span>
        <span style={COL_HEAD}>STEPS</span>
        <span style={{ ...COL_HEAD, textAlign: "right" }}>STATUS</span>
      </div>

      {/* rows */}
      <div className="flex flex-col" style={{ padding: 8, gap: 6 }}>
        {rows.map((row, i) => (
          <TaskRow key={row.id} row={row} selected={i === 0} />
        ))}

        {remaining > 0 ? (
          <div style={{ textAlign: "center", padding: 8 }}>
            <span style={{ font: "var(--mono-sm)", fontSize: 11, color: "var(--text-low)" }}>
              + {remaining} more golden tasks
            </span>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
