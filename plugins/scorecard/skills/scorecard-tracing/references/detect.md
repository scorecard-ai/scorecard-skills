# Pick a tracing method

Read the manifest files first: `package.json`, `pyproject.toml`, `requirements*.txt`, `uv.lock`, `poetry.lock`, `go.mod`, `pom.xml`, `build.gradle*`, `*.csproj`, `Cargo.toml`. Then grep the source for imports.

Go down the table. Take the **first** row that matches. Frameworks come before raw provider clients, because a framework calls the client for you.

| # | You find | Method | Reference |
|---|---|---|---|
| 1 | `claude-agent-sdk` / `claude_agent_sdk` (Python) or `@anthropic-ai/claude-agent-sdk` (TS), or the agent shells out to the `claude` CLI | Claude Agent SDK env vars | `claude-agent-sdk.md` |
| 2 | The "agent" is Claude in Slack (Claude Tag) and there is no code | Claude Tag | `claude-tag.md` |
| 3 | `ai` plus any `@ai-sdk/*` package (TS) | `wrapAISDK()` | `vercel-ai-sdk.md` |
| 4 | `langchain*`, `langgraph`, `llama-index*` / `llama_index`, `crewai`, `haystack-ai`, `litellm`, `openai-agents` (Python) | Traceloop | `traceloop.md` |
| 5 | `langchain`, `@langchain/*`, `llamaindex` (TS) | Traceloop (TS) | `traceloop.md` |
| 6 | Already has `traceloop-sdk` or `@traceloop/node-server-sdk` | Traceloop, point it at Scorecard | `traceloop.md` |
| 7 | Already has an OTel `TracerProvider` (`opentelemetry-sdk`, `@opentelemetry/sdk-trace-*`) | Add a Scorecard exporter | `opentelemetry.md` |
| 8 | `openai` or `anthropic` (Python), `openai` or `@anthropic-ai/sdk` (TS), called directly | `wrap()` | `sdk-wrap.md` |
| 9 | Go, Java, .NET, Rust, Ruby, or raw HTTP calls to an LLM | OpenTelemetry | `opentelemetry.md` |
| 10 | The user wants no new dependency, and the app uses an OpenAI-compatible client | LLM proxy | `llm-proxy.md` |

## Tie-breaks

- **Two frameworks** (for example LangChain calling OpenAI): pick the framework. Traceloop traces both layers.
- **Python OpenAI Agents SDK** (`openai-agents`): Traceloop with its OpenAI Agents instrumentation.
- **Wrap vs proxy:** prefer `wrap()`. The proxy adds a network hop and only covers OpenAI-compatible calls. Use it when the user cannot add a dependency or cannot change code beyond a base URL.
- **Nothing matches:** ask the user how the agent calls its model. Then use `opentelemetry.md`.

## Tell the user

One line: the method and the reason. Example: "Found `langchain-openai` in pyproject.toml, so I'll use Traceloop. It traces LangChain and the OpenAI calls under it."
