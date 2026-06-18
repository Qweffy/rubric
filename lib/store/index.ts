// Package barrel for the SQLite write path — the store seam shared by the CLI
// (bin/rubric.ts, lib/commands/*) and the seed (db/seed.ts). Callers import the
// domain helpers from "@/lib/store"; the low-level insert* primitives live in
// ./primitives and are re-exported here for the seed, which writes table by
// table. Dashboard code never touches this module — it reads through
// lib/queries/* (a lint boundary forbids the reverse).

export { db } from "@/db";
export type { Executor } from "./executor";

// Low-level single-table primitives (idempotent, Executor-aware).
export {
  insertSuite,
  updateSuiteLatestRun,
  insertPromptVersion,
  insertRun,
  insertCase,
  insertCaseResult,
  insertJudge,
  insertJudgeVerdict,
  insertHumanLabel,
  insertCalibrationRun,
  insertTrajectoryTask,
  insertTrajectoryStep,
  insertErrorCluster,
} from "./primitives";

// Domain write helpers (defaults-filling, row-returning, transaction-composing).
export {
  upsertSuite,
  upsertPromptVersion,
  setSuiteLatestRun,
  suiteIdBySlug,
} from "./suites-writes";
export type {
  UpsertSuiteInput,
  UpsertPromptVersionInput,
} from "./suites-writes";

export { persistRun } from "./runs-writes";
export type {
  RunSummary,
  CaseSummaryInput,
  ScorerResultInput,
  PersistRunResult,
} from "./runs-writes";

export {
  upsertJudge,
  persistJudgeVerdict,
  persistHumanLabel,
  persistCalibrationRun,
} from "./judge-writes";
export type {
  UpsertJudgeInput,
  PersistJudgeVerdictInput,
  PersistHumanLabelInput,
  PersistCalibrationRunInput,
} from "./judge-writes";

export { persistTrajectoryTask } from "./trajectory-writes";
export type {
  TrajectoryTaskInput,
  TrajectoryStepInput,
  PersistTrajectoryResult,
} from "./trajectory-writes";
