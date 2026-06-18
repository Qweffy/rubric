// NOTE: no "server-only" here — the seed/eval CLIs (tsx) import this module too.
// App-facing data access goes through lib/queries/*, which ARE server-only.
// better-sqlite3's CJS default export shares the name of a named export; the
// default is the one we want, so silence the cosmetic no-named-as-default warning.
// eslint-disable-next-line import-x/no-named-as-default
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "./schema";

// Local file DB — defaults to ./rubric.db, overridable via RUBRIC_DB.
const client = new Database(process.env.RUBRIC_DB ?? "./rubric.db");
client.pragma("journal_mode = WAL");
client.pragma("foreign_keys = ON");

export const db = drizzle(client, { schema });
export { schema };
