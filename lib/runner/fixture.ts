import { readFileSync } from "node:fs";

import { RunnerError } from "@/lib/runner/errors";
import {
  type CaseInput,
  type Target,
  type TargetOutput,
} from "@/lib/runner/types";
import { type FixtureTarget } from "@/lib/spec/types";

/* ------------------------------------------------------------------ */
/* Fixture target — reads a pre-recorded JSON output off disk.          */
/* Zero process, zero network: the path is templated per case, the file */
/* is read + JSON-parsed, and the raw value is handed back untrusted.   */
/* This is the offline/replay seam used to score without re-running the */
/* system under test.                                                   */
/* ------------------------------------------------------------------ */

/**
 * Substitute `${case.id}` in a fixture path with the concrete case id.
 * Only `case.id` is supported — an unknown `${...}` token is a spec error
 * (a typo'd placeholder) and fails loudly rather than reading a wrong file.
 */
export function interpolatePath(template: string, caseId: string): string {
  return template.replace(/\$\{([^}]*)\}/g, (_match, tokenRaw: string) => {
    const token = tokenRaw.trim();
    // reason: comparing a template token to a literal name, not a secret.
    // eslint-disable-next-line security/detect-possible-timing-attacks
    if (token === "case.id") return caseId;
    throw new RunnerError(
      `unknown placeholder "\${${token}}" in fixture path "${template}"`,
    );
  });
}

export function makeFixtureTarget(spec: FixtureTarget): Target {
  // Sync work, but the Target.run signature is Promise-returning so a throw
  // surfaces as a rejection — uniform with exec.ts for the caller's catch.
  // eslint-disable-next-line @typescript-eslint/require-await
  const run = async (input: CaseInput): Promise<TargetOutput> => {
    const path = interpolatePath(spec.path, input.id);

    let raw: string;
    try {
      // reason: path is templated from a trusted spec file, not user input.
      raw = readFileSync(path, "utf8"); // eslint-disable-line security/detect-non-literal-fs-filename
    } catch (cause) {
      throw new RunnerError(`cannot read fixture "${path}"`, { cause });
    }

    try {
      return JSON.parse(raw) as TargetOutput;
    } catch (cause) {
      throw new RunnerError(`fixture "${path}" is not valid JSON`, { cause });
    }
  };

  return { run };
}
