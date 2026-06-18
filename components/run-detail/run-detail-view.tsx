"use client";

import { useMemo, useState } from "react";

import { Card } from "@/components/ui/card";
import { HeatmapCell, type HeatmapFlip, type HeatmapState } from "@/components/ui/heatmap-cell";
import { Icon } from "@/components/ui/icon";
import { Kbd } from "@/components/ui/kbd";
import { SectionLabel } from "@/components/ui/section-label";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { Tag } from "@/components/ui/tag";
import { type MatrixCell, type MatrixRow, type RunDetail, type ScorerColumn } from "@/lib/queries/runs";

import { CaseDrawer } from "./case-drawer";
import { RunHeader } from "./run-header";
import { formatPct, scorerTone } from "./scorer-style";

/* ------------------------------------------------------------------ */
/* The matrix renders columns in the design's curated order, not the    */
/* query's alphabetical sort. Any scorer the query returns that isn't    */
/* in this list is appended after, so the grid never silently drops a    */
/* column.                                                               */
/* ------------------------------------------------------------------ */
const COLUMN_ORDER = ["schema", "exact-match", "field-accuracy", "field_accuracy", "judge"];

function orderScorers(scorers: ScorerColumn[]): { column: ScorerColumn; sourceIndex: number }[] {
  const indexed = scorers.map((column, sourceIndex) => ({ column, sourceIndex }));
  const rank = (name: string): number => {
    const i = COLUMN_ORDER.indexOf(name);
    return i === -1 ? COLUMN_ORDER.length : i;
  };
  return [...indexed].sort((a, b) => rank(a.column.name) - rank(b.column.name));
}

type FilterKey = "all" | "failing" | "regressed" | "judge-disagrees" | "skipped";

/** A row's judge cell is the violet scorer cell, surfaced separately for tally + dot. */
function judgeCellOf(row: MatrixRow, judgeIndex: number): MatrixCell | null {
  if (judgeIndex < 0) return null;
  return row.cells[judgeIndex] ?? null;
}

/** Count of scored (non-null) scorer cells that passed — drives the row "n/m" tally. */
function rowTally(row: MatrixRow): { pass: number; total: number } {
  let pass = 0;
  let total = 0;
  for (const cell of row.cells) {
    if (cell === null) continue;
    total += 1;
    if (cell.pass) pass += 1;
  }
  return { pass, total };
}

/** Any cell flipped from PASS → fail flags the row as regressed. */
function rowRegressed(row: MatrixRow): boolean {
  return row.cells.some((cell) => cell !== null && !cell.pass && cell.flippedFrom === "pass");
}

/**
 * A judge-disagreement is an overall-PASS case whose judge cell passed leniently
 * while a stricter scorer or the human label diverges. The seed encodes exactly
 * one (case_103): overall pass, judge score below a clean pass. We surface it as
 * a judge cell that passed with a sub-maximal score on a passing row.
 */
function rowJudgeDisagrees(row: MatrixRow, judgeCell: MatrixCell | null): boolean {
  if (row.verdict !== "pass" || judgeCell === null) return false;
  return judgeCell.pass && judgeCell.score < 1;
}

/** Map a scored scorer cell to its heatmap state + glyph value. */
function cellState(name: string, cell: MatrixCell): HeatmapState {
  if (name === "judge") return "judge";
  return cell.pass ? "pass" : "fail";
}

/** The corner flip triangle: a PASS→fail flip is a downward red delta. */
function cellFlip(cell: MatrixCell): HeatmapFlip | undefined {
  if (cell.flippedFrom === "pass" && !cell.pass) return "down";
  if (cell.flippedFrom === "fail" && cell.pass) return "up";
  return undefined;
}

export interface RunDetailViewProps {
  detail: RunDetail;
}

/**
 * RunDetailView — the run inspector: a sticky run header, the summary strip,
 * a filter bar, and the dense case × scorer matrix (the keystone). Every cell
 * is a HeatmapCell; rows are DataRow-style grid rows that open a CaseDrawer.
 * The skipped case is shown as a muted cyan-dash row beneath the scored set.
 */
export function RunDetailView({ detail }: RunDetailViewProps) {
  const { summary, scorers, rows } = detail;

  const [filter, setFilter] = useState<FilterKey>("all");
  const [mode, setMode] = useState<"absolute" | "diff">("absolute");
  const [openRow, setOpenRow] = useState<MatrixRow | null>(null);

  // The diff baseline is the immediately-prior run in this suite's sequence —
  // runs carry monotonic ids, so id - 1 is the previous run we diff against.
  // (getRunDetail returns no explicit baseline ref; derive it here.)
  const baselineRunId = summary.id - 1;

  const orderedScorers = useMemo(() => orderScorers(scorers), [scorers]);
  const judgeSourceIndex = useMemo(
    () => scorers.findIndex((s) => s.name === "judge"),
    [scorers],
  );

  // Split scored rows (pass/fail) from the skipped row — the "142 cases" count
  // is the scored set; skipped renders separately below the scored block.
  const scoredRows = useMemo(() => rows.filter((r) => r.verdict !== "skipped"), [rows]);
  const skippedRows = useMemo(() => rows.filter((r) => r.verdict === "skipped"), [rows]);

  // Derived row flags, computed once.
  const flags = useMemo(() => {
    const map = new Map<number, { regressed: boolean; judgeDisagrees: boolean }>();
    for (const row of scoredRows) {
      const judgeCell = judgeCellOf(row, judgeSourceIndex);
      map.set(row.caseRowId, {
        regressed: rowRegressed(row),
        judgeDisagrees: rowJudgeDisagrees(row, judgeCell),
      });
    }
    return map;
  }, [scoredRows, judgeSourceIndex]);

  const counts = useMemo(() => {
    const failing = scoredRows.filter((r) => r.verdict === "fail").length;
    let regressed = 0;
    let judgeDisagrees = 0;
    for (const flag of flags.values()) {
      if (flag.regressed) regressed += 1;
      if (flag.judgeDisagrees) judgeDisagrees += 1;
    }
    return {
      all: scoredRows.length,
      failing,
      regressed,
      judgeDisagrees,
      skipped: skippedRows.length,
    };
  }, [scoredRows, skippedRows, flags]);

  const visibleScored = useMemo(() => {
    switch (filter) {
      case "failing":
        return scoredRows.filter((r) => r.verdict === "fail");
      case "regressed":
        return scoredRows.filter((r) => flags.get(r.caseRowId)?.regressed);
      case "judge-disagrees":
        return scoredRows.filter((r) => flags.get(r.caseRowId)?.judgeDisagrees);
      case "skipped":
        return [];
      default:
        return scoredRows;
    }
  }, [filter, scoredRows, flags]);

  const visibleSkipped = filter === "all" || filter === "skipped" ? skippedRows : [];

  const tabs: TabItem[] = [
    { value: "all", label: "All", count: counts.all },
    { value: "failing", label: "Failing", count: counts.failing },
    { value: "regressed", label: "Regressed", count: counts.regressed },
    { value: "judge-disagrees", label: "Judge-disagrees", count: counts.judgeDisagrees },
    { value: "skipped", label: "Skipped", count: counts.skipped },
  ];

  // matrix grid: 280px case column · one 1fr per scorer · 64px row tally.
  const matrixColumns = `280px repeat(${orderedScorers.length}, 1fr) 64px`;
  const shownCount = visibleScored.length + visibleSkipped.length;

  return (
    <>
      <div className="flex flex-col">
        <RunHeader
          summary={summary}
          baselineRunId={baselineRunId}
          mode={mode}
          onModeChange={setMode}
        />

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* SUMMARY STRIP */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1.7fr 1fr 1fr",
              gap: 14,
            }}
          >
            <SummaryStat label="PASS">
              <span style={{ font: "600 26px/1.1 var(--font-mono)", color: "var(--phosphor)" }}>
                {summary.passCount}
                <span style={{ fontSize: 15, color: "var(--text-muted)" }}>
                  /{summary.passCount + summary.failCount}
                </span>
              </span>
              <StatSub>{formatPct(summary.passRate)}</StatSub>
            </SummaryStat>

            <SummaryStat label="FAIL">
              <span style={{ font: "600 26px/1.1 var(--font-mono)", color: "var(--red)" }}>
                {summary.failCount}
              </span>
              <StatSub>
                {formatPct(
                  summary.passCount + summary.failCount > 0
                    ? summary.failCount / (summary.passCount + summary.failCount)
                    : 0,
                )}
              </StatSub>
            </SummaryStat>

            <Card padding={false} style={{ padding: 14 }}>
              <SectionLabel style={{ marginBottom: 10 }}>BY SCORER</SectionLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {orderedScorers.map(({ column }) => (
                  <ScorerChip key={column.name} column={column} />
                ))}
              </div>
            </Card>

            <SummaryStat label={`vs #${baselineRunId}`}>
              <span style={{ font: "600 26px/1.1 var(--font-mono)", color: "var(--red)" }}>
                −{Math.max(0, counts.regressed)}
              </span>
              <StatSub>cases</StatSub>
            </SummaryStat>

            <SummaryStat label="SKIPPED">
              <span style={{ font: "600 26px/1.1 var(--font-mono)", color: "var(--text-muted)" }}>
                {summary.skippedCount}
              </span>
              <StatSub muted>precondition</StatSub>
            </SummaryStat>
          </div>

          {/* FILTER BAR */}
          <Card
            padding={false}
            style={{
              padding: "0 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <Tabs
              tabs={tabs}
              value={filter}
              onChange={(v) => setFilter(v as FilterKey)}
              style={{ border: "none" }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 0" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: 150,
                  height: 32,
                  padding: "0 11px",
                  background: "var(--surface-panel)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-control)",
                  color: "var(--text-muted)",
                  font: "var(--mono-sm)",
                }}
              >
                <Icon name="search" size={14} strokeWidth={1.5} style={{ color: "var(--text-label)" }} />
                <span style={{ flex: 1 }}>filter cases…</span>
              </div>
              {orderedScorers.map(({ column }) => (
                <Tag
                  key={column.name}
                  tone="neutral"
                  style={
                    column.name === "judge"
                      ? { height: 28, color: "var(--text-low)", borderStyle: "dashed" }
                      : { height: 28 }
                  }
                >
                  {column.name}
                </Tag>
              ))}
              <button
                type="button"
                className="inline-flex cursor-pointer items-center"
                style={{
                  gap: 6,
                  height: 30,
                  padding: "0 11px",
                  background: "transparent",
                  border: "none",
                  borderRadius: "var(--radius-control)",
                  color: "var(--text-body)",
                  font: "600 12px/1 var(--font-mono)",
                }}
              >
                group by failure-mode
              </button>
            </div>
          </Card>

          {/* THE MATRIX */}
          <Card
            padding={false}
            header={`CASE × SCORER · ${counts.all} × ${orderedScorers.length}`}
            actions={
              <span style={{ font: "var(--mono-sm)", color: "var(--text-muted)" }}>
                {shownCount} shown · click row → case detail
              </span>
            }
          >
            <div style={{ position: "relative", maxHeight: 392, overflow: "auto" }}>
              {/* header row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: matrixColumns,
                  position: "sticky",
                  top: 0,
                  zIndex: 4,
                  background: "var(--surface-panel)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    position: "sticky",
                    left: 0,
                    zIndex: 5,
                    background: "var(--surface-panel)",
                    padding: "9px 14px",
                    borderRight: "1px solid var(--divider)",
                  }}
                >
                  <ColumnHead>CASE</ColumnHead>
                </div>
                {orderedScorers.map(({ column }) => (
                  <div
                    key={column.name}
                    style={{
                      padding: "9px 10px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 3,
                      borderRight: "1px solid var(--divider)",
                    }}
                  >
                    <span
                      style={{
                        font: "600 12px/1 var(--font-mono)",
                        color:
                          column.name === "judge" ? "var(--violet)" : "var(--text-hi)",
                      }}
                    >
                      {column.name}
                    </span>
                    <ScorerPct column={column} />
                  </div>
                ))}
                <div style={{ padding: "9px 8px", display: "flex", alignItems: "flex-start" }}>
                  <ColumnHead>ROW</ColumnHead>
                </div>
              </div>

              {/* scored rows */}
              {visibleScored.map((row, rowIdx) => {
                const isLastBlock =
                  rowIdx === visibleScored.length - 1 && visibleSkipped.length === 0;
                const flag = flags.get(row.caseRowId);
                const tally = rowTally(row);
                const railColor = flag?.regressed
                  ? "var(--red)"
                  : flag?.judgeDisagrees
                    ? "var(--amber)"
                    : undefined;
                const dotColor =
                  row.verdict === "fail"
                    ? "var(--red)"
                    : flag?.judgeDisagrees
                      ? "var(--amber)"
                      : "var(--phosphor)";
                const dotGlow = row.verdict === "fail" || tally.pass === 2;

                return (
                  <div
                    key={row.caseRowId}
                    style={{
                      display: "grid",
                      gridTemplateColumns: matrixColumns,
                      position: "relative",
                    }}
                  >
                    {/* sticky case cell */}
                    <CaseLeadCell
                      row={row}
                      railColor={railColor}
                      lastRow={isLastBlock}
                      onSelect={() => setOpenRow(row)}
                    />
                    {orderedScorers.map(({ column, sourceIndex }, colIdx) => {
                      const cell = row.cells[sourceIndex] ?? null;
                      const lastCol = colIdx === orderedScorers.length - 1;
                      if (cell === null) {
                        return (
                          <HeatmapCell
                            key={column.name}
                            state="skip"
                            value="−"
                            hideGlyph
                            lastRow={isLastBlock}
                            onSelect={() => setOpenRow(row)}
                            style={lastCol ? { borderRight: "none" } : undefined}
                          />
                        );
                      }
                      const state = cellState(column.name, cell);
                      const isJudge = column.name === "judge";
                      return (
                        <HeatmapCell
                          key={column.name}
                          state={state}
                          value={
                            isJudge
                              ? formatJudge(cell)
                              : !cell.pass
                                ? cell.score.toFixed(2)
                                : undefined
                          }
                          hideGlyph={isJudge}
                          flip={cellFlip(cell)}
                          lastRow={isLastBlock}
                          onSelect={() => setOpenRow(row)}
                          tooltip={
                            cell.flippedFrom != null || cell.detail
                              ? <CellTooltip caseId={row.caseId} scorer={column.name} cell={cell} baseline={baselineRunId} />
                              : undefined
                          }
                          style={lastCol ? { borderRight: "none" } : undefined}
                        />
                      );
                    })}
                    {/* row tally */}
                    <div
                      className="cursor-pointer"
                      onClick={() => setOpenRow(row)}
                      style={{
                        height: 28,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 5,
                        borderBottom: isLastBlock ? "none" : "1px solid var(--divider)",
                        font: "var(--mono-sm)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          color: row.verdict === "fail" ? "var(--red)" : "var(--text-muted)",
                        }}
                      >
                        {tally.pass}/{tally.total}
                      </span>
                      <RowDot color={dotColor} glow={dotGlow} />
                    </div>
                  </div>
                );
              })}

              {/* skipped row(s) — muted, cyan dashes, SKIP badge */}
              {visibleSkipped.map((row, idx) => {
                const isLast = idx === visibleSkipped.length - 1;
                return (
                  <div
                    key={row.caseRowId}
                    style={{
                      display: "grid",
                      gridTemplateColumns: matrixColumns,
                      opacity: 0.72,
                    }}
                  >
                    <CaseLeadCell
                      row={row}
                      muted
                      lastRow={isLast}
                      onSelect={() => setOpenRow(row)}
                    />
                    {orderedScorers.map(({ column }, colIdx) => (
                      <HeatmapCell
                        key={column.name}
                        state="skip"
                        value="−"
                        hideGlyph
                        lastInRow={false}
                        lastRow={isLast}
                        onSelect={() => setOpenRow(row)}
                        style={
                          colIdx === orderedScorers.length - 1 ? { borderRight: "none" } : undefined
                        }
                      />
                    ))}
                    <div
                      className="cursor-pointer"
                      onClick={() => setOpenRow(row)}
                      style={{
                        height: 28,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 5,
                        borderBottom: isLast ? "none" : "1px solid var(--divider)",
                      }}
                    >
                      <StatusBadge
                        status="SKIP"
                        style={{ height: 16, padding: "0 5px", fontSize: 9 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* legend footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                padding: "10px 16px",
                borderTop: "1px solid var(--divider)",
                flexWrap: "wrap",
              }}
            >
              <LegendItem glyph="✓" glyphColor="var(--phosphor)" label="pass" />
              <LegendItem glyph="✗" glyphColor="var(--red)" label="fail" />
              <LegendItem glyph="−" glyphColor="var(--cyan)" label="skipped" />
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ font: "var(--mono-sm)", color: "var(--phosphor)" }}>▲</span>
                <span style={{ font: "var(--mono-sm)", color: "var(--red)" }}>▼</span>
                <span style={{ font: "var(--mono-sm)", color: "var(--text-muted)" }}>flipped</span>
              </div>
              <LegendItem glyph="◆" glyphColor="var(--violet)" label="judge" />
              <span style={{ flex: 1 }} />
              <span
                style={{
                  font: "var(--mono-sm)",
                  color: "var(--text-muted)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Kbd>↵</Kbd> open case
              </span>
            </div>
          </Card>
        </div>
      </div>

      <CaseDrawer
        row={openRow}
        scorers={orderedScorers}
        baselineRunId={baselineRunId}
        onClose={() => setOpenRow(null)}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Local presentational helpers — kept colocated since they're only     */
/* meaningful inside the matrix screen.                                  */
/* ------------------------------------------------------------------ */

/** Judge cell tally: the seed maps a clean pass to 5/5, a lenient pass to 3/5,
 * and a fail to 2/5 — recover the n/5 from the 0-1 score so the value reads as
 * the design's "5/5 ◆" tally. */
function formatJudge(cell: MatrixCell): string {
  const n = Math.round(cell.score * 5);
  return `${n}/5 ◆`;
}

function SummaryStat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Card padding={false} style={{ padding: 14 }}>
      <SectionLabel style={{ marginBottom: 8 }}>{label}</SectionLabel>
      {children}
    </Card>
  );
}

function StatSub({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <div
      style={{
        font: "var(--mono-sm)",
        fontSize: 11,
        marginTop: 6,
        color: muted ? "var(--text-low)" : "var(--text-muted)",
      }}
    >
      {children}
    </div>
  );
}

function ScorerChip({ column }: { column: ScorerColumn }) {
  const tone = scorerTone(column);
  return (
    <span
      style={{
        font: "600 10px/1.4 var(--font-mono)",
        fontVariantNumeric: "tabular-nums",
        padding: "1px 5px",
        borderRadius: "var(--radius-sm)",
        color: tone.color,
        background: tone.fill,
        border: `1px solid ${tone.border}`,
      }}
    >
      {column.name} {formatPct(column.passRate)}
    </span>
  );
}

function ScorerPct({ column }: { column: ScorerColumn }) {
  const tone = scorerTone(column);
  return (
    <span
      style={{
        font: "600 10px/1.4 var(--font-mono)",
        fontVariantNumeric: "tabular-nums",
        padding: "1px 5px",
        borderRadius: "var(--radius-sm)",
        width: "max-content",
        color: tone.color,
        background: tone.fill,
      }}
    >
      {formatPct(column.passRate)}
    </span>
  );
}

function ColumnHead({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        font: "600 10px/1 var(--font-mono)",
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        color: "var(--text-low)",
      }}
    >
      {children}
    </span>
  );
}

function CaseLeadCell({
  row,
  railColor,
  muted = false,
  lastRow,
  onSelect,
}: {
  row: MatrixRow;
  railColor?: string;
  muted?: boolean;
  lastRow: boolean;
  onSelect: () => void;
}) {
  const emphasized = railColor != null;
  return (
    <div
      className="cursor-pointer"
      onClick={onSelect}
      style={{
        position: "sticky",
        left: 0,
        zIndex: 2,
        background: "var(--surface-card)",
        padding: "0 14px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        borderRight: "1px solid var(--divider)",
        borderBottom: lastRow ? "none" : "1px solid var(--divider)",
        height: 28,
        boxShadow: railColor ? `inset 2px 0 0 ${railColor}` : undefined,
      }}
    >
      <span
        style={{
          font: "var(--mono-sm)",
          fontSize: 11,
          color: emphasized ? "var(--text-hi)" : "var(--text-muted)",
        }}
      >
        {row.caseId}
      </span>
      <span
        className="truncate"
        style={{
          font: "var(--text-sm)",
          color: emphasized ? "var(--text-hi)" : muted ? "var(--text-muted)" : "var(--text-body)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {row.label}
      </span>
    </div>
  );
}

function RowDot({ color, glow }: { color: string; glow: boolean }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: color,
        flex: "none",
        boxShadow: glow ? `0 0 6px ${color}` : undefined,
      }}
    />
  );
}

function CellTooltip({
  caseId,
  scorer,
  cell,
  baseline,
}: {
  caseId: string;
  scorer: string;
  cell: MatrixCell;
  baseline: number;
}) {
  return (
    <>
      <span style={{ font: "var(--mono-sm)", color: "var(--text-hi)" }}>
        {caseId} · {scorer} ·{" "}
        <span style={{ color: cell.pass ? "var(--phosphor)" : "var(--red)" }}>
          {cell.pass ? "PASS" : "FAIL"}
        </span>
      </span>
      {cell.detail && (
        <span style={{ font: "var(--mono-sm)", color: "var(--text-mid)" }}>{cell.detail}</span>
      )}
      {cell.flippedFrom != null && (
        <span style={{ font: "var(--mono-sm)", color: "var(--text-muted)" }}>
          was{" "}
          <span style={{ color: cell.flippedFrom === "pass" ? "var(--phosphor)" : "var(--red)" }}>
            {cell.flippedFrom === "pass" ? "PASS" : "FAIL"}
          </span>{" "}
          on #{baseline}
        </span>
      )}
    </>
  );
}

function LegendItem({
  glyph,
  glyphColor,
  label,
}: {
  glyph: string;
  glyphColor: string;
  label: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ font: "var(--mono-sm)", fontSize: 13, color: glyphColor }}>{glyph}</span>
      <span style={{ font: "var(--mono-sm)", color: "var(--text-muted)" }}>{label}</span>
    </div>
  );
}
