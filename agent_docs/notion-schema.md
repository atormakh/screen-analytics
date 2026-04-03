# Notion DB Schema

## Database: Screenly Snapshots

| Property | Type | Notes |
|---|---|---|
| `Name` | Title | Auto: `YYYY-MM-DD HH:mm` |
| `Summary` | Rich text | AI-generated activity description |
| `Timestamp` | Date | Exact capture datetime (ISO 8601) |
| `Path` | Rich text | Absolute local path to `.png` file |
| `Tags` | Multi-select | Optional: auto-tagged by AI (e.g. "coding", "email") |

## saveSnapshot() call shape

```typescript
await saveSnapshot({
  title: '2026-04-02 10:03',
  summary: 'Reviewing a pull request on GitHub for a Rust project.',
  timestamp: '2026-04-02T10:03:00-03:00',
  localPath: '/Users/agus/Library/Application Support/com.screenly.app/screenshots/2026-04-02_10-03-00.png',
  tags: ['coding', 'github']
})
```

## getSnapshots() — query pattern

```typescript
// Filter by date range (single day) in Notion API:
filter: {
  property: 'Timestamp',
  date: { on_or_after: '2026-04-02', on_or_before: '2026-04-02' }
}
```

## saveDailyReport() — creates a special page

```typescript
await saveDailyReport('2026-04-02', markdownContent)
// Creates a page with Name: "Daily Report — 2026-04-02"
// Tags: ["daily-report"]
```
