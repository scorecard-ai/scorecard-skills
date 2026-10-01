---
name: scorecard-setup
description: Connect a repo to Scorecard. Gets and checks the Scorecard API key, picks or creates a Scorecard project, and writes SCORECARD_API_KEY and SCORECARD_PROJECT_ID to the env file. Also connects the Scorecard MCP server. Use when the user asks to log in, connect, or pick a Scorecard project, and before any other Scorecard step.
---

# Connect to Scorecard

Files named `references/<file>.md` below sit next to this `SKILL.md`, in the skill's own folder, not in the user's repo. Read them from there.

## 1. API key

1. Look for `SCORECARD_API_KEY` in the shell env, then in the repo's env files (`.env`, `.env.local`, `.env.development`).
2. If there is none, ask the user to create one at https://app.scorecard.io/settings ("Scorecard API Keys"). Tell them:
   - Only org admins can create keys.
   - The key starts with `ak_` and is shown once.
   - They can paste it, or set it in the env file themselves.
3. Never echo the key back, print it, or put it in a code file or commit.

## 2. Check the key

List projects. A `200` means the key works. A `401` means the key is wrong or revoked.

```bash
curl -sS -w '\n%{http_code}\n' "${SCORECARD_BASE_URL:-https://api2.scorecard.io/api/v2}/projects" \
  -H "Authorization: Bearer $SCORECARD_API_KEY"
```

`SCORECARD_BASE_URL` is only set for staging or self-hosted Scorecard. Leave it unset for normal use.

## 3. Pick a project

A project holds one agent's traces, metrics, test sets, and runs.

- If the list has a project that matches this agent, ask the user to confirm it.
- Otherwise create one named after the repo or agent:

```bash
curl -sS "${SCORECARD_BASE_URL:-https://api2.scorecard.io/api/v2}/projects" \
  -H "Authorization: Bearer $SCORECARD_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"name": "<agent name>", "description": "<one line about the agent>"}'
```

The response has `id`, a numeric string such as `"314"`. That is `SCORECARD_PROJECT_ID`.

Why this matters: traces without a valid project ID go to the org's oldest project, not to this one.

## 4. Write the env file

Add to the env file the repo already uses (create `.env` if none, and make sure it is in `.gitignore`):

```bash
SCORECARD_API_KEY=ak_...
SCORECARD_PROJECT_ID=314
```

If the repo has an example env file (`.env.example`, `.env.sample`), add both names there with empty values.

## 5. Install the SDK (only if a later step needs it)

| Language | Command |
|---|---|
| Python | `pip install scorecard-ai` (add `[otel]` for tracing wrappers) |
| TypeScript / JavaScript | `npm install scorecard-ai` |
| Go | `go get github.com/scorecard-ai/scorecard-go` |

Use the repo's package manager (`uv add`, `poetry add`, `pnpm add`, `yarn add`, `bun add`). If you write versions into a manifest by hand, use at least `scorecard-ai>=3.9` (Python) and `^3.4.0` (TypeScript). Do not guess older versions.

## 6. MCP server (optional)

The Scorecard MCP server lets a coding agent read and change Scorecard data directly. The Claude Code plugin bundles it; other agents add it in one command. See `references/mcp.md` to connect it by hand or in other editors.

## Done when

- The project list call returns `200`.
- `SCORECARD_PROJECT_ID` is set and the project exists.
- The key is only in ignored env files.
