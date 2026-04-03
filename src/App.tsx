import { useState } from "react";
import { invoke, isTauri } from "@tauri-apps/api/core";
import ActivityDrawer from "./components/ActivityDrawer";
import DailyReport from "./components/DailyReport";
import ErrorBanner from "./components/ErrorBanner";
import Timeline from "./components/Timeline";
import { useTimeline } from "./hooks/useTimeline";
import { logError } from "./lib/activityLog";
import { formatUnknownError, truncateDetail } from "./lib/errors";
import { playManualCaptureChime } from "./lib/sounds";

export default function App() {
  const { snapshots, loading, processing } = useTimeline();
  const [showReport, setShowReport] = useState(false);
  const [capturing, setCapturing] = useState(false);

  async function handleManualCapture() {
    if (!isTauri()) return;
    void playManualCaptureChime();
    setCapturing(true);
    try {
      await invoke("take_screenshot");
    } catch (err) {
      logError(
        "app",
        "Manual capture (Rust) failed",
        truncateDetail(formatUnknownError(err)),
      );
      console.error("Manual capture failed:", err);
    } finally {
      setCapturing(false);
    }
  }

  return (
    <div className="flex h-screen flex-col bg-zinc-950">
      {/* header */}
      <ErrorBanner />

      <header className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
          </div>
          <h1 className="text-sm font-semibold tracking-tight text-zinc-100">
            Screenly
          </h1>
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
            {snapshots.length} snapshots
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ActivityDrawer />
          <button
            onClick={handleManualCapture}
            disabled={capturing}
            className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200 disabled:opacity-50"
          >
            {capturing ? "Capturing..." : "Capture Now"}
          </button>
          <button
            onClick={() => setShowReport(true)}
            disabled={snapshots.length === 0}
            className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-40"
          >
            Generate Report
          </button>
        </div>
      </header>

      {/* main */}
      <Timeline
        snapshots={snapshots}
        loading={loading}
        processing={processing}
      />

      {/* daily report modal */}
      {showReport && (
        <DailyReport
          snapshots={snapshots}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}
