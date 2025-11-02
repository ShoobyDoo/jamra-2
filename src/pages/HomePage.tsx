import { Text, Title } from "@mantine/core";
import React from "react";

export const HomePage: React.FC = () => {
  return (
    <div className="mx-auto max-w-6xl">
      <Title order={1} className="mb-6">
        Home
      </Title>
      <Text className="text-gray-600">
        TODO: Show netflix style continue reading cards at top, with full
        featured search below
      </Text>
    </div>
  );
};
