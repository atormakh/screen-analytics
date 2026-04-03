import { useState, useEffect, useCallback } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { Snapshot, SnapshotPayload } from "../types";
import { analyzeScreenshot } from "../lib/openai";
import { saveSnapshot, getSnapshots } from "../lib/notion";
import { todayISO } from "../lib/storage";

export function useTimeline() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const today = todayISO();

  const fetchSnapshots = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSnapshots(today);
      setSnapshots(data);
    } catch (err) {
      console.error("Failed to fetch snapshots:", err);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    fetchSnapshots();
  }, [fetchSnapshots]);

  useEffect(() => {
    if (!isTauri()) return;

    let cancelled = false;
    let unlistenFn: (() => void) | undefined;

    void (async () => {
      try {
        const unlisten = await listen<SnapshotPayload>(
          "snapshot-taken",
          async (event) => {
            const { path, timestamp } = event.payload;

            setProcessing(true);
            try {
              const summary = await analyzeScreenshot(path);
              const dt = new Date(timestamp);
              const title = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")} ${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;

              await saveSnapshot({ title, summary, timestamp, localPath: path });

              setSnapshots((prev) => [
                ...prev,
                { timestamp, summary, path, tags: [] },
              ]);
            } catch (err) {
              console.error("Failed to process snapshot:", err);
            } finally {
              setProcessing(false);
            }
          },
        );
        if (cancelled) {
          unlisten();
          return;
        }
        unlistenFn = unlisten;
      } catch (err) {
        console.error("Failed to register snapshot listener:", err);
      }
    })();

    return () => {
      cancelled = true;
      unlistenFn?.();
    };
  }, []);

  return { snapshots, loading, processing, refresh: fetchSnapshots };
}
