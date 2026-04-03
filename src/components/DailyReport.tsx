import { useState } from "react";
import Markdown from "react-markdown";
import type { Snapshot } from "../types";
import { generateDailyReport } from "../lib/openai";
import { saveDailyReport } from "../lib/notion";
import { todayISO } from "../lib/storage";

interface Props {
  snapshots: Snapshot[];
  onClose: () => void;
}

export default function DailyReport({ snapshots, onClose }: Props) {
  const [report, setReport] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const result = await generateDailyReport(
        snapshots.map((s) => ({ timestamp: s.timestamp, summary: s.summary })),
      );
      setReport(result);
    } catch (err) {
      console.error("Failed to generate report:", err);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveToNotion() {
    if (!report) return;
    setSaving(true);
    try {
      await saveDailyReport(todayISO(), report);
      setSaved(true);
    } catch (err) {
      console.error("Failed to save report:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        {/* header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h2 className="text-sm font-semibold text-zinc-100">Daily Report</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!report && !generating && (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <p className="text-sm text-zinc-400">
                Generate an AI summary of your {snapshots.length} snapshots from
                today.
              </p>
              <button
                onClick={handleGenerate}
                className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500"
              >
                Generate Report
              </button>
            </div>
          )}

          {generating && (
            <div className="flex items-center justify-center gap-3 py-12 text-zinc-500">
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating report...
            </div>
          )}

          {report && (
            <div className="prose prose-invert prose-sm max-w-none prose-headings:text-zinc-200 prose-p:text-zinc-300 prose-strong:text-zinc-200 prose-li:text-zinc-300">
              <Markdown>{report}</Markdown>
            </div>
          )}
        </div>

        {/* footer */}
        {report && (
          <div className="flex items-center justify-end gap-3 border-t border-zinc-800 px-6 py-4">
            {saved ? (
              <span className="text-xs text-emerald-400">Saved to Notion</span>
            ) : (
              <button
                onClick={handleSaveToNotion}
                disabled={saving}
                className="rounded-lg border border-zinc-700 px-4 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save to Notion"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
