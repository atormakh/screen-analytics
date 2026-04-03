/// <reference types="@rsbuild/core/types" />

interface ImportMetaEnv {
  readonly PUBLIC_OPENAI_API_KEY: string;
  readonly PUBLIC_NOTION_API_KEY: string;
  readonly PUBLIC_NOTION_DB_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
