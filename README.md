# Scorecard Skills

Agent Skills that connect an AI agent to [Scorecard](https://scorecard.io): tracing, metrics, test sets, and evals. They work in any coding agent that reads `SKILL.md` files: Claude Code, Codex, Gemini CLI, OpenCode, Pi, Cursor, Goose, Hermes, and more.

## Install

**Any agent**

```bash
npx skills add scorecard-ai/scorecard-skills
```

The installer asks which agents to install for. To pick one up front, add `-a <agent>`, for example `-a codex`, `-a opencode`, or `-a pi`.

**Claude Code plugin** (also adds the Scorecard MCP server)

```
/plugin marketplace add scorecard-ai/scorecard-skills
/plugin install scorecard@scorecard
```

**By hand:** copy the folders in [`skills/`](skills) to your agent's skills folder. Most agents read `.agents/skills/`; Claude Code reads `.claude/skills/`.

## Use

Get an API key at [app.scorecard.io/settings](https://app.scorecard.io/settings), open your agent's repo, and ask:

> Onboard this agent to Scorecard.

Or ask for one step: "Add Scorecard tracing", "Trace my coding agent in Scorecard", "Write Scorecard metrics for this agent".

## Skills

| Skill | Does |
|---|---|
| [`scorecard-onboard`](skills/scorecard-onboard) | Runs every step below, in order |
| [`scorecard-setup`](skills/scorecard-setup) | Checks the API key, picks or creates a project, connects MCP |
| [`scorecard-agent-brief`](skills/scorecard-agent-brief) | Writes down what the agent does and what "good" means |
| [`scorecard-tracing`](skills/scorecard-tracing) | Adds tracing to an app, a framework, or a coding agent |
| [`scorecard-metrics`](skills/scorecard-metrics) | Designs and creates metrics |
| [`scorecard-testsets`](skills/scorecard-testsets) | Builds a test set, or imports CSV, JSON, or JSONL |
| [`scorecard-evals`](skills/scorecard-evals) | Runs evals, links traces, simulates conversations, sets up CI |

Every change lands as ordinary code or config in your repo, so you can review it and re-run it.

## What it traces

**Apps and frameworks:** OpenAI and Anthropic SDKs, Vercel AI SDK, LangChain, LangGraph, LlamaIndex, CrewAI, LiteLLM, OpenAI Agents SDK, Claude Agent SDK, any OpenTelemetry setup, and hand-written agent loops in any language.

**Coding agents:**

| Agent | How |
|---|---|
| Claude Code, OpenCode, Goose | Env vars |
| Codex, Gemini CLI | Their config file |
| Pi | An extension included in the skill |
| Hermes, Cursor, your own harness | Hooks plus span helpers included in the skill |

## Safety

- The API key stays in git-ignored env files, never in code.
- The skills ask before running anything that costs money or sends prompts and tool output to Scorecard.
- They never delete or overwrite existing Scorecard metrics or test sets.

## Links

[Docs](https://docs.scorecard.io) · [App](https://app.scorecard.io) · SDKs: [Python](https://github.com/scorecard-ai/scorecard-python), [TypeScript](https://github.com/scorecard-ai/scorecard-node), [Go](https://github.com/scorecard-ai/scorecard-go) · Feedback: open an issue

## License

[Apache 2.0](LICENSE)
