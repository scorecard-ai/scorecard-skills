# Traceloop / OpenLLMetry: frameworks

Traceloop's OpenLLMetry is an open-source OTel instrumentation set. One init call traces LangChain, LangGraph, LlamaIndex, CrewAI, Haystack, LiteLLM, the OpenAI Agents SDK, and the provider SDKs under them (OpenAI, Anthropic, Bedrock, Gemini, Cohere, Mistral, and more). Scorecard receives the traces. No Traceloop account is needed.

## Install

| Language | Command |
|---|---|
| Python | `pip install traceloop-sdk` |
| TypeScript | `npm install @traceloop/node-server-sdk` |

The Python package pulls in the instrumentations for every library it supports.

## Python

Put this in the entry point, **before** any import of the framework or provider SDK. Instrumentation patches modules at import time.

```python
import os

from traceloop.sdk import Traceloop

# Scorecard takes traces only. Without this, Traceloop also exports metrics and logs 404s.
os.environ.setdefault("TRACELOOP_METRICS_ENABLED", "false")

Traceloop.init(
    app_name="my-agent",
    api_endpoint=os.environ.get("TRACELOOP_BASE_URL", "https://tracing.scorecard.io/otel"),
    headers={"Authorization": f"Bearer {os.environ['SCORECARD_API_KEY']}"},
    resource_attributes={"scorecard.project_id": os.environ["SCORECARD_PROJECT_ID"]},
    disable_batch=True,
    telemetry_enabled=False,
)

# Framework imports go after init.
from langchain_openai import ChatOpenAI  # noqa: E402
```

- `disable_batch=True` sends each span at once. Short scripts need it. For a busy server, drop it and let the batch processor run.
- `telemetry_enabled=False` turns off Traceloop's own anonymous usage stats.
- Leave out `instruments=` so every installed library is traced. Pass a set (for example `{Instruments.LANGCHAIN, Instruments.OPENAI}`) only to limit it.
- If the entry point loads `.env` with `python-dotenv`, call `load_dotenv()` before `Traceloop.init`.

## TypeScript

Import and init first, then import the framework. Pass the modules to instrument, because ESM and bundlers can hide them from auto-patching.

```typescript
import * as traceloop from "@traceloop/node-server-sdk";
import OpenAI from "openai";

traceloop.initialize({
  appName: "my-agent",
  baseUrl: process.env.TRACELOOP_BASE_URL ?? "https://tracing.scorecard.io/otel",
  headers: { Authorization: `Bearer ${process.env.SCORECARD_API_KEY}` },
  disableBatch: true,
  instrumentModules: { openAI: OpenAI },
});
```

`instrumentModules` takes a different shape per library. Getting it wrong crashes at startup (`Cannot read properties of undefined (reading 'prototype')`):

| Key | Pass |
|---|---|
| `openAI` | the default export: `import OpenAI from "openai"` |
| `anthropic` | the module namespace: `import * as anthropic from "@anthropic-ai/sdk"` |
| `langchain` | the LangChain module namespaces, for example `{ chainsModule, agentsModule, toolsModule }` |
| `llamaIndex`, `bedrock`, `cohere`, `pinecone`, `chromadb` | the module namespace (`import * as x from "..."`) |

Anthropic example:

```typescript
import * as anthropic from "@anthropic-ai/sdk";
import * as traceloop from "@traceloop/node-server-sdk";

traceloop.initialize({
  appName: "my-agent",
  baseUrl: process.env.TRACELOOP_BASE_URL ?? "https://tracing.scorecard.io/otel",
  headers: { Authorization: `Bearer ${process.env.SCORECARD_API_KEY}` },
  disableBatch: true,
  instrumentModules: { anthropic },
});
```

Set the project with the standard OTel env var, next to the other Scorecard env vars:

```bash
OTEL_RESOURCE_ATTRIBUTES=scorecard.project_id=314
```

## Name the steps (optional)

Traceloop decorators give agent steps readable names in the trace tree:

```python
from traceloop.sdk.decorators import task, workflow

@workflow(name="answer_question")
def answer(question: str) -> str:
    ...
```

```typescript
await traceloop.withWorkflow({ name: "answer_question" }, async () => {
  // agent code
});
```

## Env var form

Traceloop also reads env vars. Use this form when the entry point cannot change:

```bash
TRACELOOP_BASE_URL=https://tracing.scorecard.io/otel
TRACELOOP_HEADERS="Authorization=Bearer%20<SCORECARD_API_KEY>"
TRACELOOP_METRICS_ENABLED=false
OTEL_RESOURCE_ATTRIBUTES=scorecard.project_id=314
```

The space in `TRACELOOP_HEADERS` must be written as `%20`.

## Gotchas

- Init after the framework import, and nothing is traced. This is the most common failure.
- "Failed to export metrics batch ... 404" means metrics export is on. Set `TRACELOOP_METRICS_ENABLED=false`.
- "Failed to export batch" warnings during shutdown are harmless when spans still arrive.
- If the repo already uses Traceloop with Traceloop's cloud, ask before changing the endpoint. To send to both, use `references/opentelemetry.md` and add a second exporter.
