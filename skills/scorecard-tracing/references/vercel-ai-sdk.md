# `wrapAISDK()`: Vercel AI SDK (TypeScript)

Wrap the `ai` module once. Every `generateText`, `generateObject`, `streamText`, `streamObject`, `embed`, and `embedMany` call through the wrapper is traced.

## Install

```bash
npm install scorecard-ai
```

If you write the version into `package.json` by hand, use `"scorecard-ai": "^3.4.0"`. Older versions have no `wrapAISDK`.

## Code

```typescript
import { openai } from "@ai-sdk/openai";
import * as ai from "ai";
import { wrapAISDK } from "scorecard-ai";

export const aiSDK = wrapAISDK(ai, {
  projectId: process.env.SCORECARD_PROJECT_ID,
  serviceName: "my-agent",
});

const { text } = await aiSDK.generateText({
  model: openai("gpt-4o-mini"),
  prompt: "What is the capital of France?",
});
```

- The API key comes from `SCORECARD_API_KEY`.
- The endpoint comes from `SCORECARD_TRACING_URL`, default `https://tracing.scorecard.io/otel/v1/traces`.

## Where to put it

1. Create the wrapper in one module (for example `lib/ai.ts`) and export it.
2. Replace `import { generateText } from "ai"` with calls on the exported wrapper, for example `aiSDK.generateText(...)`.
3. Change only call sites that make model calls. Keep type imports from `ai` as they are.

## Live scoring (optional)

Pass `metrics` to score production traffic as it happens. Each entry is a metric ID or a plain-language description; descriptions become new metrics.

```typescript
export const aiSDK = wrapAISDK(ai, {
  projectId: process.env.SCORECARD_PROJECT_ID,
  metrics: ["Check that the answer cites a source"],
});
```

`projectId` is required when `metrics` is set. Metric setup errors only log to the console. Check the project's Metrics page after the first call.

## Flush before exit

Spans export right away (batch size 1). If a short script still loses its last span, flush the provider behind the global proxy; `trace.getTracerProvider().forceFlush()` does not exist and crashes. See "Flush before exit" in `sdk-wrap.md`.

## Gotchas

- `wrapAISDK` registers its own global OTel tracer provider. If the app already registers one (for example `@vercel/otel` in `instrumentation.ts`), use `references/opentelemetry.md` and add a Scorecard exporter to the existing provider instead.
- In Next.js, create the wrapper in server code only.
