import { spawn } from "node:child_process";

import { RunnerError } from "@/lib/runner/errors";
import {
  type CaseInput,
  type Target,
  type TargetOutput,
} from "@/lib/runner/types";
import { type ExecTarget } from "@/lib/spec/types";

/* ------------------------------------------------------------------ */
/* Exec target — runs the system under test as a subprocess.            */
/* The case's input is serialized to JSON and delivered via stdin, a    */
/* single argv slot, or an env var (per spec.input). stdout is captured */
/* and JSON-parsed. A timeout, a spawn failure, a non-zero exit, or     */
/* unparseable stdout all surface as RunnerError so one bad case fails   */
/* cleanly instead of crashing the run.                                 */
/* ------------------------------------------------------------------ */

/** Env var the case payload lands in when spec.input is "env". */
export const CASE_INPUT_ENV = "RUBRIC_CASE_INPUT";

/** Split a shell-ish command string into program + args (whitespace-only). */
function splitCommand(command: string): { file: string; args: string[] } {
  const parts = command.trim().split(/\s+/);
  const [file, ...args] = parts;
  if (file === undefined || file.length === 0) {
    throw new RunnerError(`empty exec command`);
  }
  return { file, args };
}

interface SpawnPlan {
  file: string;
  args: string[];
  env: NodeJS.ProcessEnv;
  stdin: string | null;
}

/** Build the spawn invocation for a case, placing the payload per spec.input. */
function planSpawn(spec: ExecTarget, payload: string): SpawnPlan {
  const { file, args } = splitCommand(spec.command);

  if (spec.input === "arg") {
    return { file, args: [...args, payload], env: process.env, stdin: null };
  }
  if (spec.input === "env") {
    return {
      file,
      args,
      env: { ...process.env, [CASE_INPUT_ENV]: payload },
      stdin: null,
    };
  }
  // "stdin" (default)
  return { file, args, env: process.env, stdin: payload };
}

export function makeExecTarget(spec: ExecTarget): Target {
  const run = async (input: CaseInput): Promise<TargetOutput> => {
    const payload = JSON.stringify(input.input);
    const plan = planSpawn(spec, payload);

    const stdout = await new Promise<string>((resolve, reject) => {
      // reason: command comes from a trusted spec file, not user input.
      const child = spawn(plan.file, plan.args, {
        env: plan.env,
        stdio: ["pipe", "pipe", "pipe"],
      });

      let out = "";
      let errOut = "";
      let settled = false;

      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        child.kill("SIGKILL");
        reject(
          new RunnerError(
            `exec "${spec.command}" timed out after ${spec.timeoutMs}ms`,
          ),
        );
      }, spec.timeoutMs);

      const fail = (error: RunnerError): void => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(error);
      };

      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (chunk: string) => {
        out += chunk;
      });
      child.stderr.on("data", (chunk: string) => {
        errOut += chunk;
      });

      child.on("error", (cause) => {
        fail(new RunnerError(`cannot spawn "${spec.command}"`, { cause }));
      });

      child.on("close", (code, signal) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (code === 0) {
          resolve(out);
          return;
        }
        const how =
          signal !== null ? `signal ${signal}` : `exit code ${code ?? "unknown"}`;
        const tail = errOut.trim().slice(0, 500);
        reject(
          new RunnerError(
            `exec "${spec.command}" failed (${how})` +
              (tail.length > 0 ? `: ${tail}` : ""),
          ),
        );
      });

      if (plan.stdin !== null) {
        child.stdin.end(plan.stdin);
      } else {
        child.stdin.end();
      }
    });

    try {
      return JSON.parse(stdout) as TargetOutput;
    } catch (cause) {
      throw new RunnerError(
        `exec "${spec.command}" stdout is not valid JSON`,
        { cause },
      );
    }
  };

  return { run };
}
