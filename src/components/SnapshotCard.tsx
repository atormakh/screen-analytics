import type { Snapshot } from "../types";
import { formatTimestamp } from "../lib/storage";

interface Props {
  snapshot: Snapshot;
}

export default function SnapshotCard({ snapshot }: Props) {
  const time = formatTimestamp(snapshot.timestamp);

  return (
    <div className="group relative flex gap-4 pb-8 last:pb-0">
      {/* timeline line */}
      <div className="flex flex-col items-center">
        <div className="h-3 w-3 rounded-full bg-violet-500 ring-4 ring-zinc-950 shrink-0 mt-1" />
        <div className="w-px flex-1 bg-zinc-800 group-last:hidden" />
      </div>

      {/* card */}
      <div className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 backdrop-blur-sm transition-colors hover:border-zinc-700">
        <span className="text-xs font-medium text-zinc-500 tracking-wide font-mono">
          {time}
        </span>
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-200">
          {snapshot.summary}
        </p>
        {snapshot.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {snapshot.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
