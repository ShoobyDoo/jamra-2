import { Text, Title } from "@mantine/core";
import React from "react";

export const LibraryPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-6xl">
      <Title order={1} className="mb-6">
        Library
      </Title>
      <Text className="text-gray-600">
        TODO: Implement manga library grid with filters and sorting
      </Text>
    </div>
  );
};
