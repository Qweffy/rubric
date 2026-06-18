import { type db } from "@/db";

/**
 * The shared write seam for the SQLite store. Every primitive in this directory
 * accepts an `Executor` so it runs identically whether called standalone
 * (auto-commit on the base `db` connection) or composed inside a
 * `db.transaction(async (tx) => …)` block. libSQL transactions are async, so the
 * primitives `await` their query builders; deriving the type from the
 * transaction callback's parameter keeps `tx` and `db` in lock-step without
 * naming drizzle's internal generic-heavy class directly.
 */
export type Executor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;
