"use client";

import Link from "next/link";

import { Drawer } from "@/components/ui/drawer";
import { Icon } from "@/components/ui/icon";
import { SectionLabel } from "@/components/ui/section-label";
import { StatusBadge, type StatusValue } from "@/components/ui/status-badge";
import { type MatrixCell, type MatrixRow, type ScorerColumn } from "@/lib/queries/runs";

import { formatPct } from "./scorer-style";

/** A case verdict → the badge shown in the drawer header. */
const VERDICT_BADGE: Record<MatrixRow["verdict"], StatusValue> = {
  pass: "PASS",
  fail: "FAIL",
  skipped: "SKIPPED",
};

export interface CaseDrawerProps {
  row: MatrixRow | null;
  /** Scorers in display order, paired with their index into row.cells. */
  scorers: { column: ScorerColumn; sourceIndex: number }[];
  baselineRunId: number;
  onClose: () => void;
}

/**
 * CaseDrawer — the right-rail case inspector opened from a matrix row. Shows the
 * case verdict, its aggregate score, and a per-scorer breakdown (pass/fail,
 * score, detail, concrete errors, and a flip note vs the baseline run). A
 * skipped case surfaces its unmet precondition instead of the scorer list.
 */
export function CaseDrawer({ row, scorers, baselineRunId, onClose }: CaseDrawerProps) {
  const open = row !== null;
  const skipped = row?.verdict === "skipped";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={460}
      title={row?.label ?? undefined}
      subtitle={row ? `${row.caseId} · case detail` : undefined}
    >
      {row && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* verdict + aggregate score */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <StatusBadge status={VERDICT_BADGE[row.verdict]} style={{ height: 22 }} />
            {!skipped && (
              <span style={{ font: "var(--mono-base)", color: "var(--text-muted)" }}>
                {Math.round(row.score * scorers.length)}/{scorers.length} scorers ·{" "}
                {formatPct(row.score)}
              </span>
            )}
          </div>

          {skipped ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                background: "var(--cyan-12)",
                border: "1px solid color-mix(in srgb, var(--cyan) 34%, transparent)",
                borderRadius: "var(--radius-control)",
              }}
            >
              <Icon
                name="circle-x"
                size={15}
                strokeWidth={1.5}
                style={{ color: "var(--cyan)", flex: "none" }}
              />
              <span style={{ font: "var(--mono-sm)", color: "var(--text-hi)" }}>
                skipped: precondition <code>cart_nonempty</code> false
              </span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <SectionLabel>SCORERS</SectionLabel>
              {scorers.map(({ column, sourceIndex }) => (
                <ScorerBreakdown
                  key={column.name}
                  name={column.name}
                  cell={row.cells[sourceIndex] ?? null}
                  baselineRunId={baselineRunId}
                />
              ))}
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              paddingTop: 4,
              borderTop: "1px solid var(--divider)",
            }}
          >
            <Link
              href="#"
              style={{
                font: "var(--mono-sm)",
                color: "var(--cyan)",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Icon name="external-link" size={13} strokeWidth={1.5} />
              Open in Error Workbench
            </Link>
          </div>
        </div>
      )}
    </Drawer>
  );
}

function ScorerBreakdown({
  name,
  cell,
  baselineRunId,
}: {
  name: string;
  cell: MatrixCell | null;
  baselineRunId: number;
}) {
  const isJudge = name === "judge";

  if (cell === null) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          padding: "9px 11px",
          background: "var(--bg-raised)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-control)",
        }}
      >
        <span style={{ font: "var(--mono-sm)", color: "var(--text-mid)" }}>{name}</span>
        <span style={{ font: "var(--mono-sm)", color: "var(--cyan)" }}>− not run</span>
      </div>
    );
  }

  const accent = isJudge
    ? "var(--violet)"
    : cell.pass
      ? "var(--phosphor)"
      : "var(--red)";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: "9px 11px",
        background: "var(--bg-raised)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-control)",
        boxShadow: cell.pass ? undefined : "inset 2px 0 0 var(--red)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <span style={{ font: "var(--mono-base)", color: accent }}>{name}</span>
        <span
          style={{
            font: "var(--mono-sm)",
            fontVariantNumeric: "tabular-nums",
            color: accent,
          }}
        >
          {isJudge ? `${Math.round(cell.score * 5)}/5 ◆` : cell.pass ? "✓ pass" : `✗ ${cell.score.toFixed(2)}`}
        </span>
      </div>
      {cell.detail && (
        <span style={{ font: "var(--mono-sm)", color: "var(--text-mid)" }}>{cell.detail}</span>
      )}
      {cell.errors.length > 0 && (
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 3 }}>
          {cell.errors.map((err, i) => (
            <li key={i} style={{ font: "var(--mono-sm)", color: "var(--red)" }}>
              <span aria-hidden="true" style={{ marginRight: 6, color: "var(--text-low)" }}>
                ›
              </span>
              {err}
            </li>
          ))}
        </ul>
      )}
      {cell.flippedFrom != null && (
        <span style={{ font: "var(--mono-sm)", color: "var(--text-muted)" }}>
          was{" "}
          <span style={{ color: cell.flippedFrom === "pass" ? "var(--phosphor)" : "var(--red)" }}>
            {cell.flippedFrom === "pass" ? "PASS" : "FAIL"}
          </span>{" "}
          on #{baselineRunId}
        </span>
      )}
    </div>
  );
}
