// Pi extension: send Pi's own activity to Scorecard as OpenTelemetry traces.
// One `invoke_agent pi` span per prompt, with a `chat <model>` span per model response and an
// `execute_tool <tool>` span per tool call underneath.
//
// Install: copy to ~/.pi/agent/extensions/scorecard-tracing.ts (all projects) or
// .pi/extensions/scorecard-tracing.ts (one project; Pi loads project extensions only after you trust
// the project or pass --approve). Then install the OpenTelemetry packages next to it:
//   npm install @opentelemetry/api @opentelemetry/sdk-trace-base @opentelemetry/exporter-trace-otlp-proto @opentelemetry/resources
//
// Env: SCORECARD_API_KEY, SCORECARD_PROJECT_ID, optional OTEL_EXPORTER_OTLP_TRACES_ENDPOINT.

import { context, type Span, SpanStatusCode, trace } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BasicTracerProvider, BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";

const MAX_CHARS = 4000;
const clip = (value: unknown) => {
  const text = typeof value === "string" ? value : JSON.stringify(value ?? "");
  return text.length > MAX_CHARS ? `${text.slice(0, MAX_CHARS)}…` : text;
};
const textOf = (message: any) =>
  Array.isArray(message?.content)
    ? message.content.filter((b: any) => b?.type === "text").map((b: any) => b.text).join("")
    : String(message?.content ?? "");

export default function (pi: any) {
  let provider: BasicTracerProvider | undefined;
  let agentSpan: Span | undefined;
  let chatSpan: Span | undefined;
  let prompt = "";
  const toolSpans = new Map<string, Span>();

  const tracer = () => provider!.getTracer("pi-scorecard-tracing");
  const inAgent = () => (agentSpan ? trace.setSpan(context.active(), agentSpan) : context.active());

  pi.on("session_start", () => {
    if (provider || !process.env.SCORECARD_API_KEY) return;
    provider = new BasicTracerProvider({
      resource: resourceFromAttributes({
        "service.name": "pi",
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
  });

  pi.on("before_agent_start", (event: any) => {
    prompt = event.prompt ?? "";
  });

  pi.on("agent_start", (_event: any, ctx: any) => {
    if (!provider) return;
    agentSpan = tracer().startSpan("invoke_agent pi", {
      attributes: {
        "gen_ai.operation.name": "invoke_agent",
        "gen_ai.agent.name": "pi",
        "session.id": ctx?.sessionManager?.getSessionId?.() ?? "",
        "input.value": clip(prompt),
        "openinference.span.kind": "AGENT",
      },
    });
  });

  pi.on("message_start", (event: any) => {
    if (!provider || event.message?.role !== "assistant") return;
    chatSpan = tracer().startSpan("chat", { attributes: { "gen_ai.operation.name": "chat", "openinference.span.kind": "LLM" } }, inAgent());
  });

  pi.on("message_end", (event: any) => {
    const m = event.message;
    if (!chatSpan || m?.role !== "assistant") return;
    const tools = Array.isArray(m.content) ? m.content.filter((b: any) => b?.type === "toolCall" || b?.type === "tool_use").map((b: any) => b.name) : [];
    const text = textOf(m) || (tools.length ? `Calling ${tools.join(", ")}` : "");
    chatSpan.updateName(`chat ${m.model ?? ""}`.trim());
    chatSpan.setAttributes({
      "gen_ai.system": m.provider ?? "",
      "gen_ai.request.model": m.model ?? "",
      "gen_ai.prompt.0.role": "user",
      "gen_ai.prompt.0.content": clip(prompt),
      "gen_ai.completion.0.role": "assistant",
      "gen_ai.completion.0.content": clip(text),
      "gen_ai.usage.input_tokens": m.usage?.input ?? 0,
      "gen_ai.usage.output_tokens": m.usage?.output ?? 0,
    });
    if (m.stopReason === "error") chatSpan.setStatus({ code: SpanStatusCode.ERROR, message: String(m.errorMessage ?? "error") });
    chatSpan.end();
    chatSpan = undefined;
  });

  pi.on("tool_execution_start", (event: any) => {
    if (!provider) return;
    const span = tracer().startSpan(
      `execute_tool ${event.toolName}`,
      {
        attributes: {
          "gen_ai.operation.name": "execute_tool",
          "gen_ai.tool.name": event.toolName,
          "gen_ai.tool.call.id": event.toolCallId,
          "tool.name": event.toolName,
          "tool.parameters": clip(event.args),
          "openinference.span.kind": "TOOL",
        },
      },
      inAgent(),
    );
    toolSpans.set(event.toolCallId, span);
  });

  pi.on("tool_execution_end", (event: any) => {
    const span = toolSpans.get(event.toolCallId);
    if (!span) return;
    span.setAttribute("tool.result", clip(event.result?.content ?? event.result));
    if (event.isError) span.setStatus({ code: SpanStatusCode.ERROR });
    span.end();
    toolSpans.delete(event.toolCallId);
  });

  // The answer is on the last chat span. Scorecard shows spans in start order, so an answer on
  // the agent span would appear before the model call that produced it.
  pi.on("agent_end", () => {
    if (!agentSpan) return;
    agentSpan.end();
    agentSpan = undefined;
    void provider?.forceFlush();
  });

  pi.on("session_shutdown", async () => {
    await provider?.shutdown();
    provider = undefined;
  });
}
