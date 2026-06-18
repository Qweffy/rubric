// rubric — the CLI eval engine entrypoint.
//
// Import order is load-bearing: "@/lib/env" runs FIRST (side-effect import) so
// RUBRIC_DB lands in process.env before "@/db" opens the SQLite connection at
// module load — every command module transitively pulls in the store/queries,
// which open the db. Only after env is set do we import the handlers.
import "@/lib/env";

import { calibrate } from "@/lib/commands/calibrate";
import { diff } from "@/lib/commands/diff";
import { exportRun } from "@/lib/commands/export";
import { list } from "@/lib/commands/list";
import { run } from "@/lib/commands/run";
import { show } from "@/lib/commands/show";
import { trajectory } from "@/lib/commands/trajectory";

/* ------------------------------------------------------------------ */
/* Arg parsing — thin. The first positional is the command; the rest    */
/* are positionals + a small set of boolean/value flags. No dependency  */
/* — process.argv.slice(2) is enough for this surface.                  */
/* ------------------------------------------------------------------ */

interface Args {
  command: string | undefined;
  positionals: string[];
  flags: {
    noStore: boolean;
    noColor: boolean;
    suite: string | undefined;
    out: string | undefined;
    format: string | undefined;
    floor: number | undefined;
  };
}

function parseArgs(argv: string[]): Args {
  const positionals: string[] = [];
  const flags: Args["flags"] = {
    noStore: false,
    noColor: false,
    suite: undefined,
    out: undefined,
    format: undefined,
    floor: undefined,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === undefined) continue;
    switch (arg) {
      case "--no-store":
        flags.noStore = true;
        break;
      case "--no-color":
        flags.noColor = true;
        break;
      case "--suite":
        flags.suite = argv[i + 1];
        i += 1;
        break;
      case "--out":
        flags.out = argv[i + 1];
        i += 1;
        break;
      case "--format":
        flags.format = argv[i + 1];
        i += 1;
        break;
      case "--floor": {
        const raw = argv[i + 1];
        flags.floor = raw !== undefined ? Number(raw) : undefined;
        i += 1;
        break;
      }
      default:
        positionals.push(arg);
    }
  }

  const [command, ...rest] = positionals;
  return { command, positionals: rest, flags };
}

const USAGE = `rubric — golden-set eval engine

usage:
  rubric run <suite.yaml> [--no-store] [--no-color] [--floor <0-1>]
  rubric list [<suite>]
  rubric show <runId>
  rubric diff <runIdA> <runIdB> | <suite>
  rubric calibrate <judge> [--suite <slug>] [--no-store]
  rubric trajectory [<taskId>]
  rubric export <runId|suite> [--out <file.csv>] [--format csv]
`;

/** Print a rendered report/string to stdout (CLI owns the single console write). */
function print(text: string): void {
  process.stdout.write(text.endsWith("\n") ? text : `${text}\n`);
}

/** Print an error to stderr in the same one-line shape across commands. */
function printError(message: string): void {
  process.stderr.write(`rubric: ${message}\n`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.command === undefined || args.command === "help" || args.command === "--help") {
    print(USAGE);
    return;
  }

  switch (args.command) {
    case "run": {
      const specPath = args.positionals[0];
      if (specPath === undefined) {
        printError("usage: rubric run <suite.yaml>");
        process.exitCode = 1;
        return;
      }
      const result = await run(specPath, {
        noStore: args.flags.noStore,
        noColor: args.flags.noColor,
        floor: args.flags.floor,
      });
      if (!result.ok) {
        printError(result.error);
        process.exitCode = 1;
        return;
      }
      print(result.data.report);
      // The run's gate decides the process exit code — this is what CI reads.
      process.exitCode = result.data.exitCode;
      return;
    }

    case "list": {
      const result = await list({ suite: args.positionals[0] ?? args.flags.suite });
      if (!result.ok) {
        printError(result.error);
        process.exitCode = 1;
        return;
      }
      print(result.data);
      return;
    }

    case "show": {
      const result = await show(args.positionals[0], { noColor: args.flags.noColor });
      if (!result.ok) {
        printError(result.error);
        process.exitCode = 1;
        return;
      }
      print(result.data);
      return;
    }

    case "diff": {
      const result = await diff(args.positionals[0], args.positionals[1], {
        noColor: args.flags.noColor,
      });
      if (!result.ok) {
        printError(result.error);
        process.exitCode = 1;
        return;
      }
      print(result.data.report);
      // A regression makes diff non-zero so it can gate a PR like `run` does.
      process.exitCode = result.data.regressed ? 1 : 0;
      return;
    }

    case "calibrate": {
      const result = await calibrate(args.positionals[0], {
        suite: args.flags.suite ?? args.positionals[1],
        noStore: args.flags.noStore,
        noColor: args.flags.noColor,
      });
      if (!result.ok) {
        printError(result.error);
        process.exitCode = 1;
        return;
      }
      print(result.data);
      return;
    }

    case "trajectory": {
      const result = await trajectory(args.positionals[0], {
        noColor: args.flags.noColor,
      });
      if (!result.ok) {
        printError(result.error);
        process.exitCode = 1;
        return;
      }
      print(result.data);
      return;
    }

    case "export": {
      const result = await exportRun(args.positionals[0], {
        out: args.flags.out,
        format: args.flags.format === "parquet" ? "parquet" : "csv",
      });
      if (!result.ok) {
        printError(result.error);
        process.exitCode = 1;
        return;
      }
      print(result.data);
      return;
    }

    default:
      printError(`unknown command "${args.command}"`);
      print(USAGE);
      process.exitCode = 1;
  }
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
