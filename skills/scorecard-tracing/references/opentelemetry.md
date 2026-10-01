# OpenTelemetry directly (any language)

Use this for Go, Java, .NET, Rust, Ruby, raw HTTP calls to a model, custom agent loops, or an app that already has an OTel tracer provider.

## Endpoint

| Setting | Value |
|---|---|
| Protocol | OTLP over HTTP, protobuf or JSON. Do not use gRPC. |
| Traces URL | `https://tracing.scorecard.io/otel/v1/traces` |
| Header | `Authorization: Bearer <SCORECARD_API_KEY>` |
| Resource attribute | `scorecard.project_id=<SCORECARD_PROJECT_ID>` |

Standard OTel env vars work in every language:

```bash
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=https://tracing.scorecard.io/otel/v1/traces
OTEL_EXPORTER_OTLP_TRACES_PROTOCOL=http/protobuf
OTEL_EXPORTER_OTLP_TRACES_HEADERS="Authorization=Bearer <SCORECARD_API_KEY>"
OTEL_RESOURCE_ATTRIBUTES=scorecard.project_id=314
OTEL_SERVICE_NAME=my-agent
```

## Attributes Scorecard reads

Spans need these attributes for Scorecard to show inputs, outputs, model, and tokens. Use the OTel GenAI names:

| Attribute | Example |
|---|---|
| `gen_ai.system` | `openai`, `anthropic` |
| `gen_ai.request.model` | `gpt-4o-mini` |
| `gen_ai.prompt.<i>.role`, `gen_ai.prompt.<i>.content` | `user`, `What is 2+2?` |
| `gen_ai.completion.<i>.role`, `gen_ai.completion.<i>.content` | `assistant`, `4` |
| `gen_ai.usage.input_tokens`, `gen_ai.usage.output_tokens` | `12`, `3` |

For the agent run, set `input.value` (the user's request) on its root span, but not `output.value`: Scorecard builds the conversation span by span in start order, so an answer on the root span shows up before the model call that produced it. The final answer belongs on the last LLM span's `gen_ai.completion.*`. For tool calls, set `tool.name`, `tool.parameters`, and `tool.result`. Set `openinference.span.kind` to `AGENT`, `TOOL`, or `LLM`.

## Python

```bash
pip install opentelemetry-sdk opentelemetry-exporter-otlp-proto-http
```

```python
import os

from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

provider = TracerProvider(
    resource=Resource.create(
        {
            "service.name": "my-agent",
            "scorecard.project_id": os.environ["SCORECARD_PROJECT_ID"],
        }
    )
)
provider.add_span_processor(
    BatchSpanProcessor(
        OTLPSpanExporter(
            endpoint=os.environ.get(
                "OTEL_EXPORTER_OTLP_TRACES_ENDPOINT", "https://tracing.scorecard.io/otel/v1/traces"
            ),
            headers={"Authorization": f"Bearer {os.environ['SCORECARD_API_KEY']}"},
        )
    )
)
trace.set_tracer_provider(provider)
tracer = trace.get_tracer("my-agent")


def call_model(question: str) -> str:
    with tracer.start_as_current_span("chat gpt-4o-mini") as span:
        span.set_attribute("gen_ai.system", "openai")
        span.set_attribute("gen_ai.request.model", "gpt-4o-mini")
        span.set_attribute("gen_ai.prompt.0.role", "user")
        span.set_attribute("gen_ai.prompt.0.content", question)
        answer = my_http_llm_call(question)
        span.set_attribute("gen_ai.completion.0.role", "assistant")
        span.set_attribute("gen_ai.completion.0.content", answer)
        return answer


# In scripts, before exit:
provider.force_flush()
```

## TypeScript (OTel JS 2.x)

```bash
npm install @opentelemetry/api @opentelemetry/sdk-trace-node @opentelemetry/sdk-trace-base @opentelemetry/exporter-trace-otlp-proto @opentelemetry/resources
```

```typescript
import { trace } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";

const provider = new NodeTracerProvider({
  resource: resourceFromAttributes({
    "service.name": "my-agent",
    "scorecard.project_id": process.env.SCORECARD_PROJECT_ID ?? "",
  }),
  spanProcessors: [
    new BatchSpanProcessor(
      new OTLPTraceExporter({
        url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ?? "https://tracing.scorecard.io/otel/v1/traces",
        headers: { Authorization: `Bearer ${process.env.SCORECARD_API_KEY}` },
      }),
    ),
  ],
});
provider.register();

export const tracer = trace.getTracer("my-agent");

// In scripts, before exit:
// await provider.forceFlush();
```

OTel JS 1.x uses `new Resource({...})` and `provider.addSpanProcessor(...)`. Match the version already in the lockfile.

## Go

```bash
go get go.opentelemetry.io/otel go.opentelemetry.io/otel/sdk go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp
```

```go
exporter, err := otlptracehttp.New(ctx) // reads OTEL_EXPORTER_OTLP_TRACES_* env vars
if err != nil {
	return err
}
res, err := resource.New(ctx, resource.WithFromEnv(), resource.WithTelemetrySDK()) // reads OTEL_RESOURCE_ATTRIBUTES
if err != nil {
	return err
}
tp := sdktrace.NewTracerProvider(sdktrace.WithBatcher(exporter), sdktrace.WithResource(res))
otel.SetTracerProvider(tp)
defer tp.Shutdown(ctx)
```

## Java, .NET, Ruby, Rust

Use that language's OTel SDK with the OTLP HTTP exporter, and set the env vars at the top of this file. The Java agent (`-javaagent:opentelemetry-javaagent.jar`) and .NET auto-instrumentation read them with no code change. Add the `gen_ai.*` attributes on the spans around model calls.

## App already has a tracer provider

Do not create a second provider. Add one more span processor with a Scorecard exporter to the existing provider. Keep the existing exporters. Put `scorecard.project_id` on the resource, or, if the resource is shared with other backends, set it as a span attribute on the root span.

## Gotchas

- Flush or shut down the provider before a script exits.
- A span processor added after spans start only exports later spans. Set up tracing first thing at startup.
