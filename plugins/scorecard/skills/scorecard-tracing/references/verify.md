# Verify tracing

Check what landed in Scorecard, not just the diff.

## 1. Static checks

- The API key is read from env, never written in code.
- `scorecard.project_id` is set on every path the agent runs through.
- Init runs before framework imports (Traceloop) and before the first model call (all methods).
- Short-lived scripts flush before exit.
- The app still type-checks, lints, and passes its tests.

## 2. Run the agent once

Pick the cheapest real request the agent handles. Ask the user before you run anything that costs money or has side effects (sends email, writes to a database, places an order). If you cannot run it, give the user the exact command.

Watch the output for exporter errors:

| Error | Cause | Fix |
|---|---|---|
| `401` / `Unauthorized` | Wrong or missing API key | Check `SCORECARD_API_KEY` is loaded in this process |
| `404` | Wrong path | Traceloop and Claude use the base URL `.../otel`; exporters and wrappers use `.../otel/v1/traces` |
| `ECONNREFUSED`, timeout | Network or proxy blocks `tracing.scorecard.io` | Allow outbound HTTPS to it |
| No error and no spans | Init ran too late, or the process exited before flush | Move init earlier; flush on exit |

## 3. Check Scorecard

Open `https://app.scorecard.io/projects/<SCORECARD_PROJECT_ID>/records`. The run should show up within a minute, with source "Trace". Open it and check:

- The input and output text are shown.
- LLM calls show the model name and token counts.
- Multi-step runs show one tree, not one record per LLM call. If they are split, add a parent span (see `sdk-wrap.md`) or a session ID (see `sessions-and-metadata.md`).

If the record is in a different project, `scorecard.project_id` is missing or wrong.

## 4. Report

Tell the user:

- The method and the files you changed
- The env vars they must set in each deploy environment (local, CI, staging, production)
- The Records page URL
