import { align, delta, pad, pct } from "@/lib/format";
import { getRegressionDiff } from "@/lib/queries/diff";
import { listRuns } from "@/lib/queries/runs";
import { type ActionResult, err, ok } from "@/lib/result";

/* ------------------------------------------------------------------ */
/* `rubric diff <a> <b>` — regression diff of run A (baseline) vs B.    */
/*                                                                      */
/* Two call shapes:                                                     */
/*   rubric diff <runIdA> <runIdB>   — explicit run ids                  */
/*   rubric diff <suiteSlug>          — the suite's two newest runs       */
/*                                       (B = newest candidate, A = prior) */
/*                                                                      */
/* Renders flipped cases (regressions first), per-scorer pass-rate       */
/* deltas, and added/removed cases. Exit code is the caller's concern —  */
/* the command surfaces whether a regression exists via data.regressed. */
/* ------------------------------------------------------------------ */

const ANSI = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
} as const;

export interface DiffOptions {
  noColor?: boolean;
}

export interface DiffResult {
  report: string;
  /** True when at least one case regressed (pass→fail). */
  regressed: boolean;
}

function paint(text: string, color: keyof typeof ANSI, on: boolean): string {
  return on ? `${ANSI[color]}${text}${ANSI.reset}` : text;
}

/** Resolve the (A, B) run-id pair from the CLI args. */
async function resolvePair(
  first: string,
  second: string | undefined,
): Promise<ActionResult<{ a: number; b: number }>> {
  // Two numeric args → explicit run ids.
  if (second !== undefined) {
    const a = Number(first);
    const b = Number(second);
    if (!Number.isInteger(a) || !Number.isInteger(b) || a <= 0 || b <= 0) {
      return err(`invalid run ids "${first}" / "${second}"`);
    }
    return ok({ a, b });
  }

  // A numeric single arg is ambiguous without a baseline — treat it as a suite
  // slug only when non-numeric; otherwise ask for a second run id.
  if (/^\d+$/.test(first)) {
    return err("usage: rubric diff <runIdA> <runIdB>  |  rubric diff <suiteSlug>");
  }

  const runs = await listRuns(first);
  if (runs.length < 2) {
    return err(`suite "${first}" has fewer than two runs to diff`);
  }
  // listRuns is newest-first: B is the candidate (newest), A is the prior run.
  const b = runs[0];
  const a = runs[1];
  if (a === undefined || b === undefined) {
    return err(`suite "${first}" has fewer than two runs to diff`);
  }
  return ok({ a: a.id, b: b.id });
}

export async function diff(
  first: string | undefined,
  second: string | undefined,
  opts: DiffOptions = {},
): Promise<ActionResult<DiffResult>> {
  if (first === undefined) {
    return err("usage: rubric diff <runIdA> <runIdB>  |  rubric diff <suiteSlug>");
  }

  const pair = await resolvePair(first, second);
  if (!pair.ok) return err(pair.error);

  const d = await getRegressionDiff(pair.data.a, pair.data.b);
  if (d === null) return err(`one or both runs not found (#${String(pair.data.a)}, #${String(pair.data.b)})`);

  const on = opts.noColor !== true;
  const deltaPainted = paint(
    delta(d.passRateDelta),
    d.passRateDelta < 0 ? "red" : d.passRateDelta > 0 ? "green" : "dim",
    on,
  );

  const head = [
    paint(`rubric · diff · ${d.suiteSlug}`, "bold", on),
    `  ${d.suiteTitle}`,
    paint(
      `  A #${String(d.runA.id)} ${d.runA.promptLabel} ${pct(d.runA.passRate)}` +
        `  →  B #${String(d.runB.id)} ${d.runB.promptLabel} ${pct(d.runB.passRate)}` +
        `   (${deltaPainted})`,
      "dim",
      on,
    ),
    "",
  ];

  // Flipped cases.
  const flips: string[] = [];
  if (d.flippedCases.length === 0) {
    flips.push(paint("  no verdict flips", "dim", on));
  } else {
    flips.push(
      paint(
        `  ${String(d.regressedCount)} regressed · ${String(d.fixedCount)} fixed`,
        "dim",
        on,
      ),
    );
    const idW = Math.max(4, ...d.flippedCases.map((f) => f.caseId.length));
    for (const f of d.flippedCases) {
      const arrow =
        f.direction === "regressed"
          ? paint("pass → fail", "red", on)
          : paint("fail → pass", "green", on);
      const labelText = f.label !== null ? paint(`  ${f.label}`, "dim", on) : "";
      flips.push(`    ${pad(f.caseId, idW)}  ${arrow}${labelText}`);
    }
  }

  // Per-scorer pass-rate deltas.
  const scorerLines: string[] = ["", paint("  scorers", "dim", on)];
  const nameW = Math.max(6, ...d.scorerDeltas.map((s) => s.scorerName.length));
  for (const s of d.scorerDeltas) {
    const dPainted = paint(
      delta(s.delta),
      s.delta < 0 ? "red" : s.delta > 0 ? "green" : "dim",
      on,
    );
    scorerLines.push(
      `    ${pad(s.scorerName, nameW)}  ${align(pct(s.passRateA), 6)} → ${align(
        pct(s.passRateB),
        6,
      )}  ${dPainted}`,
    );
  }

  // Added / removed cases.
  const churn: string[] = [];
  if (d.addedCaseIds.length > 0) {
    churn.push(paint(`  + added: ${d.addedCaseIds.join(", ")}`, "green", on));
  }
  if (d.removedCaseIds.length > 0) {
    churn.push(paint(`  - removed: ${d.removedCaseIds.join(", ")}`, "red", on));
  }

  const report = [...head, ...flips, ...scorerLines, ...(churn.length > 0 ? ["", ...churn] : [])].join(
    "\n",
  );

  return ok({ report, regressed: d.regressedCount > 0 });
}
