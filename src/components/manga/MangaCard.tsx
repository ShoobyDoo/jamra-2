import { Badge, Button, Card, Group, Image, Text } from "@mantine/core";
import { IconBook } from "@tabler/icons-react";
import React from "react";
import { useNavigate } from "react-router";
import type { ExtensionSearchResult } from "../../types";
import { buildRoute } from "../../routes/routes.config";

interface MangaCardProps {
  extensionId: string;
  extensionName?: string;
  result: ExtensionSearchResult;
  onSelect?: (result: ExtensionSearchResult) => void;
}

export const MangaCard: React.FC<MangaCardProps> = ({
  extensionId,
  extensionName,
  result,
  onSelect,
}) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    if (onSelect) {
      onSelect(result);
      return;
    }
    navigate(buildRoute.mangaDetails(extensionId, result.id));
  };

  return (
    <Card withBorder radius="md" padding="md" className="flex flex-col gap-3">
      <Card.Section>
        {result.coverUrl ? (
          <Image
            src={result.coverUrl}
            alt={result.title}
            height={220}
            fit="cover"
            loading="lazy"
            fallbackSrc="https://placehold.co/600x800?text=No+Cover"
          />
        ) : (
          <div className="flex h-56 items-center justify-center bg-gray-50 text-sm text-gray-400">
            <IconBook size={40} />
          </div>
        )}
      </Card.Section>

      <div className="flex flex-1 flex-col gap-2">
        <Text fw={600} lineClamp={2}>
          {result.title}
        </Text>
        {extensionName && (
          <Text size="xs" c="dimmed">
            {extensionName}
          </Text>
        )}
        {result.description && (
          <Text size="sm" c="dimmed" lineClamp={3}>
            {result.description}
          </Text>
        )}
        <Group gap="xs">
          {result.status && (
            <Badge size="sm" variant="light">
              {result.status}
            </Badge>
          )}
          {result.lang && (
            <Badge size="sm" color="gray" variant="outline">
              {result.lang.toUpperCase()}
            </Badge>
          )}
        </Group>
        <Button variant="light" radius="md" size="xs" mt="auto" onClick={handleViewDetails}>
          View details
        </Button>
      </div>
    </Card>
  );
};
