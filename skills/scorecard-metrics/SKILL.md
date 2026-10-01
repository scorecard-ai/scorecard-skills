---
name: scorecard-metrics
description: Create Scorecard metrics (evaluators, graders, LLM-as-judge) for an AI agent. Turns the agent brief into 3 to 5 metrics (AI-judged, human, or heuristic; boolean, 1-5, or 0-1), writes them as a re-runnable script in scorecard/, and creates them in the Scorecard project. This skill has the exact Scorecard metric fields and prompt variables, so load it before you create metrics instead of guessing the API. Use when the user asks for metrics, evaluators, graders, LLM-as-judge, or scoring criteria in Scorecard.
---

# Create Scorecard metrics

Follow this skill and its reference files. Do not guess Scorecard metric fields from memory.

Files named `references/<file>.md` below sit next to this `SKILL.md`, in the skill's own folder, not in the user's repo. Read them from there.

A metric scores one record. An AI metric sends a prompt to a judge model, with the record's inputs, outputs, and expected values filled in.

Needs `SCORECARD_API_KEY` and `SCORECARD_PROJECT_ID` (run `scorecard-setup` first) and `scorecard/agent-brief.md` (run `scorecard-agent-brief` first, or ask the user what "good" means).

## Steps

1. Read `scorecard/agent-brief.md` and `references/metric-types.md`.
2. Pick 3 to 5 metrics. Cover:
   - **Task success**: did it do what the user asked?
   - **The top risk** from the brief: hallucination, unsafe action, policy break, PII leak.
   - **One agent-specific check** from "Good output", for example "cites the order ID".
   Prefer boolean metrics. They are easier to agree on than 1 to 5 scores.
3. Show the user a table: name, type, what it checks. Ask them to confirm before you create anything.
4. Write `scorecard/metrics.py` or `scorecard/metrics.ts` (match the repo) using the template in `references/metric-script.md`. The script creates each metric only if no metric with that name exists, so it is safe to re-run.
5. Run it. It writes the metric IDs to `scorecard/scorecard.json`.
6. Tell the user the metrics page: `https://app.scorecard.io/projects/<SCORECARD_PROJECT_ID>/metrics`.

## Writing a good judge prompt

- One thing per metric. "Correct and polite" is two metrics.
- Refer to fields by name: `{{inputs.question}}`, `{{outputs.answer}}`, `{{expected.idealAnswer}}`. Names must match the test set fields and the agent output exactly.
- Say what PASS and FAIL look like, with one short example of each.
- End with `{{ gradingInstructionsAndExamples }}`. Scorecard fills in output-format instructions there.
- Do not reference `expected` in a metric that must also score production traces. Traces have no expected values.

## Rules

- Do not delete or change existing metrics without asking. Other runs depend on them.
- Heuristic metric code (a Python or TypeScript `score()` function) can only be entered in the Scorecard UI, and a heuristic metric without code makes scoring fail. Do not create heuristic metrics through the API. Give the user the code and the steps to create it in the UI. For a check that runs in the user's own code, push scores to a human metric instead (the `scorecard-evals` skill covers this under "push scores").
