# Scorecard MCP server

Two ways to run it. Both give the coding agent two tools:

- `search_docs`: searches the Scorecard SDK docs.
- `execute`: runs TypeScript against a signed-in Scorecard SDK client. It can create projects, metrics, test sets, runs, and records.

## Remote server (recommended)

URL: `https://mcp.scorecard.io/mcp` (streamable HTTP). Sign-in uses OAuth in the browser. No API key is needed.

This plugin already bundles it. To add it by hand:

| Client | How |
|---|---|
| Claude Code | `claude mcp add --transport http scorecard https://mcp.scorecard.io/mcp`, then run `/mcp` and sign in |
| Claude Desktop / claude.ai | Settings → Connectors → Add custom connector → `https://mcp.scorecard.io/mcp` |
| Cursor, Windsurf, VS Code, Codex | Add a remote HTTP MCP server with the same URL |

Check it in Claude Code:

```bash
claude mcp list
# scorecard: https://mcp.scorecard.io/mcp (HTTP) - ✓ Connected
```

The remote server also accepts an API key instead of OAuth, which suits CI or headless agents:

```bash
claude mcp add --transport http scorecard https://mcp.scorecard.io/mcp \
  --header "Authorization: Bearer $SCORECARD_API_KEY"
```

## Local server

Runs on the user's machine and uses an API key.

```bash
claude mcp add scorecard --env SCORECARD_API_KEY="$SCORECARD_API_KEY" -- npx -y scorecard-ai-mcp@latest
```

Other clients:

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

## When to use MCP and when to write code

- Use MCP for one-off reads and fixes: "list my metrics", "rename this test set".
- Write code (the SDK) for anything the team should keep and re-run: metric definitions, test sets, eval runs. Code lives in the repo and is reviewed.
