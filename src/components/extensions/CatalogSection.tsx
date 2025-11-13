import { ActionIcon, Alert, Badge, Button, Card, Group, Loader, Stack, Table, Text, Title } from "@mantine/core";
import { IconAlertCircle, IconDownload, IconRefresh } from "@tabler/icons-react";
import React from "react";
import { useCatalogList, useCatalogSync } from "../../hooks/queries/useCatalogQueries";
import { notifications } from "@mantine/notifications";

interface CatalogSectionProps {
  onInstallClick?: (extensionId: string) => void;
}

export const CatalogSection: React.FC<CatalogSectionProps> = ({ onInstallClick }) => {
  const { data, isLoading, error } = useCatalogList();
  const syncMutation = useCatalogSync();

  const handleSync = () => {
    syncMutation.mutate(undefined, {
      onSuccess: (data) => {
        notifications.show({
          title: "Catalog Synced",
          message: `Updated ${data.result.entriesUpdated} entries, removed ${data.result.entriesRemoved}`,
          color: "green",
        });
      },
      onError: (error) => {
        notifications.show({
          title: "Sync Failed",
          message: error instanceof Error ? error.message : "Failed to sync catalog",
          color: "red",
        });
      },
    });
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <Group>
          <Loader size="sm" />
          <Text>Loading catalog...</Text>
        </Group>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert color="red" icon={<IconAlertCircle size={16} />}>
        Failed to load catalog: {error instanceof Error ? error.message : "Unknown error"}
      </Alert>
    );
  }

  const entries = data?.entries ?? [];

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <div>
          <Title order={2}>Extension Catalog</Title>
          <Text size="sm" c="dimmed">
            Available extensions from registered repositories
          </Text>
        </div>
        <Button
          leftSection={<IconRefresh size={16} />}
          onClick={handleSync}
          loading={syncMutation.isPending}
        >
          Sync Catalog
        </Button>
      </Group>

      {entries.length === 0 ? (
        <Alert color="blue">
          No catalog entries found. Click "Sync Catalog" to fetch the latest extensions.
        </Alert>
      ) : (
        <Card className="p-0">
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Version</Table.Th>
                <Table.Th>Language</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {entries.map((entry) => (
                <Table.Tr key={entry.id}>
                  <Table.Td>
                    <Group gap="xs">
                      {entry.iconUrl && (
                        <img
                          src={entry.iconUrl}
                          alt={entry.name}
                          className="h-6 w-6 rounded object-cover"
                        />
                      )}
                      <Text fw={500}>{entry.name}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge size="sm" variant="light">
                      v{entry.version}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {entry.language ? (
                      <Badge size="sm" variant="outline">
                        {entry.language}
                      </Badge>
                    ) : (
                      <Text c="dimmed" size="sm">
                        N/A
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" lineClamp={1} c="dimmed">
                      {entry.description || "No description"}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon
                      variant="light"
                      color="blue"
                      aria-label={`Install ${entry.name}`}
                      onClick={() => onInstallClick?.(entry.id)}
                    >
                      <IconDownload size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      )}
    </Stack>
  );
};
