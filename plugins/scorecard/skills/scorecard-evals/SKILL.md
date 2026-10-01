---
name: scorecard-evals
description: Run a Scorecard evaluation of an AI agent. Writes a script that runs the agent on a Scorecard test set, scores it with Scorecard metrics, and prints the run URL. Also covers linking traces to eval records, multi-turn simulations, CI with GitHub Actions, pushing scores from your own checks, system versions, and no-code runs. Use when the user asks to run evals, benchmark, regression-test, or compare versions of an agent in Scorecard.
---

# Run a Scorecard evaluation

Files named `references/<file>.md` below are in this skill's own folder (the base directory shown when the skill loads), not in the user's repo. Read them from there.

A run takes each test case, calls the agent with its inputs, saves the output as a record, and scores the record with the chosen metrics. Scorecard scores AI metrics on its side after the records arrive.

Needs `SCORECARD_API_KEY`, `SCORECARD_PROJECT_ID`, and `scorecard/scorecard.json` with `metricIds` and `testsetId` (from the `scorecard-metrics` and `scorecard-testsets` skills).

## Pick what to build

| The user wants | Reference |
|---|---|
| Run the agent on a test set and score it (default) | `references/run-and-evaluate.md` |
| See the full trace of each eval record (tool calls, LLM calls) | `references/trace-linking.md` |
| Test a chat agent over several turns against a simulated user | `references/multi-turn.md` |
| Run evals in CI, on PRs, or nightly | `references/github-actions.md` |
| Push scores from their own code (guardrails, unit checks, human review queue) | `references/scores-and-guardrails.md` |
| Compare prompts, models, or configs; run without code (Playground, HTTP endpoint) | `references/versions-and-no-code.md` |

## Default steps

1. Read `references/run-and-evaluate.md`.
2. Find how to call the agent once with plain inputs. Use the entry point from `scorecard/agent-brief.md`.
3. Check side effects. If the agent sends messages, writes data, or spends money, ask the user how to run it safely (dry-run flag, sandbox account, mocked tools) before running.
4. Write `scorecard/run_eval.py` or `scorecard/run_eval.ts`.
5. Tell the user the cost: one agent call per test case, plus one judge call per test case per AI metric. Get a yes, then run it.
6. Print and share the run URL. Scores show up within a few minutes.
7. Summarize: pass rate per metric, and the 3 worst records with a one-line reason each.

## Rules

- The agent code under test must be the real code path, not a copy.
- Output field names must match the `{{outputs.*}}` variables in the metrics.
- Never commit real outputs that contain customer data.
