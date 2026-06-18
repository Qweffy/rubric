import { z } from "zod";

/* ------------------------------------------------------------------ */
/* Golden-set suite spec — the on-disk YAML contract.                   */
/* This zod schema IS the boundary: every suite file is parsed through  */
/* it before the runner trusts a single field. strictObject everywhere  */
/* so a typo'd key fails loudly instead of being silently ignored.      */
/* ------------------------------------------------------------------ */

/* --- prompt ------------------------------------------------------- */

export const promptSpecSchema = z.strictObject({
  version: z.string().min(1),
  ref: z.string().min(1).optional(),
});

/* --- target ------------------------------------------------------- */

export const fixtureTargetSchema = z.strictObject({
  kind: z.literal("fixture"),
  path: z.string().min(1),
});

export const execTargetSchema = z.strictObject({
  kind: z.literal("exec"),
  command: z.string().min(1),
  input: z.enum(["stdin", "arg", "env"]).default("stdin"),
  parseStdout: z.literal("json").default("json"),
  timeoutMs: z.int().positive().default(30000),
});

export const targetSpecSchema = z.discriminatedUnion("kind", [
  fixtureTargetSchema,
  execTargetSchema,
]);

/* --- scorers ------------------------------------------------------ */

export const exactMatchScorerSchema = z.strictObject({
  type: z.literal("exact-match"),
  name: z.string().min(1),
  mode: z.enum(["deep-equal", "by-path"]),
  weight: z.number().default(1),
});

export const jsonSchemaScorerSchema = z.strictObject({
  type: z.literal("json-schema"),
  name: z.string().min(1),
  schema: z.record(z.string(), z.unknown()),
  weight: z.number().default(1),
});

export const fieldAccuracyScorerSchema = z.strictObject({
  type: z.literal("field-accuracy"),
  name: z.string().min(1),
  fields: z.array(z.string().min(1)).min(1),
  threshold: z.number().default(0.95),
  weight: z.number().default(1),
});

export const containsScorerSchema = z.strictObject({
  type: z.literal("contains"),
  name: z.string().min(1),
  pattern: z.string().min(1),
  regex: z.boolean().default(false),
  weight: z.number().default(1),
});

export const judgeScorerSchema = z.strictObject({
  type: z.literal("judge"),
  name: z.string().min(1),
  rubric: z.array(z.string().min(1)).min(1),
  passScore: z.int().default(4),
  weight: z.number().default(1),
});

export const scorerSpecSchema = z.discriminatedUnion("type", [
  exactMatchScorerSchema,
  jsonSchemaScorerSchema,
  fieldAccuracyScorerSchema,
  containsScorerSchema,
  judgeScorerSchema,
]);

/* --- cases -------------------------------------------------------- */

export const caseSpecSchema = z.strictObject({
  id: z.string().min(1),
  label: z.string().min(1).optional(),
  input: z.unknown(),
  expect: z.record(z.string(), z.unknown()),
  precondition: z.string().min(1).optional(),
});

/* --- suite -------------------------------------------------------- */

export const suiteSpecSchema = z.strictObject({
  version: z.literal(1),
  suite: z.string().min(1),
  title: z.string().min(1),
  repo: z.string().min(1).optional(),
  prompt: promptSpecSchema,
  target: targetSpecSchema,
  scorers: z.array(scorerSpecSchema).min(1),
  cases: z.union([z.string().min(1), z.array(caseSpecSchema)]),
});
