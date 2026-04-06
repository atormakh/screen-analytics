import { Badge, Box, Button, Group, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { IconCamera } from "@tabler/icons-react";
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
    <Box
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background:
          "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(109, 40, 217, 0.12), transparent), var(--mantine-color-dark-9)",
      }}
    >
      <ErrorBanner />

      <Box
        component="header"
        px="md"
        py="sm"
        style={{
          borderBottom: "1px solid var(--mantine-color-dark-4)",
          background: "rgba(9, 9, 11, 0.92)",
          backdropFilter: "blur(12px)",
          flexShrink: 0,
        }}
      >
        <Group justify="space-between" gap="md" wrap="nowrap">
          <Group
            gap="sm"
            wrap="nowrap"
            className="min-w-0 flex-1"
            py={4}
            px={4}
            style={{ borderRadius: 8, marginLeft: -4 }}
            {...{ "data-tauri-drag-region": true }}
          >
            <ThemeIcon
              size={36}
              radius="md"
              variant="gradient"
              gradient={{ from: "violet.6", to: "violet.8", deg: 135 }}
              style={{ boxShadow: "0 8px 24px rgba(109, 40, 217, 0.25)" }}
            >
              <IconCamera size={20} stroke={1.75} />
            </ThemeIcon>
            <Stack gap={0} className="min-w-0">
              <Title order={1} size="h5" fw={600} lineHeight={1.2}>
                Screendiary
              </Title>
              <Text size="xs" c="dimmed" truncate>
                Activity timeline · Notion sync
              </Text>
            </Stack>
            <Badge
              variant="light"
              color="gray"
              size="sm"
              radius="xl"
              className="shrink-0"
              styles={{ label: { fontVariantNumeric: "tabular-nums" } }}
            >
              {snapshots.length} shots
            </Badge>
          </Group>

          <Group gap="xs" wrap="nowrap" className="shrink-0">
            <ActivityDrawer />
            <Button
              variant="default"
              size="xs"
              onClick={handleManualCapture}
              disabled={capturing}
            >
              {capturing ? "Capturing…" : "Capture now"}
            </Button>
            <Button
              size="xs"
              onClick={() => setShowReport(true)}
              disabled={snapshots.length === 0}
            >
              Daily report
            </Button>
          </Group>
        </Group>
      </Box>

      <Timeline
        snapshots={snapshots}
        loading={loading}
        processing={processing}
      />

      {showReport ? (
        <DailyReport
          snapshots={snapshots}
          onClose={() => setShowReport(false)}
        />
      ) : null}
    </Box>
  );
}
