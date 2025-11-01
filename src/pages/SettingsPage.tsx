import { Text, Title } from "@mantine/core";
import React from "react";

export const SettingsPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-6xl">
      <Title order={1} className="mb-6">
        Settings
      </Title>
      <Text className="text-gray-600">
        TODO: Reading preferences, theme, download quality, etc.
      </Text>
    </div>
  );
};
