import { relations } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// SQLite has no native enum type — unions are emulated as text().$type<Union>().
// Booleans are integer({ mode: "boolean" }), timestamps integer({ mode: "timestamp" }),
// and json blobs text({ mode: "json" }).$type<...>().

export type SuiteStatus =
  | "passing"
  | "regressed"
  | "partial"
  | "flaky"
  | "stale";
export type RunTrigger = "manual" | "ci" | "cron";
export type RunStatus = "running" | "completed" | "failed";
export type CaseVerdict = "pass" | "fail" | "skipped";
export type ScorerFlippedFrom = "pass" | "fail";
export type JudgeProvider = "groq" | "ollama" | "recorded";
export type JudgeStatus = "aligned" | "under-calibrated" | "biased" | "drifted";
export type HumanLabel = "pass" | "fail";
export type TrajectoryOutcome = "correct" | "diverged-but-correct" | "failed";
export type TrajectoryStepMatch = "match" | "insert" | "delete" | "substitute";

/** Per-case rubric verdict returned by a judge — one entry per criterion. */
export interface RubricResult {
  criterion: string;
  pass: boolean;
  weight?: number;
  note?: string;
}

/**
 * An eval suite — the top-level unit gated in CI. status reflects the latest run
 * relative to the suite's history; latestRunId points at the most recent run row
 * (nullable until the first run lands).
 */
export const suites = sqliteTable("suites", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  repo: text("repo").notNull(),
  status: text("status").$type<SuiteStatus>().notNull().default("passing"),
  latestRunId: integer("latest_run_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
}, (t) => [uniqueIndex("suites_slug_unique").on(t.slug)]);

/**
 * A versioned prompt under a suite. label is the human handle ("v3", "baseline");
 * ref pins it to a commit/tag when sourced from a repo. Unique on (suiteId, label)
 * so a label is stable within a suite.
 */
export const promptVersions = sqliteTable(
  "prompt_versions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    suiteId: integer("suite_id")
      .notNull()
      .references(() => suites.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    ref: text("ref"),
    body: text("body").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    uniqueIndex("prompt_versions_suite_label_unique").on(t.suiteId, t.label),
  ],
);

/**
 * One execution of a suite against a prompt version. Aggregate counts/rates accrue
 * as cases land; passRate/costUsd/wallMs summarize the whole run. finishedAt is
 * null while status is "running".
 */
export const runs = sqliteTable(
  "runs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    suiteId: integer("suite_id")
      .notNull()
      .references(() => suites.id, { onDelete: "cascade" }),
    promptVersionId: integer("prompt_version_id")
      .notNull()
      .references(() => promptVersions.id, { onDelete: "cascade" }),
    sha: text("sha").notNull(),
    branch: text("branch").notNull(),
    trigger: text("trigger").$type<RunTrigger>().notNull().default("manual"),
    triggeredBy: text("triggered_by"),
    status: text("status").$type<RunStatus>().notNull().default("running"),
    total: integer("total").notNull().default(0),
    passCount: integer("pass_count").notNull().default(0),
    failCount: integer("fail_count").notNull().default(0),
    skippedCount: integer("skipped_count").notNull().default(0),
    passRate: real("pass_rate").notNull().default(0),
    costUsd: real("cost_usd").notNull().default(0),
    wallMs: integer("wall_ms").notNull().default(0),
    startedAt: integer("started_at", { mode: "timestamp" }).notNull(),
    finishedAt: integer("finished_at", { mode: "timestamp" }),
  },
  (t) => [
    index("runs_suite_started_idx").on(t.suiteId, t.startedAt),
    index("runs_prompt_version_idx").on(t.promptVersionId),
  ],
);

/**
 * A single case within a run. input/expected/actual are arbitrary JSON blobs;
 * actual is null until the case executes. verdict + score are the case-level
 * outcome. Unique on (runId, caseId) so a logical case appears once per run.
 */
export const cases = sqliteTable(
  "cases",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    runId: integer("run_id")
      .notNull()
      .references(() => runs.id, { onDelete: "cascade" }),
    caseId: text("case_id").notNull(),
    label: text("label"),
    input: text("input", { mode: "json" }).$type<unknown>().notNull(),
    expected: text("expected", { mode: "json" }).$type<unknown>().notNull(),
    actual: text("actual", { mode: "json" }).$type<unknown>(),
    verdict: text("verdict").$type<CaseVerdict>().notNull(),
    score: real("score").notNull().default(0),
    precondition: text("precondition"),
  },
  (t) => [uniqueIndex("cases_run_case_unique").on(t.runId, t.caseId)],
);

/**
 * One scorer's result for a case. A case can have many scorers; pass/score are
 * that scorer's verdict. errors is a JSON string[]; flippedFrom records that this
 * scorer's verdict changed vs the prior run (null when stable). Unique on
 * (caseRowId, scorerName).
 */
export const caseResults = sqliteTable(
  "case_results",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    caseRowId: integer("case_row_id")
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
    scorerName: text("scorer_name").notNull(),
    pass: integer("pass", { mode: "boolean" }).notNull(),
    score: real("score").notNull().default(0),
    detail: text("detail"),
    errors: text("errors", { mode: "json" }).$type<string[]>().notNull(),
    latencyMs: integer("latency_ms"),
    flippedFrom: text("flipped_from").$type<ScorerFlippedFrom>(),
  },
  (t) => [
    uniqueIndex("case_results_case_scorer_unique").on(
      t.caseRowId,
      t.scorerName,
    ),
  ],
);

/**
 * An LLM-judge profile and its calibration metrics. kappa/agreement/biases are
 * the latest calibration outputs (null before first calibration). status grades
 * the judge; isDefault marks the judge used when none is specified. name unique.
 */
export const judges = sqliteTable(
  "judges",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    provider: text("provider").$type<JudgeProvider>().notNull(),
    kappa: real("kappa"),
    agreement: real("agreement"),
    falsePass: integer("false_pass"),
    falseFail: integer("false_fail"),
    posBias: real("pos_bias"),
    lengthBias: real("length_bias"),
    costPer1k: real("cost_per_1k"),
    latencyP50Ms: integer("latency_p50_ms"),
    status: text("status")
      .$type<JudgeStatus>()
      .notNull()
      .default("under-calibrated"),
    isDefault: integer("is_default", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [uniqueIndex("judges_name_unique").on(t.name)],
);

/**
 * One judge's verdict on a case. score is the rubric total; pass is the binary
 * call; rubricResults is the per-criterion breakdown (JSON). tokens/costUsd are
 * the judge-call accounting when the provider is live (null for "recorded").
 */
export const judgeVerdicts = sqliteTable(
  "judge_verdicts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    caseRowId: integer("case_row_id")
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
    judgeId: integer("judge_id")
      .notNull()
      .references(() => judges.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
    pass: integer("pass", { mode: "boolean" }).notNull(),
    rubricResults: text("rubric_results", { mode: "json" })
      .$type<RubricResult[]>()
      .notNull(),
    reasoning: text("reasoning"),
    tokens: integer("tokens"),
    costUsd: real("cost_usd"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("judge_verdicts_case_idx").on(t.caseRowId),
    index("judge_verdicts_judge_idx").on(t.judgeId),
  ],
);

/**
 * A human gold label for a logical case in a suite. label is the ground-truth
 * pass/fail; labeledBy records the annotator. Unique on (suiteId, caseId) so a
 * case has one canonical human verdict per suite.
 */
export const humanLabels = sqliteTable(
  "human_labels",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    suiteId: integer("suite_id")
      .notNull()
      .references(() => suites.id, { onDelete: "cascade" }),
    caseId: text("case_id").notNull(),
    label: text("label").$type<HumanLabel>().notNull(),
    labeledBy: text("labeled_by"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [uniqueIndex("human_labels_suite_case_unique").on(t.suiteId, t.caseId)],
);

/**
 * One calibration pass of a judge against a suite's human labels. n is the sample
 * size; tp/tn/fp/fn the confusion matrix; kappa/agreement the agreement metrics;
 * the bias columns + lengthR2 characterize systematic skew.
 */
export const calibrationRuns = sqliteTable(
  "calibration_runs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    suiteId: integer("suite_id")
      .notNull()
      .references(() => suites.id, { onDelete: "cascade" }),
    judgeId: integer("judge_id")
      .notNull()
      .references(() => judges.id, { onDelete: "cascade" }),
    n: integer("n").notNull(),
    tp: integer("tp").notNull(),
    tn: integer("tn").notNull(),
    fp: integer("fp").notNull(),
    fn: integer("fn").notNull(),
    kappa: real("kappa").notNull(),
    agreement: real("agreement").notNull(),
    posBias: real("pos_bias"),
    lengthBias: real("length_bias"),
    lengthR2: real("length_r2"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("calibration_runs_suite_idx").on(t.suiteId),
    index("calibration_runs_judge_idx").on(t.judgeId),
  ],
);

/**
 * An agent-trajectory task under a suite, optionally tied to a run. expectedTools
 * is the reference tool sequence (JSON string[]); toolSelectionAccuracy scores the
 * actual vs expected alignment; outcome grades the end-to-end result.
 */
export const trajectoryTasks = sqliteTable(
  "trajectory_tasks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    suiteId: integer("suite_id")
      .notNull()
      .references(() => suites.id, { onDelete: "cascade" }),
    runId: integer("run_id").references(() => runs.id, { onDelete: "set null" }),
    taskId: text("task_id").notNull(),
    expectedTools: text("expected_tools", { mode: "json" })
      .$type<string[]>()
      .notNull(),
    toolSelectionAccuracy: real("tool_selection_accuracy").notNull(),
    finalAnswerPass: integer("final_answer_pass", {
      mode: "boolean",
    }).notNull(),
    outcome: text("outcome").$type<TrajectoryOutcome>().notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("trajectory_tasks_suite_idx").on(t.suiteId),
    index("trajectory_tasks_run_idx").on(t.runId),
  ],
);

/**
 * One ordered step of a trajectory task (idx). expectedTool/actualTool name the
 * reference vs observed tool; args/result are JSON blobs; match is the edit-distance
 * alignment op vs the expected sequence. Unique on (taskId, idx).
 */
export const trajectorySteps = sqliteTable(
  "trajectory_steps",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    taskId: integer("task_id")
      .notNull()
      .references(() => trajectoryTasks.id, { onDelete: "cascade" }),
    idx: integer("idx").notNull(),
    expectedTool: text("expected_tool"),
    actualTool: text("actual_tool"),
    args: text("args", { mode: "json" }).$type<unknown>().notNull(),
    result: text("result", { mode: "json" }).$type<unknown>().notNull(),
    match: text("match").$type<TrajectoryStepMatch>().notNull(),
  },
  (t) => [uniqueIndex("trajectory_steps_task_idx_unique").on(t.taskId, t.idx)],
);

/**
 * A cluster of related failures within a run, surfaced in the Error Workbench.
 * size is the member count; dominantScorer/mode characterize the failure pattern;
 * sharedTraits + caseIds (JSON string[]) enumerate the cluster; inGoldenSet marks
 * clusters promoted into the regression golden set.
 */
export const errorClusters = sqliteTable(
  "error_clusters",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    runId: integer("run_id")
      .notNull()
      .references(() => runs.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    size: integer("size").notNull(),
    dominantScorer: text("dominant_scorer").notNull(),
    mode: text("mode").notNull(),
    sharedTraits: text("shared_traits", { mode: "json" })
      .$type<string[]>()
      .notNull(),
    caseIds: text("case_ids", { mode: "json" }).$type<string[]>().notNull(),
    inGoldenSet: integer("in_golden_set", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [index("error_clusters_run_idx").on(t.runId)],
);

// ─── relations ──────────────────────────────────────────────────────────────

export const suitesRelations = relations(suites, ({ one, many }) => ({
  latestRun: one(runs, {
    fields: [suites.latestRunId],
    references: [runs.id],
  }),
  promptVersions: many(promptVersions),
  runs: many(runs),
  humanLabels: many(humanLabels),
  calibrationRuns: many(calibrationRuns),
  trajectoryTasks: many(trajectoryTasks),
}));

export const promptVersionsRelations = relations(
  promptVersions,
  ({ one, many }) => ({
    suite: one(suites, {
      fields: [promptVersions.suiteId],
      references: [suites.id],
    }),
    runs: many(runs),
  }),
);

export const runsRelations = relations(runs, ({ one, many }) => ({
  suite: one(suites, {
    fields: [runs.suiteId],
    references: [suites.id],
  }),
  promptVersion: one(promptVersions, {
    fields: [runs.promptVersionId],
    references: [promptVersions.id],
  }),
  cases: many(cases),
  trajectoryTasks: many(trajectoryTasks),
  errorClusters: many(errorClusters),
}));

export const casesRelations = relations(cases, ({ one, many }) => ({
  run: one(runs, {
    fields: [cases.runId],
    references: [runs.id],
  }),
  results: many(caseResults),
  judgeVerdicts: many(judgeVerdicts),
}));

export const caseResultsRelations = relations(caseResults, ({ one }) => ({
  case: one(cases, {
    fields: [caseResults.caseRowId],
    references: [cases.id],
  }),
}));

export const judgesRelations = relations(judges, ({ many }) => ({
  verdicts: many(judgeVerdicts),
  calibrationRuns: many(calibrationRuns),
}));

export const judgeVerdictsRelations = relations(judgeVerdicts, ({ one }) => ({
  case: one(cases, {
    fields: [judgeVerdicts.caseRowId],
    references: [cases.id],
  }),
  judge: one(judges, {
    fields: [judgeVerdicts.judgeId],
    references: [judges.id],
  }),
}));

export const humanLabelsRelations = relations(humanLabels, ({ one }) => ({
  suite: one(suites, {
    fields: [humanLabels.suiteId],
    references: [suites.id],
  }),
}));

export const calibrationRunsRelations = relations(
  calibrationRuns,
  ({ one }) => ({
    suite: one(suites, {
      fields: [calibrationRuns.suiteId],
      references: [suites.id],
    }),
    judge: one(judges, {
      fields: [calibrationRuns.judgeId],
      references: [judges.id],
    }),
  }),
);

export const trajectoryTasksRelations = relations(
  trajectoryTasks,
  ({ one, many }) => ({
    suite: one(suites, {
      fields: [trajectoryTasks.suiteId],
      references: [suites.id],
    }),
    run: one(runs, {
      fields: [trajectoryTasks.runId],
      references: [runs.id],
    }),
    steps: many(trajectorySteps),
  }),
);

export const trajectoryStepsRelations = relations(
  trajectorySteps,
  ({ one }) => ({
    task: one(trajectoryTasks, {
      fields: [trajectorySteps.taskId],
      references: [trajectoryTasks.id],
    }),
  }),
);

export const errorClustersRelations = relations(errorClusters, ({ one }) => ({
  run: one(runs, {
    fields: [errorClusters.runId],
    references: [runs.id],
  }),
}));

// ─── inferred Select/Insert types ─────────────────────────────────────────────

export type Suite = typeof suites.$inferSelect;
export type NewSuite = typeof suites.$inferInsert;

export type PromptVersion = typeof promptVersions.$inferSelect;
export type NewPromptVersion = typeof promptVersions.$inferInsert;

export type Run = typeof runs.$inferSelect;
export type NewRun = typeof runs.$inferInsert;

export type Case = typeof cases.$inferSelect;
export type NewCase = typeof cases.$inferInsert;

export type CaseResult = typeof caseResults.$inferSelect;
export type NewCaseResult = typeof caseResults.$inferInsert;

export type Judge = typeof judges.$inferSelect;
export type NewJudge = typeof judges.$inferInsert;

export type JudgeVerdict = typeof judgeVerdicts.$inferSelect;
export type NewJudgeVerdict = typeof judgeVerdicts.$inferInsert;

export type HumanLabelRow = typeof humanLabels.$inferSelect;
export type NewHumanLabelRow = typeof humanLabels.$inferInsert;

export type CalibrationRun = typeof calibrationRuns.$inferSelect;
export type NewCalibrationRun = typeof calibrationRuns.$inferInsert;

export type TrajectoryTask = typeof trajectoryTasks.$inferSelect;
export type NewTrajectoryTask = typeof trajectoryTasks.$inferInsert;

export type TrajectoryStep = typeof trajectorySteps.$inferSelect;
export type NewTrajectoryStep = typeof trajectorySteps.$inferInsert;

export type ErrorCluster = typeof errorClusters.$inferSelect;
export type NewErrorCluster = typeof errorClusters.$inferInsert;
