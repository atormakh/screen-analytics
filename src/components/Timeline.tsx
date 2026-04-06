import {
  Badge,
  Center,
  Group,
  Loader,
  Stack,
  Text,
  ThemeIcon,
  Timeline as MantineTimeline,
} from "@mantine/core";
import { IconCamera } from "@tabler/icons-react";
import { useEffect, useRef } from "react";
import type { Snapshot } from "../types";
import { formatDateHeader, formatTimestamp, todayISO } from "../lib/storage";

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
      <Center flex={1} py="xl">
        <Group gap="sm" c="dimmed">
          <Loader size="sm" type="oval" />
          <Text size="sm">Loading snapshots…</Text>
        </Group>
      </Center>
    );
  }

  if (snapshots.length === 0) {
    return (
      <Center flex={1} px="lg">
        <Stack align="center" gap="lg" maw={420}>
          <ThemeIconPlaceholder />
          <Stack gap="xs" ta="center">
            <Text fw={500} size="md">
              No snapshots yet today
            </Text>
            <Text size="sm" c="dimmed" lh={1.6}>
              Screendiary saves a capture every{" "}
              <Text span fw={500} c="gray.4">
                3 minutes
              </Text>{" "}
              and summarizes it with AI. Use{" "}
              <Text span fw={500} c="gray.4">
                Capture now
              </Text>{" "}
              in the header to try it immediately.
            </Text>
          </Stack>
        </Stack>
      </Center>
    );
  }

  return (
    <Stack flex={1} gap="md" px={{ base: "md", sm: "lg" }} py="md" style={{ overflowY: "auto" }}>
      <Text size="xs" fw={600} tt="uppercase" lts="0.2em" c="dimmed">
        {formatDateHeader(todayISO())}
      </Text>

      <MantineTimeline
        bulletSize={28}
        lineWidth={2}
        color="violet"
        active={snapshots.length}
      >
        {snapshots.map((snap, i) => (
          <MantineTimeline.Item
            key={`${snap.timestamp}-${i}`}
            bullet={
              <ThemeIcon size={28} radius="xl" color="violet" variant="filled">
                <IconCamera size={14} stroke={1.75} />
              </ThemeIcon>
            }
            title={
              <Text size="xs" ff="monospace" c="dimmed" fw={500}>
                {formatTimestamp(snap.timestamp)}
              </Text>
            }
          >
            <Stack gap="sm" mt={4}>
              <Text size="sm" lh={1.65}>
                {snap.summary}
              </Text>
              {snap.tags.length > 0 ? (
                <Group gap={6}>
                  {snap.tags.map((tag) => (
                    <Badge key={tag} size="xs" variant="light" color="gray">
                      {tag}
                    </Badge>
                  ))}
                </Group>
              ) : null}
            </Stack>
          </MantineTimeline.Item>
        ))}
      </MantineTimeline>

      {processing ? (
        <Group gap="xs" ml={48} c="dimmed">
          <Loader size={14} type="oval" />
          <Text size="xs">Analyzing new screenshot…</Text>
        </Group>
      ) : null}

      <div ref={bottomRef} />
    </Stack>
  );
}

function ThemeIconPlaceholder() {
  return (
    <Center
      p="xl"
      style={{
        borderRadius: 16,
        border: "1px solid var(--mantine-color-dark-4)",
        background: "var(--mantine-color-dark-7)",
      }}
    >
      <IconCamera size={56} stroke={1.2} color="var(--mantine-color-dark-2)" />
    </Center>
  );
}
