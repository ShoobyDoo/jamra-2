import {
  Alert,
  Button,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";
import React from "react";
import { useNavigate, useParams } from "react-router";
import { apiClient } from "../api/client";
import { API_BASE_URL, API_PATHS } from "../constants/api";
import { buildRoute } from "../routes/routes.config";
import type { ReaderChapter } from "../types";

const buildImageSrc = (url?: string) => {
  if (!url) {
    return null;
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const base = API_BASE_URL.endsWith("/")
    ? API_BASE_URL.slice(0, -1)
    : API_BASE_URL;
  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
};

export const ReaderPage: React.FC = () => {
  const { libraryId, chapterId } = useParams<{
    libraryId: string;
    chapterId: string;
  }>();
  const navigate = useNavigate();
  const [chapter, setChapter] = React.useState<ReaderChapter | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    if (!libraryId || !chapterId) {
      setChapter(null);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    apiClient
      .get<ReaderChapter>(API_PATHS.readerChapter(libraryId, chapterId), {
        signal: controller.signal,
      })
      .then((data) => {
        if (!isMounted) return;
        setChapter(data);
      })
      .catch((err) => {
        if (!isMounted || controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Unable to load chapter");
        setChapter(null);
      })
      .finally(() => {
        if (!isMounted || controller.signal.aborted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [chapterId, libraryId, reloadKey]);

  const handleReload = () => setReloadKey((key) => key + 1);

  if (!libraryId || !chapterId) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Alert
          icon={<IconAlertCircle size={18} />}
          title="Missing context"
          color="red"
        >
          Reader routes require both a library id and chapter id. Use the
          library or manga details page to choose a chapter and try again.
        </Alert>
      </div>
    );
  }

  const chapterPages = chapter?.pages ?? [];
  const pageCount = chapterPages.length;

  const handleOpenChapter = (targetChapterId: string | null | undefined) => {
    if (!libraryId || !targetChapterId) return;
    navigate(buildRoute.reader(libraryId, targetChapterId));
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Stack gap="lg">
        <div>
          <Title order={1}>Reader</Title>
          <Text c="dimmed">
            Prototype reader that fetches all pages and displays them in a
            vertical strip. A richer experience will ship in a later update.
          </Text>
        </div>

        {error && (
          <Alert
            color="red"
            icon={<IconAlertCircle size={18} />}
            withCloseButton
            onClose={() => setError(null)}
            title="Unable to load chapter"
          >
            {error}
            <Button
              mt="sm"
              leftSection={<IconRefresh size={16} />}
              size="xs"
              variant="light"
              onClick={handleReload}
            >
              Try again
            </Button>
          </Alert>
        )}

        {isLoading && (
          <Paper
            withBorder
            radius="lg"
            p="lg"
            className="flex items-center justify-center gap-3"
          >
            <Loader />
            <Text>Loading chapter...</Text>
          </Paper>
        )}

        {chapter && !isLoading && (
          <Paper withBorder radius="lg" p="lg">
            <div className="flex flex-col gap-1">
              <Title order={3}>
                {chapter.title || `Chapter ${chapter.number ?? ""}`}
              </Title>
              <Text size="sm" c="dimmed">
                {pageCount} page
                {pageCount === 1 ? "" : "s"} ·{" "}
                {chapter.isDownloaded ? "Downloaded" : "Streaming"}
              </Text>
              <Button
                mt="md"
                variant="light"
                leftSection={<IconRefresh size={16} />}
                onClick={handleReload}
              >
                Reload pages
              </Button>
            </div>
          </Paper>
        )}

        {chapter && pageCount === 0 && !isLoading && (
          <Paper withBorder radius="lg" p="lg">
            <Text>No pages are available for this chapter yet.</Text>
          </Paper>
        )}

        {chapter && pageCount > 0 && (
          <Stack gap="xl">
            {chapterPages.map((page) => {
              const imageSrc = buildImageSrc(page.url);
              return (
                <Paper
                  key={page.number}
                  radius="md"
                  withBorder
                  shadow="xs"
                  className="bg-gray-950/5 p-3"
                >
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={`Page ${page.number}`}
                      className="w-full rounded-lg bg-black object-contain"
                    />
                  ) : (
                    <Alert
                      color="yellow"
                      icon={<IconAlertCircle size={16} />}
                      title="Missing page URL"
                    >
                      This page descriptor did not include a URL.
                    </Alert>
                  )}
                  <Text size="xs" c="dimmed" ta="center" mt="sm">
                    Page {page.number}
                  </Text>
                </Paper>
              );
            })}
          </Stack>
        )}

        {chapter && (
          <Paper
            withBorder
            radius="lg"
            p="lg"
            className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <Title order={4} size="h5">
                Chapter navigation
              </Title>
              <Text size="sm" c="dimmed">
                Jump to the previous or next chapter when available.
              </Text>
            </div>
            <div className="flex gap-3">
              <Button
                variant="default"
                disabled={!chapter.nextChapterId}
                onClick={() => handleOpenChapter(chapter.nextChapterId)}
              >
                Previous Chapter
              </Button>
              <Button
                variant="filled"
                disabled={!chapter.previousChapterId}
                onClick={() => handleOpenChapter(chapter.previousChapterId)}
              >
                Next Chapter
              </Button>
            </div>
          </Paper>
        )}
      </Stack>
    </div>
  );
};
