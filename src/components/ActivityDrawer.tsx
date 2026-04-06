import {
  Badge,
  Button,
  Drawer,
  Group,
  ScrollArea,
  Stack,
  Text,
} from "@mantine/core";
import { useState } from "react";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { clearActivityLog, useActivityLog } from "../lib/activityLog";
import type { ActivityEntry } from "../types";

function levelColor(level: ActivityEntry["level"]): string {
  switch (level) {
    case "error":
      return "red";
    case "warn":
      return "yellow";
    case "success":
      return "green";
    default:
      return "gray";
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
      <Button
        variant="default"
        size="xs"
        onClick={() => setOpen(true)}
        pos="relative"
      >
        Activity
        {errorCount > 0 ? (
          <Badge
            size="xs"
            color="red"
            circle
            pos="absolute"
            top={-6}
            right={-6}
            style={{ pointerEvents: "none", minWidth: 18 }}
          >
            {errorCount > 9 ? "9+" : errorCount}
          </Badge>
        ) : null}
      </Button>

      <Drawer
        opened={open}
        onClose={() => setOpen(false)}
        position="right"
        size="md"
        padding="md"
        title="Activity log"
        overlayProps={{ backgroundOpacity: 0.45 }}
        closeButtonProps={{ "aria-label": "Close activity" }}
      >
        <Stack gap="sm" h="100%">
          <Group gap="xs" wrap="wrap">
            <Button variant="light" size="compact-xs" onClick={copyAllVisible}>
              Copy visible
            </Button>
            <Button
              variant="light"
              size="compact-xs"
              onClick={() => clearActivityLog()}
            >
              Clear list
            </Button>
            {isTauri() ? (
              <>
                <Button
                  variant="light"
                  size="compact-xs"
                  onClick={openLogsInFinder}
                >
                  Open logs folder
                </Button>
                <Button
                  variant="light"
                  size="compact-xs"
                  onClick={copyLogPath}
                >
                  Copy log file path
                </Button>
              </>
            ) : null}
          </Group>

          {pathHint ? (
            <Text size="xs" c="green">
              Copied: {pathHint}
            </Text>
          ) : null}

          <ScrollArea
            type="auto"
            offsetScrollbars
            style={{ flex: 1, minHeight: 0 }}
            mah="calc(100vh - 11rem)"
          >
            {entries.length === 0 ? (
              <Text size="sm" c="dimmed">
                No entries yet. Successful AI/Notion steps and errors appear
                here. The same lines are appended to{" "}
                <Text span ff="monospace" size="xs">
                  logs/activity.jsonl
                </Text>{" "}
                under the app data folder.
              </Text>
            ) : (
              <Stack gap="sm" pr="xs">
                {entries.map((e) => (
                  <Stack
                    key={e.id}
                    gap={6}
                    p="sm"
                    style={{
                      borderRadius: 8,
                      borderLeft: `4px solid var(--mantine-color-${levelColor(e.level)}-6)`,
                      background: "var(--mantine-color-dark-7)",
                    }}
                  >
                    <Group gap="xs" wrap="wrap" align="baseline">
                      <Text size="10px" ff="monospace" c="dimmed">
                        {formatTime(e.ts)}
                      </Text>
                      <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                        {e.source}
                      </Text>
                      <Text size="xs">{e.message}</Text>
                    </Group>
                    {e.detail ? (
                      <Text
                        component="pre"
                        size="xs"
                        c="dimmed"
                        ff="monospace"
                        style={{
                          margin: 0,
                          maxHeight: 160,
                          overflow: "auto",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          padding: 8,
                          borderRadius: 6,
                          background: "rgba(0,0,0,0.25)",
                        }}
                      >
                        {e.detail}
                      </Text>
                    ) : null}
                  </Stack>
                ))}
              </Stack>
            )}
          </ScrollArea>
        </Stack>
      </Drawer>
    </>
  );
}
