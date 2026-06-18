import { createGroqJudge } from "@/lib/judge/groq";
import { createOllamaJudge } from "@/lib/judge/ollama";
import { type JudgeAdapter } from "@/lib/judge/types";

/* ------------------------------------------------------------------ */
/* Judge factory — selects the provider from RUBRIC_JUDGE.              */
/* Groq is the default; Ollama is the local drop-in. Both honor         */
/* RUBRIC_JUDGE_MODEL for the model id. Neither constructor touches the */
/* network or reads a key, so getJudge() is cheap and side-effect-free  */
/* until the adapter's judge() is actually called.                      */
/* ------------------------------------------------------------------ */

export type JudgeProviderName = "groq" | "ollama";

function provider(): JudgeProviderName {
  const raw = process.env.RUBRIC_JUDGE ?? "groq";
  if (raw === "groq" || raw === "ollama") return raw;
  throw new Error(
    `Unknown RUBRIC_JUDGE "${raw}" — expected "groq" or "ollama".`,
  );
}

/** Resolve the configured judge adapter. */
export function getJudge(): JudgeAdapter {
  switch (provider()) {
    case "groq":
      return createGroqJudge();
    case "ollama":
      return createOllamaJudge();
  }
}
