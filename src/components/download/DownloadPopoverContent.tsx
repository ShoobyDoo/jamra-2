import { ActionIcon, Box, Progress, ScrollArea, Text } from "@mantine/core";
import { IconX as CloseIcon, IconCircleX } from "@tabler/icons-react";
import React from "react";
import { useCancelDownload } from "../../hooks/queries/useDownloadQueries";
import type { DownloadQueueItem } from "../../types";

interface DownloadPopoverContentProps {
  downloads: DownloadQueueItem[];
  onClose: () => void;
}

// EXAMPLE COMPONENT IMPLEMENTATION

export const DownloadPopoverContent: React.FC<DownloadPopoverContentProps> = ({
  downloads,
  onClose,
}) => {
  const { mutate: cancelDownload } = useCancelDownload();

  const activeDownloads = downloads.filter(
    (d) => d.status === "pending" || d.status === "downloading",
  );

  const handleCancel = (downloadId: string) => {
    cancelDownload(downloadId);
  };

  const getStatusText = (status: DownloadQueueItem["status"]): string => {
    switch (status) {
      case "pending":
        return "Waiting...";
      case "downloading":
        return "Downloading...";
      case "completed":
        return "Completed";
      case "failed":
        return "Failed";
      default:
        return "Unknown";
    }
  };

  const getProgressColor = (status: DownloadQueueItem["status"]): string => {
    if (status === "failed") return "red";
    if (status === "completed") return "green";
    return "blue";
  };

  return (
    <Box>
      {/* Header */}
      <Box className="flex items-center justify-between gap-2 border-b border-gray-200 p-3">
        <Text size="sm" fw={500}>
          Active Downloads Queue ({activeDownloads.length})
        </Text>
        <ActionIcon
          size="xs"
          variant="subtle"
          onClick={onClose}
          aria-label="Close popover"
        >
          <CloseIcon size={16} />
        </ActionIcon>
      </Box>

      {/* Downloads List */}
      {activeDownloads.length === 0 ? (
        <Box className="p-8 text-center">
          <Text size="sm" c="dimmed">
            No active downloads
          </Text>
        </Box>
      ) : (
        <ScrollArea h={downloads.length * 72} type="auto">
          <Box>
            {downloads.map((download) => (
              <Box
                key={download.id}
                className="border-b border-gray-100 p-3 transition-colors hover:bg-gray-50"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <Text size="xs" fw={500} className="truncate">
                      Chapter {download.chapterId}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {getStatusText(download.status)}
                    </Text>
                  </div>
                  {(download.status === "pending" ||
                    download.status === "downloading") && (
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      color="red"
                      onClick={() => handleCancel(download.id)}
                      aria-label="Cancel download"
                    >
                      <IconCircleX size={16} />
                    </ActionIcon>
                  )}
                </div>
                <Progress
                  value={download.progress}
                  size="xs"
                  color={getProgressColor(download.status)}
                  animated={download.status === "downloading"}
                />
              </Box>
            ))}
          </Box>
        </ScrollArea>
      )}
    </Box>
  );
};
