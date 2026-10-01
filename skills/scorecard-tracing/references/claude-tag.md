# Claude Tag (Claude in Slack)

Claude Tag runs in an Anthropic-hosted environment. There is no code to change. A Claude org admin sets env vars in the admin settings. You cannot do this from the repo, so give the user these steps.

Needs a Claude Team or Enterprise plan and a Claude org admin.

## Steps for the user

1. Open https://claude.ai/admin-settings/cloud-environments and create an Anthropic-hosted environment.
2. Set **Network access** so the environment can reach `tracing.scorecard.io`.
3. Add these env vars, one `KEY=value` per line (fill in the key and project ID):

   ```
   OTEL_EXPORTER_OTLP_HEADERS=Authorization=Bearer <SCORECARD_API_KEY>
   ENABLE_BETA_TRACING_DETAILED=1
   BETA_TRACING_ENDPOINT=https://tracing.scorecard.io/otel
   OTEL_LOG_USER_PROMPTS=1
   OTEL_LOG_TOOL_DETAILS=1
   OTEL_LOG_TOOL_CONTENT=1
   OTEL_RESOURCE_ATTRIBUTES=scorecard.project_id=<SCORECARD_PROJECT_ID>
   ```

4. Open https://claude.ai/admin-settings/claude-tag → Claude Tag's access → **Slack** tab → **Advanced** → **Environment**. Select the new environment.
5. Start a **new** thread and mention Claude. Threads that were already running keep the old environment.

## What they will see

Each Claude Tag session (channel, thread, DM, or routine) becomes one record on the Records page.

## Gotchas

- Setting the environment at workspace level traces every channel. Set it per channel to limit scope.
- Tell the user that prompts and tool content go to Scorecard with these settings. Drop the three `OTEL_LOG_*` lines to send timings only.
