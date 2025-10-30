import React from 'react';
import { Title, Text } from '@mantine/core';

export const LibraryPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <Title order={1} className="mb-6">
        Library
      </Title>
      <Text className="text-gray-600">
        TODO: Implement manga library grid with filters and sorting
      </Text>
    </div>
  );
};
