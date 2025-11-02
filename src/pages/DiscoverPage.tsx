import { Text, Title } from "@mantine/core";
import React from "react";

export const DiscoverPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-6xl">
      <Title order={1} className="mb-6">
        Discover
      </Title>
      <Text className="text-gray-600">
        TODO: Show discover content from active extension(s)
      </Text>
    </div>
  );
};
