import { Text, Title } from "@mantine/core";
import React from "react";

export const HistoryPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-6xl">
      <Title order={1} className="mb-6">
        History
      </Title>
      <Text className="text-gray-600">
        TODO: Show app history including actions, reading records, etc.
      </Text>
    </div>
  );
};
