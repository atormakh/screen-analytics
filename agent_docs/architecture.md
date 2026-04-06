# Architecture

## Data flow

```
[std::thread timer — every 3 min]
  └─ screenshot.rs → saves .png to disk via macOS `screencapture -x`
  └─ emits Tauri event: "snapshot-taken" { path, timestamp }
        │
        ▼
[Frontend — React 19 / Mantine / Rsbuild]
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
- **TS:** all network calls (AI Gateway, Notion). Keeps Rust layer thin.
- **No backend server.** AI Gateway: `fetch` in renderer. Notion: `@tauri-apps/plugin-http` (no CORS).
- **Styles:** Mantine 9 + Tailwind 4; `@tailwindcss/typography` for markdown in the daily report.

## Screenshot storage

- Path: `~/Library/Application Support/com.screendiary.app/screenshots/`
- Format: `.png`, named `YYYY-MM-DD_HH-mm-ss.png`
- Screenshots stay local — only the path + summary are written to Notion.

## Env variables


| Variable                                   | Used in                                             |
| ------------------------------------------ | --------------------------------------------------- |
| `PUBLIC_AI_GATEWAY_API_KEY`                | `src/lib/openai.ts` (Gateway OpenAI-compatible API) |
| `PUBLIC_AI_GATEWAY_BASE_URL`               | optional; default `https://ai-gateway.vercel.sh/v1` |
| `PUBLIC_AI_GATEWAY_MODEL_VISION` / `_TEXT` | optional model ids (e.g. `openai/gpt-4o-mini`)      |
| `PUBLIC_NOTION_API_KEY`                    | `src/lib/notion.ts`                                 |
| `PUBLIC_NOTION_DB_ID`                      | `src/lib/notion.ts`                                 |


