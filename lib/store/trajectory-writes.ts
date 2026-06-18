import { db } from "@/db";
import {
  type TrajectoryOutcome,
  type TrajectoryStepMatch,
} from "@/db/schema";

import { insertTrajectoryStep, insertTrajectoryTask } from "./primitives";

/**
 * Persist an agent-trajectory task and its ordered steps atomically.
 *
 * persistTrajectoryTask wraps the task row plus all of its steps in one libSQL
 * transaction so a task is never visible with a partial step sequence. The task
 * is upserted on its natural key (suiteId, taskId, runId) via
 * the insertTrajectoryTask primitive; steps are idempotent against the
 * (taskId, idx) unique index, so re-persisting the same trajectory converges
 * instead of duplicating.
 */

/** One step of a trajectory, aligned against the expected tool sequence. */
export interface TrajectoryStepInput {
  idx: number;
  expectedTool?: string | null;
  actualTool?: string | null;
  args: unknown;
  result: unknown;
  match: TrajectoryStepMatch;
}

/** A trajectory task plus its full step sequence, ready to persist. */
export interface TrajectoryTaskInput {
  suiteId: number;
  /** Optional run this trajectory belongs to. */
  runId?: number | null;
  taskId: string;
  expectedTools: string[];
  /** Tool-selection accuracy of actual vs expected, normalized to [0, 1]. */
  toolSelectionAccuracy: number;
  finalAnswerPass: boolean;
  outcome: TrajectoryOutcome;
  steps: TrajectoryStepInput[];
}

export interface PersistTrajectoryResult {
  taskRowId: number;
  stepCount: number;
}

/**
 * Persist a trajectory task and its steps atomically. Returns the task row id
 * and the number of steps written.
 */
export async function persistTrajectoryTask(
  input: TrajectoryTaskInput,
): Promise<PersistTrajectoryResult> {
  return db.transaction(async (tx) => {
    const taskRowId = await insertTrajectoryTask(
      {
        suiteId: input.suiteId,
        runId: input.runId ?? null,
        taskId: input.taskId,
        expectedTools: input.expectedTools,
        toolSelectionAccuracy: input.toolSelectionAccuracy,
        finalAnswerPass: input.finalAnswerPass,
        outcome: input.outcome,
        createdAt: new Date(),
      },
      tx,
    );

    for (const step of input.steps) {
      await insertTrajectoryStep(
        {
          taskId: taskRowId,
          idx: step.idx,
          expectedTool: step.expectedTool ?? null,
          actualTool: step.actualTool ?? null,
          args: step.args,
          result: step.result,
          match: step.match,
        },
        tx,
      );
    }

    return { taskRowId, stepCount: input.steps.length };
  });
}
