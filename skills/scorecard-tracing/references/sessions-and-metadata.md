# Sessions, metadata, and tags

## Sessions: one record per conversation

A chat agent handles several turns per conversation. Give every trace in a conversation the same session ID, and Scorecard merges them into one record.

Scorecard reads the first of these it finds:

1. Span attribute `session.id` (Claude Code and the Claude Agent SDK set this for you)
2. Resource attribute `scorecard.session_id`
3. Span attribute `scorecard.session_id`

Set it on the root span of each turn. Use the app's existing conversation or thread ID.

```python
with tracer.start_as_current_span("agent.turn") as span:
    span.set_attribute("session.id", conversation_id)
    ...
```

```typescript
tracer.startActiveSpan("agent.turn", async (span) => {
  span.setAttribute("session.id", conversationId);
  // ...
  span.end();
});
```

With Traceloop, do the same: `Traceloop.init` registers the global tracer provider, so `trace.get_tracer(...)` spans nest the framework spans under them. Do not use Traceloop association properties for this; they are saved under a `traceloop.association.properties.` prefix that Scorecard does not read as a session ID.

## Metadata

Any span or resource attribute that starts with `scorecard.` is saved as record metadata, with the prefix removed. Examples:

| Attribute | Saved as |
|---|---|
| `scorecard.user_id` | `user_id` |
| `scorecard.env` | `env` |

Do not put secrets or personal data in metadata unless the user agrees.

## Tags

Tags let users filter records.

- `scorecard.tags`: a comma-separated list, for example `beta,mobile`
- `scorecard.tag.<name>`: set to `true` to add the tag `<name>`

## Group traces into one run

To group separate traces (for example a batch job) into one run, give them the same `scorecard.tracing_group_id` span or resource attribute.
