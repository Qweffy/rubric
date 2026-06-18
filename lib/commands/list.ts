import { align, pad, pct, utc } from "@/lib/format";
import { listRuns } from "@/lib/queries/runs";
import { type ActionResult, ok } from "@/lib/result";

/* ------------------------------------------------------------------ */
/* `rubric list [suite]` — recent runs, newest-first.                   */
/*                                                                      */
/* Reads through lib/queries/runs (a non-server-only read module) and    */
/* renders a compact table: run id, suite, prompt label, pass-rate,     */
/* totals, status, sha, and start time. Scoping to a suite slug filters  */
/* the list. Returns the rendered string for the CLI to print.          */
/* ------------------------------------------------------------------ */

export interface ListOptions {
  /** Optional suite slug to scope the listing. */
  suite?: string;
}

export async function list(opts: ListOptions = {}): Promise<ActionResult<string>> {
  const runs = await listRuns(opts.suite);

  if (runs.length === 0) {
    const scope = opts.suite !== undefined ? ` for suite "${opts.suite}"` : "";
    return ok(`No runs found${scope}.`);
  }

  const idW = Math.max(2, ...runs.map((r) => String(r.id).length));
  const suiteW = Math.max(5, ...runs.map((r) => r.suiteSlug.length));
  const promptW = Math.max(6, ...runs.map((r) => r.promptLabel.length));
  const statusW = Math.max(6, ...runs.map((r) => r.status.length));

  const header =
    "  " +
    [
      align("#", idW),
      pad("suite", suiteW),
      pad("prompt", promptW),
      align("pass", 6),
      align("total", 5),
      pad("status", statusW),
      pad("sha", 7),
      "started",
    ].join("  ");

  const lines = runs.map((r) =>
    "  " +
    [
      align(String(r.id), idW),
      pad(r.suiteSlug, suiteW),
      pad(r.promptLabel, promptW),
      align(pct(r.passRate), 6),
      align(String(r.total), 5),
      pad(r.status, statusW),
      pad(r.sha.slice(0, 7), 7),
      utc(r.startedAt),
    ].join("  "),
  );

  return ok([header, ...lines].join("\n"));
}
