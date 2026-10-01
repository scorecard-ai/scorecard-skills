# Test set script templates

Test cases live in `scorecard/testcases.jsonl`, one JSON object per line. The script creates the test set if no test set with that name exists, then uploads cases that are not already in it. It is safe to re-run after adding lines.

The API accepts up to 100 test cases per call; the scripts send batches of 100.

## Python: `scorecard/testset.py`

```python
"""Create this agent's Scorecard test set from testcases.jsonl. Safe to re-run."""

import json
import os
from pathlib import Path

from scorecard_ai import Scorecard

HERE = Path(__file__).parent
CONFIG_PATH = HERE / "scorecard.json"
PROJECT_ID = os.environ["SCORECARD_PROJECT_ID"]

TESTSET = {
    "name": "support-agent-v1",
    "description": "Common, edge, and risky support questions.",
    "json_schema": {
        "type": "object",
        "properties": {
            "question": {"type": "string"},
            "idealAnswer": {"type": "string"},
            "category": {"type": "string"},
        },
        "required": ["question", "idealAnswer"],
    },
    "field_mapping": {"inputs": ["question"], "expected": ["idealAnswer"], "metadata": ["category"]},
}


def main() -> None:
    client = Scorecard()  # reads SCORECARD_API_KEY
    cases = [json.loads(line) for line in (HERE / "testcases.jsonl").read_text().splitlines() if line.strip()]

    testset = next((t for t in client.testsets.list(PROJECT_ID) if t.name == TESTSET["name"]), None)
    if testset is None:
        testset = client.testsets.create(PROJECT_ID, **TESTSET)
        print(f"created testset {testset.name} ({testset.id})")
    else:
        print(f"exists  testset {testset.name} ({testset.id})")

    uploaded = {json.dumps(tc.json_data, sort_keys=True) for tc in client.testcases.list(testset.id)}
    new_cases = [c for c in cases if json.dumps(c, sort_keys=True) not in uploaded]

    for start in range(0, len(new_cases), 100):
        batch = new_cases[start : start + 100]
        result = client.testcases.create(testset.id, items=[{"json_data": c} for c in batch])
        for tc in result.items:
            if tc.validation_errors:
                print(f"invalid testcase {tc.id}: {tc.validation_errors}")
    print(f"uploaded {len(new_cases)} new testcases, {len(cases) - len(new_cases)} already present")

    config = json.loads(CONFIG_PATH.read_text()) if CONFIG_PATH.exists() else {}
    config.update({"projectId": PROJECT_ID, "testsetId": testset.id})
    CONFIG_PATH.write_text(json.dumps(config, indent=2) + "\n")


if __name__ == "__main__":
    main()
```

## TypeScript: `scorecard/testset.ts`

```typescript
// Create this agent's Scorecard test set from testcases.jsonl. Safe to re-run.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import Scorecard from "scorecard-ai";

const CONFIG_PATH = new URL("./scorecard.json", import.meta.url);
const CASES_PATH = new URL("./testcases.jsonl", import.meta.url);
const PROJECT_ID = process.env.SCORECARD_PROJECT_ID!;

const TESTSET: Scorecard.TestsetCreateParams = {
  name: "support-agent-v1",
  description: "Common, edge, and risky support questions.",
  jsonSchema: {
    type: "object",
    properties: {
      question: { type: "string" },
      idealAnswer: { type: "string" },
      category: { type: "string" },
    },
    required: ["question", "idealAnswer"],
  },
  fieldMapping: { inputs: ["question"], expected: ["idealAnswer"], metadata: ["category"] },
};

const client = new Scorecard(); // reads SCORECARD_API_KEY
const stable = (value: unknown) => JSON.stringify(value, Object.keys(value as object).sort());
const cases: Record<string, unknown>[] = readFileSync(CASES_PATH, "utf8")
  .split("\n")
  .filter((line) => line.trim())
  .map((line) => JSON.parse(line));

let testset: Scorecard.Testset | undefined;
for await (const t of client.testsets.list(PROJECT_ID)) {
  if (t.name === TESTSET.name) testset = t;
}
if (!testset) {
  testset = await client.testsets.create(PROJECT_ID, TESTSET);
  console.log(`created testset ${testset.name} (${testset.id})`);
} else {
  console.log(`exists  testset ${testset.name} (${testset.id})`);
}

const uploaded = new Set<string>();
for await (const tc of client.testcases.list(testset.id)) uploaded.add(stable(tc.jsonData));
const newCases = cases.filter((c) => !uploaded.has(stable(c)));

for (let start = 0; start < newCases.length; start += 100) {
  const batch = newCases.slice(start, start + 100);
  const result = await client.testcases.create(testset.id, { items: batch.map((jsonData) => ({ jsonData })) });
  for (const tc of result.items) {
    if (tc.validationErrors?.length) console.log(`invalid testcase ${tc.id}:`, tc.validationErrors);
  }
}
console.log(`uploaded ${newCases.length} new testcases, ${cases.length - newCases.length} already present`);

const config = existsSync(CONFIG_PATH) ? JSON.parse(readFileSync(CONFIG_PATH, "utf8")) : {};
writeFileSync(CONFIG_PATH, JSON.stringify({ ...config, projectId: PROJECT_ID, testsetId: testset.id }, null, 2) + "\n");
```

## No SDK: curl

```bash
BASE="${SCORECARD_BASE_URL:-https://api2.scorecard.io/api/v2}"
curl -sS "$BASE/projects/$SCORECARD_PROJECT_ID/testsets" -H "Authorization: Bearer $SCORECARD_API_KEY" \
  -H 'Content-Type: application/json' -d @testset.json          # returns {"id": ...}
curl -sS "$BASE/testsets/<testsetId>/testcases" -H "Authorization: Bearer $SCORECARD_API_KEY" \
  -H 'Content-Type: application/json' -d '{"items":[{"jsonData":{"question":"...","idealAnswer":"..."}}]}'
```
