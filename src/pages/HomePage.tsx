import { Alert, Anchor, Text, Title } from "@mantine/core";
import { IconAlertCircle, IconBook } from "@tabler/icons-react";
import React from "react";
import { useNavigate } from "react-router";
import { ContinueReadingCard } from "../components/home/ContinueReadingCard";
import { useContinueReadingEntries } from "../hooks/queries/useHomeQueries";
import type { ContinueReadingEntry } from "../types";
import { buildRoute, ROUTES } from "../routes/routes.config";

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    data: continueReadingEntries,
    isPending,
    isError,
    error,
    refetch,
  } = useContinueReadingEntries();

  const handleViewAllContinueReading = () => {
    navigate(ROUTES.LIBRARY);
  };

  const handleContinueReading = (entry: ContinueReadingEntry) => {
    navigate(buildRoute.reader(entry.libraryId, entry.chapterId));
  };

  const handleOpenMangaDetails = (entry: ContinueReadingEntry) => {
    navigate(buildRoute.mangaDetails(entry.extensionId, entry.mangaId));
  };

  const hasEntries = (continueReadingEntries?.length ?? 0) > 0;

  return (
    <div className="mx-auto w-full">
      {/* Continue Reading Section */}
      <section className="mb-10">
        <div className="mb-4 flex flex-wrap items-center justify-between">
          <Title order={2}>Continue Reading</Title>
          <Anchor
            component="button"
            onClick={handleViewAllContinueReading}
            className="text-blue-600 hover:underline"
          >
            View All
          </Anchor>
        </div>

        {isError && (
          <Alert
            color="red"
            icon={<IconAlertCircle size={16} />}
            className="mb-4"
            withCloseButton
            onClose={() => refetch()}
            title="Unable to load progress"
          >
            {error instanceof Error ? error.message : "Unexpected error"}
          </Alert>
        )}

        {isPending ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(176px,192px))] justify-items-center gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`continue-reading-skeleton-${index}`}
                className="h-72 w-44 animate-pulse rounded-2xl bg-gray-200/50"
              />
            ))}
          </div>
        ) : hasEntries ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(176px,192px))] justify-items-center gap-3">
            {continueReadingEntries?.map((entry) => (
              <ContinueReadingCard
                key={entry.libraryId}
                entry={entry}
                onContinue={handleContinueReading}
                onOpenDetails={handleOpenMangaDetails}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center">
            <IconBook size={28} className="mx-auto mb-2 text-gray-400" />
            <Title order={5}>No recent progress</Title>
            <Text size="sm" c="dimmed">
              Start reading any manga to see it appear here.
            </Text>
          </div>
        )}
      </section>
    </div>
  );
};
