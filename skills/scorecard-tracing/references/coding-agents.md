# Coding agents and agent harnesses

Trace the coding agent itself (Claude Code, Codex, Gemini CLI, OpenCode, Pi, Goose, Hermes, Cursor) so each session shows up in Scorecard with its model calls and tool calls. Use this when the user wants to see what their coding agent does, or runs one in CI or as a product.

Ask which agent first, unless the repo makes it obvious. Then follow its section.

## Where the settings go

Most agents read tracing settings from env vars. Write them to `scorecard/agent-tracing.env` in the repo, with no secrets in it: the key comes from `SCORECARD_API_KEY` at load time.

```bash
# scorecard/agent-tracing.env: load with `set -a; . scorecard/agent-tracing.env; set +a` before starting the agent.
OTEL_EXPORTER_OTLP_HEADERS="Authorization=Bearer ${SCORECARD_API_KEY}"
OTEL_RESOURCE_ATTRIBUTES="scorecard.project_id=${SCORECARD_PROJECT_ID}"
# ...plus the agent's own lines below
```

Tell the user to load it in their shell profile, the CI job, or a launcher script. Agents that use a config file instead (Codex, Gemini CLI) say so below.

All agents send prompts and tool output to Scorecard once content capture is on. Tell the user, and let them turn content off if the repo handles secrets or customer data.

## Claude Code

Add the env vars from `claude-agent-sdk.md` ("Env vars") to `scorecard/agent-tracing.env`. They make Claude Code send `claude_code.interaction`, `claude_code.llm_request`, and `claude_code.tool` spans, grouped by `session.id`.

Claude Code ignores OTLP settings in a repo's `.claude/settings.json`. Use the env file, the shell, or the `env` block of the user's `~/.claude/settings.json`.

## OpenCode

OpenCode exports traces through the standard OTLP env vars. Add to `scorecard/agent-tracing.env`:

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=https://tracing.scorecard.io/otel
```

OpenCode appends `/v1/traces`. Then turn on its AI SDK spans, which carry the prompts, responses, and tool calls, in `opencode.json` at the repo root (or `~/.config/opencode/opencode.json`):

```json
{ "experimental": { "openTelemetry": true } }
```

Merge the key into an existing `opencode.json`. OpenCode also sends many internal spans (file system, SQL). Scorecard's "AI only" filter on the Records page hides them; the model calls are the `ai.streamText` spans and the tool calls are `ai.toolCall`.

## Pi

Pi has no built-in exporter. Install the extension in this skill's `assets/pi-scorecard-tracing.ts`:

1. Copy it to `~/.pi/agent/extensions/scorecard-tracing.ts` for all projects, or `.pi/extensions/scorecard-tracing.ts` for this repo. Pi loads project extensions only after the project is trusted (or with `--approve`).
2. Install its packages next to it (for a project extension, at the repo root): `npm install @opentelemetry/api@^1 @opentelemetry/sdk-trace-base@^2 @opentelemetry/exporter-trace-otlp-proto@latest @opentelemetry/resources@^2`. The extension needs OpenTelemetry JS SDK 2.x. If you write `package.json` by hand, use `^2` for `sdk-trace-base` and `resources`; 1.x fails with `resourceFromAttributes is not a function`.
3. It reads `SCORECARD_API_KEY`, `SCORECARD_PROJECT_ID`, and optionally `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` from the environment.

It sends one `invoke_agent pi` span per prompt, with `chat` and `execute_tool` spans under it.

## Codex

Codex reads tracing settings from `~/.codex/config.toml` (or `$CODEX_HOME/config.toml`), not from env vars. Add or merge:

```toml
[otel]
log_user_prompt = true
span_attributes = { "scorecard.project_id" = "<SCORECARD_PROJECT_ID>" }
trace_exporter = { otlp-http = { endpoint = "https://tracing.scorecard.io/otel/v1/traces", protocol = "binary", headers = { "Authorization" = "Bearer <SCORECARD_API_KEY>" } } }
```

- Use the full `/v1/traces` URL. Codex does not append it.
- This file holds the key. It lives in the user's home folder; never copy it into the repo.
- Spans use Codex's own names (`session_loop`, `run_turn`, `handle_responses`, one span per tool) with `gen_ai.usage.*` token counts.

## Gemini CLI

Add to `.gemini/settings.json` in the repo (or `~/.gemini/settings.json`):

```json
{
  "telemetry": {
    "enabled": true,
    "traces": true,
    "target": "local",
    "otlpProtocol": "http",
    "otlpEndpoint": "https://tracing.scorecard.io/otel",
    "logPrompts": true
  }
}
```

Gemini CLI appends `/v1/traces`. The settings file has no field for headers, so the header and project ID come from `scorecard/agent-tracing.env` (the two lines at the top of this file). Spans are `agent_call`, `llm_call`, and `tool_call`, with `gen_ai.*` attributes.

## Goose

Goose follows the OTel GenAI conventions (`invoke_agent`, `chat`, `execute_tool` spans). Add to `scorecard/agent-tracing.env`:

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=https://tracing.scorecard.io/otel
OTEL_TRACES_EXPORTER=otlp
OTEL_METRICS_EXPORTER=none
OTEL_LOGS_EXPORTER=none
OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=true
```

## Hermes and Cursor

Neither exports traces to an OTLP endpoint of your choice out of the box. Both have hooks that fire around tool calls and model responses:

- **Hermes:** a Python plugin with `ctx.register_hook` on `pre_api_request` / `post_api_request` and `pre_tool_call` / `post_tool_call`.
- **Cursor:** `.cursor/hooks.json` commands for `preToolUse`, `postToolUse`, `afterAgentResponse`, and `stop`. Each gets `conversation_id` on stdin.

In either, open and close spans from those hooks using the span tree and helpers in `agent-loop.md`. Check the agent's current hook docs first; these APIs change often.

## Any other harness

If the agent is your own code, or a harness not listed here, instrument its loop with `agent-loop.md`.

## Verify

Start the agent with the settings loaded, give it a small task that reads a file, and check the Records page. One session should show one tree: the agent turn, its model calls, and a tool call for the file read.
