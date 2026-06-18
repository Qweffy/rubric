// Seeds the canonical demo dataset — the single source of truth behind every
// dashboard screen. Run with `npm run seed` (tsx). Idempotent: re-running
// converges on the same rows instead of duplicating, so it's safe to re-seed
// after a schema push or a pull.
//
// Import order is load-bearing: "@/lib/env" runs FIRST (side-effect import) so
// RUBRIC_DB is in process.env before "@/db" opens the SQLite connection at
// module load; only then do we pull in the store writers.
import "@/lib/env";

import { and, eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import { db } from "@/db";
import {
  calibrationRuns as calibrationRunsTable,
  cases as casesTable,
  errorClusters as errorClustersTable,
  runs as runsTable,
  type CaseVerdict,
  type ScorerFlippedFrom,
  type SuiteStatus,
} from "@/db/schema";
import {
  persistCalibrationRun,
  persistHumanLabel,
  persistJudgeVerdict,
  persistRun,
  persistTrajectoryTask,
  setSuiteLatestRun,
  upsertJudge,
  upsertPromptVersion,
  upsertSuite,
  type CaseSummaryInput,
  type ScorerResultInput,
} from "@/lib/store";

/* ------------------------------------------------------------------ */
/* The four canonical scorer columns, in display order.                 */
/* schema · exact-match · field-accuracy · judge (the violet/AI one).   */
/* ------------------------------------------------------------------ */
type ScorerName = "schema" | "exact-match" | "field-accuracy" | "judge";
const SCORERS: ScorerName[] = ["schema", "exact-match", "field-accuracy", "judge"];

/* ------------------------------------------------------------------ */
/* Suites (6). Counts/rates are the pre-reconciled canonical values.    */
/* ------------------------------------------------------------------ */
interface SuiteSeed {
  slug: string;
  title: string;
  repo: string;
  status: SuiteStatus;
}

const SUITES: SuiteSeed[] = [
  {
    slug: "checkout-extraction",
    title: "Checkout field extraction",
    repo: "acme/checkout",
    status: "regressed",
  },
  {
    slug: "support-router",
    title: "Support ticket router",
    repo: "acme/support",
    status: "passing",
  },
  {
    slug: "invoice-parser",
    title: "Invoice parser",
    repo: "acme/invoice",
    status: "passing",
  },
  {
    slug: "refund-agent",
    title: "Refund agent (trajectories)",
    repo: "acme/refund",
    status: "partial",
  },
  {
    slug: "email-summarize",
    title: "Email summarizer",
    repo: "acme/email",
    status: "flaky",
  },
  {
    slug: "pii-redactor",
    title: "PII redactor",
    repo: "acme/pii",
    status: "stale",
  },
];

/* The non-hero suites get a single representative latest run so their
 * pass-rate / cost / sha / version on the Suites Overview reconcile. */
interface SimpleRunSeed {
  suiteSlug: string;
  versionLabel: string;
  versionBody: string;
  versionRef: string | null;
  sha: string;
  branch: string;
  passRate: number;
  total: number;
  costUsd: number;
  wallMs: number;
  startedAt: Date;
  suiteStatus: SuiteStatus;
  runStatus: "completed" | "failed";
}

const SIMPLE_RUNS: SimpleRunSeed[] = [
  {
    suiteSlug: "support-router",
    versionLabel: "v14",
    versionBody: "Route the ticket to the smallest sufficient queue. Prefer self-serve.",
    versionRef: null,
    sha: "9c2e7b1",
    branch: "main",
    passRate: 0.961,
    total: 180,
    costUsd: 0.41,
    wallMs: 22000,
    startedAt: new Date("2026-06-17T08:12:00Z"),
    suiteStatus: "passing",
    runStatus: "completed",
  },
  {
    suiteSlug: "invoice-parser",
    versionLabel: "v8",
    versionBody: "Extract invoice header + line items as strict JSON. Never guess a total.",
    versionRef: null,
    sha: "4471aa2",
    branch: "main",
    passRate: 0.99,
    total: 200,
    costUsd: 0.55,
    wallMs: 26000,
    startedAt: new Date("2026-06-17T06:40:00Z"),
    suiteStatus: "passing",
    runStatus: "completed",
  },
  {
    suiteSlug: "refund-agent",
    versionLabel: "v6",
    versionBody: "Use the refund tools in order. Confirm eligibility before issuing.",
    versionRef: null,
    sha: "bb71e03",
    branch: "main",
    passRate: 0.824,
    total: 40,
    costUsd: 1.1,
    wallMs: 51000,
    startedAt: new Date("2026-06-17T04:40:00Z"),
    suiteStatus: "partial",
    runStatus: "completed",
  },
  {
    suiteSlug: "email-summarize",
    versionLabel: "v11",
    versionBody: "Summarize the thread in 3 bullets. Preserve action items verbatim.",
    versionRef: null,
    sha: "2d9f0c4",
    branch: "main",
    passRate: 0.789,
    total: 90,
    costUsd: 0.62,
    wallMs: 30000,
    startedAt: new Date("2026-06-17T04:40:00Z"),
    suiteStatus: "flaky",
    runStatus: "completed",
  },
  {
    suiteSlug: "pii-redactor",
    versionLabel: "v3",
    versionBody: "Redact every PII span. Prefer over-redaction to a leak.",
    versionRef: null,
    sha: "e1c4a77",
    branch: "main",
    passRate: 0.92,
    total: 120,
    costUsd: 0.62,
    wallMs: 28000,
    startedAt: new Date("2026-06-08T09:00:00Z"),
    suiteStatus: "stale",
    runStatus: "completed",
  },
];

/* ------------------------------------------------------------------ */
/* checkout-extraction — THE hero. Two prompt versions, two runs.       */
/* head #1487 (v23) reconciles to 126/142 with the canonical per-scorer */
/* counts; baseline #1462 (v22) is 134/142.                             */
/* ------------------------------------------------------------------ */

const V22_BODY = `Extract the checkout fields as JSON: order id, customer, line items, totals, and the payment tender(s). Return only the JSON object.`;
const V23_BODY = `Extract the checkout fields as JSON: order id, customer, line items, totals, and the payment tender(s). Return only the JSON object.
Require a \`secondary_payment\` object whenever multiple tenders are present.`;

// Per-scorer PASS targets over 142 for the head run #1487.
const HEAD_SCORER_PASS: Record<ScorerName, number> = {
  schema: 113,
  "exact-match": 135,
  "field-accuracy": 120,
  judge: 130,
};
const TOTAL_CASES = 142;

// The 16 overall-failing cases, broken down by dominant scorer
// (schema 11 · judge 3 · exact-match 1 · field-accuracy 1 = 16).
// case_071 is the canonical schema-dominant flip. case_103 is NOT here — it is
// an overall-PASS case whose judge is lenient (false-pass vs the human label).
const DOMINANT_PLAN: { scorer: ScorerName; count: number }[] = [
  { scorer: "schema", count: 11 }, // case_071 covers one of these.
  { scorer: "judge", count: 3 },
  { scorer: "exact-match", count: 1 },
  { scorer: "field-accuracy", count: 1 },
];

interface CaseSlot {
  caseId: string;
  label: string;
  scorerPass: Record<ScorerName, boolean>;
  /** Per-scorer flip (pass on v22 → fail on v23). */
  flipped: Record<ScorerName, boolean>;
  verdict: CaseVerdict;
  skipped: boolean;
}

function padId(n: number): string {
  return `case_${String(n).padStart(3, "0")}`;
}

/**
 * Build the 142 scored cases + 1 skipped case for the head run so every
 * canonical count divides EXACTLY:
 *   overall 126 PASS / 16 FAIL = 142
 *   schema 113 · exact-match 135 · field-accuracy 120 · judge 130 pass
 *   8 cases flipped pass→fail (case_071 among them)
 * The construction is deterministic — no randomness — so re-seeding is stable.
 */
function buildHeadCases(): CaseSlot[] {
  // 142 scored ids: 1..143 minus the skipped 119. case_119 is the skipped row.
  const scoredIds: number[] = [];
  for (let n = 1; n <= 143; n += 1) {
    if (n === 119) continue;
    scoredIds.push(n);
    if (scoredIds.length === TOTAL_CASES) break;
  }

  const labelFor = (n: number): string => {
    const named: Record<number, string> = {
      1: "basic checkout",
      34: "guest checkout",
      55: "multi-currency",
      71: "split-tender checkout",
      88: "coupon stack",
      103: "ambiguous refund window",
    };
    return named[n] ?? `checkout case ${String(n)}`;
  };

  const allPass = (): Record<ScorerName, boolean> => ({
    schema: true,
    "exact-match": true,
    "field-accuracy": true,
    judge: true,
  });
  const noFlip = (): Record<ScorerName, boolean> => ({
    schema: false,
    "exact-match": false,
    "field-accuracy": false,
    judge: false,
  });

  const slots: CaseSlot[] = scoredIds.map((n) => ({
    caseId: padId(n),
    label: labelFor(n),
    scorerPass: allPass(),
    flipped: noFlip(),
    verdict: "pass",
    skipped: false,
  }));
  const byId = new Map(slots.map((s) => [s.caseId, s]));

  const get = (n: number): CaseSlot => {
    const s = byId.get(padId(n));
    if (s === undefined) throw new Error(`missing slot ${padId(n)}`);
    return s;
  };

  // --- pin the canonical flip anchor: case_071 → schema FAIL + field-acc FAIL,
  //     exact-match PASS, judge PASS → 2/4, overall FAIL, schema flipped.
  {
    const c = get(71);
    c.scorerPass.schema = false;
    c.scorerPass["field-accuracy"] = false;
    c.flipped.schema = true;
    c.verdict = "fail";
  }

  // --- choose the remaining 15 failing cases by dominant scorer. case_071 is
  //     the first schema-dominant; take 10 more schema, 3 judge, 1 exact, 1 fa.
  const used = new Set<string>([padId(71)]);
  const pickFailing = (scorer: ScorerName, count: number): void => {
    let placed = 0;
    for (const s of slots) {
      if (placed >= count) break;
      if (used.has(s.caseId) || s.verdict === "fail" || s.skipped) continue;
      s.scorerPass[scorer] = false;
      s.verdict = "fail";
      used.add(s.caseId);
      placed += 1;
    }
    if (placed < count) throw new Error(`could not place ${String(count)} ${scorer} fails`);
  };
  // case_071 already covers one schema-dominant, so place one fewer schema.
  for (const { scorer, count } of DOMINANT_PLAN) {
    pickFailing(scorer, scorer === "schema" ? count - 1 : count);
  }

  // --- 8 of the 16 failing cases flipped pass→fail. case_071 already flagged;
  //     mark 7 more failing cases as flipped (on their dominant scorer).
  let flips = slots.filter((s) => Object.values(s.flipped).some(Boolean)).length;
  for (const s of slots) {
    if (flips >= 8) break;
    if (s.verdict !== "fail") continue;
    if (Object.values(s.flipped).some(Boolean)) continue;
    const dominant = SCORERS.find((sc) => !s.scorerPass[sc]);
    if (dominant !== undefined) {
      s.flipped[dominant] = true;
      flips += 1;
    }
  }

  // --- hit the per-scorer marginals exactly by adding SOFT scorer failures.
  //     A soft failure lands on an overall-PASS case (or as a co-failure on a
  //     failing one, never on case_071) so it lowers a scorer's pass count
  //     without changing the 126/16 overall split.
  const scorerFailCount = (scorer: ScorerName): number =>
    slots.filter((s) => !s.scorerPass[scorer]).length;

  for (const scorer of SCORERS) {
    const wantFail = TOTAL_CASES - HEAD_SCORER_PASS[scorer];
    // 1) co-failures on already-failing cases (skip case_071 to keep it 2/4).
    for (const s of slots) {
      if (scorerFailCount(scorer) >= wantFail) break;
      if (s.verdict !== "fail" || s.caseId === padId(71)) continue;
      if (!s.scorerPass[scorer]) continue;
      s.scorerPass[scorer] = false;
    }
    // 2) soft single failures on otherwise-clean passing cases.
    for (const s of slots) {
      if (scorerFailCount(scorer) >= wantFail) break;
      if (s.verdict === "fail" || s.skipped) continue;
      const cleanlyPassing = SCORERS.every((sc) => s.scorerPass[sc]);
      if (!cleanlyPassing) continue;
      s.scorerPass[scorer] = false;
    }
    if (scorerFailCount(scorer) !== wantFail) {
      throw new Error(
        `scorer ${scorer}: placed ${String(scorerFailCount(scorer))} fails, want ${String(wantFail)}`,
      );
    }
  }

  // --- case_103: overall PASS, judge gives a lenient 3/5 (still a PASS scorer
  //     verdict → keeps judge pass-count at 130) but the human label is FAIL.
  //     The judge verdict + human label are seeded separately below; here we
  //     only assert the slot exists and stays overall-pass.
  if (get(103).verdict !== "pass") {
    throw new Error("case_103 must remain overall PASS (judge-disagrees, not regressed)");
  }

  // --- the skipped case_119.
  slots.push({
    caseId: padId(119),
    label: "empty cart",
    scorerPass: noFlip(), // unused for a skipped case
    flipped: noFlip(),
    verdict: "skipped",
    skipped: true,
  });

  return slots;
}

/** Realistic per-scorer detail strings for a case's scorer result. */
function scorerDetail(
  scorer: ScorerName,
  pass: boolean,
  caseId: string,
): { detail: string; errors: string[] } {
  if (pass) {
    switch (scorer) {
      case "schema":
        return { detail: "valid against record_invoice contract", errors: [] };
      case "exact-match":
        return { detail: "normalized strings match", errors: [] };
      case "field-accuracy":
        return { detail: "all tracked fields matched", errors: [] };
      case "judge":
        return { detail: "rubric satisfied", errors: [] };
    }
  }
  switch (scorer) {
    case "schema":
      return {
        detail: "missing required field `secondary_payment`",
        errors: ["$.secondary_payment — required, absent"],
      };
    case "exact-match":
      return { detail: "string mismatch on `order_id`", errors: ["order_id ≠ expected"] };
    case "field-accuracy":
      return {
        detail: caseId === padId(71) ? "6/8 fields matched" : "below field-accuracy threshold",
        errors: ["`secondary_payment` absent", "`total` mismatch"],
      };
    case "judge":
      return { detail: "rubric criterion unmet", errors: ["split-tender requirement unmet"] };
  }
}

/** Score a scorer result to a [0,1] number for the seed. */
function scorerScore(scorer: ScorerName, pass: boolean, caseId: string): number {
  if (pass) return scorer === "judge" ? 1 : 1;
  if (scorer === "field-accuracy") return caseId === padId(71) ? 0.71 : 0.8;
  if (scorer === "judge") return 0.6;
  return 0;
}

function toScorerResults(slot: CaseSlot): ScorerResultInput[] {
  return SCORERS.map((scorer): ScorerResultInput => {
    const pass = slot.scorerPass[scorer];
    const { detail, errors } = scorerDetail(scorer, pass, slot.caseId);
    return {
      scorerName: scorer,
      pass,
      score: scorerScore(scorer, pass, slot.caseId),
      detail,
      errors,
      latencyMs: scorer === "judge" ? 2100 : 40,
      flippedFrom: slot.flipped[scorer] ? ("pass" satisfies ScorerFlippedFrom) : null,
    };
  });
}

function caseAggregateScore(slot: CaseSlot): number {
  const passes = SCORERS.filter((s) => slot.scorerPass[s]).length;
  return passes / SCORERS.length;
}

function toCaseSummary(slot: CaseSlot): CaseSummaryInput {
  if (slot.skipped) {
    return {
      caseId: slot.caseId,
      label: slot.label,
      input: { note: "skipped" },
      expected: { note: "skipped" },
      actual: null,
      verdict: "skipped",
      score: 0,
      precondition: "cart_nonempty",
      scorers: [],
    };
  }
  return {
    caseId: slot.caseId,
    label: slot.label,
    input: { case: slot.caseId },
    expected: { case: slot.caseId, requires: "secondary_payment" },
    actual: { case: slot.caseId },
    verdict: slot.verdict,
    score: caseAggregateScore(slot),
    scorers: toScorerResults(slot),
  };
}

/* ------------------------------------------------------------------ */
/* Judges (4) + their calibration on checkout-extraction.               */
/* ------------------------------------------------------------------ */
interface JudgeSeed {
  name: string;
  provider: "groq" | "ollama" | "recorded";
  isDefault: boolean;
  costPer1k: number;
  latencyP50Ms: number;
  status: "aligned" | "under-calibrated" | "biased" | "drifted";
  kappa: number;
  agreement: number;
  n: number;
  tp: number;
  tn: number;
  fp: number;
  fn: number;
  posBias: number;
  lengthBias: number;
  lengthR2: number;
}

const JUDGES: JudgeSeed[] = [
  {
    name: "claude-opus-4",
    provider: "recorded",
    isDefault: true,
    costPer1k: 1.8,
    latencyP50Ms: 2100,
    status: "aligned",
    kappa: 0.81,
    agreement: 0.986,
    n: 420,
    tp: 198,
    tn: 216,
    fp: 4,
    fn: 2,
    posBias: 0.03,
    lengthBias: 0.11,
    lengthR2: 0.11,
  },
  {
    name: "claude-3.5-sonnet",
    provider: "recorded",
    isDefault: false,
    costPer1k: 0.9,
    latencyP50Ms: 900,
    status: "aligned",
    kappa: 0.79,
    agreement: 0.964,
    n: 420,
    tp: 196,
    tn: 209,
    fp: 7,
    fn: 8,
    posBias: 0.05,
    lengthBias: 0.12,
    lengthR2: 0.12,
  },
  {
    name: "gpt-4o",
    provider: "recorded",
    isDefault: false,
    costPer1k: 1.25,
    latencyP50Ms: 1600,
    status: "biased",
    kappa: 0.71,
    agreement: 0.921,
    n: 420,
    tp: 190,
    tn: 197,
    fp: 14,
    fn: 19,
    posBias: 0.34,
    lengthBias: 0.18,
    lengthR2: 0.18,
  },
  {
    name: "gpt-4o-mini",
    provider: "recorded",
    isDefault: false,
    costPer1k: 0.15,
    latencyP50Ms: 400,
    status: "under-calibrated",
    kappa: 0.58,
    agreement: 0.84,
    n: 420,
    tp: 184,
    tn: 169,
    fp: 31,
    fn: 36,
    posBias: 0.5,
    lengthBias: 0.27,
    lengthR2: 0.27,
  },
];

/* ------------------------------------------------------------------ */
/* Idempotency helper — clear a suite's prior run(s) for a given SHA so */
/* a re-seed replaces rather than duplicates. cases / case_results /    */
/* judge_verdicts / error_clusters / trajectory_tasks cascade on delete.*/
/* ------------------------------------------------------------------ */
function deleteRunBySha(sha: string): void {
  for (const r of db.select({ id: runsTable.id }).from(runsTable).where(eq(runsTable.sha, sha)).all()) {
    db.delete(runsTable).where(eq(runsTable.id, r.id)).run();
  }
}

/**
 * Drop any prior calibration row for (suiteId, judgeId) so a re-seed replaces
 * rather than appends. calibration_runs has no unique index and the store
 * helper always inserts, so the seed owns this idempotency.
 */
function deleteCalibration(suiteId: number, judgeId: number): void {
  db.delete(calibrationRunsTable)
    .where(
      and(
        eq(calibrationRunsTable.suiteId, suiteId),
        eq(calibrationRunsTable.judgeId, judgeId),
      ),
    )
    .run();
}

/** Resolve a run's case row id by (runId, caseId) — judge verdicts need it. */
function caseRowId(runId: number, caseId: string): number {
  const match = db
    .select({ id: casesTable.id, caseId: casesTable.caseId })
    .from(casesTable)
    .where(eq(casesTable.runId, runId))
    .all()
    .find((c) => c.caseId === caseId);
  if (match === undefined) throw new Error(`case ${caseId} not found in run ${String(runId)}`);
  return match.id;
}

/**
 * Persist the head-run error cluster. The schema has no store helper for
 * error_clusters yet, so the seed writes it through the shared db connection.
 * Idempotent on (runId, name): the prior cluster for this run is cleared first.
 */
function persistErrorCluster(runId: number): void {
  db.delete(errorClustersTable).where(eq(errorClustersTable.runId, runId)).run();
  db.insert(errorClustersTable)
    .values({
      runId,
      name: "missing-secondary-payment",
      size: 6,
      dominantScorer: "schema",
      mode: "omits second tender on split payments",
      sharedTraits: ["tender=split", "currency=USD"],
      caseIds: [padId(71), padId(124), padId(131), padId(137), padId(140), padId(145)],
      inGoldenSet: false,
      createdAt: new Date(),
    })
    .run();
}

async function main(): Promise<void> {
  const log = (msg: string): void => {
    process.stdout.write(`${msg}\n`);
  };

  // Apply schema migrations first so `npm run seed` works against an empty DB.
  migrate(db, { migrationsFolder: `${import.meta.dirname}/migrations` });
  log("migrations applied");

  // 1) Suites — idempotent on slug.
  const suiteIdBy = new Map<string, number>();
  for (const s of SUITES) {
    const row = upsertSuite({
      slug: s.slug,
      title: s.title,
      repo: s.repo,
      status: s.status,
    });
    suiteIdBy.set(s.slug, row.id);
  }
  log(`suites: ${String(suiteIdBy.size)} upserted`);

  const checkoutId = suiteIdBy.get("checkout-extraction");
  if (checkoutId === undefined) throw new Error("checkout-extraction suite missing");

  // 2) Judges + calibration on checkout-extraction — idempotent on name /
  //    (suiteId, judgeId).
  const judgeIdBy = new Map<string, number>();
  for (const j of JUDGES) {
    const row = upsertJudge({
      name: j.name,
      provider: j.provider,
      isDefault: j.isDefault,
      costPer1k: j.costPer1k,
      latencyP50Ms: j.latencyP50Ms,
      status: j.status,
    });
    judgeIdBy.set(j.name, row.id);
    deleteCalibration(checkoutId, row.id);
    persistCalibrationRun({
      suiteId: checkoutId,
      judgeId: row.id,
      n: j.n,
      tp: j.tp,
      tn: j.tn,
      fp: j.fp,
      fn: j.fn,
      kappa: j.kappa,
      agreement: j.agreement,
      posBias: j.posBias,
      lengthBias: j.lengthBias,
      lengthR2: j.lengthR2,
      judgeStatus: j.status,
    });
  }
  log(`judges: ${String(judgeIdBy.size)} upserted + calibrated`);

  // 3) checkout-extraction prompt versions v22 (baseline) + v23 (head).
  const v22Id = upsertPromptVersion({
    suiteId: checkoutId,
    label: "v22",
    body: V22_BODY,
    ref: "7b1d004",
  });
  const v23Id = upsertPromptVersion({
    suiteId: checkoutId,
    label: "v23",
    body: V23_BODY,
    ref: "a3f9c21",
  });

  // 4) Baseline run #1462 (v22, 134/142). A coarse pass/fail split is enough —
  //    the per-scorer detail lives on the head run.
  deleteRunBySha("7b1d004");
  const baselineCases: CaseSummaryInput[] = [];
  for (let i = 1; i <= 142; i += 1) {
    const pass = i > 8; // 134 pass / 8 fail = 142
    baselineCases.push({
      caseId: padId(i),
      label: i === 71 ? "split-tender checkout" : `checkout case ${String(i)}`,
      input: { case: padId(i) },
      expected: { case: padId(i) },
      actual: { case: padId(i) },
      verdict: pass ? "pass" : "fail",
      score: pass ? 1 : 0.5,
      scorers: SCORERS.map((scorer) => ({
        scorerName: scorer,
        pass,
        score: pass ? 1 : 0,
        detail: pass ? "ok" : "fail",
        errors: pass ? [] : ["baseline failure"],
        latencyMs: scorer === "judge" ? 2000 : 38,
        flippedFrom: null,
      })),
    });
  }
  const baseline = persistRun({
    suiteId: checkoutId,
    promptVersionId: v22Id,
    sha: "7b1d004",
    branch: "main",
    trigger: "cron",
    triggeredBy: "nightly",
    status: "completed",
    costUsd: 0.81,
    wallMs: 37000,
    startedAt: new Date("2026-06-16T18:40:00Z"),
    finishedAt: new Date("2026-06-16T18:40:37Z"),
    suiteStatus: "passing",
    cases: baselineCases,
  });
  log(`baseline run #${String(baseline.runId)} (v22): ${String(baseline.caseCount)} cases`);

  // 5) Head run #1487 (v23, 126/142) — the regression, with full per-scorer
  //    reconciliation.
  deleteRunBySha("a3f9c21");
  const headSlots = buildHeadCases();
  const headCases = headSlots.map(toCaseSummary);
  const head = persistRun({
    suiteId: checkoutId,
    promptVersionId: v23Id,
    sha: "a3f9c21",
    branch: "feat/stricter-schema",
    trigger: "ci",
    triggeredBy: "PR#214",
    status: "failed",
    costUsd: 0.83,
    wallMs: 38000,
    startedAt: new Date("2026-06-17T09:12:00Z"),
    finishedAt: new Date("2026-06-17T09:12:38Z"),
    suiteStatus: "regressed",
    cases: headCases,
  });
  log(`head run #${String(head.runId)} (v23): ${String(head.caseCount)} cases`);

  // Point the suite at the head run + grade it regressed.
  setSuiteLatestRun(checkoutId, head.runId, "regressed");

  // 6) Judge verdicts on the head run: the default judge claude-opus-4 grades
  //    every judge-scored case. case_103 is the false-pass (3/5 PASS vs human
  //    FAIL); case_071's judge passed (its failure is schema/field-accuracy).
  const opusId = judgeIdBy.get("claude-opus-4");
  if (opusId === undefined) throw new Error("claude-opus-4 judge missing");

  for (const slot of headSlots) {
    if (slot.skipped) continue;
    const judgePass = slot.scorerPass.judge;
    const isCase103 = slot.caseId === padId(103);
    const score = isCase103 ? 3 : judgePass ? 5 : 2;
    persistJudgeVerdict({
      caseRowId: caseRowId(head.runId, slot.caseId),
      judgeId: opusId,
      score,
      pass: isCase103 ? true : judgePass,
      rubricResults: [
        { criterion: "extracts both tenders", pass: slot.scorerPass.schema },
        { criterion: "correct totals", pass: slot.scorerPass["field-accuracy"] },
        { criterion: "currency present", pass: true },
      ],
      reasoning: isCase103
        ? "The refund falls outside the stated window, but the policy text is ambiguous; accepting it is defensible."
        : judgePass
          ? "Output satisfies the rubric."
          : "The model omitted the second tender entirely, so the split-tender requirement is unmet.",
      tokens: 1180,
      costUsd: 0.004,
    });
  }
  log("judge verdicts: seeded for head run (case_103 false-pass)");

  // 7) Human gold label: case_103 = fail (the disagreement vs the judge's PASS).
  persistHumanLabel({
    suiteId: checkoutId,
    caseId: padId(103),
    label: "fail",
    labeledBy: "nico",
  });
  log("human label: case_103 = fail");

  // 8) Error cluster on the head run — missing-secondary-payment (size 6,
  //    schema-dominant, contains case_071, not yet in the golden set).
  persistErrorCluster(head.runId);
  log("error cluster: missing-secondary-payment (size 6)");

  // 9) Refund-agent trajectory: book_flight_multi_leg — diverged-but-correct
  //    (tool-selection 90.5%, final answer PASS) with an inserted redundant
  //    search_flights at step 2.
  const refundId = suiteIdBy.get("refund-agent");
  if (refundId === undefined) throw new Error("refund-agent suite missing");
  persistTrajectoryTask({
    suiteId: refundId,
    runId: null,
    taskId: "book_flight_multi_leg",
    expectedTools: ["search_flights", "check_seats", "hold_seat", "confirm_booking"],
    toolSelectionAccuracy: 0.905,
    finalAnswerPass: true,
    outcome: "diverged-but-correct",
    steps: [
      {
        idx: 0,
        expectedTool: "search_flights",
        actualTool: "search_flights",
        args: { origin: "JFK", dest: "LHR", date: "2026-07-02" },
        result: { flights: 12 },
        match: "match",
      },
      {
        idx: 1,
        expectedTool: "check_seats",
        actualTool: "search_flights",
        args: { origin: "JFK", dest: "LHR", date: "2026-07-02" },
        result: { flights: 12 },
        match: "insert",
      },
      {
        idx: 2,
        expectedTool: "check_seats",
        actualTool: "check_seats",
        args: { flightId: "BA178" },
        result: { seats: 4 },
        match: "match",
      },
      {
        idx: 3,
        expectedTool: "hold_seat",
        actualTool: "hold_seat",
        args: { flightId: "BA178", seat: "12A" },
        result: { held: true },
        match: "match",
      },
      {
        idx: 4,
        expectedTool: "confirm_booking",
        actualTool: "confirm_booking",
        args: { flightId: "BA178", seat: "12A" },
        result: { pnr: "QX7K2P" },
        match: "match",
      },
    ],
  });
  log("trajectory: book_flight_multi_leg (diverged-but-correct, 90.5%)");

  // 10) The 5 non-hero suites — one representative run each so the overview
  //     reconciles. Idempotent: clear the SHA first.
  for (const r of SIMPLE_RUNS) {
    const suiteId = suiteIdBy.get(r.suiteSlug);
    if (suiteId === undefined) throw new Error(`suite ${r.suiteSlug} missing`);
    const versionId = upsertPromptVersion({
      suiteId,
      label: r.versionLabel,
      body: r.versionBody,
      ref: r.versionRef,
    });
    deleteRunBySha(r.sha);
    const passCount = Math.round(r.passRate * r.total);
    const simpleCases: CaseSummaryInput[] = [];
    for (let i = 1; i <= r.total; i += 1) {
      const pass = i <= passCount;
      simpleCases.push({
        caseId: padId(i),
        label: `${r.suiteSlug} case ${String(i)}`,
        input: { case: padId(i) },
        expected: { case: padId(i) },
        actual: { case: padId(i) },
        verdict: pass ? "pass" : "fail",
        score: pass ? 1 : 0,
        scorers: SCORERS.map((scorer) => ({
          scorerName: scorer,
          pass,
          score: pass ? 1 : 0,
          detail: pass ? "ok" : "fail",
          errors: pass ? [] : ["failure"],
          latencyMs: scorer === "judge" ? 2000 : 38,
          flippedFrom: null,
        })),
      });
    }
    const run = persistRun({
      suiteId,
      promptVersionId: versionId,
      sha: r.sha,
      branch: r.branch,
      trigger: "manual",
      triggeredBy: "seed",
      status: r.runStatus,
      costUsd: r.costUsd,
      wallMs: r.wallMs,
      startedAt: r.startedAt,
      finishedAt: new Date(r.startedAt.getTime() + r.wallMs),
      suiteStatus: r.suiteStatus,
      cases: simpleCases,
    });
    setSuiteLatestRun(suiteId, run.runId, r.suiteStatus);
    log(`suite ${r.suiteSlug}: run #${String(run.runId)} (${String(passCount)}/${String(r.total)})`);
  }

  log("seed complete.");
}

main().catch((e: unknown) => {
  process.stderr.write(`${e instanceof Error ? (e.stack ?? e.message) : String(e)}\n`);
  process.exit(1);
});
