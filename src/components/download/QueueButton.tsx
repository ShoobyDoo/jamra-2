import { Badge, Popover } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconStack } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import React, { useEffect } from "react";
import { WS_EVENTS } from "../../constants/websocket";
import { downloadKeys } from "../../hooks/queries/useDownloadQueries";
import { useWebSocket } from "../../hooks/useWebSocket";
import type { DownloadProgressPayload, DownloadQueueItem } from "../../types";
import { DownloadPopoverContent } from "./DownloadPopoverContent";

/**
 * Queue button with badge indicator and popover showing active downloads
 */
export const QueueButton: React.FC = () => {
  const [popoverOpened, { close, toggle }] = useDisclosure(false);
  const queryClient = useQueryClient();

  // Fetch download queue
  // const {
  //   data: downloads = [
  //     {
  //       id: "test-1",
  //       mangaId: "one-piece",
  //       chapterId: "ch-1",
  //       status: "downloading",
  //       progress: 47,
  //       createdAt: 1762042088,
  //     },
  //   ],
  // } = useDownloadQueue();

  const downloads: DownloadQueueItem[] = [
    {
      id: "test-1",
      mangaId: "one-piece",
      chapterId: "ch-1",
      status: "downloading",
      progress: 47,
      createdAt: 1762042088,
    },
    {
      id: "test-2",
      mangaId: "one-piece",
      chapterId: "ch-1",
      status: "downloading",
      progress: 47,
      createdAt: 1762042088,
    },
    {
      id: "test-3",
      mangaId: "one-piece",
      chapterId: "ch-1",
      status: "downloading",
      progress: 47,
      createdAt: 1762042088,
    },
  ];

  // Subscribe to WebSocket download progress events
  const progressUpdate = useWebSocket<DownloadProgressPayload>(
    WS_EVENTS.DOWNLOAD_PROGRESS,
  );

  // Invalidate query cache when WebSocket event received
  useEffect(() => {
    if (progressUpdate) {
      queryClient.invalidateQueries({ queryKey: downloadKeys.queue });
    }
  }, [progressUpdate, queryClient]);

  // Calculate active download count
  const activeDownloads = downloads.filter(
    (d: DownloadQueueItem) =>
      d.status === "pending" || d.status === "downloading",
  );
  const activeCount = activeDownloads.length;

  const handleClick = () => {
    toggle();
  };

  return (
    <Popover
      width={280}
      position="right"
      withArrow
      shadow="md"
      opened={popoverOpened}
      onChange={(opened) => {
        if (!opened) close();
      }}
    >
      <Popover.Target>
        <div className="relative">
          <button
            onClick={handleClick}
            className="flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-lg text-gray-700 transition-colors hover:bg-gray-100"
            aria-label={`Queue${activeCount > 0 ? ` (${activeCount} active)` : ""}`}
          >
            <IconStack size={24} stroke={1.5} />
            <span className="text-center text-[10px] leading-none font-medium tracking-wide">
              Queue
            </span>
          </button>

          {/* Badge indicator */}
          {activeCount > 0 && (
            <Badge
              size="xs"
              circle
              className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center bg-blue-600 p-0 text-white"
              fw={600}
              py={4}
              style={{
                fontSize: "9px",
                // padding: "0 4px",
              }}
            >
              {activeCount}
            </Badge>
          )}
        </div>
      </Popover.Target>

      <Popover.Dropdown p={0}>
        <DownloadPopoverContent downloads={downloads} onClose={close} />
      </Popover.Dropdown>
    </Popover>
  );
};
