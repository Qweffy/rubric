import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  cases,
  humanLabels,
  judges,
  judgeVerdicts,
  runs,
  type JudgeStatus,
} from "@/db/schema";
import {
  type CalibrationPair,
  buildConfusion,
} from "@/lib/calibration/confusion";
import { agreement, cohensKappa, round } from "@/lib/calibration/kappa";
import { align, pad, pct } from "@/lib/format";
import { type ActionResult, err, ok } from "@/lib/result";
import { persistCalibrationRun, suiteIdBySlug } from "@/lib/store";

/* ------------------------------------------------------------------ */
/* `rubric calibrate <judge> [suite]` — judge vs. human gold labels.    */
/*                                                                      */
/* Pairs every stored judge verdict with the human label for the same   */
/* (suite, case), then computes the confusion matrix, Cohen's kappa, and */
/* raw agreement via lib/calibration. Optionally scoped to one suite.    */
/* Persists the calibration run (and denormalizes it onto the judge)     */
/* unless --no-store. Renders the confusion matrix + headline metrics.   */
/* ------------------------------------------------------------------ */

const ANSI = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
} as const;

export interface CalibrateOptions {
  /** Scope calibration to one suite slug. */
  suite?: string;
  /** Skip persisting the calibration run. */
  noStore?: boolean;
  noColor?: boolean;
}

function paint(text: string, color: keyof typeof ANSI, on: boolean): string {
  return on ? `${ANSI[color]}${text}${ANSI.reset}` : text;
}

/** Grade a judge from kappa + bias, mirroring the seed's status taxonomy. */
function gradeJudge(kappa: number, posBias: number | null): JudgeStatus {
  if (posBias !== null && Math.abs(posBias) >= 0.3) return "biased";
  if (kappa >= 0.75) return "aligned";
  if (kappa >= 0.6) return "under-calibrated";
  return "drifted";
}

/** Pairs in the shape lib/calibration consumes — judge vs. human pass/fail. */
async function loadCalibrationPairs(
  judgeId: number,
  suiteId: number | null,
): Promise<{ pairs: CalibrationPair[]; suiteIds: Set<number> }> {
  const base = db
    .select({
      suiteId: runs.suiteId,
      judgePass: judgeVerdicts.pass,
      humanLabel: humanLabels.label,
    })
    .from(judgeVerdicts)
    .innerJoin(cases, eq(cases.id, judgeVerdicts.caseRowId))
    .innerJoin(runs, eq(runs.id, cases.runId))
    .innerJoin(
      humanLabels,
      and(eq(humanLabels.suiteId, runs.suiteId), eq(humanLabels.caseId, cases.caseId)),
    );

  const rows =
    suiteId === null
      ? await base.where(eq(judgeVerdicts.judgeId, judgeId))
      : await base.where(
          and(eq(judgeVerdicts.judgeId, judgeId), eq(runs.suiteId, suiteId)),
        );

  const suiteIds = new Set<number>();
  const pairs: CalibrationPair[] = rows.map((r) => {
    suiteIds.add(r.suiteId);
    return {
      judge: r.judgePass ? "pass" : "fail",
      human: r.humanLabel,
    };
  });
  return { pairs, suiteIds };
}

export async function calibrate(
  judgeName: string | undefined,
  opts: CalibrateOptions = {},
): Promise<ActionResult<string>> {
  if (judgeName === undefined) {
    return err("usage: rubric calibrate <judge> [suite]");
  }

  const judgeRow = await db
    .select({ id: judges.id, name: judges.name })
    .from(judges)
    .where(eq(judges.name, judgeName))
    .limit(1);
  const judge = judgeRow[0];
  if (judge === undefined) return err(`judge "${judgeName}" not found`);

  let suiteId: number | null = null;
  if (opts.suite !== undefined) {
    suiteId = await suiteIdBySlug(opts.suite);
    if (suiteId === null) return err(`suite "${opts.suite}" not found`);
  }

  const { pairs, suiteIds } = await loadCalibrationPairs(judge.id, suiteId);
  if (pairs.length === 0) {
    return err(
      `no judge↔human label pairs for "${judgeName}"` +
        (opts.suite !== undefined ? ` in suite "${opts.suite}"` : "") +
        " — seed human labels first",
    );
  }

  const confusion = buildConfusion(pairs);
  const kappa = round(cohensKappa(confusion));
  const agree = round(agreement(confusion));
  const status = gradeJudge(kappa, null);

  const on = opts.noColor !== true;

  let persisted = "";
  if (opts.noStore !== true) {
    // Persist against the single calibrated suite when scoped; otherwise pick a
    // representative suite (calibrationRuns require a suiteId FK).
    const targetSuite = suiteId ?? [...suiteIds][0] ?? null;
    if (targetSuite !== null) {
      await persistCalibrationRun({
        suiteId: targetSuite,
        judgeId: judge.id,
        n: pairs.length,
        tp: confusion.tp,
        tn: confusion.tn,
        fp: confusion.fp,
        fn: confusion.fn,
        kappa,
        agreement: agree,
        judgeStatus: status,
      });
      persisted = paint("  calibration run persisted", "dim", on);
    }
  }

  const statusColor: keyof typeof ANSI =
    status === "aligned" ? "green" : status === "drifted" ? "red" : "yellow";

  const lines = [
    paint(`rubric · calibrate · ${judge.name}`, "bold", on),
    paint(
      `  n=${String(pairs.length)}` +
        (opts.suite !== undefined ? ` · suite ${opts.suite}` : " · all suites"),
      "dim",
      on,
    ),
    "",
    `  kappa      ${paint(kappa.toFixed(2), "bold", on)}`,
    `  agreement  ${pct(agree)}`,
    `  status     ${paint(status, statusColor, on)}`,
    "",
    paint("  confusion (judge × human)", "dim", on),
    `    ${pad("", 6)}${align("human✓", 8)}${align("human✗", 8)}`,
    `    ${pad("judge✓", 6)}${align(String(confusion.tp), 8)}${align(String(confusion.fp), 8)}`,
    `    ${pad("judge✗", 6)}${align(String(confusion.fn), 8)}${align(String(confusion.tn), 8)}`,
    "",
    paint(
      `  fp ${String(confusion.fp)} (lenient) · fn ${String(confusion.fn)} (strict)`,
      "dim",
      on,
    ),
  ];
  if (persisted.length > 0) lines.push(persisted);

  return ok(lines.join("\n"));
}
