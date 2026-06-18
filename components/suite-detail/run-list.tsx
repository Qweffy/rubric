"use client";

import { useRef, useState } from "react";

import { useRowNavRegistration } from "@/components/shell/keyboard-nav";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { StatusBadge } from "@/components/ui/status-badge";
import { type RunStatus } from "@/db/schema";

/** A run as rendered in the history table. */
export interface RunListRow {
  id: number;
  sha: string;
  branch: string;
  promptLabel: string;
  status: RunStatus;
  passRate: number;
  /** passRate(this) − passRate(prior), null when no prior run. */
  delta: number | null;
  who: string;
  when: string;
  /** Wall-clock duration label, e.g. "38s". */
  duration: string;
  /** Cost label, e.g. "$0.83". */
  cost: string;
  /** True for the regression head — paints the red rail + wash. */
  regressed: boolean;
  /** True for a flaky run — amber treatment. */
  flaky: boolean;
}

export interface RunListProps {
  rows: RunListRow[];
  /** Total runs in history (the header count, e.g. "4 of 20"). */
  totalRuns: number;
  onOpenRun?: (run: RunListRow) => void;
}

const GRID_TEMPLATE =
  "72px 92px 92px 64px 56px minmax(0,1fr) 96px 84px 76px 60px";

const COLUMNS = [
  "RUN",
  "STATUS",
  "PASS-RATE",
  "Δ",
  "VER",
  "BRANCH",
  "WHO",
  "WHEN",
  "DUR",
  "COST",
];

function statusValue(row: RunListRow): string {
  if (row.flaky) return "FLAKY";
  if (row.status === "completed") return "PASS";
  if (row.status === "running") return "RUNNING";
  return "FAIL";
}

function rateColor(row: RunListRow): string {
  if (row.flaky) return "var(--amber)";
  if (row.status === "completed") return "var(--phosphor)";
  return "var(--red)";
}

function deltaCell(row: RunListRow) {
  if (row.delta === null) {
    return <span className="mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>—</span>;
  }
  const pts = row.delta * 100;
  const down = pts < 0;
  const flat = Math.abs(pts) < 0.05;
  const color = flat
    ? "var(--text-muted)"
    : down
      ? row.flaky
        ? "var(--amber)"
        : "var(--red)"
      : "var(--phosphor)";
  const glyph = flat ? "" : down ? "▼" : "▲";
  return (
    <span className="mono" style={{ fontSize: 12, color }}>
      {flat ? "+" : glyph}
      {Math.abs(pts).toFixed(1)}
    </span>
  );
}

function VersionTag({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 18,
        padding: "0 6px",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--border)",
        font: "var(--mono-sm)",
        fontSize: 10,
        color: "var(--text-mid)",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function BranchTag({ branch }: { branch: string }) {
  const isMain = branch === "main";
  const color = isMain ? "var(--cyan)" : "var(--amber)";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 18,
        padding: "0 6px",
        width: "max-content",
        maxWidth: "100%",
        borderRadius: "var(--radius-sm)",
        border: `1px solid color-mix(in srgb, ${color} 38%, transparent)`,
        font: "var(--mono-sm)",
        fontSize: 10,
        color,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {branch}
    </span>
  );
}

interface RunRowItemProps {
  row: RunListRow;
  selected: boolean;
  highlighted: boolean;
  onSelect: () => void;
  onOpen: () => void;
  rowRef: (node: HTMLDivElement | null) => void;
}

function RunRowItem({
  row,
  selected,
  highlighted,
  onSelect,
  onOpen,
  rowRef,
}: RunRowItemProps) {
  const active = selected || highlighted;
  const railColor = row.regressed
    ? "var(--red)"
    : row.flaky
      ? "var(--amber)"
      : null;
  return (
    <div
      ref={rowRef}
      data-row-key={String(row.id)}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onSelect}
      onDoubleClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onOpen();
        } else if (e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className="cursor-pointer hover:border-[var(--border-strong)] hover:shadow-[var(--glow-phosphor-sm)]"
      style={{
        display: "grid",
        gridTemplateColumns: GRID_TEMPLATE,
        alignItems: "center",
        gap: 14,
        padding: "11px 14px",
        position: "relative",
        borderRadius: "var(--radius-card)",
        border: `1px solid ${
          row.regressed
            ? "color-mix(in srgb, var(--red) 40%, transparent)"
            : active
              ? "var(--border-strong)"
              : "var(--border)"
        }`,
        background: row.regressed
          ? "var(--red-14)"
          : active
            ? "var(--phosphor-08)"
            : "var(--bg-raised)",
        boxShadow: active ? "var(--glow-phosphor-sm)" : undefined,
        transition:
          "border-color var(--dur-fast), box-shadow var(--dur), background var(--dur-fast)",
      }}
    >
      {railColor ? (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 0,
            top: 8,
            bottom: 8,
            width: 2,
            borderRadius: 1,
            background: railColor,
            boxShadow: `0 0 8px ${railColor}`,
          }}
        />
      ) : null}

      <a
        href={`/runs/${String(row.id)}`}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onOpen();
        }}
        className="mono hover:underline"
        style={{ fontSize: 13, color: "var(--cyan)", textDecoration: "none" }}
      >
        #{row.id}
      </a>

      <span>
        <StatusBadge status={statusValue(row)} />
      </span>

      <span className="mono" style={{ fontSize: 14, color: rateColor(row) }}>
        {(row.passRate * 100).toFixed(1)}%
      </span>

      {deltaCell(row)}

      <VersionTag label={row.promptLabel} />

      <BranchTag branch={row.branch} />

      <span className="mono" style={{ fontSize: 12, color: "var(--cyan)" }}>
        {row.who}
      </span>

      <span className="mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>
        {row.when}
      </span>

      <span className="mono" style={{ fontSize: 12, color: "var(--text-mid)" }}>
        {row.duration}
      </span>

      <span className="mono" style={{ fontSize: 12, color: "var(--text-mid)" }}>
        {row.cost}
      </span>
    </div>
  );
}

/**
 * RunList — the suite's run-history table. A sticky mono column header then one
 * selectable row per run with status, pass-rate, delta, version, branch, who,
 * when, duration and cost. The regression head paints a red rail + wash; flaky
 * runs go amber. Rows register with the shell's row-nav controller so j/k move
 * the highlight and ↵ opens the highlighted run.
 */
export function RunList({ rows, totalRuns, onOpenRun }: RunListProps) {
  // The head run (first) is selected by default — it is the regression anchor.
  const [selectedId, setSelectedId] = useState<number | null>(
    rows[0]?.id ?? null,
  );
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  const highlighted = useRowNavRegistration(rowRefs, rows.length, (index) => {
    const run = rows[index];
    if (run) {
      setSelectedId(run.id);
      onOpenRun?.(run);
    }
  });

  return (
    <Card
      padding={false}
      header="RUNS"
      actions={
        <span
          className="mono"
          style={{ font: "var(--mono-sm)", fontSize: 11, color: "var(--text-muted)" }}
        >
          {rows.length} of {totalRuns} · j/k to navigate · ↵ opens run
        </span>
      }
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: GRID_TEMPLATE,
          alignItems: "center",
          gap: 14,
          padding: "8px 16px",
          borderBottom: "1px solid var(--divider)",
        }}
      >
        {COLUMNS.map((col) => (
          <span
            key={col}
            className="mono"
            style={{
              font: "600 10px/1 var(--font-mono)",
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: "var(--text-low)",
            }}
          >
            {col}
          </span>
        ))}
      </div>

      <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map((row, index) => (
          <RunRowItem
            key={row.id}
            row={row}
            selected={selectedId === row.id}
            highlighted={highlighted === index}
            onSelect={() => setSelectedId(row.id)}
            onOpen={() => {
              setSelectedId(row.id);
              onOpenRun?.(row);
            }}
            rowRef={(node) => {
              rowRefs.current[index] = node;
            }}
          />
        ))}
      </div>

      {rows.length === 0 ? (
        <div
          className="flex items-center"
          style={{ gap: 8, padding: "16px", color: "var(--text-muted)" }}
        >
          <Icon name="list" size={16} />
          <span style={{ font: "var(--text-sm)" }}>No runs recorded yet.</span>
        </div>
      ) : null}
    </Card>
  );
}
