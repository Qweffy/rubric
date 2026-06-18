import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  calibrationRuns,
  cases,
  humanLabels,
  judges,
  judgeVerdicts,
  runs,
  suites,
  type HumanLabel,
  type JudgeProvider,
  type JudgeStatus,
} from "@/db/schema";

/* ------------------------------------------------------------------ */
/* Calibration — a judge measured against human gold labels.            */
/* Cohen's kappa, raw agreement, the TP/TN/FP/FN confusion matrix,      */
/* bias signals, and a list of judge↔human disagreements to inspect.    */
/* ------------------------------------------------------------------ */

export interface ConfusionMatrix {
  /** Judge pass, human pass. */
  tp: number;
  /** Judge fail, human fail. */
  tn: number;
  /** Judge pass, human fail — the false-positive (over-lenient) cell. */
  fp: number;
  /** Judge fail, human pass — the false-negative (over-strict) cell. */
  fn: number;
}

export interface CalibrationBias {
  /** Tendency to skew positive (pass) regardless of merit, null if unmeasured. */
  posBias: number | null;
  /** Correlation of pass with candidate length, null if unmeasured. */
  lengthBias: number | null;
  /** R² of the length-bias fit, null if unmeasured. */
  lengthR2: number | null;
}

export interface Disagreement {
  caseRowId: number;
  caseId: string;
  suiteSlug: string;
  /** What the judge called it. */
  judgeLabel: HumanLabel;
  /** What the human called it. */
  humanLabel: HumanLabel;
  /** The judge's rubric score. */
  judgeScore: number;
  reasoning: string | null;
}

export interface JudgeCalibration {
  judgeId: number;
  judgeName: string;
  provider: JudgeProvider;
  status: JudgeStatus;
  isDefault: boolean;
  /** Latest calibration sample size, null when never calibrated. */
  n: number | null;
  kappa: number | null;
  agreement: number | null;
  confusion: ConfusionMatrix | null;
  bias: CalibrationBias;
  costPer1k: number | null;
  latencyP50Ms: number | null;
  /** Judge↔human mismatches from the calibrated suites, newest-first. */
  disagreements: Disagreement[];
}

/**
 * One judge's calibration profile: its latest calibration run (kappa, agreement,
 * confusion, bias) plus the concrete cases where it disagreed with the human
 * gold label. Keyed by judge name. Returns null when the name is unknown.
 */
export async function getCalibration(
  judgeName: string,
): Promise<JudgeCalibration | null> {
  const found = await db
    .select({
      id: judges.id,
      name: judges.name,
      provider: judges.provider,
      status: judges.status,
      isDefault: judges.isDefault,
      costPer1k: judges.costPer1k,
      latencyP50Ms: judges.latencyP50Ms,
    })
    .from(judges)
    .where(eq(judges.name, judgeName))
    .limit(1);

  const judge = found[0];
  if (!judge) return null;

  // Latest calibration run for this judge across any suite.
  const calRows = await db
    .select({
      n: calibrationRuns.n,
      tp: calibrationRuns.tp,
      tn: calibrationRuns.tn,
      fp: calibrationRuns.fp,
      fn: calibrationRuns.fn,
      kappa: calibrationRuns.kappa,
      agreement: calibrationRuns.agreement,
      posBias: calibrationRuns.posBias,
      lengthBias: calibrationRuns.lengthBias,
      lengthR2: calibrationRuns.lengthR2,
    })
    .from(calibrationRuns)
    .where(eq(calibrationRuns.judgeId, judge.id))
    .orderBy(desc(calibrationRuns.createdAt))
    .limit(1);

  const cal = calRows[0] ?? null;

  const disagreements = await getDisagreements(judge.id);

  return {
    judgeId: judge.id,
    judgeName: judge.name,
    provider: judge.provider,
    status: judge.status,
    isDefault: judge.isDefault,
    n: cal?.n ?? null,
    kappa: cal?.kappa ?? null,
    agreement: cal?.agreement ?? null,
    confusion: cal
      ? { tp: cal.tp, tn: cal.tn, fp: cal.fp, fn: cal.fn }
      : null,
    bias: {
      posBias: cal?.posBias ?? null,
      lengthBias: cal?.lengthBias ?? null,
      lengthR2: cal?.lengthR2 ?? null,
    },
    costPer1k: judge.costPer1k,
    latencyP50Ms: judge.latencyP50Ms,
    disagreements,
  };
}

/** How many disagreements to surface per judge in the calibration view. */
export const DISAGREEMENT_LIMIT = 50;

/**
 * Cases where this judge's pass/fail differs from the human gold label. Joins
 * judge verdicts to human labels by (suiteId, caseId), keeping only mismatches.
 */
async function getDisagreements(judgeId: number): Promise<Disagreement[]> {
  const rows = await db
    .select({
      caseRowId: judgeVerdicts.caseRowId,
      caseId: cases.caseId,
      suiteSlug: suites.slug,
      judgePass: judgeVerdicts.pass,
      humanLabel: humanLabels.label,
      judgeScore: judgeVerdicts.score,
      reasoning: judgeVerdicts.reasoning,
      createdAt: judgeVerdicts.createdAt,
    })
    .from(judgeVerdicts)
    .innerJoin(cases, eq(cases.id, judgeVerdicts.caseRowId))
    .innerJoin(runs, eq(runs.id, cases.runId))
    .innerJoin(suites, eq(suites.id, runs.suiteId))
    .innerJoin(
      humanLabels,
      and(
        eq(humanLabels.suiteId, suites.id),
        eq(humanLabels.caseId, cases.caseId),
      ),
    )
    .where(eq(judgeVerdicts.judgeId, judgeId))
    .orderBy(desc(judgeVerdicts.createdAt));

  const out: Disagreement[] = [];
  for (const r of rows) {
    const judgeLabel: HumanLabel = r.judgePass ? "pass" : "fail";
    if (judgeLabel === r.humanLabel) continue;
    out.push({
      caseRowId: r.caseRowId,
      caseId: r.caseId,
      suiteSlug: r.suiteSlug,
      judgeLabel,
      humanLabel: r.humanLabel,
      judgeScore: r.judgeScore,
      reasoning: r.reasoning,
    });
    if (out.length >= DISAGREEMENT_LIMIT) break;
  }
  return out;
}

export interface JudgeComparisonRow {
  judgeId: number;
  judgeName: string;
  provider: JudgeProvider;
  status: JudgeStatus;
  isDefault: boolean;
  kappa: number | null;
  agreement: number | null;
  /** False-pass count from the judges table (latest calibration). */
  falsePass: number | null;
  /** False-fail count from the judges table (latest calibration). */
  falseFail: number | null;
  posBias: number | null;
  lengthBias: number | null;
  costPer1k: number | null;
  latencyP50Ms: number | null;
}

/**
 * Side-by-side comparison of every judge, for the model-comparison board (the
 * "4 judges" panel). Sorted default-first, then by kappa descending (nulls last).
 */
export async function getModelComparison(): Promise<JudgeComparisonRow[]> {
  const rows = await db
    .select({
      judgeId: judges.id,
      judgeName: judges.name,
      provider: judges.provider,
      status: judges.status,
      isDefault: judges.isDefault,
      kappa: judges.kappa,
      agreement: judges.agreement,
      falsePass: judges.falsePass,
      falseFail: judges.falseFail,
      posBias: judges.posBias,
      lengthBias: judges.lengthBias,
      costPer1k: judges.costPer1k,
      latencyP50Ms: judges.latencyP50Ms,
    })
    .from(judges);

  return rows.sort((a, b) => {
    if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
    const ka = a.kappa ?? -Infinity;
    const kb = b.kappa ?? -Infinity;
    if (ka !== kb) return kb - ka;
    return a.judgeName.localeCompare(b.judgeName);
  });
}
