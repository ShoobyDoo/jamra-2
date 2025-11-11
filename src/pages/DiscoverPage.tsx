import {
  Badge,
  Button,
  Paper,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { IconFlame, IconSearch } from "@tabler/icons-react";
import React, { useState } from "react";

const trendingManga = [
  {
    id: "one-piece",
    title: "One Piece",
    source: "WeebCentral",
    tags: ["Adventure", "Shounen", "Weekly"],
  },
  {
    id: "jjk",
    title: "Jujutsu Kaisen",
    source: "MangaDex",
    tags: ["Action", "Dark Fantasy"],
  },
  {
    id: "solo-leveling",
    title: "Solo Leveling",
    source: "Batoto",
    tags: ["Manhwa", "Trending"],
  },
  {
    id: "dandadan",
    title: "Dandadan",
    source: "WeebCentral",
    tags: ["Sci-Fi", "Comedy"],
  },
  {
    id: "berserk",
    title: "Berserk",
    source: "ComicK",
    tags: ["Seinen", "Classic"],
  },
  {
    id: "frieren",
    title: "Frieren: Beyond Journey's End",
    source: "MangaDex",
    tags: ["Fantasy", "Drama"],
  },
];

export const DiscoverPage: React.FC = () => {
  const [query, setQuery] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: Wire up actual search + extension selection
    console.log("Search query:", query);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4">
      <section className="mb-12 text-center">
        <Title order={1} className="mb-3">
          Discover
        </Title>
        <Text className="mx-auto mb-6 max-w-2xl text-gray-600">
          Search across your installed extensions or dive into what readers are
          loving right now.
        </Text>
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
          <Paper
            shadow="sm"
            radius="xl"
            className="flex flex-col gap-3 border border-gray-200 p-4 sm:flex-row"
          >
            <TextInput
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="Search title, author, or extension"
              radius="xl"
              size="md"
              leftSection={<IconSearch size={18} />}
              className="flex-1"
            />
            <Button
              type="submit"
              radius="xl"
              size="md"
              className="w-full sm:w-auto"
            >
              Search
            </Button>
          </Paper>
        </form>
      </section>

      <section>
        <div className="mb-5 flex items-center gap-2">
          <IconFlame size={20} className="text-orange-500" />
          <Title order={3}>Hot & Trending</Title>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trendingManga.map((manga) => (
            <Paper
              key={manga.id}
              withBorder
              radius="lg"
              className="flex h-full flex-col gap-3 p-4"
            >
              <div>
                <Text fw={600}>{manga.title}</Text>
                <Text size="xs" c="dimmed">
                  Source: {manga.source}
                </Text>
              </div>
              <div className="flex flex-wrap gap-2">
                {manga.tags.map((tag) => (
                  <Badge key={tag} size="xs" radius="sm" variant="light">
                    {tag}
                  </Badge>
                ))}
              </div>
            </Paper>
          ))}
        </div>
      </section>
    </div>
  );
};
