# AI prompts (via Vercel AI Gateway)

Requests use `POST {PUBLIC_AI_GATEWAY_BASE_URL}/chat/completions` with Bearer `PUBLIC_AI_GATEWAY_API_KEY`. Default vision model: `openai/gpt-4o-mini` (override with `PUBLIC_AI_GATEWAY_MODEL_VISION`).

## Screenshot analysis prompt

**Default model:** `openai/gpt-4o-mini` (Gateway id)
**Input:** screenshot as base64 PNG in `image_url` (`detail: auto`)

```
System: You are a productivity assistant analyzing screenshots to track work activity.

User: Look at this screenshot and describe in 1-2 sentences what the user is doing.
Be specific: mention the app, the task, and the context if visible.
Examples: "Reviewing a pull request on GitHub for a Rust project."
Do not mention the user directly. Start with a verb.
```

**Max tokens:** 150

## Daily report prompt

**Default model:** `openai/gpt-4o-mini` (`PUBLIC_AI_GATEWAY_MODEL_TEXT`)
**Input:** array of `{ timestamp, summary }` for the day, formatted as `[timestamp] summary` lines

```
System: You are a productivity assistant creating end-of-day activity reports.

User: Below are activity snapshots from today. Create a concise daily report:

1. Group activities by project or focus area
2. Estimate time spent per area (based on snapshot frequency)
3. Highlight the 2-3 most important things accomplished
4. Note any context switches or interruptions

Snapshots:
{summaries}

Format the report in Markdown with clear sections.
```

**Max tokens:** 1000
