# Screendiary



A **macOS** desktop app ([Tauri](https://tauri.app/) + React) that captures a fullscreen screenshot **every 3 minutes**, sends it to a **vision-capable model** via the [Vercel AI Gateway](https://vercel.com/docs/ai-gateway), and stores **short text summaries** in **Notion**—one row per capture. You also get an **end-of-day AI report** built from that day’s snapshots.

Screenshots stay on your machine; Notion only receives the summary text and the local file path (see [Privacy](#privacy)).

**UI:** [Mantine](https://mantine.dev/) 9, [Tailwind CSS](https://tailwindcss.com/) 4 + [@tailwindcss/typography](https://github.com/tailwindlabs/tailwindcss-typography), [Rsbuild](https://rsbuild.rs/).

---

## Requirements

- **macOS** (the capture path uses the system `screencapture` CLI)
- [Bun](https://bun.sh/)
- [Rust](https://www.rust-lang.org/tools/install) (stable) and **Xcode Command Line Tools** (Tauri will prompt if something is missing)

---

## Quick start (development)

```bash
bun install
cp .env.example .env
# Edit .env: AI Gateway key + Notion integration (see below)
bun tauri dev
```

With valid keys, the app will analyze new captures and write to Notion. For how data moves through the app, see `[agent_docs/architecture.md](agent_docs/architecture.md)`.

---

## Configuration

### Vercel AI Gateway

1. Create an API key in the [Vercel dashboard](https://vercel.com/) (AI Gateway).
2. Set `PUBLIC_AI_GATEWAY_API_KEY` in `.env`.

Optional overrides (see `.env.example`):

- `PUBLIC_AI_GATEWAY_BASE_URL` — defaults to `https://ai-gateway.vercel.sh/v1`
- `PUBLIC_AI_GATEWAY_MODEL_VISION` / `PUBLIC_AI_GATEWAY_MODEL_TEXT` — model IDs (OpenAI-compatible names, e.g. `google/gemini-3-flash`)

### Notion

1. **Create a Notion database** (table) with these properties (names can be customized via env—defaults shown):

  | Property    | Type                                                                    |
  | ----------- | ----------------------------------------------------------------------- |
  | `Name`      | Title                                                                   |
  | `Summary`   | Rich text                                                               |
  | `Timestamp` | Date                                                                    |
  | `Path`      | Rich text                                                               |
  | `Tags`      | Multi-select (optional; set `PUBLIC_NOTION_SKIP_TAGS=1` if you omit it) |

2. **Create a Notion integration** at [notion.so/my-integrations](https://www.notion.so/my-integrations), copy the **Internal Integration Secret** → `PUBLIC_NOTION_API_KEY`.
3. **Share the database** with that integration (⋯ on the database → *Connections* / *Add connections*).
4. Copy the database ID from the database URL (`https://www.notion.so/workspace/**long-id-here**?v=...`) → `PUBLIC_NOTION_DB_ID`.

Details and API shapes: `[agent_docs/notion-schema.md](agent_docs/notion-schema.md)`.

---

## Privacy

- Captures are saved under  
`~/Library/Application Support/com.screendiary.app/screenshots/`  
as `.png` files.
- **Notion** stores: title, summary text, timestamp, and the **absolute local path** to the screenshot—not the image bytes.
- You are responsible for API keys, Notion access, and who can open your Notion workspace.

---

## Build a distributable Mac app

```bash
bun install
cp .env.example .env   # fill keys if you want them baked into the UI build
bun tauri build
```

Typical outputs:

- **App bundle:** `src-tauri/target/release/bundle/macos/Screendiary.app`
- **Disk image:** `src-tauri/target/release/bundle/dmg/Screendiary_*.dmg`

Open **Screendiary.app** from Finder or drag it to **Applications**.

- **Other Macs / Gatekeeper:** for downloads without scary warnings you need an **Apple Developer** account, **code signing**, and **notarization**. See [Tauri — macOS code signing](https://v2.tauri.app/distribute/sign-macos/).
- **Unsigned local builds:** you can often run them on your machine with **right-click → Open** the first time.

**Important:** `PUBLIC_`* variables are embedded at **frontend build** time. Change `.env` and run `bun tauri build` again if you rotate keys.

---

## Scripts


| Command           | Purpose                    |
| ----------------- | -------------------------- |
| `bun tauri dev`   | Run the app in development |
| `bun tauri build` | Production macOS bundle    |
| `bun run build`   | Frontend only (Rsbuild)    |


---

## Agent / contributor context

`[CLAUDE.md](CLAUDE.md)` and `[agent_docs/](agent_docs/)` describe commands, prompts, and schema for automation-friendly work on the repo.