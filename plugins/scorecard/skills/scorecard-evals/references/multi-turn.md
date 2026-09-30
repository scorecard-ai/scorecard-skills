# Multi-turn simulation

Tests a chat agent over a whole conversation. A **simulated user** (an LLM playing a customer with a goal) talks to your agent until the goal is met or a turn limit is hit. Each conversation becomes one record, scored by the metrics.

## Test set

One test case per conversation. Inputs describe the simulated user, for example:

| Field | Example |
|---|---|
| `persona` | "Impatient customer, writes short messages" |
| `goal` | "Find out if used skates can be returned" |

## Metric

Write metrics that read the whole conversation from `{{outputs.conversation}}`, for example:

```text
Customer goal: {{inputs.goal}}
Conversation:
{{outputs.conversation}}

PASS if the agent gave the customer what they needed by the end, without making up facts.
FAIL otherwise.

{{ gradingInstructionsAndExamples }}
```

## Script: `scorecard/run_simulation.py`

The simulated user uses the same model provider as the agent. Replace `simulated_user_reply` with a call to that provider.

```python
"""Simulate conversations with the agent and score them in Scorecard."""

import json
from pathlib import Path

from scorecard_ai import Scorecard

from agent import chat  # the real agent: takes the message list, returns the reply text

CONFIG = json.loads((Path(__file__).parent / "scorecard.json").read_text())
MAX_TURNS = 6
STOP_WORD = "DONE"


def simulated_user_reply(persona: str, goal: str, history: list[dict]) -> str:
    """One simulated-user message. Call the same provider the agent uses."""
    prompt = (
        f"You are a customer. Persona: {persona}. Your goal: {goal}. "
        f"Reply with your next message only. Say {STOP_WORD} when your goal is met."
    )
    # Flip roles: the agent is the "user" from the simulated customer's point of view.
    flipped = [{"role": "user" if m["role"] == "assistant" else "assistant", "content": m["content"]} for m in history]
    return call_model(system=prompt, messages=flipped or [{"role": "user", "content": "Start the conversation."}])


def simulate(inputs: dict) -> str:
    history: list[dict] = []
    for _ in range(MAX_TURNS):
        user_message = simulated_user_reply(inputs["persona"], inputs["goal"], history)
        history.append({"role": "user", "content": user_message})
        if STOP_WORD in user_message:
            break
        history.append({"role": "assistant", "content": chat(history)})
    return "\n".join(f"{m['role']}: {m['content']}" for m in history)


def main() -> None:
    client = Scorecard()
    run = client.runs.create(CONFIG["projectId"], metric_ids=CONFIG["metricIds"], testset_id=CONFIG["testsetId"])
    for testcase in client.testcases.list(CONFIG["testsetId"]):
        inputs = testcase.inputs
        client.records.create(
            run.id,
            testcase_id=testcase.id,
            inputs=inputs,
            outputs={"conversation": simulate(inputs)},
            expected=testcase.expected or {},
        )
    print(f"Scorecard run: https://app.scorecard.io/projects/{CONFIG['projectId']}/runs/{run.id}")


if __name__ == "__main__":
    main()
```

- If the agent only takes one message, add a small `chat(history)` wrapper that passes the history the way the agent expects.
- Keep `MAX_TURNS` low at first. Each turn is two model calls.
- Scorecard scores the records after they arrive. Open the run URL to read each conversation and its scores.

In TypeScript, the same loop works with `client.runs.create`, `client.testcases.list`, and `client.records.create`.

## SDK helper and sim agents

The Python SDK also ships `multi_turn_simulation` with sim agents configured in Scorecard (`client.systems.upsert(..., config={..., "isSimAgent": True})`). If it fails with `404 Cannot POST /api/v2/agents/<id>/simulate`, the Scorecard API you use does not serve that route yet. Use the loop above instead.
