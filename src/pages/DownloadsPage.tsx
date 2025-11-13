import {
  ActionIcon,
  Badge,
  Card,
  Group,
  Loader,
  Progress,
  ScrollArea,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { IconCircleX } from "@tabler/icons-react";
import React from "react";
import {
  useCancelDownload,
  useDownloadQueue,
  useDownloadStats,
} from "../hooks/queries/useDownloadQueries";
import type { DownloadQueueItem } from "../types";
import { formatRelativeTime } from "../lib/date";
import { useDownloadSubscriptions } from "../hooks/useDownloadSubscription";

const STATUS_COLORS: Record<DownloadQueueItem["status"], string> = {
  queued: "gray",
  downloading: "blue",
  completed: "green",
  failed: "red",
  cancelled: "yellow",
};

const formatBytes = (bytes?: number) => {
  if (!bytes || Number.isNaN(bytes)) return "0 B";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** index).toFixed(1)} ${units[index]}`;
};

export const DownloadsPage: React.FC = () => {
  const { data, isLoading, isRefetching } = useDownloadQueue();
  const { data: stats, isLoading: statsLoading } = useDownloadStats();
  const { mutate: cancelDownload, isPending: isCancelling } =
    useCancelDownload();

  const downloads = data?.downloads ?? [];
  const hasDownloads = downloads.length > 0;

  // Subscribe to active download WebSocket events for real-time updates
  const activeDownloadIds = downloads
    .filter((d) => d.status === "queued" || d.status === "downloading")
    .map((d) => d.id);
  useDownloadSubscriptions(activeDownloadIds);

  const handleCancel = (downloadId: string) => {
    cancelDownload(downloadId);
  };

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Title order={1}>Downloads</Title>
          <Text size="sm" c="dimmed">
            Monitor queued chapters, progress, and disk usage.
          </Text>
        </div>
        <Group gap="lg">
          <Card withBorder padding="sm" radius="md">
            <Text size="xs" c="dimmed">
              Active Downloads
            </Text>
            <Text fw={600} size="lg">
              {
                downloads.filter(
                  (item) =>
                    item.status === "queued" || item.status === "downloading",
                ).length
              }
            </Text>
          </Card>
          <Card withBorder padding="sm" radius="md">
            <Text size="xs" c="dimmed">
              Stored Chapters
            </Text>
            <Text fw={600} size="lg">
              {statsLoading ? "…" : stats?.downloadCount ?? 0}
            </Text>
            <Text size="xs" c="dimmed">
              {statsLoading ? "" : formatBytes(stats?.totalSize)}
            </Text>
          </Card>
        </Group>
      </div>

      <Card withBorder radius="lg" padding="0">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <Text fw={600}>Download Queue</Text>
          {isLoading || isRefetching ? <Loader size="sm" /> : null}
        </div>
        {isLoading && !hasDownloads ? (
          <div className="flex items-center justify-center py-12">
            <Loader size="md" />
          </div>
        ) : hasDownloads ? (
          <ScrollArea h="60vh">
            <Table verticalSpacing="md" striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Chapter</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Progress</Table.Th>
                  <Table.Th>Library</Table.Th>
                  <Table.Th>Updated</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {downloads.map((download) => {
                  const cancellable =
                    download.status === "queued" ||
                    download.status === "downloading";
                  return (
                    <Table.Tr key={download.id}>
                      <Table.Td>
                        <Text fw={500}>
                          {download.chapterNumber ?? download.chapterId}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {download.chapterId}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={STATUS_COLORS[download.status]}>
                          {download.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={download.progress}
                            w={160}
                            color={
                              download.status === "failed"
                                ? "red"
                                : download.status === "completed"
                                  ? "green"
                                  : "blue"
                            }
                          />
                          <Text size="xs" c="dimmed">
                            {download.progress}%
                          </Text>
                        </div>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" c="dimmed">
                          {download.libraryId}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" c="dimmed">
                          {formatRelativeTime(
                            download.completedAt ??
                              download.startedAt ??
                              download.createdAt,
                          )}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        {cancellable && (
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() => handleCancel(download.id)}
                            disabled={isCancelling}
                            aria-label="Cancel download"
                          >
                            <IconCircleX size={16} />
                          </ActionIcon>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        ) : (
          <div className="py-12 text-center text-gray-500">
            No downloads queued yet. Queue chapters from the Reader or Manga
            details page.
          </div>
        )}
      </Card>
    </div>
  );
};
