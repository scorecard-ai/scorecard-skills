# Scorecard skills

Official [Scorecard](https://scorecard.io) skills for Claude Code and other coding agents.

Point your coding agent at the repo of an AI agent or LLM app, and these skills connect it to Scorecard: they add tracing, write metrics and test sets, and run your first evaluation. Every change is ordinary code in your repo, so you can review it, re-run it, and put it in CI.

## Install

In Claude Code:

```
/plugin marketplace add scorecard-ai/scorecard-skills
/plugin install scorecard@scorecard
```

Or from a terminal:

```bash
claude plugin marketplace add scorecard-ai/scorecard-skills
claude plugin install scorecard@scorecard
```

The plugin also connects the Scorecard MCP server (`https://mcp.scorecard.io/mcp`). Run `/mcp` in Claude Code and sign in to use it.

**Other agents** (Codex, Cursor, Gemini CLI, and others that read `SKILL.md` files): copy the folders in [`plugins/scorecard/skills/`](plugins/scorecard/skills) into your agent's skills directory, for example `.agents/skills/` or `~/.codex/skills/`.

## Quick start

1. Get a Scorecard API key at [app.scorecard.io/settings](https://app.scorecard.io/settings). Org admins can create keys.
2. Open your agent's repo in Claude Code and ask:

   > Onboard this agent to Scorecard.

The `scorecard-onboard` skill walks through each step and asks before it spends money or changes behavior. You can also ask for one step, for example "Add Scorecard tracing" or "Write Scorecard metrics for this agent".

## Skills

| Skill | What it does | Output in your repo |
|---|---|---|
| `scorecard-onboard` | Runs all the steps below in order | |
| `scorecard-setup` | Checks your API key, picks or creates a project, connects MCP | `SCORECARD_API_KEY`, `SCORECARD_PROJECT_ID` in `.env` |
| `scorecard-agent-brief` | Reads the agent's code and writes what it does and what "good" means | `scorecard/agent-brief.md` |
| `scorecard-tracing` | Detects how the agent is built and adds tracing | A few lines at the agent's entry point |
| `scorecard-metrics` | Designs 3 to 5 metrics (LLM judge, human, or heuristic) and creates them | `scorecard/metrics.py` or `.ts` |
| `scorecard-testsets` | Builds a test set from scratch or from CSV / JSON / JSONL | `scorecard/testcases.jsonl`, `scorecard/testset.py` or `.ts` |
| `scorecard-evals` | Runs the agent on the test set, scores it, links traces, sets up CI | `scorecard/run_eval.py` or `.ts`, optional GitHub Actions workflow |

## Supported stacks

| Your agent uses | How the skill traces it |
|---|---|
| Claude Agent SDK (Python, TypeScript), Claude Code CLI | Env vars only, no code change |
| Claude Tag (Claude in Slack) | Admin settings, no code change |
| OpenAI or Anthropic SDK (Python, TypeScript) | `wrap()` from the Scorecard SDK |
| Vercel AI SDK | `wrapAISDK()` from the Scorecard SDK, with optional live scoring |
| LangChain, LangGraph, LlamaIndex, CrewAI, LiteLLM, OpenAI Agents SDK, Haystack, Bedrock, Gemini | OpenLLMetry (Traceloop), one init call |
| Any OpenAI-compatible client, no new dependency allowed | Scorecard LLM proxy, change the base URL |
| Go, Java, .NET, Rust, Ruby, raw HTTP, or an existing OpenTelemetry setup | OpenTelemetry OTLP exporter |

For evaluation, the skills cover SDK runs (`runAndEvaluate` / `run_and_evaluate`), trace-linked eval records, multi-turn simulations with simulated users, pushing your own scores (guardrails, code checks, human review), system versions for A/B comparisons, and CI with GitHub Actions. They also explain the no-code paths in the Scorecard UI: file import, Playground runs, and HTTP endpoints.

## What the skills will and will not do

- They keep your API key in env files that git ignores. They never write it into code.
- They change as little code as they can, in your repo's language and style.
- They ask before running anything that costs money, like an eval run that calls your model.
- They do not delete or overwrite existing Scorecard metrics or test sets.

## Links

- Docs: [docs.scorecard.io](https://docs.scorecard.io)
- App: [app.scorecard.io](https://app.scorecard.io)
- SDKs: [Python](https://github.com/scorecard-ai/scorecard-python), [TypeScript](https://github.com/scorecard-ai/scorecard-node), [Go](https://github.com/scorecard-ai/scorecard-go)

## License

[Apache 2.0](LICENSE)
