import { Badge, Card, Group, Text } from "@mantine/core";
import React from "react";

interface MangaCardProps {
  id: string;
  title: string;
  coverUrl?: string;
  status?: "ongoing" | "completed" | "hiatus";
}

export const MangaCard: React.FC<MangaCardProps> = ({ title, status }) => {
  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      className="cursor-pointer border border-gray-200 transition-all hover:border-gray-400"
    >
      {/* TODO: Add cover image */}
      <Text fw={600} className="mb-2">
        {title}
      </Text>
      <Group>{status && <Badge color="gray">{status}</Badge>}</Group>
    </Card>
  );
};
