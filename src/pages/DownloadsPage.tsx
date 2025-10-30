import React from 'react';
import { Title, Text } from '@mantine/core';

export const DownloadsPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <Title order={1} className="mb-6">
        Downloads
      </Title>
      <Text className="text-gray-600">
        TODO: Show download queue, progress, and manage downloads
      </Text>
    </div>
  );
};
