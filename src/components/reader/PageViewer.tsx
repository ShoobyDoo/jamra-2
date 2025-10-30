import React from 'react';
import { Box, Text } from '@mantine/core';

interface PageViewerProps {
  imageSrc?: string;
  pageNumber: number;
  totalPages: number;
}

export const PageViewer: React.FC<PageViewerProps> = ({
  imageSrc,
  pageNumber,
  totalPages,
}) => {
  return (
    <Box className="flex h-full w-full flex-col items-center justify-center">
      {/* TODO: Display page image */}
      <Text className="text-gray-600">
        Page {pageNumber + 1} of {totalPages}
      </Text>
      {imageSrc && <Text className="text-sm text-gray-500">{imageSrc}</Text>}
    </Box>
  );
};
