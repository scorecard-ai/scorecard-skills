# Scorecard MCP server

The MCP server gives a coding agent two tools:

- `search_docs`: searches the Scorecard SDK docs.
- `execute`: runs TypeScript against a signed-in Scorecard SDK client. It can create projects, metrics, test sets, runs, and records.

## Remote server (recommended)

URL: `https://mcp.scorecard.io/mcp` (streamable HTTP). Sign-in is OAuth in the browser, so no API key is needed. Add it in the agent the user works in:

| Agent | How |
|---|---|
| Claude Code | Bundled with the Scorecard plugin. By hand: `claude mcp add --transport http scorecard https://mcp.scorecard.io/mcp`, then `/mcp` to sign in |
| Codex | `codex mcp add scorecard --url https://mcp.scorecard.io/mcp` |
| Gemini CLI | `gemini mcp add --transport http scorecard https://mcp.scorecard.io/mcp` |
| OpenCode | In `opencode.json`: `{ "mcp": { "scorecard": { "type": "remote", "url": "https://mcp.scorecard.io/mcp" } } }` |
| Cursor | In `.cursor/mcp.json`: `{ "mcpServers": { "scorecard": { "url": "https://mcp.scorecard.io/mcp" } } }` |
| Claude Desktop, claude.ai | Settings → Connectors → Add custom connector → the URL above |
| Others | Add a remote HTTP MCP server with the URL above |

For CI or a headless agent, send an API key instead of signing in: add the header `Authorization: Bearer <SCORECARD_API_KEY>` to the server entry. For example, in Claude Code:

```bash
claude mcp add --transport http scorecard https://mcp.scorecard.io/mcp \
  --header "Authorization: Bearer $SCORECARD_API_KEY"
```

## Local server

Runs on the user's machine with an API key. Any agent that takes a command-based MCP server:

```json
{
  "mcpServers": {
    "scorecard": {
      "command": "npx",
      "args": ["-y", "scorecard-ai-mcp@latest"],
      "env": { "SCORECARD_API_KEY": "ak_..." }
    }
  }
}
```

Claude Code: `claude mcp add scorecard --env SCORECARD_API_KEY="$SCORECARD_API_KEY" -- npx -y scorecard-ai-mcp@latest`.

## When to use MCP and when to write code

- Use MCP for one-off reads and fixes: "list my metrics", "rename this test set".
- Write code (the SDK) for anything the team should keep and re-run: metric definitions, test sets, eval runs. Code lives in the repo and is reviewed.
