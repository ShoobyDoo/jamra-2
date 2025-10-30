import React from 'react';
import { Title, Text } from '@mantine/core';

export const SettingsPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <Title order={1} className="mb-6">
        Settings
      </Title>
      <Text className="text-gray-600">
        TODO: Reading preferences, theme, download quality, etc.
      </Text>
    </div>
  );
};
