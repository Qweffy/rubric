import { z } from "zod";

import { buildJudgePrompt } from "@/lib/judge/prompt";
import { type JudgeAdapter, type JudgeRequest } from "@/lib/judge/types";
import { judgeVerdictSchema } from "@/lib/judge/verdict-schema";

/* ------------------------------------------------------------------ */
/* Ollama judge adapter — local, drop-in for Groq.                      */
/* Talks the OpenAI-compatible /v1/chat/completions surface Ollama      */
/* exposes (no API key). Ollama's json_schema support is best-effort    */
/* across models, so we send the schema as a guided-decoding hint AND   */
/* parse the body here, retrying once with the validation error appended */
/* when the first response doesn't conform. The caller re-parses too —  */
/* this retry just buys a better shot at a clean parse without a key.    */
/* ------------------------------------------------------------------ */

const DEFAULT_BASE_URL = "http://localhost:11434/v1";
const DEFAULT_MODEL = "gpt-oss:20b";

export const ollamaBaseUrl = (): string =>
  process.env.OLLAMA_BASE_URL ?? DEFAULT_BASE_URL;

export const ollamaModel = (): string =>
  process.env.RUBRIC_JUDGE_MODEL ?? DEFAULT_MODEL;

// z.toJSONSchema emits a draft `$schema` key some servers reject; strip it.
function toStrictSchema(): Record<string, unknown> {
  const { $schema, ...rest } = z.toJSONSchema(judgeVerdictSchema) as Record<
    string,
    unknown
  >;
  void $schema;
  return rest;
}

const JSON_SCHEMA = toStrictSchema();

// Minimal boundary parse of the HTTP envelope — we only read the one field we
// need (the assistant message content), as unknown, then JSON.parse it.
const chatEnvelopeSchema = z.object({
  choices: z
    .array(z.object({ message: z.object({ content: z.string().nullable() }) }))
    .min(1),
});

interface ChatMessage {
  role: "system" | "user";
  content: string;
}

async function callOnce(
  model: string,
  messages: ChatMessage[],
): Promise<unknown> {
  const res = await fetch(`${ollamaBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "judge_verdict",
          strict: true,
          schema: JSON_SCHEMA,
        },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Ollama judge request failed: ${res.status} ${res.statusText}${
        body ? ` — ${body.slice(0, 200)}` : ""
      }`,
    );
  }

  const envelope = chatEnvelopeSchema.parse(await res.json());
  const content = envelope.choices[0]?.message.content;
  if (!content) throw new Error("Empty completion from Ollama judge");
  return JSON.parse(content);
}

export function createOllamaJudge(): JudgeAdapter {
  const model = ollamaModel();
  return {
    model,
    async judge(req: JudgeRequest): Promise<unknown> {
      const { system, user } = buildJudgePrompt(req);
      const messages: ChatMessage[] = [
        { role: "system", content: system },
        { role: "user", content: user },
      ];

      const first = await callOnce(model, messages);
      const parsed = judgeVerdictSchema.safeParse(first);
      if (parsed.success) return first;

      // One repair retry: append the validation error and ask for corrected JSON.
      const issue = parsed.error.issues[0];
      const note = issue
        ? `${issue.path.join(".")}: ${issue.message}`
        : "invalid shape";
      const repairMessages: ChatMessage[] = [
        ...messages,
        {
          role: "user",
          content: `Your previous output failed validation: ${note}. Return only corrected JSON matching the schema.`,
        },
      ];
      // Return raw — the caller's parseOrResult is the trusted boundary.
      return callOnce(model, repairMessages);
    },
  };
}
