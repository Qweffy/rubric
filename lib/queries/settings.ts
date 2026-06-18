import { sql } from "drizzle-orm";

import { db } from "@/db";
import {
  judges,
  runs,
  suites,
  type JudgeProvider,
} from "@/db/schema";

/* ------------------------------------------------------------------ */
/* Settings — connections & store stats for the admin panel.            */
/* Connections are the judge providers (Groq / Ollama / recorded),      */
/* their credential state read from env, and how many judges use each.  */
/* No "server-only": env + counts are safe to read from the CLI too.    */
/* ------------------------------------------------------------------ */

export type ConnectionStatus = "connected" | "configured" | "unconfigured";

export interface Connection {
  provider: JudgeProvider;
  label: string;
  status: ConnectionStatus;
  /** Human note on what the status means / what's missing. */
  detail: string;
  /** The env var that configures this provider, null for the recorded backend. */
  envVar: string | null;
  /** Model id in use for this provider, when one is pinned via env. */
  model: string | null;
  /** How many judges in the store use this provider. */
  judgeCount: number;
  /** Whether any judge on this provider is the default. */
  isDefaultProvider: boolean;
}

export interface StoreStats {
  suites: number;
  runs: number;
  judges: number;
}

export interface ConnectionsData {
  connections: Connection[];
  stats: StoreStats;
}

const PROVIDER_LABEL: Record<JudgeProvider, string> = {
  groq: "Groq",
  ollama: "Ollama",
  recorded: "Recorded fixtures",
};

function envOr(name: string): string | null {
  const v = process.env[name];
  return v !== undefined && v.length > 0 ? v : null;
}

function connectionFor(
  provider: JudgeProvider,
  judgeCount: number,
  isDefaultProvider: boolean,
): Connection {
  const label = PROVIDER_LABEL[provider];
  const model = envOr("RUBRIC_JUDGE_MODEL");

  switch (provider) {
    case "groq": {
      const key = envOr("GROQ_API_KEY");
      return {
        provider,
        label,
        status: key !== null ? "connected" : "unconfigured",
        detail:
          key !== null
            ? "API key present — live judging enabled."
            : "GROQ_API_KEY is not set — judging falls back to recorded.",
        envVar: "GROQ_API_KEY",
        model,
        judgeCount,
        isDefaultProvider,
      };
    }
    case "ollama": {
      const base = envOr("OLLAMA_BASE_URL");
      return {
        provider,
        label,
        status: base !== null ? "configured" : "unconfigured",
        detail:
          base !== null
            ? `Base URL ${base} — reachability not checked here.`
            : "OLLAMA_BASE_URL is not set.",
        envVar: "OLLAMA_BASE_URL",
        model,
        judgeCount,
        isDefaultProvider,
      };
    }
    case "recorded":
      return {
        provider,
        label,
        status: "connected",
        detail: "Deterministic fixtures — always available, no credentials.",
        envVar: null,
        model: null,
        judgeCount,
        isDefaultProvider,
      };
  }
}

/**
 * The connections panel: one row per judge provider with its credential state
 * (from env), the pinned model, and how many judges use it. A store-stats strip
 * accompanies it. Providers with no judges still appear so the UI can offer to
 * configure them.
 */
export async function getConnections(): Promise<ConnectionsData> {
  const [providerRows, suiteCount, runCount, judgeCount] = await Promise.all([
    db
      .select({
        provider: judges.provider,
        count: sql<number>`count(*)`,
        defaultCount: sql<number>`sum(case when ${judges.isDefault} then 1 else 0 end)`,
      })
      .from(judges)
      .groupBy(judges.provider),
    db.select({ n: sql<number>`count(*)` }).from(suites),
    db.select({ n: sql<number>`count(*)` }).from(runs),
    db.select({ n: sql<number>`count(*)` }).from(judges),
  ]);

  const byProvider = new Map(
    providerRows.map((r) => [
      r.provider,
      { count: r.count, isDefault: r.defaultCount > 0 },
    ]),
  );

  const allProviders: JudgeProvider[] = ["groq", "ollama", "recorded"];
  const connections = allProviders.map((p) => {
    const agg = byProvider.get(p) ?? { count: 0, isDefault: false };
    return connectionFor(p, agg.count, agg.isDefault);
  });

  return {
    connections,
    stats: {
      suites: suiteCount[0]?.n ?? 0,
      runs: runCount[0]?.n ?? 0,
      judges: judgeCount[0]?.n ?? 0,
    },
  };
}
