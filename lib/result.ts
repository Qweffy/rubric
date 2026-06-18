import { logger } from "@/lib/logger";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export const ok = <T>(data: T): ActionResult<T> => ({ ok: true, data });
export const err = (error: string): ActionResult<never> => ({
  ok: false,
  error,
});

/**
 * Expected, user-safe failures. Thrown inside runAction, their message
 * reaches the client verbatim. Anything else is logged server-side and
 * the client gets the generic fallback.
 */
export class ActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActionError";
  }
}

export async function runAction<T>(
  fallback: string,
  fn: () => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    return ok(await fn());
  } catch (e) {
    if (e instanceof ActionError) return err(e.message);
    logger.error("action", fallback, { error: e });
    return err(fallback);
  }
}
