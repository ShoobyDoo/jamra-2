import { ActionIcon, Alert, Badge, Card, Group, Loader, Stack, Table, Text, Title } from "@mantine/core";
import { IconAlertCircle, IconEye, IconPlugConnected } from "@tabler/icons-react";
import React from "react";
import { useExtensionsList } from "../../hooks/queries/useExtensionsQueries";

interface InstalledExtensionsListProps {
  onViewDetails?: (extensionId: string) => void;
}

export const InstalledExtensionsList: React.FC<InstalledExtensionsListProps> = ({
  onViewDetails,
}) => {
  const { data, isLoading, error } = useExtensionsList();

  if (isLoading) {
    return (
      <Card className="p-6">
        <Group>
          <Loader size="sm" />
          <Text>Loading installed extensions...</Text>
        </Group>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert color="red" icon={<IconAlertCircle size={16} />}>
        Failed to load extensions: {error instanceof Error ? error.message : "Unknown error"}
      </Alert>
    );
  }

  const extensions = data?.extensions ?? [];

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Installed Extensions</Title>
        <Text size="sm" c="dimmed">
          {extensions.length} extension{extensions.length !== 1 ? "s" : ""} installed
        </Text>
      </div>

      {extensions.length === 0 ? (
        <Alert color="blue">
          No extensions installed yet. Install extensions from the catalog below.
        </Alert>
      ) : (
        <Card className="p-0">
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Version</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Source</Table.Th>
                <Table.Th>Installed</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {extensions.map((ext) => (
                <Table.Tr key={ext.id}>
                  <Table.Td>
                    <Group gap="xs">
                      <IconPlugConnected size={20} className="text-blue-600" />
                      <Text fw={500}>{ext.name}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge size="sm" variant="light">
                      v{ext.version}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      size="sm"
                      color={ext.enabled ? "green" : "gray"}
                      variant={ext.enabled ? "filled" : "light"}
                    >
                      {ext.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed" lineClamp={1}>
                      {ext.repoSource}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {ext.installedAt
                        ? new Date(ext.installedAt).toLocaleDateString()
                        : "Unknown"}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon
                      variant="light"
                      color="blue"
                      aria-label={`View ${ext.name} details`}
                      onClick={() => onViewDetails?.(ext.id)}
                    >
                      <IconEye size={16} />
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
