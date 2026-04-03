import { useState } from "react";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { clearActivityLog, useActivityLog } from "../lib/activityLog";
import type { ActivityEntry } from "../types";

function levelStyle(level: ActivityEntry["level"]): string {
  switch (level) {
    case "error":
      return "text-red-400 border-l-red-500";
    case "warn":
      return "text-amber-400 border-l-amber-500";
    case "success":
      return "text-emerald-400 border-l-emerald-500";
    default:
      return "text-zinc-400 border-l-zinc-600";
  }
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function ActivityDrawer() {
  const entries = useActivityLog();
  const [open, setOpen] = useState(false);
  const [pathHint, setPathHint] = useState<string | null>(null);

  const errorCount = entries.filter((e) => e.level === "error").length;

  async function openLogsInFinder() {
    if (!isTauri()) return;
    try {
      await invoke("open_logs_folder");
    } catch (e) {
      console.error(e);
    }
  }

  async function copyLogPath() {
    if (!isTauri()) return;
    try {
      const p = await invoke<string>("get_activity_log_path");
      setPathHint(p);
      await navigator.clipboard.writeText(p);
    } catch (e) {
      console.error(e);
    }
  }

  function copyAllVisible() {
    const text = entries
      .map(
        (e) =>
          `[${e.ts}] ${e.level.toUpperCase()} ${e.source} — ${e.message}${e.detail ? `\n${e.detail}` : ""}`,
      )
      .join("\n\n---\n\n");
    void navigator.clipboard.writeText(text);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative rounded-lg border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
      >
        Activity
        {errorCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {errorCount > 9 ? "9+" : errorCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[60] flex justify-end bg-black/50" role="dialog">
          <button
            type="button"
            className="h-full flex-1 cursor-default border-0 bg-transparent"
            aria-label="Close panel"
            onClick={() => setOpen(false)}
          />
          <div className="flex h-full w-full max-w-md flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
              <h2 className="text-sm font-semibold text-zinc-100">Activity log</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 border-b border-zinc-800 px-4 py-2">
              <button
                type="button"
                onClick={copyAllVisible}
                className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
              >
                Copy visible
              </button>
              <button
                type="button"
                onClick={() => clearActivityLog()}
                className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
              >
                Clear list
              </button>
              {isTauri() ? (
                <>
                  <button
                    type="button"
                    onClick={openLogsInFinder}
                    className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
                  >
                    Open logs folder
                  </button>
                  <button
                    type="button"
                    onClick={copyLogPath}
                    className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
                  >
                    Copy log file path
                  </button>
                </>
              ) : null}
            </div>
            {pathHint ? (
              <p className="px-4 py-1 text-xs text-emerald-400/90">Copied: {pathHint}</p>
            ) : null}

            <div className="flex-1 overflow-y-auto p-3">
              {entries.length === 0 ? (
                <p className="px-1 text-sm text-zinc-500">
                  No entries yet. Successful OpenAI/Notion steps and errors appear here. The same
                  lines are appended to{" "}
                  <code className="text-zinc-400">logs/activity.jsonl</code> under the app data
                  folder.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {entries.map((e) => (
                    <li
                      key={e.id}
                      className={`rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3 text-xs border-l-4 ${levelStyle(e.level)}`}
                    >
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="font-mono text-[10px] text-zinc-500">
                          {formatTime(e.ts)}
                        </span>
                        <span className="font-semibold uppercase tracking-wide text-zinc-500">
                          {e.source}
                        </span>
                        <span className="text-zinc-300">{e.message}</span>
                      </div>
                      {e.detail ? (
                        <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded bg-black/25 p-2 font-mono text-[11px] text-zinc-400">
                          {e.detail}
                        </pre>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
