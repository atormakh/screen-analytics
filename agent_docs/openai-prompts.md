# AI prompts (via Vercel AI Gateway)

Requests use `POST {PUBLIC_AI_GATEWAY_BASE_URL}/chat/completions` with Bearer `PUBLIC_AI_GATEWAY_API_KEY`. Default vision model: `google/gemini-3-flash` (override with `PUBLIC_AI_GATEWAY_MODEL_VISION`).

## Screenshot analysis prompt

**Default model:** `google/gemini-3-flash` (Gateway id)
**Input:** screenshot as base64 PNG in `image_url` (`detail: high`)

```
System: You are a productivity assistant that analyzes screenshots to create a detailed activity log. Your summaries will be aggregated into a daily report, so they must be specific and information-rich — capturing exactly what was being worked on, in which app, on which project, and any other visible context. Never be vague or generic.

User: Analyze this screenshot in detail. Write 2-4 sentences describing the activity.

Include ALL of the following that are visible:
- The application or website in use (name it precisely)
- The specific task or action happening
- Project or file names, repo names, branch names, document titles visible in tabs or title bars
- Key content on screen: code being written, message being typed, article being read, form being filled
- Any secondary context: other visible tabs, sidebar items, terminal output, notifications

Be concrete and information-dense. Prefer specifics over generalities.
BAD: "Working in a code editor."
GOOD: "Editing the analyzeScreenshot function in src/lib/openai.ts within VS Code, modifying the prompt template for the Screendiary project. A terminal panel is open showing a running dev server."

Do not mention the user directly. Start with a verb in present progressive.

## Tags (3-7 tags, lowercase kebab-case)
Generate specific, multi-dimensional tags from these categories:
1. **App**: the exact app or site (e.g. "vscode", "cursor", "chrome", "slack", "figma")
2. **Activity**: what's being done (e.g. "coding", "debugging", "code-review", "reading-docs")
3. **Project/repo**: the project name if visible (e.g. "screendiary", "my-api")
4. **Technology**: languages or frameworks visible (e.g. "typescript", "rust", "react")
5. **Domain**: area of work (e.g. "frontend", "backend", "devops", "design")
```

**Response format:** `{ type: "json_object" }` — returns `{ "summary": "...", "tags": ["...", ...] }`

**Max tokens:** 500

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
