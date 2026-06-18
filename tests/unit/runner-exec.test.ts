import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { RunnerError } from "@/lib/runner/errors";
import { CASE_INPUT_ENV, makeExecTarget } from "@/lib/runner/exec";
import { type CaseInput } from "@/lib/runner/types";
import { type ExecTarget } from "@/lib/spec/types";

/* ------------------------------------------------------------------ */
/* Exec runner — drives a real subprocess. The system under test here   */
/* is a set of tiny inline node scripts (written to a tmp dir) that read */
/* the case payload from stdin / argv / env, then echo JSON on stdout.  */
/* No network, no DB, no API key — exec is pure process plumbing, so the */
/* tests assert the real spawn/timeout/exit/parse behavior end to end.  */
/* ------------------------------------------------------------------ */

// The node binary running this very test — guaranteed present, no PATH guess.
const NODE = process.execPath;

let dir: string;

/** Write a node script to the tmp dir and return its absolute path. */
function script(name: string, body: string): string {
  const path = join(dir, name);
  // reason: path is a fixed name under a test-owned mkdtemp dir, not user input.
  writeFileSync(path, body, "utf8"); // eslint-disable-line security/detect-non-literal-fs-filename
  return path;
}

/** A complete ExecTarget spec with the parser defaults the schema applies. */
function execSpec(over: Partial<ExecTarget> & { command: string }): ExecTarget {
  return {
    kind: "exec",
    input: "stdin",
    parseStdout: "json",
    timeoutMs: 5000,
    ...over,
  };
}

/** A minimal parsed case — only `id` and `input` matter to the exec target. */
function caseInput(input: unknown, id = "case-1"): CaseInput {
  return { id, input, expect: {} };
}

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "rubric-exec-"));

  // Echo the payload back, tagged with how it was received, so each input
  // mode can prove the payload landed in the right channel.
  script(
    "echo-stdin.cjs",
    [
      "let raw = '';",
      "process.stdin.on('data', (c) => { raw += c; });",
      "process.stdin.on('end', () => {",
      "  process.stdout.write(JSON.stringify({ via: 'stdin', got: JSON.parse(raw || 'null') }));",
      "});",
    ].join("\n"),
  );

  script(
    "echo-arg.cjs",
    [
      "const raw = process.argv[2] ?? 'null';",
      "process.stdout.write(JSON.stringify({ via: 'arg', got: JSON.parse(raw) }));",
    ].join("\n"),
  );

  script(
    "echo-env.cjs",
    [
      `const raw = process.env[${JSON.stringify(CASE_INPUT_ENV)}] ?? 'null';`,
      "process.stdout.write(JSON.stringify({ via: 'env', got: JSON.parse(raw) }));",
    ].join("\n"),
  );

  // Sleeps past any sane timeout, then would exit 0 — used to force a kill.
  script(
    "sleep.cjs",
    ["setTimeout(() => process.stdout.write('{}'), 60000);"].join("\n"),
  );

  // Prints a diagnostic to stderr and exits nonzero — the failure path.
  script(
    "fail.cjs",
    [
      "process.stderr.write('boom: bad input');",
      "process.exit(3);",
    ].join("\n"),
  );

  // Exits 0 but emits text that is not JSON — the unparseable-stdout path.
  script("garbage.cjs", ["process.stdout.write('not json at all');"].join("\n"));
});

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("makeExecTarget — payload delivery", () => {
  it("delivers the case input as JSON on stdin and parses stdout JSON", async () => {
    const t = makeExecTarget(
      execSpec({
        command: `${NODE} ${join(dir, "echo-stdin.cjs")}`,
        input: "stdin",
      }),
    );
    const out = await t.run(caseInput({ amount: 42, note: "hi" }));
    expect(out).toEqual({ via: "stdin", got: { amount: 42, note: "hi" } });
  });

  it("does not spawn anything until run() is called", () => {
    // makeExecTarget is a pure builder — constructing it must not touch the
    // process table; only run() spawns. A bogus command proves it stays inert.
    const target = makeExecTarget(execSpec({ command: "definitely-not-a-real-binary" }));
    expect(typeof target.run).toBe("function");
  });

  it("delivers the case input as the trailing argv slot when input is 'arg'", async () => {
    const t = makeExecTarget(
      execSpec({
        command: `${NODE} ${join(dir, "echo-arg.cjs")}`,
        input: "arg",
      }),
    );
    const out = await t.run(caseInput({ id: "x", n: 7 }));
    expect(out).toEqual({ via: "arg", got: { id: "x", n: 7 } });
  });

  it("delivers the case input via the env var when input is 'env'", async () => {
    const t = makeExecTarget(
      execSpec({
        command: `${NODE} ${join(dir, "echo-env.cjs")}`,
        input: "env",
      }),
    );
    const out = await t.run(caseInput(["a", "b", "c"]));
    expect(out).toEqual({ via: "env", got: ["a", "b", "c"] });
  });

  it("serializes a primitive input the same way (round-trips through JSON)", async () => {
    const t = makeExecTarget(
      execSpec({
        command: `${NODE} ${join(dir, "echo-stdin.cjs")}`,
        input: "stdin",
      }),
    );
    const out = await t.run(caseInput("just-a-string"));
    expect(out).toEqual({ via: "stdin", got: "just-a-string" });
  });
});

describe("makeExecTarget — failure modes", () => {
  it("rejects with RunnerError when the process exceeds timeoutMs", async () => {
    const t = makeExecTarget(
      execSpec({
        command: `${NODE} ${join(dir, "sleep.cjs")}`,
        timeoutMs: 80,
      }),
    );
    await expect(t.run(caseInput({}))).rejects.toBeInstanceOf(RunnerError);
    await expect(t.run(caseInput({}))).rejects.toThrow(/timed out after 80ms/);
  });

  it("rejects with RunnerError carrying stderr tail on a nonzero exit", async () => {
    const t = makeExecTarget(
      execSpec({ command: `${NODE} ${join(dir, "fail.cjs")}` }),
    );
    const err = await t.run(caseInput({})).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(RunnerError);
    expect((err as RunnerError).message).toContain("exit code 3");
    expect((err as RunnerError).message).toContain("boom: bad input");
  });

  it("rejects with RunnerError when stdout is not valid JSON", async () => {
    const t = makeExecTarget(
      execSpec({ command: `${NODE} ${join(dir, "garbage.cjs")}` }),
    );
    const err = await t.run(caseInput({})).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(RunnerError);
    expect((err as RunnerError).message).toContain("not valid JSON");
    // The original SyntaxError is preserved as the cause for logging.
    expect((err as RunnerError).cause).toBeInstanceOf(Error);
  });

  it("rejects with RunnerError when the program cannot be spawned", async () => {
    const t = makeExecTarget(
      execSpec({ command: `${join(dir, "does-not-exist-binary")}` }),
    );
    const err = await t.run(caseInput({})).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(RunnerError);
    expect((err as RunnerError).message).toContain("cannot spawn");
    expect((err as RunnerError).cause).toBeDefined();
  });

  it("throws a RunnerError synchronously-wrapped for an empty command", async () => {
    const t = makeExecTarget(execSpec({ command: "   " }));
    await expect(t.run(caseInput({}))).rejects.toBeInstanceOf(RunnerError);
    await expect(t.run(caseInput({}))).rejects.toThrow(/empty exec command/);
  });
});
