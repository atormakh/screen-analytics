import { useEffect, useRef } from "react";
import type { Snapshot } from "../types";
import SnapshotCard from "./SnapshotCard";
import { formatDateHeader, todayISO } from "../lib/storage";

interface Props {
  snapshots: Snapshot[];
  loading: boolean;
  processing: boolean;
}

export default function Timeline({ snapshots, loading, processing }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [snapshots.length]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-500">
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading snapshots...
        </div>
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-2xl bg-zinc-900 p-6">
          <svg className="mx-auto h-12 w-12 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-medium text-zinc-300">No snapshots yet</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Screenshots are captured every 3 minutes automatically.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <h2 className="mb-6 text-xs font-semibold uppercase tracking-widest text-zinc-500">
        {formatDateHeader(todayISO())}
      </h2>

      <div className="ml-1">
        {snapshots.map((snap, i) => (
          <SnapshotCard key={`${snap.timestamp}-${i}`} snapshot={snap} />
        ))}
      </div>

      {processing && (
        <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500 ml-8">
          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Analyzing new screenshot...
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
