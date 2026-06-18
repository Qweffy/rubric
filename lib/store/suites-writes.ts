import { eq } from "drizzle-orm";

import { db } from "@/db";
import { suites, type Suite, type SuiteStatus } from "@/db/schema";

import { type Executor } from "./executor";
import {
  insertPromptVersion,
  insertSuite,
  updateSuiteLatestRun,
} from "./primitives";

/**
 * Domain write helpers for suites and their versioned prompts. These wrap the
 * low-level insert* primitives (lib/store/index.ts) with a friendly,
 * defaults-filling input shape and return the persisted row. Each is a single
 * idempotent upsert keyed on a unique index (slug / (suiteId, label)), so a
 * re-seed or a re-registration converges instead of duplicating. Every helper
 * accepts an optional Executor so it can run standalone or inside a caller's
 * transaction.
 */

export interface UpsertSuiteInput {
  slug: string;
  title: string;
  repo: string;
  status?: SuiteStatus;
}

/**
 * Insert or update a suite by its unique slug, filling timestamps. On conflict
 * the human-facing columns refresh and updatedAt bumps; createdAt and
 * latestRunId are preserved. Returns the persisted row.
 */
export async function upsertSuite(
  input: UpsertSuiteInput,
  exec: Executor = db,
): Promise<Suite> {
  const now = new Date();
  const id = await insertSuite(
    {
      slug: input.slug,
      title: input.title,
      repo: input.repo,
      status: input.status ?? "passing",
      createdAt: now,
      updatedAt: now,
    },
    exec,
  );

  const row = await exec.select().from(suites).where(eq(suites.id, id)).limit(1).get();
  if (row === undefined) throw new Error("suite upsert returned no row");
  return row;
}

export interface UpsertPromptVersionInput {
  suiteId: number;
  label: string;
  body: string;
  ref?: string | null;
}

/**
 * Insert or update a prompt version on the (suiteId, label) unique index so a
 * label is stable within a suite. On conflict body and ref refresh. Returns the
 * persisted version id.
 */
export async function upsertPromptVersion(
  input: UpsertPromptVersionInput,
  exec: Executor = db,
): Promise<number> {
  return insertPromptVersion(
    {
      suiteId: input.suiteId,
      label: input.label,
      body: input.body,
      ref: input.ref ?? null,
      createdAt: new Date(),
    },
    exec,
  );
}

/**
 * Point a suite at its most recent run and grade it. Bumps updatedAt so the
 * suite sorts fresh after a run lands.
 */
export async function setSuiteLatestRun(
  suiteId: number,
  runId: number,
  status: SuiteStatus,
  exec: Executor = db,
): Promise<void> {
  await updateSuiteLatestRun(suiteId, runId, status, new Date(), exec);
}

/** Resolve a suite id by slug — null when the slug is unknown. */
export async function suiteIdBySlug(
  slug: string,
  exec: Executor = db,
): Promise<number | null> {
  const row = await exec
    .select({ id: suites.id })
    .from(suites)
    .where(eq(suites.slug, slug))
    .limit(1)
    .get();
  return row?.id ?? null;
}
