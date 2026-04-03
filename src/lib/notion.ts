import { fetch } from "@tauri-apps/plugin-http";

import { logError, logInfo, logSuccess } from "./activityLog";
import { truncateDetail } from "./errors";

const NOTION_API_KEY = import.meta.env.PUBLIC_NOTION_API_KEY;
const NOTION_DB_ID = import.meta.env.PUBLIC_NOTION_DB_ID;

/** Must match the exact column names in your Notion database. */
const PROP_NAME =
  import.meta.env.PUBLIC_NOTION_PROP_NAME?.trim() || "Name";
const PROP_SUMMARY =
  import.meta.env.PUBLIC_NOTION_PROP_SUMMARY?.trim() || "Summary";
const PROP_TIMESTAMP =
  import.meta.env.PUBLIC_NOTION_PROP_TIMESTAMP?.trim() || "Timestamp";
const PROP_PATH =
  import.meta.env.PUBLIC_NOTION_PROP_PATH?.trim() || "Path";
const PROP_TAGS =
  import.meta.env.PUBLIC_NOTION_PROP_TAGS?.trim() || "Tags";
/** Set to `1` if your database has no Tags (multi-select) column. */
const SKIP_NOTION_TAGS =
  import.meta.env.PUBLIC_NOTION_SKIP_TAGS === "1" ||
  import.meta.env.PUBLIC_NOTION_SKIP_TAGS === "true";

const NOTION_VERSION = "2022-06-28";

function assertNotionConfig(): void {
  const missing: string[] = [];
  if (!NOTION_API_KEY?.trim()) missing.push("PUBLIC_NOTION_API_KEY");
  if (!NOTION_DB_ID?.trim()) missing.push("PUBLIC_NOTION_DB_ID");
  if (missing.length) {
    const msg = `Missing env: ${missing.join(", ")}. Set them in .env and restart the app.`;
    logError("notion", "Notion is not configured", msg);
    throw new Error(msg);
  }
}

function notionHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${NOTION_API_KEY}`,
    "Notion-Version": NOTION_VERSION,
  };
}

export async function saveSnapshot(snapshot: {
  title: string;
  summary: string;
  timestamp: string;
  localPath: string;
  tags?: string[];
}): Promise<void> {
  assertNotionConfig();
  logInfo(
    "notion",
    "Creating Notion page (snapshot)",
    `title: ${snapshot.title}`,
  );

  const properties: Record<string, unknown> = {
    [PROP_NAME]: { title: [{ text: { content: snapshot.title } }] },
    [PROP_SUMMARY]: { rich_text: [{ text: { content: snapshot.summary } }] },
    [PROP_TIMESTAMP]: { date: { start: snapshot.timestamp } },
    [PROP_PATH]: { rich_text: [{ text: { content: snapshot.localPath } }] },
  };

  if (!SKIP_NOTION_TAGS && snapshot.tags?.length) {
    properties[PROP_TAGS] = {
      multi_select: snapshot.tags.map((t) => ({ name: t })),
    };
  }

  const response = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: notionHeaders(),
    body: JSON.stringify({
      parent: { database_id: NOTION_DB_ID },
      properties,
    }),
  });

  if (!response.ok) {
    const err = truncateDetail(await response.text());
    const msg = `HTTP ${response.status} ${response.statusText}`;
    logError("notion", "Failed to create Notion page for snapshot", `${msg}\n${err}`);
    throw new Error(`Notion API error: ${msg} — ${err}`);
  }

  const body = await response.json();
  const pageId = (body as { id?: string }).id;
  logSuccess(
    "notion",
    "Snapshot saved to Notion",
    pageId ? `page id: ${pageId}` : "page created",
  );
}

export async function getSnapshots(
  date: string,
): Promise<
  { timestamp: string; summary: string; path: string; tags: string[] }[]
> {
  assertNotionConfig();
  logInfo("notion", "Querying Notion database for day", `date: ${date}`);

  const response = await fetch(
    `https://api.notion.com/v1/databases/${NOTION_DB_ID}/query`,
    {
      method: "POST",
      headers: notionHeaders(),
      body: JSON.stringify({
        filter: {
          property: PROP_TIMESTAMP,
          date: { on_or_after: date, on_or_before: date },
        },
        sorts: [{ property: PROP_TIMESTAMP, direction: "ascending" }],
      }),
    },
  );

  if (!response.ok) {
    const err = truncateDetail(await response.text());
    const msg = `HTTP ${response.status} ${response.statusText}`;
    logError("notion", "Failed to query Notion database", `${msg}\n${err}`);
    throw new Error(`Notion API error: ${msg} — ${err}`);
  }

  const data = await response.json();
  const results = data.results as unknown[] | undefined;
  const n = results?.length ?? 0;
  logSuccess("notion", "Notion query completed", `${n} row(s) for ${date}`);

  return data.results.map((page: Record<string, any>) => {
    const props = page.properties ?? {};
    return {
      timestamp: props[PROP_TIMESTAMP]?.date?.start || "",
      summary: props[PROP_SUMMARY]?.rich_text?.[0]?.text?.content || "",
      path: props[PROP_PATH]?.rich_text?.[0]?.text?.content || "",
      tags:
        props[PROP_TAGS]?.multi_select?.map((t: { name: string }) => t.name) ||
        [],
    };
  });
}

export async function saveDailyReport(
  date: string,
  markdownContent: string,
): Promise<void> {
  assertNotionConfig();
  logInfo("notion", "Saving daily report to Notion", `date: ${date}`);

  const chunks = markdownContent.match(/.{1,2000}/gs) || [markdownContent];

  const response = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: notionHeaders(),
    body: JSON.stringify({
      parent: { database_id: NOTION_DB_ID },
      properties: {
        [PROP_NAME]: { title: [{ text: { content: `Daily Report — ${date}` } }] },
        [PROP_SUMMARY]: {
          rich_text: chunks.map((chunk) => ({ text: { content: chunk } })),
        },
        [PROP_TIMESTAMP]: { date: { start: date } },
        ...(SKIP_NOTION_TAGS
          ? {}
          : {
              [PROP_TAGS]: { multi_select: [{ name: "daily-report" }] },
            }),
      },
    }),
  });

  if (!response.ok) {
    const err = truncateDetail(await response.text());
    const msg = `HTTP ${response.status} ${response.statusText}`;
    logError("notion", "Failed to save daily report page", `${msg}\n${err}`);
    throw new Error(`Notion API error: ${msg} — ${err}`);
  }

  logSuccess("notion", "Daily report page created in Notion", `date: ${date}`);
}
