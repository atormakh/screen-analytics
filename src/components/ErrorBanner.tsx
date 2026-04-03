import { useEffect, useState } from "react";
import type { ActivityEntry } from "../types";

export default function ErrorBanner() {
  const [last, setLast] = useState<ActivityEntry | null>(null);
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ActivityEntry>).detail;
      setLast(detail);
      setDismissedId(null);
    };
    window.addEventListener("screenly-activity-error", handler);
    return () => window.removeEventListener("screenly-activity-error", handler);
  }, []);

  if (!last || dismissedId === last.id) return null;

  return (
    <div
      role="alert"
      className="flex shrink-0 items-start gap-3 border-b border-red-900/60 bg-red-950/90 px-4 py-3 text-sm text-red-100"
    >
      <div className="mt-0.5 text-red-400">
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-red-50">{last.message}</p>
        {last.detail ? (
          <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap break-words rounded bg-black/30 p-2 font-mono text-xs text-red-200/90">
            {last.detail}
          </pre>
        ) : null}
        <p className="mt-2 text-xs text-red-300/80">
          Source: {last.source} · Open <strong>Activity</strong> for full history. Log file:
          ~/Library/Application Support/com.screenly.app/logs/activity.jsonl
        </p>
      </div>
      <button
        type="button"
        onClick={() => setDismissedId(last.id)}
        className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-red-200 hover:bg-red-900/50"
      >
        Dismiss
      </button>
    </div>
  );
}
