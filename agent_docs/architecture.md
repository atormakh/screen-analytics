# Architecture

## Data flow

```
[std::thread timer — every 3 min]
  └─ screenshot.rs → saves .png to disk via macOS `screencapture -x`
  └─ emits Tauri event: "snapshot-taken" { path, timestamp }
        │
        ▼
[Frontend — React/TS]
  └─ listen("snapshot-taken")
  └─ openai.ts → analyzeScreenshot(path) → summary string
  └─ notion.ts → saveSnapshot({ timestamp, summary, localPath })
        │
        ▼
[Notion DB — one row per snapshot]
  └─ fields: Name (title) | Summary (text) | Timestamp (date) | Path (text) | Tags (multi-select)
```

## Boundaries

- **Rust:** capture screen, save file, emit event. Never calls OpenAI or Notion.
- **TS:** all network calls (OpenAI, Notion). Keeps Rust layer thin.
- **No backend server.** All API calls go directly from the Tauri renderer via `fetch()`.

## Screenshot storage

- Path: `~/Library/Application Support/com.screenly.app/screenshots/`
- Format: `.png`, named `YYYY-MM-DD_HH-mm-ss.png`
- Screenshots stay local — only the path + summary are written to Notion.

## Env variables

| Variable | Used in |
|---|---|
| `PUBLIC_OPENAI_API_KEY` | `src/lib/openai.ts` |
| `PUBLIC_NOTION_API_KEY` | `src/lib/notion.ts` |
| `PUBLIC_NOTION_DB_ID` | `src/lib/notion.ts` |
