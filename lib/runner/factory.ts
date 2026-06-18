import { makeExecTarget } from "@/lib/runner/exec";
import { makeFixtureTarget } from "@/lib/runner/fixture";
import { type Target } from "@/lib/runner/types";
import { type TargetSpec } from "@/lib/spec/types";

/* ------------------------------------------------------------------ */
/* Target factory — the one place that maps a spec's `kind` to a Target.*/
/* The runner depends on this seam only, never on a concrete target, so */
/* adding a kind is a single switch arm here plus its builder.          */
/* ------------------------------------------------------------------ */

/** Build the concrete Target a suite's `target` block describes. */
export function makeTarget(spec: TargetSpec): Target {
  switch (spec.kind) {
    case "fixture":
      return makeFixtureTarget(spec);
    case "exec":
      return makeExecTarget(spec);
    default: {
      // Exhaustiveness: a new kind on TargetSpec makes this fail to compile.
      const _never: never = spec;
      return _never;
    }
  }
}
