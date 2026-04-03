import { readFile } from "@tauri-apps/plugin-fs";
import { logError, logInfo, logSuccess } from "./activityLog";
import { formatUnknownError, truncateDetail } from "./errors";

const AI_GATEWAY_KEY = import.meta.env.PUBLIC_AI_GATEWAY_API_KEY;
const AI_GATEWAY_BASE =
  import.meta.env.PUBLIC_AI_GATEWAY_BASE_URL?.replace(/\/$/, "") ||
  "https://ai-gateway.vercel.sh/v1";
/** Default: Gemini 3 Flash (fast / low cost, vision-capable via AI Gateway). Override with PUBLIC_AI_GATEWAY_MODEL_VISION. */
const MODEL_VISION =
  import.meta.env.PUBLIC_AI_GATEWAY_MODEL_VISION || "google/gemini-3-flash";
/** Default: same family for daily report text. Override with PUBLIC_AI_GATEWAY_MODEL_TEXT. */
const MODEL_TEXT =
  import.meta.env.PUBLIC_AI_GATEWAY_MODEL_TEXT || "google/gemini-3-flash";

function assertGatewayKey(): void {
  if (!AI_GATEWAY_KEY?.trim()) {
    const msg =
      "PUBLIC_AI_GATEWAY_API_KEY is empty. Add your AI Gateway key to .env and restart `bun tauri dev`.";
    logError("ai-gateway", "Missing AI Gateway API key", msg);
    throw new Error(msg);
  }
}

function chatCompletionsUrl(): string {
  return `${AI_GATEWAY_BASE}/chat/completions`;
}

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
  assertGatewayKey();
  logInfo("ai-gateway", "Vision request started", `file: ${path}`);

  let bytes: Uint8Array;
  try {
    bytes = await readFile(path);
  } catch (e) {
    const d = truncateDetail(formatUnknownError(e));
    logError("ai-gateway", "Could not read screenshot file for upload", d);
    throw e;
  }

  logInfo(
    "ai-gateway",
    `Image loaded → AI Gateway chat/completions (${MODEL_VISION})`,
    `${bytes.byteLength} bytes → base64`,
  );

  const base64 = await toBase64(bytes);

  const response = await fetch(chatCompletionsUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI_GATEWAY_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL_VISION,
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
              image_url: {
                url: `data:image/png;base64,${base64}`,
                detail: "auto",
              },
            },
          ],
        },
      ],
      max_tokens: 150,
    }),
  });

  if (!response.ok) {
    const err = truncateDetail(await response.text());
    const msg = `HTTP ${response.status} ${response.statusText}`;
    logError("ai-gateway", "AI Gateway rejected the vision request", `${msg}\n${err}`);
    throw new Error(`AI Gateway error: ${msg} — ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content as string | undefined;
  if (!content?.trim()) {
    logError(
      "ai-gateway",
      "Unexpected response shape (no choices[0].message.content)",
      truncateDetail(JSON.stringify(data)),
    );
    throw new Error("AI Gateway returned an empty summary");
  }

  logSuccess(
    "ai-gateway",
    "Vision summary received",
    truncateDetail(content, 500),
  );
  return content;
}

export async function generateDailyReport(
  snapshots: { timestamp: string; summary: string }[],
): Promise<string> {
  assertGatewayKey();
  logInfo(
    "ai-gateway",
    "Daily report request (text-only) via AI Gateway",
    `model: ${MODEL_TEXT} · ${snapshots.length} summaries`,
  );

  const summaries = snapshots
    .map((s) => `[${s.timestamp}] ${s.summary}`)
    .join("\n");

  const response = await fetch(chatCompletionsUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI_GATEWAY_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL_TEXT,
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
    const err = truncateDetail(await response.text());
    const msg = `HTTP ${response.status} ${response.statusText}`;
    logError(
      "ai-gateway",
      "AI Gateway rejected the daily report request",
      `${msg}\n${err}`,
    );
    throw new Error(`AI Gateway error: ${msg} — ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content as string | undefined;
  if (!content?.trim()) {
    logError(
      "ai-gateway",
      "Daily report: empty content",
      truncateDetail(JSON.stringify(data)),
    );
    throw new Error("AI Gateway returned an empty report");
  }

  logSuccess(
    "ai-gateway",
    "Daily report text received",
    `${content.length} characters`,
  );
  return content;
}
