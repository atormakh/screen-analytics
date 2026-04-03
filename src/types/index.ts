export interface Snapshot {
  timestamp: string;
  summary: string;
  path: string;
  tags: string[];
}

export interface SnapshotPayload {
  path: string;
  timestamp: string;
}

export type ActivityLevel = "info" | "success" | "warn" | "error";

export type ActivitySource =
  | "openai"
  | "ai-gateway"
  | "notion"
  | "pipeline"
  | "app";

export interface ActivityEntry {
  id: string;
  ts: string;
  level: ActivityLevel;
  source: ActivitySource;
  message: string;
  detail?: string;
}
