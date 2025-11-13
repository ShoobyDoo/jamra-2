import { Badge, Popover } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconStack } from "@tabler/icons-react";
import React from "react";
import { useDownloadQueue } from "../../hooks/queries/useDownloadQueries";
import type { DownloadQueueItem } from "../../types";
import { DownloadPopoverContent } from "./DownloadPopoverContent";
import { useDownloadSubscriptions } from "../../hooks/useDownloadSubscription";

/**
 * Queue button with badge indicator and popover showing active downloads
 */
export const QueueButton: React.FC = () => {
  const [popoverOpened, { close, toggle }] = useDisclosure(false);

  // Fetch download queue
  const { data } = useDownloadQueue();
  const downloads: DownloadQueueItem[] = data?.downloads ?? [];

  // Calculate active download count
  const activeDownloads = downloads.filter(
    (d: DownloadQueueItem) =>
      d.status === "queued" || d.status === "downloading",
  );
  const activeCount = activeDownloads.length;

  // Subscribe to WebSocket events for active downloads when popover is open
  // This reduces traffic by only subscribing to relevant downloads
  const downloadIdsToSubscribe = popoverOpened
    ? activeDownloads.map((d) => d.id)
    : undefined;
  useDownloadSubscriptions(downloadIdsToSubscribe);

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
            <span className="text-center text-[11px] leading-none font-medium tracking-wide">
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
