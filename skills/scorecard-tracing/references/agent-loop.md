# Any agent loop or harness

Every agent, from a 50-line script to a coding agent like Codex or Pi, runs the same loop: take a request, call a model, run the tools the model asks for, call the model again, and stop. Trace that loop with three kinds of spans and Scorecard shows it as one tree, whatever language, model, or framework the agent uses.

Use this when no other method fits: a hand-written loop, a custom harness, a model called over raw HTTP, or a framework Traceloop does not cover.

## The span tree

```
invoke_agent <agent name>          one per user request (a turn)
├── chat <model>                   one per model call
├── execute_tool <tool name>       one per tool call
├── chat <model>
└── ...
```

Set these attributes. The OTel GenAI names (`gen_ai.*`) keep the trace portable; the extra names are the ones Scorecard's trace view reads for inputs, outputs, and tool calls.

| Span | Attributes |
|---|---|
| `invoke_agent` | `gen_ai.operation.name=invoke_agent`, `gen_ai.agent.name`, `session.id` (the conversation ID), `input.value` (user request), `openinference.span.kind=AGENT` |
| `chat` | `gen_ai.operation.name=chat`, `gen_ai.system` (`anthropic`, `openai`, ...), `gen_ai.request.model`, `gen_ai.prompt.<i>.role` and `.content` for each message sent (role `tool` for tool results), `gen_ai.completion.0.role` and `.content` for the reply, `gen_ai.usage.input_tokens`, `gen_ai.usage.output_tokens`, `openinference.span.kind=LLM` |
| `execute_tool` | `gen_ai.operation.name=execute_tool`, `gen_ai.tool.name`, `gen_ai.tool.call.id`, `tool.name`, `tool.parameters` (JSON args), `tool.result`, `openinference.span.kind=TOOL` |

Mark failed tool calls and model calls with span status `ERROR` and record the exception.

How Scorecard shows it: the Conversation tab walks these spans in start order. The `invoke_agent` span gives the user's message, each `chat` span gives an assistant message with its model, and each `execute_tool` span gives a tool message with its result. That is why the final answer goes on the last `chat` span, not on `invoke_agent`, and why a reply that only calls tools still gets readable text ("Calling get_policy").

## Exporter setup

Use the exporter setup in `opentelemetry.md` (OTLP over HTTP, `Authorization: Bearer <SCORECARD_API_KEY>`, resource attribute `scorecard.project_id`). Set it up once at startup, before the loop runs.

## Python helper

Add this as one module, for example `scorecard_tracing.py`, and call it from the loop.

```python
"""Scorecard tracing for an agent loop: one span per turn, model call, and tool call."""

import json
from contextlib import contextmanager

from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode

tracer = trace.get_tracer("agent")


@contextmanager
def agent_turn(agent_name: str, session_id: str, user_input: str):
    with tracer.start_as_current_span(f"invoke_agent {agent_name}") as span:
        span.set_attributes({
            "gen_ai.operation.name": "invoke_agent",
            "gen_ai.agent.name": agent_name,
            "session.id": session_id,
            "input.value": user_input,
            "openinference.span.kind": "AGENT",
        })
        yield span  # the final answer is recorded on the last model_call span


@contextmanager
def model_call(system: str, model: str, messages: list[dict]):
    with tracer.start_as_current_span(f"chat {model}") as span:
        span.set_attributes({
            "gen_ai.operation.name": "chat",
            "gen_ai.system": system,
            "gen_ai.request.model": model,
            "openinference.span.kind": "LLM",
        })
        for i, m in enumerate(messages):
            content = m["content"] if isinstance(m["content"], str) else json.dumps(m["content"])
            span.set_attribute(f"gen_ai.prompt.{i}.role", m["role"])
            span.set_attribute(f"gen_ai.prompt.{i}.content", content)
        yield span


def record_reply(span, text: str, input_tokens: int | None = None, output_tokens: int | None = None, tool_names: list[str] | None = None):
    # A reply that only calls tools has no text; describe it so the conversation stays readable.
    if not text.strip() and tool_names:
        text = "Calling " + ", ".join(tool_names)
    span.set_attribute("gen_ai.completion.0.role", "assistant")
    span.set_attribute("gen_ai.completion.0.content", text)
    if input_tokens is not None:
        span.set_attribute("gen_ai.usage.input_tokens", input_tokens)
    if output_tokens is not None:
        span.set_attribute("gen_ai.usage.output_tokens", output_tokens)


@contextmanager
def tool_call(name: str, call_id: str, arguments: dict):
    with tracer.start_as_current_span(f"execute_tool {name}") as span:
        span.set_attributes({
            "gen_ai.operation.name": "execute_tool",
            "gen_ai.tool.name": name,
            "gen_ai.tool.call.id": call_id,
            "tool.name": name,
            "tool.parameters": json.dumps(arguments),
            "openinference.span.kind": "TOOL",
        })
        try:
            yield span  # set span.set_attribute("tool.result", str(result)) before leaving
        except Exception as exc:
            span.record_exception(exc)
            span.set_status(Status(StatusCode.ERROR, str(exc)))
            raise
```

In the loop:

```python
with agent_turn("support-bot", conversation_id, user_message) as turn:
    while True:
        with model_call("anthropic", MODEL, messages) as llm:
            reply = call_model(messages)
            record_reply(llm, reply.text, reply.input_tokens, reply.output_tokens, [c.name for c in reply.tool_calls])
        if not reply.tool_calls:
            break
        for call in reply.tool_calls:
            with tool_call(call.name, call.id, call.arguments) as span:
                result = run_tool(call)
                span.set_attribute("tool.result", str(result))
            messages.append(tool_result_message(call, result))
```

## TypeScript helper

```typescript
import { type Span, SpanStatusCode, trace } from "@opentelemetry/api";

const tracer = trace.getTracer("agent");

export function agentTurn<T>(agentName: string, sessionId: string, input: string, fn: (span: Span) => Promise<T>): Promise<T> {
  return tracer.startActiveSpan(`invoke_agent ${agentName}`, async (span) => {
    span.setAttributes({
      "gen_ai.operation.name": "invoke_agent",
      "gen_ai.agent.name": agentName,
      "session.id": sessionId,
      "input.value": input,
      "openinference.span.kind": "AGENT",
    });
    try {
      return await fn(span); // the final answer is recorded on the last modelCall span
    } finally {
      span.end();
    }
  });
}

export function modelCall<T>(system: string, model: string, messages: { role: string; content: unknown }[], fn: (span: Span) => Promise<T>): Promise<T> {
  return tracer.startActiveSpan(`chat ${model}`, async (span) => {
    span.setAttributes({ "gen_ai.operation.name": "chat", "gen_ai.system": system, "gen_ai.request.model": model, "openinference.span.kind": "LLM" });
    messages.forEach((m, i) => {
      span.setAttribute(`gen_ai.prompt.${i}.role`, m.role);
      span.setAttribute(`gen_ai.prompt.${i}.content`, typeof m.content === "string" ? m.content : JSON.stringify(m.content));
    });
    try {
      return await fn(span); // set gen_ai.completion.0.content ("Calling <tool>" if no text) and gen_ai.usage.* inside fn
    } finally {
      span.end();
    }
  });
}

export function toolCall<T>(name: string, callId: string, args: unknown, fn: (span: Span) => Promise<T>): Promise<T> {
  return tracer.startActiveSpan(`execute_tool ${name}`, async (span) => {
    span.setAttributes({
      "gen_ai.operation.name": "execute_tool",
      "gen_ai.tool.name": name,
      "gen_ai.tool.call.id": callId,
      "tool.name": name,
      "tool.parameters": JSON.stringify(args),
      "openinference.span.kind": "TOOL",
    });
    try {
      const result = await fn(span);
      span.setAttribute("tool.result", typeof result === "string" ? result : JSON.stringify(result));
      return result;
    } catch (err) {
      span.recordException(err as Error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) });
      throw err;
    } finally {
      span.end();
    }
  });
}
```

## Rules

- Wrap the real loop. Do not restructure it to fit the helpers.
- If the agent calls the model through the OpenAI or Anthropic SDK, you can use `wrap()` (see `sdk-wrap.md`) for the `chat` spans and only add `agent_turn` and `tool_call` by hand.
- Tool arguments and results can hold file contents, secrets, or personal data. Ask the user before you record them, and truncate large values (for example to 4,000 characters).
- Flush the tracer provider before a CLI exits.
