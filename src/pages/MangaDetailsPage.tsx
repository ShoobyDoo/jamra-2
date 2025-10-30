import React from 'react';
import { Title, Text } from '@mantine/core';

export const MangaDetailsPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <Title order={1} className="mb-6">
        Manga Details
      </Title>
      <Text className="text-gray-600">
        TODO: Display manga info, cover, chapters list, and actions
      </Text>
    </div>
  );
};
