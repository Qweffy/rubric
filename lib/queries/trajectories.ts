import { asc, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  suites,
  trajectorySteps,
  trajectoryTasks,
  type TrajectoryOutcome,
  type TrajectoryStepMatch,
} from "@/db/schema";

/* ------------------------------------------------------------------ */
/* Agent trajectories — tool-use sequences scored vs. a reference.      */
/* List view: one row per task with its tool-selection accuracy and     */
/* outcome. Detail view: the per-step expected-vs-actual alignment.     */
/* ------------------------------------------------------------------ */

export interface TrajectoryListItem {
  id: number;
  taskId: string;
  suiteSlug: string;
  suiteTitle: string;
  /** Owning run, null when the task isn't tied to a specific run. */
  runId: number | null;
  /** Reference tool sequence the agent was expected to take. */
  expectedTools: string[];
  /** Alignment of actual vs. expected tool sequence (0-1). */
  toolSelectionAccuracy: number;
  finalAnswerPass: boolean;
  outcome: TrajectoryOutcome;
  createdAt: Date;
}

/**
 * Every agent-trajectory task, newest-first, with its suite and headline
 * accuracy/outcome. Drives the trajectories index.
 */
export async function getTrajectories(): Promise<TrajectoryListItem[]> {
  return db
    .select({
      id: trajectoryTasks.id,
      taskId: trajectoryTasks.taskId,
      suiteSlug: suites.slug,
      suiteTitle: suites.title,
      runId: trajectoryTasks.runId,
      expectedTools: trajectoryTasks.expectedTools,
      toolSelectionAccuracy: trajectoryTasks.toolSelectionAccuracy,
      finalAnswerPass: trajectoryTasks.finalAnswerPass,
      outcome: trajectoryTasks.outcome,
      createdAt: trajectoryTasks.createdAt,
    })
    .from(trajectoryTasks)
    .innerJoin(suites, eq(suites.id, trajectoryTasks.suiteId))
    .orderBy(desc(trajectoryTasks.createdAt));
}

export interface TrajectoryStepDetail {
  idx: number;
  expectedTool: string | null;
  actualTool: string | null;
  /** JSON blobs — opaque here, rendered by the step inspector. */
  args: unknown;
  result: unknown;
  /** Edit-distance op vs. the expected sequence. */
  match: TrajectoryStepMatch;
}

export interface TrajectoryStepCounts {
  match: number;
  insert: number;
  delete: number;
  substitute: number;
}

export interface TrajectoryDetail {
  id: number;
  taskId: string;
  suiteSlug: string;
  suiteTitle: string;
  runId: number | null;
  expectedTools: string[];
  toolSelectionAccuracy: number;
  finalAnswerPass: boolean;
  outcome: TrajectoryOutcome;
  createdAt: Date;
  /** Ordered actual sequence the agent took. */
  actualTools: string[];
  /** Per-step alignment, ordered by idx. */
  steps: TrajectoryStepDetail[];
  /** Tally of alignment ops across the steps. */
  stepCounts: TrajectoryStepCounts;
}

/**
 * One trajectory task with its full step-by-step alignment. Keyed by the logical
 * taskId. When the same taskId exists under multiple suites, the newest task
 * wins. Returns null when the taskId is unknown.
 */
export async function getTrajectoryDetail(
  taskId: string,
): Promise<TrajectoryDetail | null> {
  const found = await db
    .select({
      id: trajectoryTasks.id,
      taskId: trajectoryTasks.taskId,
      suiteSlug: suites.slug,
      suiteTitle: suites.title,
      runId: trajectoryTasks.runId,
      expectedTools: trajectoryTasks.expectedTools,
      toolSelectionAccuracy: trajectoryTasks.toolSelectionAccuracy,
      finalAnswerPass: trajectoryTasks.finalAnswerPass,
      outcome: trajectoryTasks.outcome,
      createdAt: trajectoryTasks.createdAt,
    })
    .from(trajectoryTasks)
    .innerJoin(suites, eq(suites.id, trajectoryTasks.suiteId))
    .where(eq(trajectoryTasks.taskId, taskId))
    .orderBy(desc(trajectoryTasks.createdAt))
    .limit(1);

  const task = found[0];
  if (!task) return null;

  const stepRows = await db
    .select({
      idx: trajectorySteps.idx,
      expectedTool: trajectorySteps.expectedTool,
      actualTool: trajectorySteps.actualTool,
      args: trajectorySteps.args,
      result: trajectorySteps.result,
      match: trajectorySteps.match,
    })
    .from(trajectorySteps)
    .where(eq(trajectorySteps.taskId, task.id))
    .orderBy(asc(trajectorySteps.idx));

  const stepCounts: TrajectoryStepCounts = {
    match: 0,
    insert: 0,
    delete: 0,
    substitute: 0,
  };
  for (const s of stepRows) stepCounts[s.match] += 1;

  // Actual sequence: every step that observed a tool, in order. "delete" steps
  // (expected-but-absent) contribute no actual tool.
  const actualTools = stepRows
    .map((s) => s.actualTool)
    .filter((t): t is string => t !== null);

  return {
    id: task.id,
    taskId: task.taskId,
    suiteSlug: task.suiteSlug,
    suiteTitle: task.suiteTitle,
    runId: task.runId,
    expectedTools: task.expectedTools,
    toolSelectionAccuracy: task.toolSelectionAccuracy,
    finalAnswerPass: task.finalAnswerPass,
    outcome: task.outcome,
    createdAt: task.createdAt,
    actualTools,
    steps: stepRows,
    stepCounts,
  };
}
