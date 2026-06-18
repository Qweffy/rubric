import { ParquetSchema, ParquetWriter } from "@dsnp/parquetjs";

import { type ExportRow } from "@/lib/queries/exports";

/* ------------------------------------------------------------------ */
/* Parquet writer — the columnar twin of the CSV path. The rich export  */
/* rows (lib/queries/exports) are written through @dsnp/parquetjs with a */
/* fixed schema: UTF8 strings, BOOLEAN for the scorer pass flag, DOUBLE  */
/* for the numeric scores. Nullable columns are `optional`, and a null   */
/* becomes `undefined` before appendRow so the optional column encodes   */
/* as absent rather than a string "null". pyarrow reads this back.       */
/* ------------------------------------------------------------------ */

/**
 * The on-disk parquet schema. Mirrors ExportRow field-for-field; the four
 * nullable columns (label, detail, actual_preview, judge_*) are `optional`.
 */
const SCHEMA = new ParquetSchema({
  suite: { type: "UTF8" },
  run_id: { type: "INT64" },
  prompt_version: { type: "UTF8" },
  sha: { type: "UTF8" },
  started_at: { type: "UTF8" },
  case_id: { type: "UTF8" },
  label: { type: "UTF8", optional: true },
  verdict: { type: "UTF8" },
  case_score: { type: "DOUBLE" },
  scorer: { type: "UTF8" },
  scorer_pass: { type: "BOOLEAN" },
  scorer_score: { type: "DOUBLE" },
  detail: { type: "UTF8", optional: true },
  errors: { type: "UTF8" },
  expected_preview: { type: "UTF8" },
  actual_preview: { type: "UTF8", optional: true },
  judge_score: { type: "DOUBLE", optional: true },
  judge_reason: { type: "UTF8", optional: true },
  judge_model: { type: "UTF8", optional: true },
});

/** A parquet append row: every cell defined, nulls collapsed to undefined. */
type ParquetRow = Record<keyof ExportRow, string | number | boolean | undefined>;

/** Drop nulls to undefined so optional columns encode as absent, not "null". */
function toParquetRow(row: ExportRow): ParquetRow {
  return {
    suite: row.suite,
    run_id: row.run_id,
    prompt_version: row.prompt_version,
    sha: row.sha,
    started_at: row.started_at,
    case_id: row.case_id,
    label: row.label ?? undefined,
    verdict: row.verdict,
    case_score: row.case_score,
    scorer: row.scorer,
    scorer_pass: row.scorer_pass,
    scorer_score: row.scorer_score,
    detail: row.detail ?? undefined,
    errors: row.errors,
    expected_preview: row.expected_preview,
    actual_preview: row.actual_preview ?? undefined,
    judge_score: row.judge_score ?? undefined,
    judge_reason: row.judge_reason ?? undefined,
    judge_model: row.judge_model ?? undefined,
  };
}

/** Write the export rows to a real `.parquet` file at `path`. */
export async function writeParquet(
  path: string,
  rows: ExportRow[],
): Promise<void> {
  const writer = await ParquetWriter.openFile(SCHEMA, path);
  try {
    for (const row of rows) {
      await writer.appendRow(toParquetRow(row));
    }
  } finally {
    await writer.close();
  }
}
