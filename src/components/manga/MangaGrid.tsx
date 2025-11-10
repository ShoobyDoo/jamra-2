import { SimpleGrid, Text } from "@mantine/core";
import React from "react";
import type { Manga } from "../../types";
import { MangaCard } from "./MangaCard";

interface MangaGridProps {
  manga: Manga[];
}

export const MangaGrid: React.FC<MangaGridProps> = ({ manga }) => {
  if (manga.length === 0) {
    return <Text className="text-gray-600">No manga found</Text>;
  }

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg">
      {manga.map((item) => (
        <MangaCard
          key={item.id}
          id={item.id}
          title={item.title}
          coverUrl={item.coverUrl}
          status={item.status}
        />
      ))}
    </SimpleGrid>
  );
};
