---
name: scorecard-tracing
description: Add Scorecard tracing to an AI agent or LLM app, for requests like "add Scorecard tracing" or "trace, instrument, monitor, or log this agent in Scorecard". Scorecard tracing uses specific packages, wrapper functions, and endpoints that are easy to guess wrong (for example, the Vercel AI SDK uses wrapAISDK from the scorecard-ai npm package, not a separate instrumentation package). This skill has the exact setup per stack, so load it before you install packages or write tracing code. Covers OpenAI, Anthropic, Vercel AI SDK, LangChain, LangGraph, LlamaIndex, CrewAI, LiteLLM, OpenAI Agents SDK, Claude Agent SDK, coding agents (Claude Code, Codex, Gemini CLI, OpenCode, Pi, Goose, Hermes, Cursor), hand-written agent loops, and plain OpenTelemetry in any language. Use when the user asks to trace, instrument, monitor, or log an agent to Scorecard.
---

# Add Scorecard tracing

Follow this skill and its reference files. Do not guess Scorecard package names, functions, or endpoints from memory. Guessed names install packages that do not exist and send no traces.

Files named `references/<file>.md` below sit next to this `SKILL.md`, in the skill's own folder, not in the user's repo. Read them from there.

Scorecard takes OpenTelemetry (OTel) traces. Each agent run becomes a record on the project's Records page.

Needs `SCORECARD_API_KEY` and `SCORECARD_PROJECT_ID`. If either is missing, run the `scorecard-setup` skill first.

## Steps

1. **Detect.** Read `references/detect.md`. Pick one method. If the user named a method, use it.
2. **Read the method's reference file** before you edit anything.
3. **Install and instrument.** Follow the reference. Use the repo's package manager.
4. **Set the project.** Every method must send `scorecard.project_id`. Without it, traces land in the org's oldest project.
5. **Flush on exit.** Short-lived scripts and CLIs must flush before exit, or the last spans are lost.
6. **Sessions (chat agents).** If the agent has multi-turn conversations, read `references/sessions-and-metadata.md` and set a session ID.
7. **Verify.** Follow `references/verify.md`.

## Methods

| Method | Reference | Code change |
|---|---|---|
| The coding agent itself: Claude Code, Codex, Gemini CLI, OpenCode, Pi, Goose, Hermes, Cursor | `references/coding-agents.md` | Env vars, a config file, or an extension |
| Claude Agent SDK (an app built on it) | `references/claude-agent-sdk.md` | Env vars only |
| Claude Tag (Claude in Slack) | `references/claude-tag.md` | Admin settings only |
| OpenAI or Anthropic client, `wrap()` | `references/sdk-wrap.md` | Wrap the client |
| Vercel AI SDK, `wrapAISDK()` | `references/vercel-ai-sdk.md` | Wrap the `ai` module |
| LangChain, LangGraph, LlamaIndex, CrewAI, LiteLLM, OpenAI Agents SDK, Bedrock, Gemini (Traceloop / OpenLLMetry) | `references/traceloop.md` | One init call |
| Scorecard LLM proxy | `references/llm-proxy.md` | Change the base URL |
| OpenTelemetry directly (any language, custom spans) | `references/opentelemetry.md` | Exporter setup |
| Hand-written agent loop or custom harness (model calls plus tool calls, any language) | `references/agent-loop.md` | One span per turn, model call, and tool call |

## Endpoints

Keep endpoints in env vars with the defaults below, so staging and self-hosted setups work without code changes.

| Env var | Default | Used by |
|---|---|---|
| `SCORECARD_TRACING_URL` | `https://tracing.scorecard.io/otel/v1/traces` | `wrap()`, `wrapAISDK()` |
| `TRACELOOP_BASE_URL` | `https://tracing.scorecard.io/otel` | Traceloop |
| `BETA_TRACING_ENDPOINT` | `https://tracing.scorecard.io/otel` | Claude Agent SDK, Claude Code |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` | `https://tracing.scorecard.io/otel/v1/traces` | OpenTelemetry |
| `SCORECARD_LLM_PROXY_URL` | `https://llm.scorecard.io` | LLM proxy |

Auth for every tracing endpoint: `Authorization: Bearer <SCORECARD_API_KEY>`. Use OTLP over HTTP (protobuf or JSON), not gRPC.

## Rules

- Change as little as you can. Do not restructure the agent.
- Do not double-instrument. If the repo already has an OTel `TracerProvider`, add a Scorecard exporter to it (see `references/opentelemetry.md`) instead of a second provider.
- Never hard-code the API key.
- Tell the user which method you picked and why, in one line.
