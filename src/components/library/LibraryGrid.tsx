import { Text } from "@mantine/core";
import React from "react";
import type { LibraryItem } from "../../types";

interface LibraryGridProps {
  items: LibraryItem[];
}

export const LibraryGrid: React.FC<LibraryGridProps> = ({ items }) => {
  if (items.length === 0) {
    return <Text className="text-gray-600">Your library is empty</Text>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.id} className="rounded border p-4">
          <Text>Manga ID: {item.mangaId}</Text>
          {/* TODO: Join with manga data and display card */}
        </div>
      ))}
    </div>
  );
};
