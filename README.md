# Screen Analytics (Screenly)

Mac desktop app (Tauri + React) that captures a screenshot every few minutes, summarizes activity with OpenAI vision, and syncs summaries to Notion. Includes an end-of-day AI report.

## Quick start

```bash
bun install
cp .env.example .env
bun tauri dev
```

See `CLAUDE.md` and `agent_docs/` for architecture and agent context.
