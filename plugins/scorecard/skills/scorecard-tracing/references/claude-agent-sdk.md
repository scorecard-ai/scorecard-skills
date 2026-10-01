# Claude Agent SDK and Claude Code CLI

Claude Code (and the Claude Agent SDK, which runs Claude Code under the hood) emits OTel traces itself. You only set env vars. No new packages.

Versions: Python `claude-agent-sdk` 0.1.18 or later, TS `@anthropic-ai/claude-agent-sdk` 0.1.71 or later.

## Env vars

```bash
OTEL_EXPORTER_OTLP_HEADERS="Authorization=Bearer ${SCORECARD_API_KEY}"
ENABLE_BETA_TRACING_DETAILED=1
BETA_TRACING_ENDPOINT=https://tracing.scorecard.io/otel
OTEL_LOG_USER_PROMPTS=1
OTEL_LOG_TOOL_DETAILS=1
OTEL_LOG_TOOL_CONTENT=1
OTEL_RESOURCE_ATTRIBUTES="scorecard.project_id=${SCORECARD_PROJECT_ID}"
```

- `OTEL_LOG_USER_PROMPTS`, `OTEL_LOG_TOOL_DETAILS`, `OTEL_LOG_TOOL_CONTENT` put prompts and tool data in the trace. Without them, Scorecard shows timings but no content. If the user handles sensitive data, tell them and let them choose.
- Claude Code sets `session.id` on its spans, so one conversation becomes one record.

## Where to set them

The SDK starts a Claude Code subprocess. The subprocess must see the env vars.

### Python

The subprocess inherits `os.environ`. Build the env in code so it works without a shell export:

```python
import os
from claude_agent_sdk import ClaudeAgentOptions, query


def scorecard_tracing_env() -> dict[str, str]:
    """Env vars that make Claude Code send traces to Scorecard."""
    return {
        "OTEL_EXPORTER_OTLP_HEADERS": f"Authorization=Bearer {os.environ['SCORECARD_API_KEY']}",
        "ENABLE_BETA_TRACING_DETAILED": "1",
        "BETA_TRACING_ENDPOINT": os.environ.get("BETA_TRACING_ENDPOINT", "https://tracing.scorecard.io/otel"),
        "OTEL_LOG_USER_PROMPTS": "1",
        "OTEL_LOG_TOOL_DETAILS": "1",
        "OTEL_LOG_TOOL_CONTENT": "1",
        "OTEL_RESOURCE_ATTRIBUTES": f"scorecard.project_id={os.environ['SCORECARD_PROJECT_ID']}",
    }


options = ClaudeAgentOptions(env=scorecard_tracing_env())

async for message in query(prompt="What is 2 + 2?", options=options):
    ...
```

If the agent already passes `ClaudeAgentOptions`, add `env=` to it. Merge with any env it already sets.

### TypeScript

In TS the `env` option **replaces** the subprocess environment. Spread `process.env` first, or the subprocess loses `PATH` and the Anthropic key.

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

const scorecardTracingEnv = {
  OTEL_EXPORTER_OTLP_HEADERS: `Authorization=Bearer ${process.env.SCORECARD_API_KEY}`,
  ENABLE_BETA_TRACING_DETAILED: "1",
  BETA_TRACING_ENDPOINT: process.env.BETA_TRACING_ENDPOINT ?? "https://tracing.scorecard.io/otel",
  OTEL_LOG_USER_PROMPTS: "1",
  OTEL_LOG_TOOL_DETAILS: "1",
  OTEL_LOG_TOOL_CONTENT: "1",
  OTEL_RESOURCE_ATTRIBUTES: `scorecard.project_id=${process.env.SCORECARD_PROJECT_ID}`,
};

for await (const message of query({
  prompt: "What is 2 + 2?",
  options: { env: { ...process.env, ...scorecardTracingEnv } },
})) {
  if (message.type === "result" && message.subtype === "success") {
    console.log(message.result);
  }
}
```

Messages from the TS SDK are plain objects. Check `message.type`, not `instanceof`.

### Claude Code CLI (scripts, CI, cron)

Export the env vars in the shell, CI job, or container before `claude` runs. For CI, store the API key as a secret and build the header from it.

## Link traces to eval runs

To score these traces inside an eval run, add `scorecard.otel_link_id` to `OTEL_RESOURCE_ATTRIBUTES`. See the `scorecard-evals` skill, `references/trace-linking.md`.

## Gotchas

- A wrong `scorecard.project_id` sends traces to the oldest project.
- Traces show up after the subprocess exits and flushes. Allow up to a minute.
