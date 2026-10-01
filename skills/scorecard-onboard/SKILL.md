---
name: scorecard-onboard
description: Onboard an AI agent or LLM app to Scorecard end to end. Use when the user asks to "set up Scorecard", "onboard my agent to Scorecard", "evaluate my agent with Scorecard", or "add Scorecard" without naming a single step. Runs setup, agent brief, tracing, metrics, test set, and a first evaluation in order.
---

# Onboard an agent to Scorecard

Scorecard (https://scorecard.io) records what an AI agent does (traces), scores it with metrics, and runs it against test sets. This skill chains the other Scorecard skills. Each step is also its own skill, so the user can stop after any step.

## Steps

Run these in order. Finish each one before the next. After each step, tell the user in one line what changed.

1. **Connect.** Use the `scorecard-setup` skill. Result: a working `SCORECARD_API_KEY`, a project, and `SCORECARD_PROJECT_ID` in the repo's env file.
2. **Understand the agent.** Use the `scorecard-agent-brief` skill. Result: `scorecard/agent-brief.md`.
3. **Trace it.** Use the `scorecard-tracing` skill. Result: the agent sends traces to the project. Ask the user to run the agent once, or run it yourself if it is safe and cheap.
4. **Metrics.** Use the `scorecard-metrics` skill. Result: 3 to 5 metrics in the project, defined in `scorecard/metrics.*`.
5. **Test set.** Use the `scorecard-testsets` skill. Result: a test set with at least 10 test cases, defined in `scorecard/testset.*`.
6. **Evaluate.** Use the `scorecard-evals` skill. Result: `scorecard/run_eval.*` runs the agent on the test set, scores it, and prints a run URL.

## Rules

- Ask before you spend money. A first eval run calls the user's LLM provider once per test case.
- Never print, commit, or log the API key. Keep it in the env file that the repo already ignores. If the repo has no ignored env file, add `.env` to `.gitignore` first.
- Match the repo: same language, package manager, and code style. Do not add a second language to the repo.
- If a step fails, stop and report the error. Do not skip ahead.

## Finish

End with a short summary:

- Where to see traces: `https://app.scorecard.io/projects/<project_id>/records`
- The files you added or changed
- The eval run URL
- One next step, for example adding the eval to CI (see `scorecard-evals`, GitHub Actions)
