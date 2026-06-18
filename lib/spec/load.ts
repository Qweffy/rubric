import { type Dirent, readFileSync, readdirSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";

import { parse as parseYaml } from "yaml";

import { type ActionResult, err, ok } from "@/lib/result";
import { caseSpecSchema, suiteSpecSchema } from "@/lib/spec/schema";
import { type CaseSpec, type SuiteSpec } from "@/lib/spec/types";
import { parseOrResult } from "@/lib/validation";

/* ------------------------------------------------------------------ */
/* Suite loader — the on-disk YAML → validated SuiteSpec boundary.      */
/*                                                                      */
/* A suite file is parsed through suiteSpecSchema (the zod boundary);    */
/* `cases` may be either an inline array OR a glob string pointing at    */
/* per-case YAML files. When it's a glob, every matched file is read,    */
/* parsed through caseSpecSchema, and inlined so the runner always sees  */
/* a concrete CaseSpec[]. Relative target/fixture paths are anchored to  */
/* the suite file's directory so a suite is runnable from any cwd.       */
/*                                                                      */
/* Returns ActionResult so the command layer surfaces a clean message    */
/* instead of a thrown stack — every failure (missing file, bad YAML,    */
/* schema violation, empty glob) is a user-facing error string.          */
/* ------------------------------------------------------------------ */

/** A fully-resolved suite: spec validated, cases inlined, paths anchored. */
export interface LoadedSuite {
  spec: SuiteSpec;
  /** Cases inlined from the glob (or passed through when already inline). */
  cases: CaseSpec[];
  /** Absolute path of the suite file. */
  suitePath: string;
  /** Directory the suite file lives in — the anchor for relative paths. */
  suiteDir: string;
}

function readFileText(path: string): ActionResult<string> {
  try {
    // reason: path comes from a trusted spec/CLI arg, not from untrusted input.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    return ok(readFileSync(path, "utf8"));
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : "unknown error";
    return err(`cannot read "${path}": ${detail}`);
  }
}

function parseYamlSafe(text: string, path: string): ActionResult<unknown> {
  try {
    return ok(parseYaml(text) as unknown);
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : "unknown error";
    return err(`"${path}" is not valid YAML: ${detail}`);
  }
}

/** Anchor a path to `baseDir` unless it is already absolute. */
function anchor(baseDir: string, path: string): string {
  return isAbsolute(path) ? path : resolve(baseDir, path);
}

/** List files under `dir` whose name matches a simple `*`-glob, recursing on `**`. */
function listDir(dir: string, recurse: boolean): string[] {
  let entries: Dirent[];
  try {
    // reason: dir is derived from a trusted suite file's glob, not user input.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (recurse) out.push(...listDir(full, true));
    } else {
      out.push(full);
    }
  }
  return out;
}

/** Convert a `*`-and-`.`-only filename glob to an anchored RegExp. */
function globToRegExp(glob: string): RegExp {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  // reason: source is a static suite-file glob bounded to filename chars.
  // eslint-disable-next-line security/detect-non-literal-regexp
  return new RegExp(`^${escaped}$`);
}

/**
 * Expand a simple cases glob relative to the suite dir. Supports `dir/*.yaml`
 * and `dir/**\/*.yaml` (the only shapes a suite needs); the segment before the
 * first `*` is a literal directory, the trailing segment is the filename glob.
 */
function expandGlob(pattern: string, suiteDir: string): string[] {
  const normalized = pattern.replace(/^\.\//, "");
  const recurse = normalized.includes("**");
  const cleaned = normalized.replace(/\*\*\//g, "");

  const lastSlash = cleaned.lastIndexOf("/");
  const dirPart = lastSlash >= 0 ? cleaned.slice(0, lastSlash) : "";
  const filePart = lastSlash >= 0 ? cleaned.slice(lastSlash + 1) : cleaned;

  const baseDir = dirPart.length > 0 ? anchor(suiteDir, dirPart) : suiteDir;
  const fileRe = globToRegExp(filePart);

  return listDir(baseDir, recurse).filter((p) => {
    const name = p.slice(p.lastIndexOf("/") + 1);
    return fileRe.test(name);
  });
}

/** A glob string for `cases` is anything that is not an inline array. */
function loadCasesFromGlob(
  pattern: string,
  suiteDir: string,
): ActionResult<CaseSpec[]> {
  const matches = expandGlob(pattern, suiteDir);

  if (matches.length === 0) {
    return err(`cases glob "${pattern}" matched no files`);
  }

  // Stable, deterministic order so a run's case ordering never depends on the
  // filesystem's directory-entry order.
  const paths = matches
    .map((m) => anchor(suiteDir, m))
    .sort((a, b) => a.localeCompare(b));

  const cases: CaseSpec[] = [];
  const seen = new Set<string>();
  for (const path of paths) {
    const text = readFileText(path);
    if (!text.ok) return err(text.error);
    const parsed = parseYamlSafe(text.data, path);
    if (!parsed.ok) return err(parsed.error);
    const validated = parseOrResult(caseSpecSchema, parsed.data);
    if (!validated.ok) return err(`case "${path}": ${validated.error}`);
    if (seen.has(validated.data.id)) {
      return err(`duplicate case id "${validated.data.id}" (in "${path}")`);
    }
    seen.add(validated.data.id);
    cases.push(validated.data);
  }
  return ok(cases);
}

/**
 * Load + validate a suite file, inlining its cases. `specPath` may be relative
 * to the process cwd. On success the returned spec's `target` path (for fixture
 * targets) is left as-authored — the caller anchors it via {@link resolveTargetPath}
 * using `suiteDir`.
 */
export function loadSuite(specPath: string): ActionResult<LoadedSuite> {
  const suitePath = isAbsolute(specPath) ? specPath : resolve(specPath);
  const suiteDir = dirname(suitePath);

  const text = readFileText(suitePath);
  if (!text.ok) return err(text.error);

  const parsed = parseYamlSafe(text.data, suitePath);
  if (!parsed.ok) return err(parsed.error);

  const validated = parseOrResult(suiteSpecSchema, parsed.data);
  if (!validated.ok) return err(`suite "${suitePath}": ${validated.error}`);
  const spec = validated.data;

  let cases: CaseSpec[];
  if (typeof spec.cases === "string") {
    const fromGlob = loadCasesFromGlob(spec.cases, suiteDir);
    if (!fromGlob.ok) return err(fromGlob.error);
    cases = fromGlob.data;
  } else {
    // Inline array — re-validate each entry defensively and dedupe ids.
    const seen = new Set<string>();
    for (const c of spec.cases) {
      if (seen.has(c.id)) return err(`duplicate case id "${c.id}"`);
      seen.add(c.id);
    }
    cases = spec.cases;
  }

  if (cases.length === 0) return err(`suite "${spec.suite}" has no cases`);

  return ok({ spec, cases, suitePath, suiteDir });
}

/**
 * Anchor a fixture target's `path` to the suite directory so the runner reads
 * the right file regardless of the process cwd. Exec targets carry a command,
 * not a path, so they pass through untouched.
 */
export function resolveTargetPath(
  target: SuiteSpec["target"],
  suiteDir: string,
): SuiteSpec["target"] {
  if (target.kind === "fixture") {
    return { ...target, path: anchor(suiteDir, target.path) };
  }
  return target;
}
