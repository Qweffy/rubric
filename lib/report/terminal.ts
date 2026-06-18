import { align, pad, pct } from "@/lib/format";
import { type CaseOutcome, type Gate, type RunSummary } from "@/lib/scorers/aggregate";

/* ------------------------------------------------------------------ */
/* Terminal report — a clean, mono-glyph render of one run.             */
/*                                                                      */
/* This module RETURNS a string; it never writes to stdout. The CLI     */
/* entrypoint (bin/rubric.ts) owns the single console write — lib/ code  */
/* is console-banned by the lint floor, and keeping the renderer pure    */
/* makes it trivially testable.                                          */
/*                                                                      */
/* Layout:                                                              */
/*   header   — suite · title · target · prompt · sha/branch            */
/*   matrix   — one row per case, one column per scorer, with glyphs:    */
/*                ✓ pass (phosphor green) · ✗ fail (red) · − skipped     */
/*   footer   — per-scorer pass-rates, the overall pass-rate, and the    */
/*              gate line with the resolved exit code.                   */
/*                                                                      */
/* ANSI is applied sparingly and only to glyphs / status words; column  */
/* widths are computed on the UNCOLORED text so escape codes never throw */
/* the alignment off. No emoji — mono glyphs only.                      */
/* ------------------------------------------------------------------ */

const ANSI = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
} as const;

// Mono status glyphs — no emoji. ✓ phosphor, ✗ red, − neutral skip.
const GLYPH = { pass: "✓", fail: "✗", skip: "−" } as const;

/** Colorize when enabled; pass-through (no escapes) otherwise. */
function paint(text: string, color: keyof typeof ANSI, enabled: boolean): string {
  return enabled ? `${ANSI[color]}${text}${ANSI.reset}` : text;
}

/** Header metadata the report prints above the matrix. */
export interface ReportHeader {
  suite: string;
  title: string;
  /** Human label of the prompt version under test ("ocr-v1", "v23"). */
  promptVersion: string;
  /** Short description of the target ("fixture ./x.json", "exec node cli.js"). */
  target: string;
  sha: string;
  branch: string;
}

/** Everything {@link renderReport} needs to draw a run. */
export interface ReportInput {
  header: ReportHeader;
  summary: RunSummary;
  cases: readonly CaseOutcome[];
  gate: Gate;
  exitCode: 0 | 1;
  /** Wall-clock duration of the run, in ms. */
  wallMs: number;
  /** Total judge cost in USD (0 for fully-offline suites). */
  costUsd: number;
  /** Force-disable ANSI (e.g. when piping). Defaults to color ON. */
  color?: boolean;
}

/** A scorer column: its name and the display width its glyph column needs. */
interface Column {
  name: string;
  width: number;
}

function statusGlyph(
  outcome: { skipped: boolean; result: { pass: boolean } } | undefined,
  color: boolean,
): { plain: string; painted: string } {
  if (outcome === undefined) return { plain: " ", painted: color ? ANSI.dim + " " + ANSI.reset : " " };
  if (outcome.skipped) {
    return { plain: GLYPH.skip, painted: paint(GLYPH.skip, "dim", color) };
  }
  if (outcome.result.pass) {
    return { plain: GLYPH.pass, painted: paint(GLYPH.pass, "green", color) };
  }
  return { plain: GLYPH.fail, painted: paint(GLYPH.fail, "red", color) };
}

/** Verdict label for a case, painted by outcome. */
function verdictLabel(
  verdict: CaseOutcome["verdict"],
  color: boolean,
): { plain: string; painted: string } {
  if (verdict === "pass") return { plain: "PASS", painted: paint("PASS", "green", color) };
  if (verdict === "fail") return { plain: "FAIL", painted: paint("FAIL", "red", color) };
  return { plain: "SKIP", painted: paint("SKIP", "dim", color) };
}

function buildColumns(summary: RunSummary): Column[] {
  return summary.scorers.map((s) => ({
    name: s.name,
    // The glyph cell is one char; the header needs the scorer name's width.
    width: Math.max(s.name.length, 3),
  }));
}

/** Render the header block. */
function renderHeader(h: ReportHeader, color: boolean): string[] {
  const title = paint(`rubric · ${h.suite}`, "bold", color);
  return [
    title,
    `  ${h.title}`,
    paint(
      `  target ${h.target}  ·  prompt ${h.promptVersion}  ·  ${h.sha}@${h.branch}`,
      "dim",
      color,
    ),
  ];
}

/** Render the matrix: a header row, then one row per case. */
function renderMatrix(
  cases: readonly CaseOutcome[],
  columns: Column[],
  color: boolean,
): string[] {
  // Case-id column width: widest case id, floored so the header "case" fits.
  const idWidth = Math.max(4, ...cases.map((c) => c.caseId.length));
  const verdictWidth = 4; // PASS / FAIL / SKIP

  const headerCells = [
    pad("case", idWidth),
    pad("verdict", verdictWidth),
    ...columns.map((col) => pad(col.name, col.width)),
  ];
  const headerLine = paint("  " + headerCells.join("  "), "dim", color);

  const rows = cases.map((c) => {
    const byScorer = new Map(c.outcomes.map((o) => [o.name, o]));
    const verdict = verdictLabel(c.verdict, color);
    const cells = columns.map((col) => {
      const g = statusGlyph(byScorer.get(col.name), color);
      // Right-pad the (single-char) glyph inside the column width on PLAIN text,
      // then re-attach color so escapes never count toward the pad.
      const padding = " ".repeat(Math.max(0, col.width - g.plain.length));
      return g.painted + padding;
    });
    return (
      "  " +
      [
        pad(c.caseId, idWidth),
        verdict.painted + " ".repeat(Math.max(0, verdictWidth - verdict.plain.length)),
        ...cells,
      ].join("  ")
    );
  });

  return [headerLine, ...rows];
}

/** Render the per-scorer pass-rate footer. */
function renderScorerRates(summary: RunSummary, color: boolean): string[] {
  if (summary.scorers.length === 0) return [];
  const nameWidth = Math.max(...summary.scorers.map((s) => s.name.length));
  return summary.scorers.map((s) => {
    const rate = pct(s.passRate);
    const counts = `${String(s.passed)}/${String(s.ran)}`;
    const colored =
      s.ran === 0
        ? paint(rate, "dim", color)
        : s.passed === s.ran
          ? paint(rate, "green", color)
          : paint(rate, "yellow", color);
    return `  ${pad(s.name, nameWidth)}  ${align(colored, 6)}  ${paint(counts, "dim", color)}`;
  });
}

/** Render the overall pass-rate + gate line. */
function renderGate(input: ReportInput, color: boolean): string[] {
  const { summary, gate, exitCode } = input;
  const green = exitCode === 0;
  const rate = pct(summary.passRate);
  const ratePainted = green ? paint(rate, "green", color) : paint(rate, "red", color);

  const counts =
    `${String(summary.passCount)} pass · ${String(summary.failCount)} fail` +
    (summary.skippedCount > 0 ? ` · ${String(summary.skippedCount)} skip` : "") +
    ` · ${String(summary.total)} total`;

  const floor = `floor ${pct(gate.floor)}`;
  const verdictWord = green ? "GREEN" : "RED";
  const gateWord = paint(`gate ${verdictWord}`, green ? "green" : "red", color);
  const exitText = paint(`exit ${String(exitCode)}`, "dim", color);

  const lines = [
    "",
    `  pass-rate  ${ratePainted}   ${paint(counts, "dim", color)}`,
    `  ${gateWord}  ${paint(floor, "dim", color)}  ${exitText}`,
  ];

  if (input.wallMs > 0 || input.costUsd > 0) {
    const wall = `${(input.wallMs / 1000).toFixed(1)}s`;
    const cost = `$${input.costUsd.toFixed(2)}`;
    lines.push(paint(`  ${wall} · ${cost}`, "dim", color));
  }
  return lines;
}

/**
 * Render a full terminal report for one run as a string. Pure — no I/O, no
 * Date.now(). The caller prints the returned string and exits with `exitCode`.
 */
export function renderReport(input: ReportInput): string {
  const color = input.color ?? true;
  const columns = buildColumns(input.summary);

  const blocks: string[] = [
    ...renderHeader(input.header, color),
    "",
    ...renderMatrix(input.cases, columns, color),
    "",
    ...renderScorerRates(input.summary, color),
    ...renderGate(input, color),
    "",
  ];

  return blocks.join("\n");
}
