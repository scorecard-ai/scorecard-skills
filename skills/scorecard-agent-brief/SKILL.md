---
name: scorecard-agent-brief
description: Write the Scorecard agent brief. Reads an AI agent's code and writes a short brief (what it does, inputs, outputs, tools, users, what "good" and "bad" look like) to scorecard/agent-brief.md. The Scorecard metrics, test set, and eval skills read this brief, so it must use this skill's exact section headings. Use when the user asks for a Scorecard agent brief, asks what their agent should be evaluated on, and before writing metrics or test sets.
---

# Write the agent brief

The brief is the input for metrics and test sets. Keep it under 80 lines. Write facts from the code, not guesses. Mark anything you inferred with "(inferred)".

## Steps

1. Find the entry point: the HTTP handler, CLI `main`, Slack handler, or the function that calls the model.
2. Read the system prompt, tool definitions, and the input and output types.
3. Read the README and any existing tests or example conversations.
4. Write `scorecard/agent-brief.md` with the template below.
5. Show the user the "Good" and "Bad" sections and ask them to correct it. They know their users better than the code does.

## Template

```markdown
# Agent brief: <name>

## What it does
<2 to 3 sentences.>

## Entry point
`<path>:<function>`, called as <how to run it once>.

## Input
| Field | Type | Example |
|---|---|---|

## Output
| Field | Type | Example |
|---|---|---|

## Tools and side effects
| Tool | What it does | Side effect (none / read / write / spends money) |
|---|---|---|

## Model
<provider and model>, temperature <n>.

## Users
<Who sends the input, and what they want.>

## Good output
- <Specific, checkable. Example: "Cites the order ID from the input.">

## Bad output
- <Specific failure. Example: "Promises a refund without calling issue_refund.">

## Risks
- <Safety, privacy, cost, or brand risks.>
```

## Rules

- Field names in Input and Output must match the code exactly. Metrics and test sets use them as variables.
- If the agent is multi-turn, say so under "What it does" and describe one turn's input.
- Flag tools with side effects clearly. Eval runs must not trigger real side effects without the user's OK.
