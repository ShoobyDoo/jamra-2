import { Text, Title } from "@mantine/core";
import React from "react";

export const DownloadsPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-6xl">
      <Title order={1} className="mb-6">
        Downloads
      </Title>
      <Text className="text-gray-600">
        TODO: Show download queue, progress, and manage downloads
      </Text>
    </div>
  );
};
