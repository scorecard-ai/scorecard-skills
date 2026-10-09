# `wrap()`: OpenAI and Anthropic clients

The Scorecard SDK wraps an OpenAI or Anthropic client. Calls through the wrapped client are traced. Nothing else changes.

## Install

| Language | Command |
|---|---|
| Python | `pip install "scorecard-ai[otel]"` (the `otel` extra is required, or `wrap` raises `ImportError`) |
| TypeScript | `npm install scorecard-ai` |

If you write the version into a manifest by hand, use `scorecard-ai[otel]>=3.9` (Python) or `"scorecard-ai": "^3.4.0"` (TypeScript). Older versions have no `wrap`.

## Python

```python
import os

from openai import OpenAI
from scorecard_ai import wrap

client = wrap(
    OpenAI(),
    {
        "api_key": os.environ["SCORECARD_API_KEY"],
        "project_id": os.environ["SCORECARD_PROJECT_ID"],
        "endpoint": os.environ.get("SCORECARD_TRACING_URL"),  # None uses the Scorecard default
        "service_name": "my-agent",
    },
)

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "Hello!"}],
)
```

Anthropic is the same: `wrap(Anthropic(), {...})`, then `client.messages.create(...)`.

## TypeScript

```typescript
import OpenAI from "openai";
import { wrap } from "scorecard-ai";

const client = wrap(new OpenAI(), {
  apiKey: process.env.SCORECARD_API_KEY,
  projectId: process.env.SCORECARD_PROJECT_ID,
  endpoint: process.env.SCORECARD_TRACING_URL, // undefined uses the Scorecard default
  serviceName: "my-agent",
});

const response = await client.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: "Hello!" }],
});
```

Anthropic: `wrap(new Anthropic(), {...})`, then `client.messages.create(...)` or `client.messages.stream(...)`.

## Where to put it

Wrap the client where it is created, once. If the client is built in several places, wrap each, or refactor to one factory function only if that is a small change.

## What is traced

| Client | Python | TypeScript |
|---|---|---|
| OpenAI | any `.create` call, including `responses.create` | `chat.completions.create` only |
| Anthropic | `messages.create`, streaming | `messages.create`, `messages.stream` |

If a TS app uses OpenAI `responses.create`, use Traceloop or OpenTelemetry instead.

## Group calls into one trace

A multi-step agent makes several LLM calls per request. Open a parent span around the request, and the wrapped calls nest under it. `wrap` sets `scorecard.project_id` only on the spans it creates, so set it on your parent span too; otherwise that span, and anything on it such as `session.id`, lands in the org's oldest project:

```python
import os

from opentelemetry import trace

tracer = trace.get_tracer("my-agent")

def handle(question: str) -> str:
    with tracer.start_as_current_span("agent.run") as span:
        span.set_attribute("scorecard.project_id", os.environ["SCORECARD_PROJECT_ID"])
        span.set_attribute("input.value", question)  # the answer comes from the wrapped LLM spans
        return run_agent(question)  # wrapped client calls happen in here
```

```typescript
import { trace } from "@opentelemetry/api";

const tracer = trace.getTracer("my-agent");

async function handle(question: string): Promise<string> {
  return tracer.startActiveSpan("agent.run", async (span) => {
    try {
      span.setAttribute("scorecard.project_id", process.env.SCORECARD_PROJECT_ID ?? "");
      span.setAttribute("input.value", question); // the answer comes from the wrapped LLM spans
      return await runAgent(question); // wrapped client calls happen in here
    } finally {
      span.end();
    }
  });
}
```

`@opentelemetry/api` is already a dependency of `scorecard-ai`. Add it to `package.json` if you import it directly.

## Flush before exit

Spans export right away (batch size 1), but a script that exits at once can still drop the last one. In a short-lived Python script, flush at the end:

```python
from opentelemetry import trace

trace.get_tracer_provider().force_flush()
```

In TypeScript, `trace.getTracerProvider()` returns a proxy with no `forceFlush`, so calling it crashes. Flush the real provider behind it:

```typescript
import { trace } from "@opentelemetry/api";

const provider = trace.getTracerProvider() as unknown as { getDelegate?: () => { forceFlush?: () => Promise<void> } };
await provider.getDelegate?.().forceFlush?.();
```

Long-running servers do not need this.

## Gotchas

- `project_id` is a numeric string such as `"314"`, not the project name.
- The wrapped object is a proxy of the original client. Types and methods do not change.
- Any object with `chat.completions` counts as OpenAI; any object with `messages` counts as Anthropic. OpenAI-compatible clients (Groq, Together, OpenRouter via the `openai` package) work.
