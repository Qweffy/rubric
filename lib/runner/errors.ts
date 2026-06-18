/* ------------------------------------------------------------------ */
/* Runner error seam — the single typed failure a target may throw.     */
/* Targets cross a trust boundary (subprocess, fixture file), so any    */
/* failure surfaces as RunnerError. The caller catches it and turns the */
/* case into a failed result instead of letting the whole run crash.    */
/* ------------------------------------------------------------------ */

/**
 * A recoverable failure while driving a target: a missing fixture, malformed
 * JSON, a non-zero subprocess exit, a timeout. Carries the original `cause`
 * (when there is one) for logging without leaking it into scoring.
 */
export class RunnerError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "RunnerError";
  }
}
