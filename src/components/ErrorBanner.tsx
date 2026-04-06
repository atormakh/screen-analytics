import { Alert, Button, Stack, Text } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
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
    window.addEventListener("screendiary-activity-error", handler);
    return () => window.removeEventListener("screendiary-activity-error", handler);
  }, []);

  if (!last || dismissedId === last.id) return null;

  return (
    <Alert
      variant="light"
      color="red"
      title={last.message}
      icon={<IconAlertTriangle size={18} />}
      withCloseButton={false}
      styles={{
        root: { borderRadius: 0, borderBottom: "1px solid var(--mantine-color-red-9)" },
      }}
    >
      <Stack gap="xs">
        {last.detail ? (
          <Text
            component="pre"
            size="xs"
            ff="monospace"
            style={{
              margin: 0,
              maxHeight: 128,
              overflow: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              padding: 8,
              borderRadius: 6,
              background: "rgba(0,0,0,0.2)",
            }}
          >
            {last.detail}
          </Text>
        ) : null}
        <Text size="xs" c="dimmed">
          Source: {last.source} · Open <strong>Activity</strong> for full history.
          Log file: ~/Library/Application Support/com.screendiary.app/logs/activity.jsonl
        </Text>
        <div>
          <Button variant="subtle" color="red" size="compact-xs" onClick={() => setDismissedId(last.id)}>
            Dismiss
          </Button>
        </div>
      </Stack>
    </Alert>
  );
}
