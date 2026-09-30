# Metric types

Every metric has an `evalType` and an `outputType`. `name`, `evalType`, and `outputType` are always required.

## evalType

| evalType | Who scores | Fields |
|---|---|---|
| `ai` | A judge model | `promptTemplate` (required), `guidelines`, `evalModelName` (default `gpt-4o`), `temperature` (0 to 2, default 0) |
| `human` | A person, in the Scorecard UI | `guidelines` |
| `heuristic` | Code the user pastes in the UI. Create these in the UI only: through the API there is no code, and scoring fails. | `guidelines` |

## outputType

| outputType | Score | Pass rule |
|---|---|---|
| `boolean` | true / false | true passes |
| `int` | 1 to 5 | `passingThreshold`, default 4 |
| `float` | 0 to 1 | `passingThreshold`, default 0.9 |

## Template variables

Prompt templates use Jinja.

| Variable | Filled with |
|---|---|
| `{{inputs.<field>}}` | A test case input, or the traced input |
| `{{outputs.<field>}}` | The agent's output |
| `{{expected.<field>}}` | The test case's expected value |
| `{{ guidelines }}` | The metric's `guidelines` text |
| `{{ gradingInstructionsAndExamples }}` | Output-format instructions from Scorecard. Put it last. |

Jinja control flow works: `{% if inputs.context %}Context: {{inputs.context}}{% endif %}`.

## Examples

Task success, boolean:

```text
You are grading a customer-support agent.

Question: {{inputs.question}}
Agent answer: {{outputs.answer}}
Reference answer: {{expected.idealAnswer}}

PASS if the agent answer gives the same facts as the reference answer. Wording can differ.
FAIL if a fact is missing, wrong, or made up.

{{ gradingInstructionsAndExamples }}
```

Groundedness, boolean, works on production traces (no `expected`):

```text
Context given to the agent: {{inputs.context}}
Agent answer: {{outputs.answer}}

PASS if every claim in the answer is supported by the context.
FAIL if the answer states anything the context does not support.

{{ gradingInstructionsAndExamples }}
```

Tone, 1 to 5:

```text
Rate how well the reply matches the requested tone "{{inputs.tone}}".
1 = opposite tone. 3 = neutral. 5 = exactly the requested tone.

Reply: {{outputs.reply}}

{{ gradingInstructionsAndExamples }}
```

## Built-in metric ideas

The Scorecard UI offers these as templates: Response Completeness, User Intent Fulfillment, Hallucination Detection, Coherency, Conciseness, PII, Content Moderation, Source Attribution Quality, Bias.
