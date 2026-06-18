import { type db } from "@/db";

/**
 * The shared write seam for the SQLite store. Every primitive in this directory
 * accepts an `Executor` so it runs identically whether called standalone
 * (auto-commit on the base `db` connection) or composed inside a
 * `db.transaction((tx) => …)` block. better-sqlite3 transactions are synchronous,
 * so `tx` exposes the same query-builder surface as `db`; deriving the type from
 * the transaction callback's parameter keeps the two in lock-step without
 * naming drizzle's internal generic-heavy class directly.
 */
export type Executor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;
