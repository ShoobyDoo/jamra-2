import { Card, Progress, Stack, Text } from "@mantine/core";
import React from "react";
import type { DownloadQueueItem } from "../../types";

interface DownloadQueueProps {
  queue: DownloadQueueItem[];
}

export const DownloadQueue: React.FC<DownloadQueueProps> = ({ queue }) => {
  if (queue.length === 0) {
    return <Text className="text-gray-600">No downloads in queue</Text>;
  }

  return (
    <Stack gap="md">
      {queue.map((item) => (
        <Card key={item.id} shadow="sm" padding="md" radius="md">
          <Text fw={600} className="mb-2">
            Chapter ID: {item.chapterId}
          </Text>
          <Progress value={item.progress} className="mb-2" />
          <Text size="sm" className="text-gray-600">
            Status: {item.status} - {item.progress}%
          </Text>
        </Card>
      ))}
    </Stack>
  );
};
