# Evals in CI with GitHub Actions

Two ways. Pick the first unless the user wants runs started from the Scorecard UI.

## A. Plain workflow in the repo

Runs the eval script from `run-and-evaluate.md` on every PR and nightly.

1. Ask the user to add the repo secret `SCORECARD_API_KEY` (and the LLM provider keys the agent needs) in GitHub → Settings → Secrets and variables → Actions.
2. Add `.github/workflows/scorecard-eval.yml`:

```yaml
name: Scorecard eval

on:
  pull_request:
  schedule:
    - cron: "0 6 * * *"
  workflow_dispatch:

jobs:
  eval:
    runs-on: ubuntu-latest
    env:
      SCORECARD_API_KEY: ${{ secrets.SCORECARD_API_KEY }}
      SCORECARD_PROJECT_ID: "314"
      OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: pip install -r requirements.txt
      - run: python scorecard/run_eval.py
```

For TypeScript, use `actions/setup-node@v4` and run `npx tsx scorecard/run_eval.ts`. Match the install step to the repo's lockfile.

3. Tell the user the cost per run: one agent call per test case plus judge calls. Nightly plus every PR can add up. Suggest `paths:` filters so only agent changes trigger it.

## B. Scorecard GitHub app

Lets users start CI evals from the Scorecard UI, and on PR open or merge.

1. The user opens https://app.scorecard.io/configure-github and installs the app on the repo.
2. They pick the branch and triggers (nightly, UI kickoff, PR opened, PR merged).
3. Scorecard opens a PR that adds `.github/workflows/scorecard-eval.yml`, `run_tests.py`, and `requirements.txt`, and sets the `SCORECARD_API_KEY` secret.
4. Edit `run_tests.py` so `run_system` calls the real agent. The workflow passes `PROJECT_ID`, `TESTSET_ID`, `METRIC_IDS`, and `SYSTEM_VERSION_ID` as env vars.

The generated `requirements.txt` may pin an old `scorecard-ai`. Bump it to the current version.
