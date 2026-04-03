/// <reference types="@rsbuild/core/types" />

interface ImportMetaEnv {
  /** Vercel AI Gateway API key (Bearer). */
  readonly PUBLIC_AI_GATEWAY_API_KEY: string;
  /** Optional override; default `https://ai-gateway.vercel.sh/v1` */
  readonly PUBLIC_AI_GATEWAY_BASE_URL?: string;
  /** Vision model id, e.g. `google/gemini-3-flash` or `openai/gpt-4o-mini` */
  readonly PUBLIC_AI_GATEWAY_MODEL_VISION?: string;
  /** Text model for daily report, e.g. `google/gemini-3-flash` */
  readonly PUBLIC_AI_GATEWAY_MODEL_TEXT?: string;
  readonly PUBLIC_NOTION_API_KEY: string;
  readonly PUBLIC_NOTION_DB_ID: string;
  /** Notion DB column names (defaults: Name, Summary, Timestamp, Path, Tags) */
  readonly PUBLIC_NOTION_PROP_NAME?: string;
  readonly PUBLIC_NOTION_PROP_SUMMARY?: string;
  readonly PUBLIC_NOTION_PROP_TIMESTAMP?: string;
  readonly PUBLIC_NOTION_PROP_PATH?: string;
  readonly PUBLIC_NOTION_PROP_TAGS?: string;
  /** If `1` or `true`, do not read/write Tags (no multi-select column). */
  readonly PUBLIC_NOTION_SKIP_TAGS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
