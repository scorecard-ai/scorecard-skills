# `runAndEvaluate`: run the agent on a test set

The SDK helper creates a run, calls your `system` function once per test case, and saves each result as a record. Scorecard then scores the records with the metrics.

## Python: `scorecard/run_eval.py`

```python
"""Run the agent on the Scorecard test set and score it."""

import json
from pathlib import Path

from scorecard_ai import Scorecard
from scorecard_ai.lib import run_and_evaluate

from my_agent import answer  # the real entry point

CONFIG = json.loads((Path(__file__).parent / "scorecard.json").read_text())


def system(inputs: dict, _system_version: object) -> dict:
    """Call the agent with one test case's inputs. Keys of the result are {{outputs.*}}."""
    return {"answer": answer(inputs["question"])}


def main() -> None:
    run = run_and_evaluate(
        client=Scorecard(),
        project_id=CONFIG["projectId"],
        testset_id=CONFIG["testsetId"],
        metric_ids=CONFIG["metricIds"],
        system=system,
    )
    print(f"Scorecard run: {run['url']}")


if __name__ == "__main__":
    main()
```

- `system` is always called with two arguments: `(inputs, system_version)`. A one-argument function raises `TypeError`.
- For async agents, use `async_run_and_evaluate` with an `async def system`.

## TypeScript: `scorecard/run_eval.ts`

```typescript
import { readFileSync } from "node:fs";
import Scorecard, { runAndEvaluate } from "scorecard-ai";

import { answer } from "../src/agent"; // the real entry point

const config = JSON.parse(readFileSync(new URL("./scorecard.json", import.meta.url), "utf8"));

const run = await runAndEvaluate(new Scorecard(), {
  projectId: config.projectId,
  testsetId: config.testsetId,
  metricIds: config.metricIds,
  system: async (inputs: { question: string }) => ({ answer: await answer(inputs.question) }),
});

console.log(`Scorecard run: ${run.url}`);
```

## Options

| Option | Python | TypeScript |
|---|---|---|
| Inline test cases instead of a test set | `testcases=[{"inputs": {...}, "expected": {...}}]` | `testcases: [{ inputs, expected }]` |
| Repeat each case N times (flaky agents) | `trials=3` | third argument `{ trials: 3 }` |
| Run cases in parallel | use `async_run_and_evaluate` | third argument `{ runInParallel: true }` |
| Tag the run with a system version | `system_version_id=...` | `systemVersionId: ...` (see `versions-and-no-code.md`) |

## Output shape

Return a flat object. Its keys become `{{outputs.<key>}}` in metric prompts. If the agent returns a string, wrap it: `{"answer": text}`.

## Read the results

The run URL opens the run's records with scores. The helper returns before scoring ends. To wait in code (CI), poll `client.runs.get(run_id)` until its status is complete, or open the URL.
