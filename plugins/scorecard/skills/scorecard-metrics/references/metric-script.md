# Metric script templates

The script is the source of truth for the project's metrics. It creates a metric only when no metric with the same name exists, and saves the IDs to `scorecard/scorecard.json`. Other Scorecard scripts read that file.

Replace the example metric with the metrics the user confirmed.

## Python: `scorecard/metrics.py`

```python
"""Create this agent's Scorecard metrics. Safe to re-run."""

import json
import os
import textwrap
from pathlib import Path

from scorecard_ai import Scorecard

CONFIG_PATH = Path(__file__).parent / "scorecard.json"
PROJECT_ID = os.environ["SCORECARD_PROJECT_ID"]

METRICS = [
    {
        "name": "Answer matches reference",
        "description": "Same facts as the reference answer.",
        "eval_type": "ai",
        "output_type": "boolean",
        "prompt_template": textwrap.dedent(
            """\
            Question: {{inputs.question}}
            Agent answer: {{outputs.answer}}
            Reference answer: {{expected.idealAnswer}}

            PASS if the agent answer gives the same facts as the reference answer.
            FAIL if a fact is missing, wrong, or made up.

            {{ gradingInstructionsAndExamples }}"""
        ),
    },
]


def main() -> None:
    client = Scorecard()  # reads SCORECARD_API_KEY
    existing = {m.name: m.id for m in client.metrics.list(PROJECT_ID)}

    ids = {}
    for spec in METRICS:
        if spec["name"] in existing:
            ids[spec["name"]] = existing[spec["name"]]
            print(f"exists   {spec['name']} ({existing[spec['name']]})")
            continue
        metric = client.metrics.create(project_id=PROJECT_ID, **spec)
        ids[spec["name"]] = metric.id
        print(f"created  {spec['name']} ({metric.id})")

    config = json.loads(CONFIG_PATH.read_text()) if CONFIG_PATH.exists() else {}
    config.update({"projectId": PROJECT_ID, "metricIds": list(ids.values())})
    CONFIG_PATH.write_text(json.dumps(config, indent=2) + "\n")


if __name__ == "__main__":
    main()
```

## TypeScript: `scorecard/metrics.ts`

```typescript
// Create this agent's Scorecard metrics. Safe to re-run.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import Scorecard from "scorecard-ai";

const CONFIG_PATH = new URL("./scorecard.json", import.meta.url);
const PROJECT_ID = process.env.SCORECARD_PROJECT_ID!;

const METRICS: Scorecard.MetricCreateParams[] = [
  {
    name: "Answer matches reference",
    description: "Same facts as the reference answer.",
    evalType: "ai",
    outputType: "boolean",
    promptTemplate: [
      "Question: {{inputs.question}}",
      "Agent answer: {{outputs.answer}}",
      "Reference answer: {{expected.idealAnswer}}",
      "",
      "PASS if the agent answer gives the same facts as the reference answer.",
      "FAIL if a fact is missing, wrong, or made up.",
      "",
      "{{ gradingInstructionsAndExamples }}",
    ].join("\n"),
  },
];

const client = new Scorecard(); // reads SCORECARD_API_KEY

const existing = new Map<string, string>();
for await (const metric of client.metrics.list(PROJECT_ID)) {
  existing.set(metric.name, metric.id);
}

const ids: string[] = [];
for (const spec of METRICS) {
  const found = existing.get(spec.name);
  if (found) {
    ids.push(found);
    console.log(`exists   ${spec.name} (${found})`);
    continue;
  }
  const metric = await client.metrics.create(PROJECT_ID, spec);
  ids.push(metric.id);
  console.log(`created  ${spec.name} (${metric.id})`);
}

const config = existsSync(CONFIG_PATH) ? JSON.parse(readFileSync(CONFIG_PATH, "utf8")) : {};
writeFileSync(CONFIG_PATH, JSON.stringify({ ...config, projectId: PROJECT_ID, metricIds: ids }, null, 2) + "\n");
```

Run with the repo's TS runner: `npx tsx scorecard/metrics.ts`, `bun scorecard/metrics.ts`, or `node --experimental-strip-types`.

## No SDK: curl

```bash
curl -sS "${SCORECARD_BASE_URL:-https://api2.scorecard.io/api/v2}/projects/$SCORECARD_PROJECT_ID/metrics" \
  -H "Authorization: Bearer $SCORECARD_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Answer matches reference","evalType":"ai","outputType":"boolean","promptTemplate":"Question: {{inputs.question}}\nAnswer: {{outputs.answer}}\n\n{{ gradingInstructionsAndExamples }}"}'
```
