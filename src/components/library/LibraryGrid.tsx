import { Loader, Text } from "@mantine/core";
import React from "react";
import type { LibraryItem } from "../../types";
import { LibraryCard } from "./LibraryCard";

interface LibraryGridProps {
  items: LibraryItem[];
  isLoading?: boolean;
}

export const LibraryGrid: React.FC<LibraryGridProps> = ({
  items,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size="lg" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Text size="lg" className="mb-2 font-semibold text-gray-700">
          Your library is empty
        </Text>
        <Text size="sm" className="text-gray-500">
          Start adding manga from the Discover page
        </Text>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {items.map((item) => (
        <LibraryCard key={item.id} item={item} />
      ))}
    </div>
  );
};
