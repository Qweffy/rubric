import { describe, expect, it } from "vitest";

import {
  type Answer,
  parseAnswer,
  runLabeling,
  type RunLabelingArgs,
} from "@/lib/commands/label";
import { type LabelCandidate } from "@/lib/queries/cases";

/* ------------------------------------------------------------------ */
/* Unit tests for the I/O-free core of `rubric label`.                  */
/*                                                                      */
/* parseAnswer maps raw prompt strings to a normalized Answer; the      */
/* readline wiring lives in the command entry, so these tests inject a   */
/* scripted async `ask()` and a capturing `persist()` — no real stdin,   */
/* no DB. The loop must persist (caseId, label) on pass/fail, skip on    */
/* skip, and stop early on quit.                                         */
/* ------------------------------------------------------------------ */

/** A minimal candidate — only caseId is load-bearing for the loop. */
function candidate(caseId: string): LabelCandidate {
  return {
    caseId,
    label: null,
    verdict: "fail",
    input: { q: caseId },
    expected: { a: 1 },
    actual: { a: 2 },
    scorers: [],
    judge: null,
    humanLabel: null,
  };
}

describe("parseAnswer", () => {
  const cases: Array<[string, Answer | null]> = [
    // canonical single letters
    ["p", "pass"],
    ["f", "fail"],
    ["s", "skip"],
    ["q", "quit"],
    // full words
    ["pass", "pass"],
    ["fail", "fail"],
    ["skip", "skip"],
    ["quit", "quit"],
    ["exit", "quit"],
    // y/n aliases
    ["y", "pass"],
    ["yes", "pass"],
    ["n", "fail"],
    ["no", "fail"],
    // empty / whitespace → skip (a bare <enter> never miscommits)
    ["", "skip"],
    ["   ", "skip"],
    // case-insensitive + surrounding whitespace
    ["  PASS  ", "pass"],
    ["F", "fail"],
    ["Quit", "quit"],
    // unrecognized
    ["maybe", null],
    ["pf", null],
    ["1", null],
  ];

  it.each(cases)("parses %j → %j", (input, expected) => {
    expect(parseAnswer(input)).toBe(expected);
  });
});

describe("runLabeling", () => {
  /** Drive the loop with a scripted answer sequence + capturing persist. */
  function harness(
    candidates: LabelCandidate[],
    answers: string[],
  ): {
    persisted: Array<{ caseId: string; label: "pass" | "fail" }>;
    asked: string[];
    invalid: string[];
    run: () => ReturnType<typeof runLabeling>;
  } {
    const persisted: Array<{ caseId: string; label: "pass" | "fail" }> = [];
    const asked: string[] = [];
    const invalid: string[] = [];
    let cursor = 0;

    const ask: RunLabelingArgs["ask"] = (c) => {
      asked.push(c.caseId);
      const answer = answers[cursor] ?? "q";
      cursor += 1;
      return Promise.resolve(answer);
    };

    return {
      persisted,
      asked,
      invalid,
      run: () =>
        runLabeling({
          cases: candidates,
          ask,
          persist: (caseId, label) => {
            persisted.push({ caseId, label });
          },
          onInvalid: (raw) => {
            invalid.push(raw);
          },
        }),
    };
  }

  it("persists pass/fail with the right (caseId, label) and skips on skip", async () => {
    const candidates = ["c1", "c2", "c3"].map(candidate);
    // c1 → pass, c2 → fail, c3 → skip
    const h = harness(candidates, ["p", "f", "s"]);
    const result = await h.run();

    expect(h.persisted).toEqual([
      { caseId: "c1", label: "pass" },
      { caseId: "c2", label: "fail" },
    ]);
    expect(result.labeled).toBe(2);
    expect(result.skipped).toBe(1);
    expect(result.quitEarly).toBe(false);
    // Every case was presented exactly once.
    expect(h.asked).toEqual(["c1", "c2", "c3"]);
  });

  it("stops early on quit — no further cases asked or persisted", async () => {
    const candidates = ["c1", "c2", "c3"].map(candidate);
    // c1 → pass, c2 → quit (c3 must never be reached)
    const h = harness(candidates, ["p", "q"]);
    const result = await h.run();

    expect(h.persisted).toEqual([{ caseId: "c1", label: "pass" }]);
    expect(result.labeled).toBe(1);
    expect(result.quitEarly).toBe(true);
    // c3 was never presented.
    expect(h.asked).toEqual(["c1", "c2"]);
  });

  it("re-prompts the same case on an unrecognized answer", async () => {
    const candidates = ["c1"].map(candidate);
    // garbage, then a real answer for the SAME case
    const h = harness(candidates, ["???", "pass"]);
    const result = await h.run();

    expect(h.invalid).toEqual(["???"]);
    expect(h.asked).toEqual(["c1", "c1"]);
    expect(h.persisted).toEqual([{ caseId: "c1", label: "pass" }]);
    expect(result.labeled).toBe(1);
  });

  it("treats a full pass/fail run as all labeled, none skipped", async () => {
    const candidates = ["a", "b"].map(candidate);
    const h = harness(candidates, ["pass", "fail"]);
    const result = await h.run();

    expect(result).toEqual({ labeled: 2, skipped: 0, quitEarly: false });
  });

  it("does nothing on an empty queue", async () => {
    const h = harness([], []);
    const result = await h.run();

    expect(result).toEqual({ labeled: 0, skipped: 0, quitEarly: false });
    expect(h.asked).toEqual([]);
    expect(h.persisted).toEqual([]);
  });
});
