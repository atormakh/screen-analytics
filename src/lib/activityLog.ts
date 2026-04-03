import { invoke, isTauri } from "@tauri-apps/api/core";
import { useSyncExternalStore } from "react";
import type { ActivityEntry, ActivityLevel, ActivitySource } from "../types";

const MAX_ENTRIES = 400;
let entries: ActivityEntry[] = [];
const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

function dispatchErrorEvent(entry: ActivityEntry) {
  if (entry.level === "error") {
    window.dispatchEvent(
      new CustomEvent<ActivityEntry>("screenly-activity-error", { detail: entry }),
    );
  }
}

/** Append one line to ~/Library/Application Support/.../logs/activity.jsonl (best effort). */
async function persistLine(entry: ActivityEntry): Promise<void> {
  if (!isTauri()) return;
  try {
    await invoke("append_activity_line", {
      jsonLine: JSON.stringify(entry),
    });
  } catch {
    /* avoid recursion if invoke fails */
  }
}

export function pushActivity(
  partial: Omit<ActivityEntry, "id" | "ts"> & { id?: string },
): ActivityEntry {
  const entry: ActivityEntry = {
    id: partial.id ?? crypto.randomUUID(),
    ts: new Date().toISOString(),
    level: partial.level,
    source: partial.source,
    message: partial.message,
    detail: partial.detail,
  };
  entries = [entry, ...entries].slice(0, MAX_ENTRIES);
  notify();
  dispatchErrorEvent(entry);
  void persistLine(entry);
  return entry;
}

export function subscribeActivity(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getActivitySnapshot(): ActivityEntry[] {
  return entries;
}

export function useActivityLog(): ActivityEntry[] {
  return useSyncExternalStore(subscribeActivity, getActivitySnapshot, getActivitySnapshot);
}

export function clearActivityLog(): void {
  entries = [];
  notify();
}

/** Convenience wrappers */
export function logInfo(source: ActivitySource, message: string, detail?: string) {
  pushActivity({ level: "info", source, message, detail });
}

export function logSuccess(source: ActivitySource, message: string, detail?: string) {
  pushActivity({ level: "success", source, message, detail });
}

export function logWarn(source: ActivitySource, message: string, detail?: string) {
  pushActivity({ level: "warn", source, message, detail });
}

export function logError(
  source: ActivitySource,
  message: string,
  detail?: string,
) {
  pushActivity({ level: "error", source, message, detail });
}
