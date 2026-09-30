# Link traces to eval records

By default an eval record holds only inputs, outputs, and scores. If the agent is also traced (see the `scorecard-tracing` skill), link each trace to its record so reviewers see every LLM and tool call behind a score.

`runAndEvaluate` gives the `system` function a unique `otelLinkId` per record. Put it on the trace as `scorecard.otel_link_id`. The trace's `scorecard.project_id` must match the run's project.

## Python, with `wrap()` or any OTel tracing

```python
from opentelemetry import trace
from scorecard_ai.lib import SystemOptions

tracer = trace.get_tracer("my-agent")


def system(inputs: dict, _system_version: object, options: SystemOptions) -> dict:
    with tracer.start_as_current_span("eval.case") as span:
        span.set_attribute("scorecard.otel_link_id", options["otel_link_id"])
        return {"answer": answer(inputs["question"])}
```

A three-argument `system` gets `options`. Flush the tracer provider after the run: `trace.get_tracer_provider().force_flush()`.

## TypeScript, with `wrap()` or any OTel tracing

```typescript
import { trace } from "@opentelemetry/api";

const tracer = trace.getTracer("my-agent");

const system = async (inputs: { question: string }, options?: { otelLinkId: string }) =>
  tracer.startActiveSpan("eval.case", async (span) => {
    try {
      if (options) span.setAttribute("scorecard.otel_link_id", options.otelLinkId);
      return { answer: await answer(inputs.question) };
    } finally {
      span.end();
    }
  });
```

## Claude Agent SDK

The link ID goes in the resource attributes of the Claude Code subprocess:

```typescript
system: async (inputs, options) => {
  const env = {
    ...process.env,
    ...scorecardTracingEnv,
    OTEL_RESOURCE_ATTRIBUTES: `scorecard.otel_link_id=${options!.otelLinkId},scorecard.project_id=${process.env.SCORECARD_PROJECT_ID}`,
  };
  // pass env to query({ prompt, options: { env } })
}
```

In Python, pass the same `OTEL_RESOURCE_ATTRIBUTES` value in `ClaudeAgentOptions(env=...)`.

## Check it

Open a record in the run. The Timeline tab shows the linked trace.
