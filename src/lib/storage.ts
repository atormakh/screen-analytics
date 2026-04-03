import { invoke } from "@tauri-apps/api/core";

export async function getScreenshotsDir(): Promise<string> {
  return invoke<string>("get_screenshots_dir");
}

export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateHeader(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}
