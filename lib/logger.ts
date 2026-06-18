// Structured logger. Intentionally dependency-light and NOT `server-only` so
// server actions, the seed/eval CLIs (tsx) and any future API route can all
// import it. Rubric runs on a local better-sqlite3 file with no error-events
// table, so this logger emits a greppable JSON line to the console only — there
// is no durable sink to write to. Keep it that way until a sink table exists.

export type LogLevel = "warn" | "error" | "fatal";

export type LogContext = Record<string, unknown>;

export interface LogOptions {
  /** An Error (or anything) whose message/stack enriches the event. */
  error?: unknown;
  /** Structured context; secret/PII-looking keys are redacted before write. */
  context?: LogContext;
}

// Keys whose values are stripped before an event is logged.
const REDACT_KEY = /(cookie|authorization|^auth$|token|password|secret|api[-_]?key)/i;

/** Replace secret/PII-looking values with "[redacted]". Exported for testing. */
export function redactContext(
  context: LogContext | undefined,
): LogContext | undefined {
  if (context === undefined) return undefined;
  const out: LogContext = {};
  for (const [key, value] of Object.entries(context)) {
    out[key] = REDACT_KEY.test(key) ? "[redacted]" : value;
  }
  return out;
}

function errorMessage(error: unknown): string | null {
  if (error instanceof Error) return error.message;
  if (error === undefined) return null;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "[unserializable error]";
  }
}

/**
 * Log a structured event: a single JSON line to the console (greppable). A
 * `warn` goes to `console.warn`; everything else to `console.error` — the only
 * two console methods rubric's lint floor permits in product code.
 */
export function logEvent(
  level: LogLevel,
  source: string,
  message: string,
  options: LogOptions = {},
): void {
  const detail = errorMessage(options.error);
  const fullMessage =
    detail !== null && detail !== message ? `${message}: ${detail}` : message;
  const context = redactContext(options.context);

  const line = JSON.stringify({
    level,
    source,
    message: fullMessage,
    ...(context !== undefined ? { context } : {}),
  });
  if (level === "warn") console.warn(line);
  else console.error(line);
}

export const logger = {
  warn: (source: string, message: string, options?: LogOptions) =>
    logEvent("warn", source, message, options),
  error: (source: string, message: string, options?: LogOptions) =>
    logEvent("error", source, message, options),
  fatal: (source: string, message: string, options?: LogOptions) =>
    logEvent("fatal", source, message, options),
};
