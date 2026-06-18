import { defineConfig } from "drizzle-kit";

// libSQL/Turso when TURSO_DATABASE_URL is set (hosted), otherwise a plain local
// file (`file:./rubric.db`, overridable via RUBRIC_DB) so generate/migrate work
// offline. The "turso" dialect drives libsql and accepts a `file:` URL locally;
// the schema is sqlite-core either way.
const url =
  process.env.TURSO_DATABASE_URL ?? `file:${process.env.RUBRIC_DB ?? "./rubric.db"}`;

export default defineConfig({
  dialect: "turso",
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dbCredentials: {
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
