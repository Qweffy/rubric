// Low-level, single-table write primitives for the SQLite store. libSQL IS
// transactional (unlike neon-http) but async, so every primitive is async and
// takes an `Executor` (the base `db` or a `tx`) — that's what lets the
// higher-level persist* helpers (runs/judge/trajectory-writes) compose them
// inside one transaction. Each primitive is an idempotent upsert keyed on a
// unique index, or a look-up-then-update for tables without a natural unique
// index, so a re-seed or a replayed eval never double-writes.
//
// The domain modules import from here; the package barrel (index.ts) re-exports
// the domain API. Callers import from "@/lib/store", not this file directly.
import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import {
  calibrationRuns,
  caseResults,
  cases,
  errorClusters,
  humanLabels,
  judges,
  judgeVerdicts,
  promptVersions,
  runs,
  suites,
  trajectorySteps,
  trajectoryTasks,
  type NewCalibrationRun,
  type NewCase,
  type NewCaseResult,
  type NewErrorCluster,
  type NewHumanLabelRow,
  type NewJudge,
  type NewJudgeVerdict,
  type NewPromptVersion,
  type NewRun,
  type NewSuite,
  type NewTrajectoryStep,
  type NewTrajectoryTask,
} from "@/db/schema";

import { type Executor } from "./executor";

export { db };
export type { Executor };

function requireId(id: number | undefined, what: string): number {
  if (id === undefined) throw new Error(`${what} write returned no row`);
  return id;
}

/** Insert a suite, or update the existing row on its unique slug. Returns the id. */
export async function insertSuite(input: NewSuite, exec: Executor = db): Promise<number> {
  const row = await exec
    .insert(suites)
    .values(input)
    .onConflictDoUpdate({
      target: suites.slug,
      set: {
        title: input.title,
        repo: input.repo,
        status: input.status,
        latestRunId: input.latestRunId,
        updatedAt: input.updatedAt,
      },
    })
    .returning({ id: suites.id })
    .get();
  return requireId(row.id, "suite");
}

/** Point a suite at its latest run (a second pass once the run row exists). */
export async function updateSuiteLatestRun(
  suiteId: number,
  latestRunId: number,
  status: NewSuite["status"],
  updatedAt: Date,
  exec: Executor = db,
): Promise<void> {
  await exec
    .update(suites)
    .set({ latestRunId, status, updatedAt })
    .where(eq(suites.id, suiteId))
    .run();
}

/** Insert a prompt version, or update on its unique (suiteId, label). Returns the id. */
export async function insertPromptVersion(
  input: NewPromptVersion,
  exec: Executor = db,
): Promise<number> {
  const row = await exec
    .insert(promptVersions)
    .values(input)
    .onConflictDoUpdate({
      target: [promptVersions.suiteId, promptVersions.label],
      set: { ref: input.ref, body: input.body, createdAt: input.createdAt },
    })
    .returning({ id: promptVersions.id })
    .get();
  return requireId(row.id, "prompt version");
}

/** Insert a run row. runs has no natural unique key, so this always inserts. */
export async function insertRun(input: NewRun, exec: Executor = db): Promise<number> {
  const row = await exec
    .insert(runs)
    .values(input)
    .returning({ id: runs.id })
    .get();
  return requireId(row.id, "run");
}

/** Insert a case, or update on its unique (runId, caseId). Returns the case row id. */
export async function insertCase(input: NewCase, exec: Executor = db): Promise<number> {
  const row = await exec
    .insert(cases)
    .values(input)
    .onConflictDoUpdate({
      target: [cases.runId, cases.caseId],
      set: {
        label: input.label,
        input: input.input,
        expected: input.expected,
        actual: input.actual,
        verdict: input.verdict,
        score: input.score,
        precondition: input.precondition,
      },
    })
    .returning({ id: cases.id })
    .get();
  return requireId(row.id, "case");
}

/** Insert a scorer result, or update on its unique (caseRowId, scorerName). */
export async function insertCaseResult(
  input: NewCaseResult,
  exec: Executor = db,
): Promise<void> {
  await exec
    .insert(caseResults)
    .values(input)
    .onConflictDoUpdate({
      target: [caseResults.caseRowId, caseResults.scorerName],
      set: {
        pass: input.pass,
        score: input.score,
        detail: input.detail,
        errors: input.errors,
        latencyMs: input.latencyMs,
        flippedFrom: input.flippedFrom,
      },
    })
    .run();
}

/** Insert a judge, or update on its unique name. Returns the judge id. */
export async function insertJudge(input: NewJudge, exec: Executor = db): Promise<number> {
  const row = await exec
    .insert(judges)
    .values(input)
    .onConflictDoUpdate({
      target: judges.name,
      set: {
        provider: input.provider,
        kappa: input.kappa,
        agreement: input.agreement,
        falsePass: input.falsePass,
        falseFail: input.falseFail,
        posBias: input.posBias,
        lengthBias: input.lengthBias,
        costPer1k: input.costPer1k,
        latencyP50Ms: input.latencyP50Ms,
        status: input.status,
        isDefault: input.isDefault,
        createdAt: input.createdAt,
      },
    })
    .returning({ id: judges.id })
    .get();
  return requireId(row.id, "judge");
}

/** Insert a judge verdict. No natural unique key, so this always inserts. */
export async function insertJudgeVerdict(
  input: NewJudgeVerdict,
  exec: Executor = db,
): Promise<number> {
  const row = await exec
    .insert(judgeVerdicts)
    .values(input)
    .returning({ id: judgeVerdicts.id })
    .get();
  return requireId(row.id, "judge verdict");
}

/** Insert a human label, or update on its unique (suiteId, caseId). Returns the id. */
export async function insertHumanLabel(
  input: NewHumanLabelRow,
  exec: Executor = db,
): Promise<number> {
  const row = await exec
    .insert(humanLabels)
    .values(input)
    .onConflictDoUpdate({
      target: [humanLabels.suiteId, humanLabels.caseId],
      set: { label: input.label, labeledBy: input.labeledBy },
    })
    .returning({ id: humanLabels.id })
    .get();
  return requireId(row.id, "human label");
}

/** Insert a calibration run. No natural unique key, so this always inserts. */
export async function insertCalibrationRun(
  input: NewCalibrationRun,
  exec: Executor = db,
): Promise<number> {
  const row = await exec
    .insert(calibrationRuns)
    .values(input)
    .returning({ id: calibrationRuns.id })
    .get();
  return requireId(row.id, "calibration run");
}

/**
 * Insert a trajectory task, or update the existing row identified by its natural
 * key (suiteId, taskId, runId — which may be null). trajectoryTasks has no
 * unique index, so identity is resolved by look-up. Returns the task row id.
 */
export async function insertTrajectoryTask(
  input: NewTrajectoryTask,
  exec: Executor = db,
): Promise<number> {
  const runId = input.runId ?? null;
  const existing = await exec
    .select({ id: trajectoryTasks.id })
    .from(trajectoryTasks)
    .where(
      and(
        eq(trajectoryTasks.suiteId, input.suiteId),
        eq(trajectoryTasks.taskId, input.taskId),
        runId === null
          ? isNull(trajectoryTasks.runId)
          : eq(trajectoryTasks.runId, runId),
      ),
    )
    .limit(1)
    .get();

  if (existing !== undefined) {
    await exec
      .update(trajectoryTasks)
      .set(input)
      .where(eq(trajectoryTasks.id, existing.id))
      .run();
    return existing.id;
  }

  const row = await exec
    .insert(trajectoryTasks)
    .values(input)
    .returning({ id: trajectoryTasks.id })
    .get();
  return requireId(row.id, "trajectory task");
}

/** Insert a trajectory step, or update on its unique (taskId, idx). */
export async function insertTrajectoryStep(
  input: NewTrajectoryStep,
  exec: Executor = db,
): Promise<void> {
  await exec
    .insert(trajectorySteps)
    .values(input)
    .onConflictDoUpdate({
      target: [trajectorySteps.taskId, trajectorySteps.idx],
      set: {
        expectedTool: input.expectedTool,
        actualTool: input.actualTool,
        args: input.args,
        result: input.result,
        match: input.match,
      },
    })
    .run();
}

/**
 * Insert an error cluster, or update the existing row identified by its natural
 * key (runId, name). errorClusters has no unique index, so identity is resolved
 * by look-up — re-seeding the same cluster updates it in place.
 */
export async function insertErrorCluster(
  input: NewErrorCluster,
  exec: Executor = db,
): Promise<number> {
  const existing = await exec
    .select({ id: errorClusters.id })
    .from(errorClusters)
    .where(
      and(eq(errorClusters.runId, input.runId), eq(errorClusters.name, input.name)),
    )
    .limit(1)
    .get();

  if (existing !== undefined) {
    await exec
      .update(errorClusters)
      .set(input)
      .where(eq(errorClusters.id, existing.id))
      .run();
    return existing.id;
  }

  const row = await exec
    .insert(errorClusters)
    .values(input)
    .returning({ id: errorClusters.id })
    .get();
  return requireId(row.id, "error cluster");
}
