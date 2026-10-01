---
name: scorecard-testsets
description: Convert a CSV, TSV, JSON, JSONL, or spreadsheet file into Scorecard test cases, or write new ones. Scorecard needs a specific row shape and field mapping, so use this skill instead of converting the file by hand. Also covers designing 10 to 30 test cases from the agent's real inputs (happy paths, edge cases, risky cases) and uploading them with a re-runnable script. Use when the user mentions Scorecard test sets, test cases, datasets, golden sets, or eval data, or asks to turn a data file into Scorecard test cases.
---

# Build a Scorecard test set

Files named `references/<file>.md` below sit next to this `SKILL.md`, in the skill's own folder, not in the user's repo. Read them from there.

A test set is a list of test cases. Each test case has **inputs** (what the agent gets), **expected** values (what a good answer contains), and optional **metadata** (for grouping, never shown to the agent).

Needs `SCORECARD_API_KEY`, `SCORECARD_PROJECT_ID`, and ideally `scorecard/agent-brief.md` and `scorecard/scorecard.json` (from the metrics step).

## Steps

If the user gave you a data file (CSV, TSV, JSON, JSONL, a spreadsheet export), read `references/import-files.md` before step 1. It has the rules for mapping columns and dropping bad rows.

1. **Schema.** Read `references/schema.md`. Make input field names match the agent's input exactly. Make expected field names match the `{{expected.*}}` variables in the metrics.
2. **Source.** Pick one:
   - The user has data (CSV, JSON, JSONL, spreadsheet export, logged conversations): follow `references/import-files.md`.
   - No data: write the cases yourself from the brief (below).
3. **Write cases.** Aim for 10 to 30:
   - About 60% common requests, based on the brief's "Users" section.
   - About 25% edge cases: empty or long input, ambiguous request, wrong language, typos.
   - About 15% risky cases from the brief's "Bad output" and "Risks": prompt injection, requests for private data, requests the agent must refuse.
   - Tag each case in metadata with `category`: `common`, `edge`, or `risk`.
4. **Review.** Show the user 5 sample cases and the count per category. Ask them to fix anything wrong. Expected values are only useful if they are right.
5. **Create.** Write `scorecard/testset.py` or `scorecard/testset.ts` from `references/testset-script.md`, with the cases in `scorecard/testcases.jsonl`: one flat JSON object per line, keyed by schema field names, with no `inputs`/`expected` wrapper (the field mapping decides which is which). Run it. It saves `testsetId` in `scorecard/scorecard.json`.
6. **Link.** Tell the user: `https://app.scorecard.io/projects/<SCORECARD_PROJECT_ID>/testsets/<testsetId>`.

## Rules

- No real customer personal data in test cases unless the user says the data is cleared for this use.
- Keep expected values short and checkable. A full ideal essay is hard to judge against; a list of key facts is easy.
- Test cases that fail schema validation are still created, with `validationErrors`. The script prints them. Fix the cases, do not ignore the errors.
