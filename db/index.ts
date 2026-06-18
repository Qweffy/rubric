// NOTE: no "server-only" here — the seed/eval CLIs (tsx) import this module too.
// App-facing data access goes through lib/queries/*, which ARE server-only.
//
// libSQL driver: a hosted Turso URL when TURSO_DATABASE_URL is set (Vercel /
// prod), otherwise a plain local file (`file:./rubric.db`, overridable via
// RUBRIC_DB) for offline dev and tests. The libsql client is async, so the
// write path (lib/store/*) awaits its transactions.
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema";

const url =
  process.env.TURSO_DATABASE_URL ?? `file:${process.env.RUBRIC_DB ?? "./rubric.db"}`;

const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

export const db = drizzle(client, { schema });
export { schema };
