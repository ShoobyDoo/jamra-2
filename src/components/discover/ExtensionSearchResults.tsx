import { Loader, SimpleGrid, Text, Title } from "@mantine/core";
import React from "react";
import { useExtensionSearch } from "../../hooks/queries/useExtensionsQueries";
import type { ExtensionSearchResult } from "../../types";
import { UnifiedMangaCard } from "../shared/UnifiedMangaCard";

interface ExtensionSearchResultsProps {
  extensionId: string;
  extensionName: string;
  searchQuery: string;
  limit?: number;
  showHeader?: boolean;
}

export const ExtensionSearchResults: React.FC<ExtensionSearchResultsProps> = ({
  extensionId,
  extensionName,
  searchQuery,
  limit,
  showHeader = true,
}) => {
  const { data, isLoading } = useExtensionSearch(extensionId, {
    query: searchQuery,
  });

  const results = limit ? (data?.results || []).slice(0, limit) : data?.results || [];

  if (isLoading) {
    return showHeader ? (
      <div>
        <Title order={3} className="mb-4">
          {extensionName}
        </Title>
        <div className="flex justify-center py-8">
          <Loader size="md" />
        </div>
      </div>
    ) : (
      <div className="flex justify-center py-8">
        <Loader size="md" />
      </div>
    );
  }

  if (!results || results.length === 0) {
    return null;
  }

  return (
    <div>
      {showHeader && (
        <div className="mb-4 flex items-center justify-between">
          <Title order={3}>
            {extensionName}
            <Text span size="sm" c="dimmed" className="ml-2">
              ({results.length} results)
            </Text>
          </Title>
        </div>
      )}
      <SimpleGrid cols={{ base: 2, xs: 3, sm: 4, md: 5, lg: 6 }} spacing="lg">
        {results.map((manga: ExtensionSearchResult) => (
          <UnifiedMangaCard
            key={manga.id}
            id={manga.id}
            extensionId={extensionId}
            title={manga.title}
            coverUrl={manga.coverUrl}
            extensionName={showHeader ? undefined : extensionName}
            status={manga.status}
          />
        ))}
      </SimpleGrid>
    </div>
  );
};
