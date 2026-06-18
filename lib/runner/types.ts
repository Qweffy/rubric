import { type CaseSpec } from "@/lib/spec/types";

/* ------------------------------------------------------------------ */
/* Target seam — what the runner executes a case against.               */
/* A target turns a case's input into raw output; the runner stays      */
/* agnostic to whether that's a fixture read, a subprocess, etc.        */
/* ------------------------------------------------------------------ */

/** The case the runner hands to a target — the spec's parsed case. */
export type CaseInput = CaseSpec;

/**
 * Raw output produced by a target. Untyped on purpose: it crosses a trust
 * boundary (subprocess stdout, fixture file) and is validated downstream
 * by scorers / zod before anything trusts its shape.
 */
export type TargetOutput = unknown;

/** A system-under-test the runner drives one case at a time. */
export interface Target {
  run(input: CaseInput): Promise<TargetOutput>;
}
