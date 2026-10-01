# System versions and no-code runs

## System versions: compare prompts, models, configs

A **system** is a named agent config in Scorecard. A **system version** is one set of values (model, temperature, prompt). Tag each run with a version, then compare runs side by side (A/B comparison) in the UI.

```python
system = client.systems.upsert(
    project_id=PROJECT_ID,
    name="support-agent",
    description="Support agent config",
    config={"model": "gpt-4o-mini", "temperature": 0.2},
)
version = client.systems.versions.upsert(system.id, name="gpt-4o-mini t=0.2", config={"model": "gpt-4o-mini", "temperature": 0.2})

run = run_and_evaluate(
    client=client,
    project_id=PROJECT_ID,
    testset_id=TESTSET_ID,
    metric_ids=METRIC_IDS,
    system_version_id=version.id,
    system=lambda inputs, system_version: {"answer": answer(inputs["question"], **system_version.config)},
)
```

TypeScript: `client.systems.upsert(projectId, {...})`, `client.systems.versions.upsert(systemId, {...})`, then `systemVersionId` in `runAndEvaluate`. The `system` function then gets `(inputs, systemVersion, options)`.

Upserting the same config returns the existing version, so the script is safe to re-run. To compare, run once per version, then open **Runs** and select two runs to compare.

## No-code: Playground and Kickoff

If the agent is a single prompt, the user can test it in the Scorecard UI with no code:

1. Add a provider key (OpenAI, Anthropic, Google, Vertex, Groq, Bedrock) in org **Settings**.
2. Open the project's **Playground**, write the prompt with `{{inputs.<field>}}` variables, pick a model, and try test cases.
3. Click **Kickoff run** to run the prompt over a test set with metrics.

## No-code: HTTP endpoint

If the agent is already deployed behind an HTTP API, Scorecard can call it directly:

1. Open the project → **Endpoints** → add one: method, URL, headers (auth), a JSON body template with `{{inputs.<field>}}`, and the JSONPath to the answer in the response.
2. Open **Kickoff run**, choose the **Endpoint** tab, pick the endpoint, the test set, and metrics.

Endpoints are set up in the UI only. Give the user the values to enter: URL, auth header name, body template, and response path, read from the repo's API routes.
