import { createHash } from "node:crypto";

import { type SuiteStatus } from "@/db/schema";
import { renderReport, type ReportHeader } from "@/lib/report/terminal";
import { type ActionResult, err, ok } from "@/lib/result";
import { RunnerError } from "@/lib/runner/errors";
import { makeTarget } from "@/lib/runner/factory";
import {
  type CaseOutcome,
  type Gate,
  exitCode as gateExitCode,
  scoreCase,
  summarizeRun,
} from "@/lib/scorers/aggregate";
import { judgeScorer } from "@/lib/scorers/judge";
import { buildScorers } from "@/lib/scorers/registry";
import { type Scorer } from "@/lib/scorers/types";
import { loadSuite, resolveTargetPath } from "@/lib/spec/load";
import { type CaseSpec, type ScorerSpec, type SuiteSpec } from "@/lib/spec/types";
import {
  type CaseSummaryInput,
  type ScorerResultInput,
  persistRun,
  upsertPromptVersion,
  upsertSuite,
} from "@/lib/store";

/* ------------------------------------------------------------------ */
/* `rubric run <suite>` — the core command.                             */
/*                                                                      */
/* load+validate spec → build scorers + target → for each case run the  */
/* target, score it, aggregate → (unless --no-store) persist the run →   */
/* render the terminal report → resolve to a process exit code by the    */
/* gate. Returns ActionResult: data.report is the string the CLI prints, */
/* data.exitCode is what bin/rubric.ts stamps onto process.exitCode.     */
/*                                                                      */
/* This handler owns its writes through lib/store (never a query module) */
/* per the repo's CLI-is-the-only-writer rule.                          */
/* ------------------------------------------------------------------ */

export interface RunOptions {
  /** Skip persistence — score + report only, leave the store untouched. */
  noStore?: boolean;
  /** Disable ANSI color in the rendered report. */
  noColor?: boolean;
  /** Minimum run-level pass-rate gate (0-1). Defaults to 1.0 (zero-regression). */
  floor?: number;
}

export interface RunResult {
  /** The rendered terminal report — printed verbatim by the CLI. */
  report: string;
  /** Process exit code: 0 green, 1 red (gate tripped). */
  exitCode: 0 | 1;
  /** New run id when persisted, null when --no-store. */
  runId: number | null;
}

/** Per-scorer gate floors, mirroring lib/queries/gating GATE_THRESHOLDS. */
const SCORER_FLOORS: Record<string, number> = {
  "field-accuracy": 0.95,
  "json-schema": 0.9,
  schema: 0.9,
};

const DEFAULT_SCORER_FLOOR = 0.9;
const DEFAULT_RUN_FLOOR = 1.0;

function buildGate(opts: RunOptions): Gate {
  return {
    floor: opts.floor ?? DEFAULT_RUN_FLOOR,
    scorerFloor: DEFAULT_SCORER_FLOOR,
    scorerFloors: SCORER_FLOORS,
  };
}

/**
 * Build every scorer for a suite. Deterministic scorers go through the registry;
 * `judge` scorers are built here (the registry refuses them — they need an LLM
 * client). The judge adapter is resolved lazily per call inside judgeScorer.
 */
function buildAllScorers(specs: readonly ScorerSpec[]): Scorer[] {
  const deterministic = specs.filter((s) => s.type !== "judge");
  const judges = specs.filter((s): s is Extract<ScorerSpec, { type: "judge" }> => s.type === "judge");

  // buildScorers also enforces unique names across the deterministic set.
  const built = buildScorers(deterministic);
  const seen = new Set(built.map((s) => s.name));
  for (const spec of judges) {
    if (seen.has(spec.name)) {
      throw new Error(`duplicate scorer name "${spec.name}"`);
    }
    seen.add(spec.name);
    built.push(judgeScorer(spec));
  }
  return built;
}

/** The expect slice handed to a scorer: case.expect keyed by the scorer's name. */
function expectFor(expect: CaseSpec["expect"], scorerName: string): unknown {
  return expect[scorerName];
}

/** Map an aggregate ScorerOutcome to the store's ScorerResultInput shape. */
function toScorerResultInputs(outcome: CaseOutcome): ScorerResultInput[] {
  return outcome.outcomes.map((o) => ({
    scorerName: o.name,
    pass: o.skipped ? false : o.result.pass,
    score: o.result.score,
    detail: o.result.detail,
    errors: o.result.errors,
    flippedFrom: null,
  }));
}

/** Map a scored case + its spec to the store's CaseSummaryInput. */
function toCaseSummaryInput(
  spec: CaseSpec,
  outcome: CaseOutcome,
  actual: unknown,
): CaseSummaryInput {
  return {
    caseId: spec.id,
    label: spec.label ?? null,
    input: spec.input,
    expected: spec.expect,
    actual,
    verdict: outcome.verdict,
    score: outcome.score,
    precondition: spec.precondition ?? null,
    scorers: toScorerResultInputs(outcome),
  };
}

/** Short, stable content sha of the suite spec — used as the run's `sha`. */
function specSha(spec: SuiteSpec): string {
  const hash = createHash("sha256").update(JSON.stringify(spec)).digest("hex");
  return hash.slice(0, 7);
}

/** Map a run summary's pass/skip mix to a suite grade. */
function gradeSuite(green: boolean, skippedCount: number, total: number): SuiteStatus {
  if (!green) return "regressed";
  if (skippedCount > 0 && skippedCount === total) return "partial";
  return "passing";
}

/** A one-line target description for the report header. */
function describeTarget(target: SuiteSpec["target"]): string {
  return target.kind === "fixture"
    ? `fixture ${target.path}`
    : `exec ${target.command}`;
}

/**
 * Run a suite end-to-end. Offline-capable: a fixture target replays a recorded
 * output with zero network, so a suite with only deterministic scorers runs with
 * no API calls. A target failure on one case fails THAT case (verdict "fail")
 * rather than crashing the whole run.
 */
export async function run(
  specPath: string,
  opts: RunOptions = {},
): Promise<ActionResult<RunResult>> {
  const loaded = loadSuite(specPath);
  if (!loaded.ok) return err(loaded.error);
  const { spec, cases, suiteDir } = loaded.data;

  let scorers: Scorer[];
  let target: ReturnType<typeof makeTarget>;
  try {
    scorers = buildAllScorers(spec.scorers);
    target = makeTarget(resolveTargetPath(spec.target, suiteDir));
  } catch (e) {
    return err(e instanceof Error ? e.message : "failed to build suite");
  }

  const startedAt = new Date();
  const outcomes: CaseOutcome[] = [];
  const summaries: CaseSummaryInput[] = [];

  for (const c of cases) {
    const ctx = { caseId: c.id, suite: spec.suite };
    // Each scorer reads its OWN slice of the case's expect blob, keyed by the
    // scorer's name (case.expect[scorerName]). The aggregate seam passes one
    // shared `expect`, so we bind the slice into each scorer up front and pass a
    // neutral expect to scoreCase.
    const sliced = scorers.map((s) => withExpectSlice(s, expectFor(c.expect, s.name)));

    let actual: unknown;
    try {
      actual = await target.run(c);
    } catch (e) {
      if (e instanceof RunnerError) {
        // A target failure is a case failure, not a run crash: synthesize a
        // failing outcome so the report shows the case as failed with no actual.
        const scored = await scoreCase(sliced, { ctx, actual: undefined, expect: undefined });
        const failed: CaseOutcome = { ...scored, verdict: "fail" };
        outcomes.push(failed);
        summaries.push(toCaseSummaryInput(c, failed, { error: e.message }));
        continue;
      }
      return err(e instanceof Error ? e.message : "target failed");
    }

    const outcome = await scoreCase(sliced, {
      ctx,
      actual,
      expect: undefined,
      preconditionMet: c.precondition === undefined ? undefined : true,
    });

    outcomes.push(outcome);
    summaries.push(toCaseSummaryInput(c, outcome, actual));
  }

  const summary = summarizeRun(outcomes);
  const gate = buildGate(opts);
  const exitCode = gateExitCode(summary, gate);
  const finishedAt = new Date();
  const wallMs = finishedAt.getTime() - startedAt.getTime();

  let runId: number | null = null;
  if (opts.noStore !== true) {
    const persisted = await persistSuiteRun({
      spec,
      summaries,
      summary,
      startedAt,
      finishedAt,
      wallMs,
      green: exitCode === 0,
    });
    if (!persisted.ok) return err(persisted.error);
    runId = persisted.data;
  }

  const header: ReportHeader = {
    suite: spec.suite,
    title: spec.title,
    promptVersion: spec.prompt.version,
    target: describeTarget(resolveTargetPath(spec.target, suiteDir)),
    sha: specSha(spec),
    branch: "local",
  };

  const report = renderReport({
    header,
    summary,
    cases: outcomes,
    gate,
    exitCode,
    wallMs,
    costUsd: 0,
    color: opts.noColor !== true,
  });

  return ok({ report, exitCode, runId });
}

/**
 * Wrap a scorer so it receives a fixed `expect` slice regardless of the blob the
 * aggregate passes. The aggregate hands every scorer the same case-level expect;
 * this proxy substitutes the per-scorer slice (case.expect[scorerName]).
 */
function withExpectSlice(scorer: Scorer, slice: unknown): Scorer {
  return {
    name: scorer.name,
    weight: scorer.weight,
    score: (actual, _expect, ctx) => scorer.score(actual, slice, ctx),
  };
}

interface PersistArgs {
  spec: SuiteSpec;
  summaries: CaseSummaryInput[];
  summary: ReturnType<typeof summarizeRun>;
  startedAt: Date;
  finishedAt: Date;
  wallMs: number;
  green: boolean;
}

/** Upsert the suite + prompt version, then persist the run. Wrapped for ActionResult. */
async function persistSuiteRun(args: PersistArgs): Promise<ActionResult<number>> {
  try {
    const suite = await upsertSuite({
      slug: args.spec.suite,
      title: args.spec.title,
      repo: args.spec.repo ?? "local",
    });
    const promptVersionId = await upsertPromptVersion({
      suiteId: suite.id,
      label: args.spec.prompt.version,
      body: args.spec.prompt.ref ?? args.spec.prompt.version,
      ref: args.spec.prompt.ref ?? null,
    });

    const suiteStatus = gradeSuite(
      args.green,
      args.summary.skippedCount,
      args.summary.total,
    );

    const result = await persistRun({
      suiteId: suite.id,
      promptVersionId,
      sha: specSha(args.spec),
      branch: "local",
      trigger: "manual",
      triggeredBy: "rubric run",
      status: "completed",
      costUsd: 0,
      wallMs: args.wallMs,
      startedAt: args.startedAt,
      finishedAt: args.finishedAt,
      suiteStatus,
      cases: args.summaries,
    });
    return ok(result.runId);
  } catch (e) {
    return err(e instanceof Error ? e.message : "failed to persist run");
  }
}
