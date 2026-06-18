# rubric

**CI for prompts.** rubric treats prompts and agents like code: golden sets, scorers, and a quality gate that fails the PR when a change makes the output worse. The same way a test suite stops you shipping a regression in logic, rubric stops you shipping a regression in *quality* — a reworded system prompt that quietly drops accuracy, a model swap that tanks answer faithfulness, an agent that starts picking the wrong tool.

It exists because an audit of two shipped products found this exact gap: prompts changed by vibes, quality measured by hope. rubric closes it, and dogfoods against those same repos.

## What it does

- **Golden sets** — eval suites defined in YAML: inputs, expected outputs, and which scorers apply. Version-controlled alongside the prompt they test.
- **Scorers** — deterministic first: exact-match and JSON-schema validation, no model call, no flake. Reach for the judge only when the criterion is genuinely subjective.
- **LLM-as-judge + calibration** — rubric-driven judging for open-ended outputs, calibrated against human labels. Reports Cohen's kappa and runs position- and length-bias checks, so the judge is a measured instrument rather than a black box you hope agrees with you.
- **Regression gating** — every run is persisted and diffed against the last green run for the same suite and prompt version. A tracked metric dropping past its threshold is a failure, not a footnote.
- **Agent-trajectory evals** — golden tasks with expected tool choices per step (tool-selection accuracy) plus a judge on the final answer, so you can score *how* an agent got there, not just the last token.
- **GitHub Action** — wires the gate into CI: open a PR that regresses a suite and the check goes red with the diff.

## Stack

- **Next.js dashboard** — read-only lens over the run store: suites, runs, prompt-version timelines, regression diffs, judge calibration, agent trajectories. Dark-only terminal aesthetic.
- **TypeScript CLI eval engine** (`bin/rubric.ts`) — the product. Runs suites, scores cases, persists runs, prints terminal reports. CLI-first by design; the dashboard is the last thing built.
- **libSQL run store** — SQLite over the libSQL driver: a single local file for dev (and CI), or hosted [Turso](https://turso.tech) for serverless/prod. Every run and case score recorded, idempotent on re-run.
- **Groq judge** — the LLM-as-judge model, pinned and calibrated. Pluggable behind the scorer interface.
- **Python (pandas)** — error-analysis workflow over exported run data: failure clustering, promote-real-traffic-to-golden-set.

The two surfaces meet only at the store: the CLI writes, the dashboard reads. See [`AGENTS.md`](AGENTS.md) for the architecture and house style.

## Quickstart

```bash
npm install            # install deps
cp .env.example .env.local   # then fill GROQ_API_KEY
npm run seed           # create the local libSQL file, seed the demo golden set + a baseline run
npm run dev            # dashboard → http://localhost:3000
```

The store is libSQL. Leave `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` empty for local
file dev — the driver falls back to a plain SQLite file at `RUBRIC_DB` (`./rubric.db`).
Set both to point at hosted [Turso](https://turso.tech) for serverless/prod (e.g. Vercel).

Run an eval from the CLI:

```bash
rubric run <suite>       # score a golden set, persist the run, print the report
rubric judge <suite>     # LLM-as-judge pass over the suite
rubric diff <suite>      # diff a prompt version vs. the last green run (non-zero exit on regression)
rubric export <suite>    # export results to parquet for pandas error analysis
```

(`npm link` once for a global `rubric`, or call it via `npm run rubric -- run <suite>`.)

## CI

The quality gate runs in GitHub Actions ([`.github/workflows/rubric.yml`](.github/workflows/rubric.yml)) on every pull request and on pushes to `main`. It runs the standard build checks — `typecheck`, `lint`, `test`, `build` — then the rubric eval gate:

```bash
npx tsx bin/rubric.ts run examples/settle-bill-review/suite.yaml --no-store
```

The deterministic scorers (exact-match, JSON-schema, field-accuracy) need no secrets and run fully offline against a captured fixture, so the gate always runs and fails the job on a regression via the CLI's non-zero exit code. A separate, optional **judge tier** is guarded by `if: ${{ secrets.GROQ_API_KEY != '' }}` and stays skipped until that secret is set — the deterministic gate is the hard blocker; the LLM judge is an additional signal for open-ended outputs.

## Labeling for calibration

Calibrating the judge (Cohen's κ) needs **human gold labels** to measure it against. `rubric label` collects them interactively from the suite's latest completed run:

```bash
rubric label <suite>             # label every still-unlabeled case in the latest run
rubric label <suite> --limit 20  # cap how many cases you label this session
rubric label <suite> --all       # re-label cases that already have a human label
```

Each case prints a compact card — input, expected, actual, every scorer's verdict, and the judge verdict + reasoning when present — then prompts `[p]ass / [f]ail / [s]kip / [q]uit` (`y`/`n` work too; `q` stops early). By default only unlabeled cases are shown, so you can label in passes across sessions.

Then compute the judge's agreement against those labels:

```bash
rubric calibrate <suite>         # Cohen's κ + confusion matrix, judge vs. your labels
```

So the loop is `rubric label <suite>` → `rubric calibrate <suite>`.

## Milestones

- [ ] **M1 — CLI core.** YAML golden-set spec, exact-match + JSON-schema scorers, clean terminal report. Demoed against a real bill-review prompt.
- [ ] **M2 — LLM-as-judge.** Rubric-driven judging, calibration against human labels (Cohen's kappa, position/length bias checks).
- [ ] **M3 — Versioning + regression tracking.** Persist runs, diff prompt versions, full history per suite.
- [ ] **M4 — Agent-trajectory evals.** Golden tasks with expected tool choices per step (tool-selection accuracy) + judge on final answers; run against a real agent.
- [ ] **M5 — Error-analysis workflow.** Parquet export, pandas failure clustering, promote-real-traffic-to-golden-set flow.
- [ ] **M6 — Dogfood + CI.** GitHub Action gating PRs on regression, wired into the sibling repos (retrieval recall@k, answer quality, field accuracy); replace a product's hardcoded confidence number with a measured signal — before/after case study.

Build order is CLI-first: M1 lands a usable evaluator before the dashboard exists. Every milestone leaves a presentable repo.
