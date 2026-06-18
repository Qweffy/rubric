import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  caseResults,
  cases,
  judgeVerdicts,
  judges,
  promptVersions,
  runs,
  suites,
} from "@/db/schema";
import { z } from "@/lib/validation";

/* ------------------------------------------------------------------ */
/* Export rows — the rich per-(case, scorer) grain for error analysis.  */
/* One row per (case, scorer); a case's judge verdict (if present) rides */
/* on each of its scorer rows. Read module mirroring lib/queries/runs.ts */
/* — plain drizzle header (no server-only): the CLI export command pulls  */
/* it in, so it must stay bundlable outside the dashboard.               */
/* ------------------------------------------------------------------ */

/** Longest preview a JSON blob is truncated to before it lands in a cell. */
const PREVIEW_LIMIT = 200;

/** One export row: a (case, scorer) pair with its run + judge context. */
export const exportRowSchema = z.object({
  suite: z.string(),
  run_id: z.number(),
  prompt_version: z.string(),
  sha: z.string(),
  started_at: z.string(),
  case_id: z.string(),
  label: z.string().nullable(),
  verdict: z.string(),
  case_score: z.number(),
  scorer: z.string(),
  scorer_pass: z.boolean(),
  scorer_score: z.number(),
  detail: z.string().nullable(),
  errors: z.string(),
  expected_preview: z.string(),
  actual_preview: z.string().nullable(),
  judge_score: z.number().nullable(),
  judge_reason: z.string().nullable(),
  judge_model: z.string().nullable(),
});

export type ExportRow = z.infer<typeof exportRowSchema>;

/** JSON.stringify a JSON-column blob and truncate to ~200 chars. */
function preview(value: unknown): string {
  const json = JSON.stringify(value);
  return json.length > PREVIEW_LIMIT ? json.slice(0, PREVIEW_LIMIT) : json;
}

/**
 * The shape coming off the select, before validation. Typing it explicitly
 * keeps the row construction honest without a single `any`.
 */
interface RawExportRow {
  suite: string;
  runId: number;
  promptVersion: string;
  sha: string;
  startedAt: Date;
  caseId: string;
  label: string | null;
  verdict: string;
  caseScore: number;
  scorer: string;
  scorerPass: boolean;
  scorerScore: number;
  detail: string | null;
  errors: string[];
  expected: unknown;
  actual: unknown;
  judgeScore: number | null;
  judgeReason: string | null;
  judgeModel: string | null;
}

/** Project a raw DB row into the flat, validated export shape. */
function toExportRow(raw: RawExportRow): ExportRow {
  return exportRowSchema.parse({
    suite: raw.suite,
    run_id: raw.runId,
    prompt_version: raw.promptVersion,
    sha: raw.sha,
    started_at: raw.startedAt.toISOString(),
    case_id: raw.caseId,
    label: raw.label,
    verdict: raw.verdict,
    case_score: raw.caseScore,
    scorer: raw.scorer,
    scorer_pass: raw.scorerPass,
    scorer_score: raw.scorerScore,
    detail: raw.detail,
    errors: raw.errors.join(" | "),
    expected_preview: preview(raw.expected),
    actual_preview: raw.actual === null ? null : preview(raw.actual),
    judge_score: raw.judgeScore,
    judge_reason: raw.judgeReason,
    judge_model: raw.judgeModel,
  });
}

/**
 * The shared select: cases → case_results (one row per (case, scorer)),
 * LEFT JOIN judge_verdicts (+ judges for the model name) so a judge verdict
 * rides on each scorer row, INNER JOIN runs → prompt_versions → suites for the
 * run-level fields. Ordered by case then scorer for a stable file layout.
 */
function baseSelect() {
  return db
    .select({
      suite: suites.slug,
      runId: runs.id,
      promptVersion: promptVersions.label,
      sha: runs.sha,
      startedAt: runs.startedAt,
      caseId: cases.caseId,
      label: cases.label,
      verdict: cases.verdict,
      caseScore: cases.score,
      scorer: caseResults.scorerName,
      scorerPass: caseResults.pass,
      scorerScore: caseResults.score,
      detail: caseResults.detail,
      errors: caseResults.errors,
      expected: cases.expected,
      actual: cases.actual,
      judgeScore: judgeVerdicts.score,
      judgeReason: judgeVerdicts.reasoning,
      judgeModel: judges.name,
    })
    .from(cases)
    .innerJoin(caseResults, eq(caseResults.caseRowId, cases.id))
    .innerJoin(runs, eq(runs.id, cases.runId))
    .innerJoin(promptVersions, eq(promptVersions.id, runs.promptVersionId))
    .innerJoin(suites, eq(suites.id, runs.suiteId))
    .leftJoin(judgeVerdicts, eq(judgeVerdicts.caseRowId, cases.id))
    .leftJoin(judges, eq(judges.id, judgeVerdicts.judgeId));
}

/** Stable ordering for a deterministic file: case row id, then scorer name. */
const ORDER = [asc(cases.id), asc(caseResults.scorerName)] as const;

/** Every (case, scorer) export row for a single run. Empty when run unknown. */
export async function getRunExportRows(runId: number): Promise<ExportRow[]> {
  const raw = await baseSelect()
    .where(eq(cases.runId, runId))
    .orderBy(...ORDER);
  return raw.map(toExportRow);
}

/** Every (case, scorer) export row across every run, oldest run first. */
export async function getAllExportRows(): Promise<ExportRow[]> {
  const raw = await baseSelect().orderBy(asc(runs.id), ...ORDER);
  return raw.map(toExportRow);
}
