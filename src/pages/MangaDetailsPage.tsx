import { Text, Title } from "@mantine/core";
import React from "react";

export const MangaDetailsPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-6xl">
      <Title order={1} className="mb-6">
        Manga Details
      </Title>
      <Text className="text-gray-600">
        TODO: Display manga info, cover, chapters list, and actions
      </Text>
    </div>
  );
};
