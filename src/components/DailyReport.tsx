import { Box, Button, Center, Group, Loader, Modal, Stack, Text } from "@mantine/core";
import { useState } from "react";
import Markdown from "react-markdown";
import type { Snapshot } from "../types";
import { logError } from "../lib/activityLog";
import { formatUnknownError, truncateDetail } from "../lib/errors";
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
      logError(
        "pipeline",
        "Daily report generation failed",
        truncateDetail(formatUnknownError(err)),
      );
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
      logError(
        "pipeline",
        "Saving daily report to Notion failed",
        truncateDetail(formatUnknownError(err)),
      );
      console.error("Failed to save report:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      opened
      onClose={onClose}
      title="Daily report"
      size="xl"
      centered
      overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
      styles={{
        body: { maxHeight: "min(85vh, 720px)", display: "flex", flexDirection: "column" },
      }}
    >
      <Stack gap="md" style={{ flex: 1, minHeight: 0 }}>
        {!report && !generating ? (
          <Center py="xl">
            <Stack align="center" gap="md" maw={360}>
              <Text size="sm" c="dimmed" ta="center">
                Generate an AI summary of your {snapshots.length} snapshots from
                today.
              </Text>
              <Button onClick={handleGenerate}>Generate report</Button>
            </Stack>
          </Center>
        ) : null}

        {generating ? (
          <Center py="xl">
            <Group gap="sm" c="dimmed">
              <Loader size="sm" type="oval" />
              <Text size="sm">Generating report…</Text>
            </Group>
          </Center>
        ) : null}

        {report ? (
          <Stack gap="sm" style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
            <Box
              component="article"
              className="prose prose-zinc prose-invert prose-sm max-w-none prose-headings:text-zinc-200 prose-p:text-zinc-300 prose-strong:text-zinc-200 prose-li:text-zinc-300 prose-a:text-violet-400 prose-code:text-zinc-300"
            >
              <Markdown>{report}</Markdown>
            </Box>
          </Stack>
        ) : null}

        {report ? (
          <Group justify="flex-end" pt="sm" style={{ borderTop: "1px solid var(--mantine-color-dark-4)" }}>
            {saved ? (
              <Text size="xs" c="green">
                Saved to Notion
              </Text>
            ) : (
              <Button
                variant="light"
                size="xs"
                onClick={handleSaveToNotion}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save to Notion"}
              </Button>
            )}
          </Group>
        ) : null}
      </Stack>
    </Modal>
  );
}
