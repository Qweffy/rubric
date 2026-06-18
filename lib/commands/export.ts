import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { writeParquet } from "@/lib/analysis/parquet";
import {
  type ExportRow,
  getAllExportRows,
  getRunExportRows,
} from "@/lib/queries/exports";
import { listRuns } from "@/lib/queries/runs";
import { type ActionResult, err, ok } from "@/lib/result";

/* ------------------------------------------------------------------ */
/* `rubric export <runId|suite> [--out file] [--format csv|parquet]`.    */
/*                                                                      */
/* One rich row per (case, scorer): run + case + scorer + judge context. */
/* CSV (default) projects that down to the 11 analysis columns; parquet  */
/* writes the full row through @dsnp/parquetjs for pandas/pyarrow. Both   */
/* sources come from lib/queries/exports. Writes the file and returns a   */
/* one-line confirmation for the CLI to print.                           */
/* ------------------------------------------------------------------ */

export type ExportFormat = "csv" | "parquet";

export interface ExportOptions {
  /** Output file path. Defaults to ./<suite>-run<id>.<ext> (or rubric-all-runs). */
  out?: string;
  /** Output format. Defaults to "csv"; "parquet" writes a real .parquet. */
  format?: ExportFormat;
  /** Export every run instead of a single run/suite target. */
  all?: boolean;
}

const CSV_COLUMNS = [
  "suite",
  "run_id",
  "case_id",
  "label",
  "verdict",
  "case_score",
  "scorer",
  "scorer_pass",
  "scorer_score",
  "detail",
  "errors",
] as const;

/** RFC-4180 CSV field: quote when it contains a comma, quote, or newline. */
function csvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function csvRow(fields: readonly string[]): string {
  return fields.map(csvField).join(",");
}

/** Project a rich export row down to the 11 CSV analysis columns. */
function csvCells(row: ExportRow): string[] {
  return [
    row.suite,
    String(row.run_id),
    row.case_id,
    row.label ?? "",
    row.verdict,
    row.case_score.toString(),
    row.scorer,
    String(row.scorer_pass),
    row.scorer_score.toString(),
    row.detail ?? "",
    row.errors,
  ];
}

/** Serialize the export rows as the 11-column CSV (header + one row per cell). */
function toCsv(rows: ExportRow[]): string {
  const lines: string[] = [csvRow(CSV_COLUMNS)];
  for (const row of rows) {
    lines.push(csvRow(csvCells(row)));
  }
  return lines.join("\n") + "\n";
}

/** Resolve a run id from a numeric arg, or the latest run of a suite slug. */
async function resolveRunId(target: string): Promise<ActionResult<number>> {
  if (/^\d+$/.test(target)) return ok(Number(target));
  const runs = await listRuns(target);
  const latest = runs[0];
  if (latest === undefined) return err(`suite "${target}" has no runs to export`);
  return ok(latest.id);
}

/** Default output filename for a target + format. */
function defaultOut(
  all: boolean,
  suiteSlug: string,
  runId: number,
  format: ExportFormat,
): string {
  const ext = format === "parquet" ? "parquet" : "csv";
  if (all) return `./rubric-all-runs.${ext}`;
  return `./${suiteSlug}-run${String(runId)}.${ext}`;
}

export async function exportRun(
  target: string | undefined,
  opts: ExportOptions = {},
): Promise<ActionResult<string>> {
  const format = opts.format ?? "csv";
  const all = opts.all ?? false;

  let rows: ExportRow[];
  let outPath: string;

  if (all) {
    rows = await getAllExportRows();
    outPath = resolve(opts.out ?? defaultOut(true, "", 0, format));
  } else {
    if (target === undefined) {
      return err(
        "usage: rubric export <runId|suite> [--out file] [--format csv|parquet] [--all]",
      );
    }
    const runIdResult = await resolveRunId(target);
    if (!runIdResult.ok) return err(runIdResult.error);
    const runId = runIdResult.data;

    rows = await getRunExportRows(runId);
    if (rows.length === 0) {
      return err(`run #${String(runId)} has no rows to export`);
    }
    outPath = resolve(opts.out ?? defaultOut(false, rows[0]?.suite ?? "run", runId, format));
  }

  try {
    if (format === "parquet") {
      await writeParquet(outPath, rows);
    } else {
      // reason: outPath is a CLI-provided destination, not untrusted input.
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      writeFileSync(outPath, toCsv(rows), "utf8");
    }
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "unknown error";
    return err(`cannot write "${outPath}": ${message}`);
  }

  return ok(`Exported ${String(rows.length)} rows to ${outPath}`);
}
