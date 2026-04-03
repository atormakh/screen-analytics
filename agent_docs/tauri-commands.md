# Tauri Commands

## Existing commands (src-tauri/src/commands.rs)

```rust
#[tauri::command]
pub fn take_screenshot(app: AppHandle) -> Result<SnapshotPayload, String>
// Captures screen, saves .png, emits "snapshot-taken" event, returns { path, timestamp }
// TS: invoke('take_screenshot')

#[tauri::command]
pub fn get_screenshots_dir(app: AppHandle) -> Result<String, String>
// Returns absolute path to screenshots directory
// TS: invoke('get_screenshots_dir')
```

## Adding a new command

1. Add `#[tauri::command]` fn to `commands.rs`
2. Register in `main.rs` → `tauri::generate_handler![..., your_command]`
3. Call from TS: `invoke('your_command', { arg })`

## Rust → TS events (scheduler pattern)

```rust
// Rust — emit after each screenshot
app.emit("snapshot-taken", SnapshotPayload { path, timestamp })
```

```typescript
// TS — listen at app startup
import { listen } from '@tauri-apps/api/event'

await listen<{ path: string; timestamp: string }>('snapshot-taken', (e) => {
  const { path, timestamp } = e.payload
  // → analyzeScreenshot(path)
})
```

## Reading files from TS (for OpenAI base64 upload)

```typescript
import { readFile } from '@tauri-apps/plugin-fs'

const bytes = await readFile(absolutePath)  // Uint8Array
// Convert to base64 via FileReader for large files
```

## Required Tauri capabilities

Configured in `src-tauri/capabilities/default.json`:
- `core:default` — basic Tauri functionality
- `core:event:default` — event listening
- `fs:default` — file system operations
- `fs:allow-read-file` (scoped to `$APPDATA/**`) — read screenshot files
