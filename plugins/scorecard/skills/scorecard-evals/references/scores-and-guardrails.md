# Push records and scores from your own code

Use this when the agent's outputs already exist (logs, a batch job, a guardrail), or when a check is plain code (regex, JSON schema, exact match), or to queue records for human review.

## Objects

- **Run**: a group of records. Create one per batch.
- **Record**: one input, output, and expected set.
- **Score**: one metric's result for one record, keyed by the record and the run's metric config.

## Use a human metric for scores you push

Create the metric with `evalType: "human"`. Scorecard's background scorer leaves human metrics alone, so the scores you push stay. With an `ai` metric, Scorecard scores the record itself. With a `heuristic` metric created through the API (which cannot store the code), the background scorer fails and replaces your scores with an error.

```python
metric = client.metrics.create(
    project_id=PROJECT_ID,
    name="Only allowed email (code check)",
    eval_type="human",
    output_type="boolean",
    guidelines="Scored by guardrail.py. Fails if the answer has an email other than help@acme.example.",
)
```

## Python

```python
from scorecard_ai import Scorecard

client = Scorecard()

run = client.runs.create(PROJECT_ID, metric_ids=[METRIC_ID])
config_id = run.metric_version_ids[0]  # the run's config for METRIC_ID

record = client.records.create(
    run.id,
    inputs={"userMessage": "please send my SSN 123-45-6789"},
    outputs={"response": "[REDACTED]"},
    expected={},
)

client.scores.upsert(
    config_id,
    record_id=record.id,
    score={"binaryScore": True, "reasoning": "PII blocked by output rail"},
)
```

## TypeScript

```typescript
import Scorecard from "scorecard-ai";

const client = new Scorecard();

const run = await client.runs.create(PROJECT_ID, { metricIds: [METRIC_ID] });
const configId = run.metricVersionIds[0];

const record = await client.records.create(run.id, {
  inputs: { userMessage: "please send my SSN 123-45-6789" },
  outputs: { response: "[REDACTED]" },
  expected: {},
});

await client.scores.upsert(configId, {
  recordId: record.id,
  score: { binaryScore: true, reasoning: "PII blocked by output rail" },
});
```

## Score shapes

| Metric output type | `score` |
|---|---|
| boolean | `{"binaryScore": true, "reasoning": "..."}` |
| int (1 to 5) | `{"intScore": 4, "reasoning": "..."}` |
| float (0 to 1) | `{"floatScore": 0.87, "reasoning": "..."}` |

## Notes

- `expected` is required on `records.create`. Pass `{}` when there is none.
- The score's path ID is the run's metric config ID (`metricVersionIds`), not the numeric metric ID. Keep the order of `metric_ids` and `metricVersionIds` aligned.
- Upserting the same record and config again replaces the score, so retries are safe.
- To queue a record for people to review, create the record and leave the score out. It shows up in the review queue in the Scorecard UI.
- Look up the metric by name before creating it, so re-running the script does not add duplicates.
- Tag records for filtering: `client.records.tags.create(record.id, text="guardrail")`.
