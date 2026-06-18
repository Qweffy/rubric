import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { getRunDetail, listRuns } from "@/lib/queries/runs";
import { type ActionResult, err, ok } from "@/lib/result";

/* ------------------------------------------------------------------ */
/* `rubric export <runId|suite> [--out file]` — results to CSV.         */
/*                                                                      */
/* One row per (case, scorer): suite, run, case id, verdict, scorer,    */
/* pass, score, detail, errors. CSV is the supported format today;      */
/* parquet is deferred (would pull a heavy dependency). Writes the file  */
/* and returns a one-line confirmation for the CLI to print.            */
/* ------------------------------------------------------------------ */

export type ExportFormat = "csv" | "parquet";

export interface ExportOptions {
  /** Output file path. Defaults to ./<suite>-run<id>.csv. */
  out?: string;
  /** Only "csv" is supported; "parquet" is rejected with a clear message. */
  format?: ExportFormat;
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

/** Resolve a run id from a numeric arg, or the latest run of a suite slug. */
async function resolveRunId(target: string): Promise<ActionResult<number>> {
  if (/^\d+$/.test(target)) return ok(Number(target));
  const runs = await listRuns(target);
  const latest = runs[0];
  if (latest === undefined) return err(`suite "${target}" has no runs to export`);
  return ok(latest.id);
}

export async function exportRun(
  target: string | undefined,
  opts: ExportOptions = {},
): Promise<ActionResult<string>> {
  if (target === undefined) {
    return err("usage: rubric export <runId|suite> [--out file.csv]");
  }

  const format = opts.format ?? "csv";
  if (format !== "csv") {
    // TODO(parquet): add a parquet writer once a lightweight encoder is vendored.
    // For now, use --format csv (the only supported export format).
    return err('parquet export is not yet supported — use --format csv');
  }

  const runIdResult = await resolveRunId(target);
  if (!runIdResult.ok) return err(runIdResult.error);
  const runId = runIdResult.data;

  const detail = await getRunDetail(runId);
  if (detail === null) return err(`run #${String(runId)} not found`);

  const { summary, scorers, rows } = detail;

  const lines: string[] = [csvRow(CSV_COLUMNS)];
  for (const row of rows) {
    if (scorers.length === 0) {
      lines.push(
        csvRow([
          summary.suiteSlug,
          String(summary.id),
          row.caseId,
          row.label ?? "",
          row.verdict,
          row.score.toString(),
          "",
          "",
          "",
          "",
          "",
        ]),
      );
      continue;
    }
    row.cells.forEach((cell, i) => {
      const scorer = scorers[i];
      if (scorer === undefined) return;
      lines.push(
        csvRow([
          summary.suiteSlug,
          String(summary.id),
          row.caseId,
          row.label ?? "",
          row.verdict,
          row.score.toString(),
          scorer.name,
          cell === null ? "" : String(cell.pass),
          cell === null ? "" : cell.score.toString(),
          cell?.detail ?? "",
          cell !== null ? cell.errors.join(" | ") : "",
        ]),
      );
    });
  }

  const outPath = resolve(
    opts.out ?? `./${summary.suiteSlug}-run${String(runId)}.csv`,
  );
  try {
    // reason: outPath is a CLI-provided destination, not untrusted input.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    writeFileSync(outPath, lines.join("\n") + "\n", "utf8");
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "unknown error";
    return err(`cannot write "${outPath}": ${message}`);
  }

  const rowCount = lines.length - 1;
  return ok(`Exported ${String(rowCount)} rows to ${outPath}`);
}
