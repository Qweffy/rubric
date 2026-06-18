# M5 error-analysis workflow

Isolated Python sub-project for the **M5 stage** of the rubric eval pipeline: a pandas + scikit-learn
notebook that clusters scorer failures over rubric's exported case-level results to surface recurring
**failure modes**. Managed with [`uv`](https://docs.astral.sh/uv/) (its own venv, lockfile, and
`.python-version`), fully isolated from the TypeScript app in the parent repo.

## Input

The notebook reads `data/results.parquet` — one row per *case × scorer* across every seeded run.
Regenerate it from the repo root with rubric's exporter:

```bash
# from the rubric repo root
rubric export --all --format parquet --out analysis/data/results.parquet
```

## Setup

```bash
cd analysis
uv sync          # creates .venv + resolves uv.lock
```

## Run the notebook

Interactive:

```bash
uv run jupyter lab            # open failure-clustering.ipynb
```

Headless (executes top-to-bottom, in place):

```bash
uv run jupyter nbconvert --to notebook --execute failure-clustering.ipynb
```

## What it produces

`failure-clustering.ipynb` performs EDA (pass/fail by suite, scorer, and judge model; score
distributions; per-run regression deltas), then builds a failure-signal matrix (TF-IDF over the
`detail`/`errors` text hstacked with one-hot `scorer` / `suite` / `score_bucket`), picks `k` by
silhouette score, fits KMeans, and labels every failed row. Outputs land in `outputs/`:

- `failures-clustered.parquet` — failed rows with their `cluster` labels and joined failure text.
- `failures-by-cluster.png` — failures per cluster.
- `failures-by-scorer.png` — failures per scorer.

The notebook also renders the **top failure-mode table** (size, dominant scorer/suite, mean score,
and a representative exemplar per cluster) and a written takeaway per cluster naming the failure mode
and its fix direction. Every cell is deterministic (`random_state=42`), so re-runs are stable.

## Dev

```bash
uv run ruff check    # lint
```
