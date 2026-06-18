import { createInterface } from "node:readline";

import { type HumanLabel } from "@/db/schema";
import {
  type CandidateJudge,
  type CandidateScorer,
  type LabelCandidate,
  loadLabelCandidates,
} from "@/lib/queries/cases";
import { type ActionResult, err, ok } from "@/lib/result";
import { persistHumanLabel, suiteIdBySlug } from "@/lib/store";

/* ------------------------------------------------------------------ */
/* `rubric label <suite> [--limit N] [--all]` — collect human gold     */
/* pass/fail labels for judge calibration (M2).                         */
/*                                                                      */
/* Loads the suite's latest completed run's cases that don't yet carry  */
/* a human label (default; --all re-labels), prints a compact card per   */
/* case (input / expected / actual + scorer verdicts + judge verdict +   */
/* reasoning), and prompts [p]ass / [f]ail / [s]kip / [q]uit. p/f write  */
/* a human label; the labels feed `rubric calibrate <suite>` (Cohen's    */
/* κ vs the judge).                                                       */
/*                                                                      */
/* The I/O-free core (parseAnswer, runLabeling) is separated from the    */
/* readline wiring so it stays unit-testable without real stdin or DB.   */
/* This handler owns its write through lib/store per the                 */
/* CLI-is-the-only-writer rule.                                          */
/* ------------------------------------------------------------------ */

const ANSI = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
} as const;

function paint(text: string, color: keyof typeof ANSI, on: boolean): string {
  return on ? `${ANSI[color]}${text}${ANSI.reset}` : text;
}

/** A parsed answer to the per-case prompt. */
export type Answer = "pass" | "fail" | "skip" | "quit";

/**
 * Map a raw prompt answer to an Answer, or null when it doesn't parse. Pure and
 * I/O-free so it's unit-testable. Trims + lowercases first; accepts the canonical
 * single letters (p/f/s/q), the full words (pass/fail/skip/quit), and the natural
 * y/n aliases. Empty input is treated as skip so a bare <enter> never miscommits.
 */
export function parseAnswer(input: string): Answer | null {
  const v = input.trim().toLowerCase();
  switch (v) {
    case "p":
    case "pass":
    case "y":
    case "yes":
      return "pass";
    case "f":
    case "fail":
    case "n":
    case "no":
      return "fail";
    case "":
    case "s":
    case "skip":
      return "skip";
    case "q":
    case "quit":
    case "exit":
      return "quit";
    default:
      return null;
  }
}

export interface RunLabelingArgs {
  cases: readonly LabelCandidate[];
  /** Ask the human about one case; resolves to their raw answer string. */
  ask: (candidate: LabelCandidate, index: number, total: number) => Promise<string>;
  /** Persist a pass/fail gold label for a case. */
  persist: (caseId: string, label: HumanLabel) => void | Promise<void>;
  /** Re-prompt on an unrecognized answer. Optional; defaults to a no-op. */
  onInvalid?: (raw: string) => void;
}

export interface LabelingResult {
  /** How many cases got a pass/fail human label this session. */
  labeled: number;
  /** How many cases were skipped. */
  skipped: number;
  /** True when the human quit before reaching the end of the queue. */
  quitEarly: boolean;
}

/**
 * Drive the labeling loop over a fixed set of candidates. I/O-free: it takes an
 * injected async `ask()` and a `persist()` so tests script answers and capture
 * writes without touching stdin or the DB. An unrecognized answer re-prompts the
 * SAME case (via onInvalid) rather than skipping it. `quit` stops the loop early.
 */
export async function runLabeling(args: RunLabelingArgs): Promise<LabelingResult> {
  const { cases, ask, persist, onInvalid } = args;
  const total = cases.length;
  let labeled = 0;
  let skipped = 0;

  for (let i = 0; i < total; i += 1) {
    const candidate = cases[i];
    if (candidate === undefined) continue;

    // Re-prompt the same case until the answer parses.
    for (;;) {
      const raw = await ask(candidate, i, total);
      const answer = parseAnswer(raw);

      if (answer === null) {
        if (onInvalid !== undefined) onInvalid(raw);
        continue;
      }
      if (answer === "quit") {
        return { labeled, skipped, quitEarly: true };
      }
      if (answer === "skip") {
        skipped += 1;
        break;
      }
      await persist(candidate.caseId, answer);
      labeled += 1;
      break;
    }
  }

  return { labeled, skipped, quitEarly: false };
}

/* ---- card rendering (pure) --------------------------------------- */

/** Compact one-line JSON of a blob, clipped so a card stays scannable. */
function summarizeBlob(value: unknown, max = 240): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return clip(value, max);
  // JSON.stringify can throw (circular refs) or return undefined (e.g. bigint at
  // top level) — fall back to a stable placeholder rather than [object Object].
  let text: string | undefined;
  try {
    text = JSON.stringify(value);
  } catch {
    text = undefined;
  }
  return clip(text ?? "(unserializable)", max);
}

/** Clip a string to `max` chars, appending an ellipsis when truncated. */
function clip(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

function scorerLine(s: CandidateScorer, on: boolean): string {
  const glyph = s.pass ? paint("✓", "green", on) : paint("✗", "red", on);
  const detail = s.detail !== null && s.detail.length > 0 ? `  ${paint(s.detail, "dim", on)}` : "";
  return `    ${glyph} ${s.scorerName}  ${paint(s.score.toFixed(2), "dim", on)}${detail}`;
}

function judgeLines(judge: CandidateJudge, on: boolean): string[] {
  const glyph = judge.pass ? paint("pass", "green", on) : paint("fail", "red", on);
  const lines = [
    `  ${paint("judge", "dim", on)} ${judge.judgeName}  ${glyph}  ${paint(String(judge.score), "dim", on)}`,
  ];
  if (judge.reasoning !== null && judge.reasoning.length > 0) {
    lines.push(`    ${paint(judge.reasoning, "dim", on)}`);
  }
  return lines;
}

/**
 * Render the compact per-case card a human reads before answering: caseId +
 * label, the input/expected/actual summaries, every scorer's verdict, and the
 * judge verdict + reasoning when present. Pure — no I/O.
 */
export function renderCard(
  candidate: LabelCandidate,
  index: number,
  total: number,
  on: boolean,
): string {
  const heading = paint(
    `[${String(index + 1)}/${String(total)}] ${candidate.caseId}`,
    "bold",
    on,
  );
  const labelTag =
    candidate.label !== null ? `  ${paint(candidate.label, "cyan", on)}` : "";
  const relabelTag =
    candidate.humanLabel !== null
      ? `  ${paint(`(was ${candidate.humanLabel})`, "yellow", on)}`
      : "";

  const lines = [
    "",
    `${heading}${labelTag}${relabelTag}`,
    `  ${paint("input   ", "dim", on)} ${summarizeBlob(candidate.input)}`,
    `  ${paint("expected", "dim", on)} ${summarizeBlob(candidate.expected)}`,
    `  ${paint("actual  ", "dim", on)} ${summarizeBlob(candidate.actual)}`,
  ];

  if (candidate.scorers.length > 0) {
    lines.push(`  ${paint("scorers", "dim", on)}`);
    for (const s of candidate.scorers) lines.push(scorerLine(s, on));
  }

  if (candidate.judge !== null) {
    lines.push(...judgeLines(candidate.judge, on));
  }

  return lines.join("\n");
}

/* ---- command entry (I/O lives here only) ------------------------- */

export interface LabelOptions {
  /** Cap how many cases to present this session. */
  limit?: number;
  /** Re-label cases that already carry a human gold label. */
  all?: boolean;
  noColor?: boolean;
}

export interface LabelResult {
  /** The closing summary — printed verbatim by the CLI. */
  report: string;
}

/** A readline-backed `ask()` that prints a card and reads one line from stdin. */
function makeStdinAsk(
  on: boolean,
): { ask: RunLabelingArgs["ask"]; close: () => void } {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const prompt = `  ${paint("[p]ass / [f]ail / [s]kip / [q]uit", "dim", on)} > `;

  const ask: RunLabelingArgs["ask"] = (candidate, index, total) =>
    new Promise<string>((resolve) => {
      process.stdout.write(`${renderCard(candidate, index, total, on)}\n`);
      rl.question(prompt, (answer) => resolve(answer));
    });

  return { ask, close: () => rl.close() };
}

/**
 * Run the interactive labeling session for a suite. Loads the unlabeled (or all,
 * with --all) candidates from the latest completed run, prompts the human per
 * case, persists pass/fail labels, and returns a closing summary that points at
 * `rubric calibrate`.
 */
export async function label(
  suiteSlug: string | undefined,
  opts: LabelOptions = {},
): Promise<ActionResult<LabelResult>> {
  if (suiteSlug === undefined) {
    return err("usage: rubric label <suite> [--limit N] [--all]");
  }

  if (suiteIdBySlug(suiteSlug) === null) {
    return err(`suite "${suiteSlug}" not found`);
  }

  const loaded = await loadLabelCandidates(suiteSlug, {
    includeLabeled: opts.all === true,
    limit: opts.limit,
  });
  if (loaded === null) {
    return err(`suite "${suiteSlug}" has no completed run to label`);
  }

  const on = opts.noColor !== true;
  const { candidates, suiteSlug: slug } = loaded;

  if (candidates.length === 0) {
    const message =
      opts.all === true
        ? `No cases in the latest run of "${slug}".`
        : `Nothing to label — every case in the latest run of "${slug}" already has a human label.`;
    return ok({ report: message });
  }

  const { ask, close } = makeStdinAsk(on);
  let result: LabelingResult;
  try {
    result = await runLabeling({
      cases: candidates,
      ask,
      persist: (caseId, humanLabel) => {
        persistHumanLabel({ suiteId: loaded.suiteId, caseId, label: humanLabel });
      },
      onInvalid: (raw) => {
        process.stdout.write(
          `  ${paint(`unrecognized "${raw.trim()}" — answer p / f / s / q`, "yellow", on)}\n`,
        );
      },
    });
  } finally {
    close();
  }

  const report = renderSummary(result, candidates.length, slug, on);
  return ok({ report });
}

/** The closing summary: how many labeled/skipped + the next-step calibrate hint. */
export function renderSummary(
  result: LabelingResult,
  total: number,
  slug: string,
  on: boolean,
): string {
  const head = paint(
    `rubric · label · ${slug}`,
    "bold",
    on,
  );
  const tally = paint(
    `  ${String(result.labeled)} labeled · ${String(result.skipped)} skipped · ${String(total)} total` +
      (result.quitEarly ? " (stopped early)" : ""),
    "dim",
    on,
  );
  const next =
    result.labeled > 0
      ? `  Run \`rubric calibrate ${slug}\` to compute Cohen's κ against the judge.`
      : `  No labels written — run again to label cases for \`rubric calibrate ${slug}\`.`;

  return [head, tally, "", next].join("\n");
}
