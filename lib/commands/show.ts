import { align, pad, pct } from "@/lib/format";
import { getRunDetail, type MatrixCell } from "@/lib/queries/runs";
import { type ActionResult, err, ok } from "@/lib/result";

/* ------------------------------------------------------------------ */
/* `rubric show <runId>` — a stored run's case × scorer matrix.         */
/*                                                                      */
/* Reads through lib/queries/runs.getRunDetail and renders the same     */
/* mono-glyph grid the live report uses, but sourced from the store     */
/* rather than a fresh run. ✓ pass · ✗ fail · − absent.                 */
/* ------------------------------------------------------------------ */

const ANSI = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
} as const;

const GLYPH = { pass: "✓", fail: "✗", absent: "−" } as const;

export interface ShowOptions {
  /** Disable ANSI color. */
  noColor?: boolean;
}

function paint(text: string, color: keyof typeof ANSI, on: boolean): string {
  return on ? `${ANSI[color]}${text}${ANSI.reset}` : text;
}

function cellGlyph(cell: MatrixCell | null, on: boolean): { plain: string; painted: string } {
  if (cell === null) return { plain: GLYPH.absent, painted: paint(GLYPH.absent, "dim", on) };
  if (cell.pass) return { plain: GLYPH.pass, painted: paint(GLYPH.pass, "green", on) };
  return { plain: GLYPH.fail, painted: paint(GLYPH.fail, "red", on) };
}

export async function show(
  runIdRaw: string | undefined,
  opts: ShowOptions = {},
): Promise<ActionResult<string>> {
  if (runIdRaw === undefined) return err("usage: rubric show <runId>");
  const runId = Number(runIdRaw);
  if (!Number.isInteger(runId) || runId <= 0) {
    return err(`invalid run id "${runIdRaw}"`);
  }

  const detail = await getRunDetail(runId);
  if (detail === null) return err(`run #${String(runId)} not found`);

  const on = opts.noColor !== true;
  const { summary, scorers, rows } = detail;

  const head = [
    paint(`rubric · run #${String(summary.id)} · ${summary.suiteSlug}`, "bold", on),
    `  ${summary.suiteTitle}`,
    paint(
      `  prompt ${summary.promptLabel}  ·  ${summary.sha}@${summary.branch}  ·  ${summary.status}`,
      "dim",
      on,
    ),
    "",
  ];

  if (rows.length === 0) {
    return ok([...head, "  (no cases)"].join("\n"));
  }

  const idW = Math.max(4, ...rows.map((r) => r.caseId.length));
  const colW = scorers.map((s) => Math.max(s.name.length, 3));

  const matrixHeader = paint(
    "  " +
      [pad("case", idW), ...scorers.map((s, i) => pad(s.name, colW[i] ?? s.name.length))].join("  "),
    "dim",
    on,
  );

  const body = rows.map((r) => {
    const cells = r.cells.map((cell, i) => {
      const g = cellGlyph(cell, on);
      const w = colW[i] ?? 1;
      return g.painted + " ".repeat(Math.max(0, w - g.plain.length));
    });
    return "  " + [pad(r.caseId, idW), ...cells].join("  ");
  });

  const nameW = Math.max(...scorers.map((s) => s.name.length));
  const rates = scorers.map(
    (s) =>
      `  ${pad(s.name, nameW)}  ${align(pct(s.passRate), 6)}  ${paint(
        `${String(s.passCount)}/${String(s.total)}`,
        "dim",
        on,
      )}`,
  );

  const passRate = paint(
    pct(summary.passRate),
    summary.passRate >= 1 ? "green" : "red",
    on,
  );
  const footer = [
    "",
    ...rates,
    "",
    `  pass-rate  ${passRate}   ${paint(
      `${String(summary.passCount)} pass · ${String(summary.failCount)} fail · ${String(summary.total)} total`,
      "dim",
      on,
    )}`,
  ];

  return ok([...head, matrixHeader, ...body, ...footer].join("\n"));
}
