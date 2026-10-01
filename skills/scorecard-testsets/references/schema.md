# Test set schema

A test set needs four things. All are required by the API.

| Field | What it is |
|---|---|
| `name` | Short name, for example `support-agent-v1` |
| `description` | One line |
| `jsonSchema` | A JSON Schema `object` describing one test case |
| `fieldMapping` | Which fields are `inputs`, `expected`, and `metadata`. All three keys are required; use `[]` for none. |

Field types: `string`, `number`, `boolean`, `object`, `array`.

## Example: support agent

```json
{
  "name": "support-agent-v1",
  "description": "Common, edge, and risky support questions.",
  "jsonSchema": {
    "type": "object",
    "properties": {
      "question": { "type": "string" },
      "customerTier": { "type": "string" },
      "idealAnswer": { "type": "string" },
      "category": { "type": "string" }
    },
    "required": ["question", "idealAnswer"]
  },
  "fieldMapping": {
    "inputs": ["question", "customerTier"],
    "expected": ["idealAnswer"],
    "metadata": ["category"]
  }
}
```

One test case is flat JSON with those fields:

```json
{"question": "How do I reset my password?", "customerTier": "free", "idealAnswer": "Settings > Security > Reset password. Link expires in 1 hour.", "category": "common"}
```

## Naming rules

- Input names = the agent's argument or request field names. The eval script passes `inputs` straight to the agent.
- Expected names = the `{{expected.*}}` names used in metrics.
- Use camelCase or snake_case to match the repo. Do not mix.

## Multi-turn agents

For chat agents, put the conversation so far in one input field, for example `messages` of type `array` with `{role, content}` items. The eval then runs one turn. For full simulated conversations, see the `scorecard-evals` skill, `references/multi-turn.md`.
