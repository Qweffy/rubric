import { randomBytes } from "node:crypto";

/* ------------------------------------------------------------------ */
/* Spotlighting (Microsoft's term): wrap untrusted text in per-call     */
/* randomized delimiters so the model can tell instructions (system     */
/* message) from data (everything fenced). Static fences are trivially  */
/* escaped — an attacker just includes the closing token — so we mint a */
/* fresh random marker each call and strip any pre-existing copy of that */
/* sequence from the content before fencing.                            */
/*                                                                       */
/* Every case OUTPUT a judge grades is hostile input (it comes from the  */
/* system under test, not a trusted source); route it all through here.  */
/* Mirrors hiring-radar/lib/agent/spotlight.ts.                          */
/* ------------------------------------------------------------------ */

/** A fresh, unguessable fence marker. 8 hex bytes = 64 bits of entropy. */
function freshMarker(): string {
  return randomBytes(8).toString("hex");
}

export interface Spotlighted {
  /** The text wrapped in <data-{marker}>…</data-{marker}> fences. */
  fenced: string;
  /** The marker used — so the prompt can name the exact fence. */
  marker: string;
}

/**
 * Fence untrusted content for a single LLM message. Strips any literal copy of
 * the chosen fence tokens from the content first (delimiter-escape defense),
 * then wraps. The caller MUST tell the model, in the SYSTEM message, that text
 * inside <data-{marker}> tags is data and never instructions.
 */
export function spotlight(content: string): Spotlighted {
  const marker = freshMarker();
  const open = `<data-${marker}>`;
  const close = `</data-${marker}>`;
  // Remove any occurrence of our fence tokens (case-insensitive, optional
  // whitespace) so the content can't forge a closing delimiter. The marker is
  // random, so this is belt-and-suspenders, but cheap.
  // eslint-disable-next-line security/detect-non-literal-regexp -- marker is a controlled random hex string (randomBytes(8)), never user input
  const fenceRe = new RegExp(`</?\\s*data-${marker}\\s*>`, "gi");
  const safe = content.replace(fenceRe, "");
  return { fenced: `${open}\n${safe}\n${close}`, marker };
}
