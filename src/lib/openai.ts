import { readFile } from "@tauri-apps/plugin-fs";

const OPENAI_API_KEY = import.meta.env.PUBLIC_OPENAI_API_KEY;

async function toBase64(bytes: Uint8Array): Promise<string> {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const blob = new Blob([buffer]);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function analyzeScreenshot(path: string): Promise<string> {
  const bytes = await readFile(path);
  const base64 = await toBase64(bytes);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a productivity assistant analyzing screenshots to track work activity.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Look at this screenshot and describe in 1-2 sentences what the user is doing.
Be specific: mention the app, the task, and the context if visible.
Examples: "Reviewing a pull request on GitHub for a Rust project."
Do not mention the user directly. Start with a verb.`,
            },
            {
              type: "image_url",
              image_url: { url: `data:image/png;base64,${base64}` },
            },
          ],
        },
      ],
      max_tokens: 150,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error: ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function generateDailyReport(
  snapshots: { timestamp: string; summary: string }[],
): Promise<string> {
  const summaries = snapshots
    .map((s) => `[${s.timestamp}] ${s.summary}`)
    .join("\n");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a productivity assistant creating end-of-day activity reports.",
        },
        {
          role: "user",
          content: `Below are activity snapshots from today. Create a concise daily report:

1. Group activities by project or focus area
2. Estimate time spent per area (based on snapshot frequency)
3. Highlight the 2-3 most important things accomplished
4. Note any context switches or interruptions

Snapshots:
${summaries}

Format the report in Markdown with clear sections.`,
        },
      ],
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error: ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
