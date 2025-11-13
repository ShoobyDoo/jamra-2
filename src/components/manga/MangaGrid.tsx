import { SimpleGrid, Text } from "@mantine/core";
import React from "react";
import type { ExtensionSearchResult } from "../../types";
import { MangaCard } from "./MangaCard";

interface MangaGridProps {
  results: ExtensionSearchResult[];
  extensionId: string;
  extensionName?: string;
  onSelect?: (result: ExtensionSearchResult) => void;
}

export const MangaGrid: React.FC<MangaGridProps> = ({
  results,
  extensionId,
  extensionName,
  onSelect,
}) => {
  if (results.length === 0) {
    return <Text className="text-gray-600">No manga found</Text>;
  }

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg">
      {results.map((result) => (
        <MangaCard
          key={`${extensionId}-${result.id}`}
          extensionId={extensionId}
          extensionName={extensionName}
          result={result}
          onSelect={onSelect}
        />
      ))}
    </SimpleGrid>
  );
};
