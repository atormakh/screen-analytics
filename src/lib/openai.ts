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

export interface ScreenshotAnalysis {
  summary: string;
  tags: string[];
}

export async function analyzeScreenshot(path: string): Promise<ScreenshotAnalysis> {
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
          content: `You are a productivity assistant that analyzes screenshots to create a detailed activity log. Your summaries will be aggregated into a daily report, so they must be specific and information-rich — capturing exactly what was being worked on, in which app, on which project, and any other visible context. Never be vague or generic.

You MUST respond with valid JSON matching this schema:
{
  "summary": "2-4 sentence description of the activity",
  "tags": ["tag1", "tag2", "tag3", ...]
}`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this screenshot in detail. Respond with a JSON object containing "summary" and "tags".

## Summary (2-4 sentences)
Include ALL of the following that are visible:
- The application or website in use (name it precisely)
- The specific task or action happening (e.g. writing code, reading docs, reviewing a PR, chatting, browsing)
- Project or file names, repo names, branch names, document titles visible in tabs or title bars
- Key content on screen: code being written, message being typed, article being read, form being filled
- Any secondary context: other visible tabs, sidebar items, terminal output, notifications

Be concrete and information-dense. Prefer specifics over generalities.
BAD: "Working in a code editor."
GOOD: "Editing the analyzeScreenshot function in src/lib/openai.ts within VS Code, modifying the prompt template for the Screendiary project. A terminal panel is open showing a running dev server."

Do not mention the user directly. Start with a verb in present progressive (e.g. "Editing…", "Reviewing…", "Browsing…").

## Tags (3-7 tags, lowercase kebab-case)
Generate specific, multi-dimensional tags from these categories:
1. **App**: the exact app or site (e.g. "vscode", "cursor", "chrome", "slack", "figma", "notion", "terminal", "safari", "discord", "github")
2. **Activity**: what's being done (e.g. "coding", "debugging", "code-review", "reading-docs", "chatting", "browsing", "writing", "designing", "email", "video-call")
3. **Project/repo**: the project name if visible (e.g. "screendiary", "my-api", "company-dashboard")
4. **Technology**: languages or frameworks visible (e.g. "typescript", "rust", "react", "python", "tailwind")
5. **Domain**: area of work (e.g. "frontend", "backend", "devops", "design", "product", "infrastructure")

Only include tags you can confidently identify from the screenshot. Prefer specific tags over generic ones.
BAD tags: ["work", "computer", "screen"]
GOOD tags: ["cursor", "coding", "screendiary", "typescript", "frontend"]`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64}`,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 500,
      response_format: { type: "json_object" },
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

  let parsed: { summary?: string; tags?: string[] };
  try {
    parsed = JSON.parse(content);
  } catch {
    logError("ai-gateway", "Failed to parse JSON from vision response", truncateDetail(content, 500));
    return { summary: content, tags: [] };
  }

  const summary = parsed.summary?.trim() || content;
  const tags = Array.isArray(parsed.tags)
    ? parsed.tags.filter((t): t is string => typeof t === "string" && t.length > 0)
    : [];

  logSuccess(
    "ai-gateway",
    "Vision analysis received",
    `${tags.length} tags · ${truncateDetail(summary, 300)}`,
  );
  return { summary, tags };
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
