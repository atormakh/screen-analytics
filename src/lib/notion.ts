const NOTION_API_KEY = import.meta.env.PUBLIC_NOTION_API_KEY;
const NOTION_DB_ID = import.meta.env.PUBLIC_NOTION_DB_ID;

const NOTION_VERSION = "2022-06-28";

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
  const properties: Record<string, unknown> = {
    Name: { title: [{ text: { content: snapshot.title } }] },
    Summary: { rich_text: [{ text: { content: snapshot.summary } }] },
    Timestamp: { date: { start: snapshot.timestamp } },
    Path: { rich_text: [{ text: { content: snapshot.localPath } }] },
  };

  if (snapshot.tags?.length) {
    properties.Tags = {
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
    const err = await response.text();
    throw new Error(`Notion API error: ${err}`);
  }
}

export async function getSnapshots(
  date: string,
): Promise<
  { timestamp: string; summary: string; path: string; tags: string[] }[]
> {
  const response = await fetch(
    `https://api.notion.com/v1/databases/${NOTION_DB_ID}/query`,
    {
      method: "POST",
      headers: notionHeaders(),
      body: JSON.stringify({
        filter: {
          property: "Timestamp",
          date: { on_or_after: date, on_or_before: date },
        },
        sorts: [{ property: "Timestamp", direction: "ascending" }],
      }),
    },
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Notion API error: ${err}`);
  }

  const data = await response.json();

  return data.results.map((page: Record<string, any>) => ({
    timestamp: page.properties.Timestamp?.date?.start || "",
    summary: page.properties.Summary?.rich_text?.[0]?.text?.content || "",
    path: page.properties.Path?.rich_text?.[0]?.text?.content || "",
    tags:
      page.properties.Tags?.multi_select?.map((t: { name: string }) => t.name) || [],
  }));
}

export async function saveDailyReport(
  date: string,
  markdownContent: string,
): Promise<void> {
  const chunks = markdownContent.match(/.{1,2000}/gs) || [markdownContent];

  const response = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: notionHeaders(),
    body: JSON.stringify({
      parent: { database_id: NOTION_DB_ID },
      properties: {
        Name: { title: [{ text: { content: `Daily Report — ${date}` } }] },
        Summary: {
          rich_text: chunks.map((chunk) => ({ text: { content: chunk } })),
        },
        Timestamp: { date: { start: date } },
        Tags: { multi_select: [{ name: "daily-report" }] },
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Notion API error: ${err}`);
  }
}
