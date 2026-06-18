import { z } from "zod";

import { type ActionResult, err, ok } from "@/lib/result";

export { z };

export function firstIssueMessage(error: z.ZodError): string {
  const flat = z.flattenError(error);
  const fieldMsg = Object.values(flat.fieldErrors)
    .flat()
    .find((m): m is string => typeof m === "string");
  return fieldMsg ?? flat.formErrors[0] ?? "Invalid input";
}

export function parseOrThrow<S extends z.ZodType>(
  schema: S,
  input: unknown,
): z.infer<S> {
  const r = schema.safeParse(input);
  if (!r.success) throw new Error(firstIssueMessage(r.error));
  return r.data;
}

export function parseOrResult<S extends z.ZodType>(
  schema: S,
  input: unknown,
): ActionResult<z.infer<S>> {
  const r = schema.safeParse(input);
  return r.success ? ok(r.data) : err(firstIssueMessage(r.error));
}
