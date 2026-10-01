# Scorecard LLM proxy

Point an OpenAI-compatible client at Scorecard's proxy. The proxy forwards each call to the provider and records it. No SDK, no OTel setup.

Use this when the user cannot add a dependency, or can only change config. Otherwise prefer `wrap()` (see `sdk-wrap.md`): it has no extra network hop.

## Settings

| Setting | Value |
|---|---|
| Base URL | `https://llm.scorecard.io` (keep it in `SCORECARD_LLM_PROXY_URL`) |
| Header `x-scorecard-api-key` | the Scorecard API key |
| Header `x-scorecard-project-id` | the numeric project ID |
| Provider API key | unchanged, passed as the client's normal `api_key` |

## Python

```python
import os

from openai import OpenAI

client = OpenAI(
    base_url=os.environ.get("SCORECARD_LLM_PROXY_URL", "https://llm.scorecard.io"),
    default_headers={
        "x-scorecard-api-key": os.environ["SCORECARD_API_KEY"],
        "x-scorecard-project-id": os.environ["SCORECARD_PROJECT_ID"],
    },
)
```

## TypeScript

```typescript
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: process.env.SCORECARD_LLM_PROXY_URL ?? "https://llm.scorecard.io",
  defaultHeaders: {
    "x-scorecard-api-key": process.env.SCORECARD_API_KEY ?? "",
    "x-scorecard-project-id": process.env.SCORECARD_PROJECT_ID ?? "",
  },
});
```

## Gotchas

- Only OpenAI-compatible calls go through the proxy. For Anthropic's native client, use `wrap()`.
- If the app already sets a `base_url` (Azure OpenAI, a gateway, a local model), do not replace it. Use `wrap()` or OpenTelemetry instead.
- Streaming works through the proxy.
