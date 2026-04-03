# CLAUDE.md

## WHY

Screenly is a Mac desktop app that captures a screenshot every 3 minutes and uses AI vision to summarize what the user was doing. At end of day, summaries are aggregated into a daily activity report. All data stays local; only summaries are written to Notion.

## WHAT

**Stack:**

- `src-tauri/` — Rust: screenshot capture (macOS `screencapture` CLI), 3-min scheduler (std::thread), Tauri commands
- `src/` — React + TypeScript: UI (timeline, daily report), API calls to OpenAI and Notion
- Storage: screenshots saved locally at `~/Library/Application Support/com.screenly.app/screenshots/`
- DB: Notion API (one row per snapshot: timestamp, summary, local path)
- AI: OpenAI GPT-4o mini Vision API

**Key files:**

- `src-tauri/src/commands.rs` — Tauri commands exposed to frontend via `invoke()`
- `src-tauri/src/scheduler.rs` — Background timer, fires every 3 min
- `src-tauri/src/screenshot.rs` — Captures screen via `screencapture -x`, saves `.png` to disk
- `src/lib/openai.ts` — `analyzeScreenshot(path) → string` and `generateDailyReport(snapshots) → string`
- `src/lib/notion.ts` — `saveSnapshot(...)`, `getSnapshots(date)`, `saveDailyReport(date, markdown)`
- `src/components/Timeline.tsx` — Main UI view with vertical timeline
- `src/components/DailyReport.tsx` — End-of-day AI summary modal

## HOW

**Setup:**

```bash
# from repository root (this folder)
bun install
cp .env.example .env  # fill PUBLIC_OPENAI_API_KEY, PUBLIC_NOTION_API_KEY, PUBLIC_NOTION_DB_ID
```

**Run dev:**

```bash
bun tauri dev
```

**Build:**

```bash
bun tauri build
```

**Typecheck:**

```bash
bun tsc --noEmit
```

**Rust check:**

```bash
cd src-tauri && cargo check
```

## Agent docs

Before starting a task, read any of the following that are relevant:


| File                           | When to read                                                 |
| ------------------------------ | ------------------------------------------------------------ |
| `agent_docs/architecture.md`   | Understanding data flow between Rust, TS, OpenAI, and Notion |
| `agent_docs/tauri-commands.md` | Adding or modifying Rust↔TS command bridge                   |
| `agent_docs/notion-schema.md`  | Notion DB schema: field names, types, expected values        |
| `agent_docs/openai-prompts.md` | Prompt templates for screenshot analysis and daily report    |


