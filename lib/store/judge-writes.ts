import { eq } from "drizzle-orm";

import { db } from "@/db";
import {
  calibrationRuns,
  judges,
  type CalibrationRun,
  type HumanLabel,
  type Judge,
  type JudgeProvider,
  type JudgeStatus,
  type RubricResult,
} from "@/db/schema";

import { type Executor } from "./executor";
import {
  insertCalibrationRun,
  insertHumanLabel,
  insertJudge,
  insertJudgeVerdict,
} from "./primitives";

/**
 * Domain write helpers for the judge / calibration subsystem, layered over the
 * insert* primitives. Judges and human labels upsert against a unique index, so
 * re-recording converges; verdicts and calibration runs always insert (no
 * natural unique key). persistCalibrationRun runs in a transaction because it
 * both inserts the calibration row AND denormalizes the latest metrics onto the
 * judge — the two must agree, so they commit together.
 */

export interface UpsertJudgeInput {
  name: string;
  provider: JudgeProvider;
  status?: JudgeStatus;
  isDefault?: boolean;
  costPer1k?: number | null;
  latencyP50Ms?: number | null;
}

/**
 * Insert or update a judge by its unique name. provider and the
 * cost/latency/default metadata refresh on conflict; the calibration metrics
 * (kappa/agreement/biases) are owned by persistCalibrationRun. Returns the row.
 */
export function upsertJudge(input: UpsertJudgeInput, exec: Executor = db): Judge {
  const id = insertJudge(
    {
      name: input.name,
      provider: input.provider,
      status: input.status ?? "under-calibrated",
      isDefault: input.isDefault ?? false,
      costPer1k: input.costPer1k ?? null,
      latencyP50Ms: input.latencyP50Ms ?? null,
      createdAt: new Date(),
    },
    exec,
  );

  const row = exec.select().from(judges).where(eq(judges.id, id)).limit(1).get();
  if (row === undefined) throw new Error("judge upsert returned no row");
  return row;
}

export interface PersistJudgeVerdictInput {
  caseRowId: number;
  judgeId: number;
  score: number;
  pass: boolean;
  rubricResults: RubricResult[];
  reasoning?: string | null;
  tokens?: number | null;
  costUsd?: number | null;
}

/**
 * Record one judge's verdict for a case. There is no unique index on
 * (caseRowId, judgeId) — a judge may legitimately re-grade across calibration
 * passes — so this always inserts. Returns the new verdict id.
 */
export function persistJudgeVerdict(
  input: PersistJudgeVerdictInput,
  exec: Executor = db,
): number {
  return insertJudgeVerdict(
    {
      caseRowId: input.caseRowId,
      judgeId: input.judgeId,
      score: input.score,
      pass: input.pass,
      rubricResults: input.rubricResults,
      reasoning: input.reasoning ?? null,
      tokens: input.tokens ?? null,
      costUsd: input.costUsd ?? null,
      createdAt: new Date(),
    },
    exec,
  );
}

export interface PersistHumanLabelInput {
  suiteId: number;
  caseId: string;
  label: HumanLabel;
  labeledBy?: string | null;
}

/**
 * Upsert a human gold label on the (suiteId, caseId) unique index so a case has
 * one canonical verdict per suite. A re-label overwrites the prior verdict and
 * annotator. Returns the persisted label id.
 */
export function persistHumanLabel(
  input: PersistHumanLabelInput,
  exec: Executor = db,
): number {
  return insertHumanLabel(
    {
      suiteId: input.suiteId,
      caseId: input.caseId,
      label: input.label,
      labeledBy: input.labeledBy ?? null,
      createdAt: new Date(),
    },
    exec,
  );
}

export interface PersistCalibrationRunInput {
  suiteId: number;
  judgeId: number;
  n: number;
  tp: number;
  tn: number;
  fp: number;
  fn: number;
  kappa: number;
  agreement: number;
  posBias?: number | null;
  lengthBias?: number | null;
  lengthR2?: number | null;
  /** Grade to stamp on the judge from this calibration pass. */
  judgeStatus: JudgeStatus;
}

/**
 * Persist a calibration pass and denormalize its metrics onto the judge in one
 * transaction. The calibration_runs row is the immutable history; the judge row
 * carries the latest snapshot (kappa/agreement/false-pass/false-fail/biases +
 * status) used by reads that don't want to re-query history. Both commit
 * together so the judge never points at a calibration it doesn't carry. Returns
 * the persisted calibration row.
 */
export function persistCalibrationRun(
  input: PersistCalibrationRunInput,
): CalibrationRun {
  return db.transaction((tx) => {
    const id = insertCalibrationRun(
      {
        suiteId: input.suiteId,
        judgeId: input.judgeId,
        n: input.n,
        tp: input.tp,
        tn: input.tn,
        fp: input.fp,
        fn: input.fn,
        kappa: input.kappa,
        agreement: input.agreement,
        posBias: input.posBias ?? null,
        lengthBias: input.lengthBias ?? null,
        lengthR2: input.lengthR2 ?? null,
        createdAt: new Date(),
      },
      tx,
    );

    tx
      .update(judges)
      .set({
        kappa: input.kappa,
        agreement: input.agreement,
        falsePass: input.fp,
        falseFail: input.fn,
        posBias: input.posBias ?? null,
        lengthBias: input.lengthBias ?? null,
        status: input.judgeStatus,
      })
      .where(eq(judges.id, input.judgeId))
      .run();

    const row = tx
      .select()
      .from(calibrationRuns)
      .where(eq(calibrationRuns.id, id))
      .limit(1)
      .get();
    if (row === undefined) {
      throw new Error("calibration run insert returned no row");
    }
    return row;
  });
}
