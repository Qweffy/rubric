import Groq from "groq-sdk";
import { z } from "zod";

import { buildJudgePrompt } from "@/lib/judge/prompt";
import { type JudgeAdapter, type JudgeRequest } from "@/lib/judge/types";
import { judgeVerdictSchema } from "@/lib/judge/verdict-schema";

/* ------------------------------------------------------------------ */
/* Groq judge adapter — the default provider.                           */
/* Constrained decoding via strict json_schema (gpt-oss supports it,    */
/* llama-3.3 does not), temperature 0 for determinism. The schema comes */
/* from judgeVerdictSchema so there's one source of truth for shape;    */
/* the caller still re-parses through that zod schema, since strict mode */
/* guarantees shape, not semantics.                                     */
/* ------------------------------------------------------------------ */

const DEFAULT_MODEL = "openai/gpt-oss-120b";

export const judgeModel = (): string =>
  process.env.RUBRIC_JUDGE_MODEL ?? DEFAULT_MODEL;

let _client: Groq | null = null;

// Lazy singleton: the key is only required when a judge call actually fires, so
// importing this module (or constructing the adapter) never throws — tests that
// inject a mock adapter run with no key at all.
function client(): Groq {
  if (!_client) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GROQ_API_KEY is not set — copy .env.example to .env.local and fill it in.",
      );
    }
    _client = new Groq({ apiKey });
  }
  return _client;
}

// z.toJSONSchema emits a draft `$schema` key that Groq's strict mode rejects;
// strip it. Built once — the schema is static.
function toStrictSchema(): Record<string, unknown> {
  const { $schema, ...rest } = z.toJSONSchema(judgeVerdictSchema) as Record<
    string,
    unknown
  >;
  void $schema;
  return rest;
}

const JSON_SCHEMA = toStrictSchema();

export function createGroqJudge(): JudgeAdapter {
  return {
    model: judgeModel(),
    async judge(req: JudgeRequest): Promise<unknown> {
      const { system, user } = buildJudgePrompt(req);

      const res = await client().chat.completions.create({
        model: judgeModel(),
        temperature: 0,
        max_completion_tokens: 1024,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "judge_verdict",
            strict: true,
            schema: JSON_SCHEMA,
          },
        },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      });

      const content = res.choices[0]?.message.content;
      if (!content) throw new Error("Empty completion from Groq judge");
      return JSON.parse(content);
    },
  };
}
