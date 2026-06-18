import { align, pad, pct } from "@/lib/format";
import {
  getTrajectories,
  getTrajectoryDetail,
} from "@/lib/queries/trajectories";
import { type ActionResult, err, ok } from "@/lib/result";

/* ------------------------------------------------------------------ */
/* `rubric trajectory [taskId]` — agent tool-use trajectories.          */
/*                                                                      */
/* No arg → list every trajectory task with its tool-selection accuracy */
/* and outcome. With a taskId → the per-step expected-vs-actual          */
/* alignment (match / insert / delete / substitute).                    */
/* Reads through lib/queries/trajectories (non-server-only).            */
/* ------------------------------------------------------------------ */

const ANSI = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
} as const;

export interface TrajectoryOptions {
  noColor?: boolean;
}

function paint(text: string, color: keyof typeof ANSI, on: boolean): string {
  return on ? `${ANSI[color]}${text}${ANSI.reset}` : text;
}

const OUTCOME_COLOR: Record<string, keyof typeof ANSI> = {
  correct: "green",
  "diverged-but-correct": "yellow",
  failed: "red",
};

const MATCH_GLYPH: Record<string, string> = {
  match: "=",
  insert: "+",
  delete: "-",
  substitute: "~",
};

async function renderList(on: boolean): Promise<string> {
  const tasks = await getTrajectories();
  if (tasks.length === 0) return "No trajectory tasks found.";

  const idW = Math.max(4, ...tasks.map((t) => t.taskId.length));
  const suiteW = Math.max(5, ...tasks.map((t) => t.suiteSlug.length));

  const header = paint(
    "  " + [pad("task", idW), pad("suite", suiteW), align("tool-acc", 8), pad("final", 5), "outcome"].join("  "),
    "dim",
    on,
  );

  const lines = tasks.map((t) => {
    const outcome = paint(t.outcome, OUTCOME_COLOR[t.outcome] ?? "dim", on);
    // "pass"/"fail" are both 4 chars; pad to the 5-wide "final" header column.
    const final =
      (t.finalAnswerPass ? paint("pass", "green", on) : paint("fail", "red", on)) + " ";
    return (
      "  " +
      [pad(t.taskId, idW), pad(t.suiteSlug, suiteW), align(pct(t.toolSelectionAccuracy), 8), final, outcome].join(
        "  ",
      )
    );
  });

  return [header, ...lines].join("\n");
}

async function renderDetail(taskId: string, on: boolean): Promise<ActionResult<string>> {
  const d = await getTrajectoryDetail(taskId);
  if (d === null) return err(`trajectory task "${taskId}" not found`);

  const outcome = paint(d.outcome, OUTCOME_COLOR[d.outcome] ?? "dim", on);
  const head = [
    paint(`rubric · trajectory · ${d.taskId}`, "bold", on),
    paint(`  ${d.suiteSlug} · ${d.suiteTitle}`, "dim", on),
    `  tool-selection ${paint(pct(d.toolSelectionAccuracy), "bold", on)}  ·  final ${
      d.finalAnswerPass ? paint("pass", "green", on) : paint("fail", "red", on)
    }  ·  ${outcome}`,
    paint(
      `  expected: ${d.expectedTools.join(" → ")}`,
      "dim",
      on,
    ),
    paint(`  actual:   ${d.actualTools.join(" → ")}`, "dim", on),
    "",
  ];

  const idxW = Math.max(1, ...d.steps.map((s) => String(s.idx).length));
  const expW = Math.max(8, ...d.steps.map((s) => (s.expectedTool ?? "—").length));
  const actW = Math.max(6, ...d.steps.map((s) => (s.actualTool ?? "—").length));

  const stepHeader = paint(
    "  " + [align("#", idxW), pad("expected", expW), pad("actual", actW), "op"].join("  "),
    "dim",
    on,
  );
  const steps = d.steps.map((s) => {
    const glyph = MATCH_GLYPH[s.match] ?? "?";
    const opColor: keyof typeof ANSI =
      s.match === "match" ? "green" : s.match === "substitute" ? "yellow" : "red";
    return (
      "  " +
      [
        align(String(s.idx), idxW),
        pad(s.expectedTool ?? "—", expW),
        pad(s.actualTool ?? "—", actW),
        paint(`${glyph} ${s.match}`, opColor, on),
      ].join("  ")
    );
  });

  const counts = paint(
    `  match ${String(d.stepCounts.match)} · insert ${String(d.stepCounts.insert)} · ` +
      `delete ${String(d.stepCounts.delete)} · substitute ${String(d.stepCounts.substitute)}`,
    "dim",
    on,
  );

  return ok([...head, stepHeader, ...steps, "", counts].join("\n"));
}

export async function trajectory(
  taskId: string | undefined,
  opts: TrajectoryOptions = {},
): Promise<ActionResult<string>> {
  const on = opts.noColor !== true;
  if (taskId === undefined) return ok(await renderList(on));
  return renderDetail(taskId, on);
}
