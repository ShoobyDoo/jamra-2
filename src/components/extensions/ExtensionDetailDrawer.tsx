import { Badge, Drawer, Group, Loader, Stack, Text, Title, Code, Alert } from "@mantine/core";
import { IconAlertCircle, IconPlugConnected } from "@tabler/icons-react";
import React from "react";
import { useExtension } from "../../hooks/queries/useExtensionsQueries";

interface ExtensionDetailDrawerProps {
  extensionId: string | null;
  opened: boolean;
  onClose: () => void;
}

export const ExtensionDetailDrawer: React.FC<ExtensionDetailDrawerProps> = ({
  extensionId,
  opened,
  onClose,
}) => {
  const { data: extension, isLoading, error } = useExtension(extensionId ?? undefined);

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconPlugConnected size={24} className="text-blue-600" />
          <Title order={3}>Extension Details</Title>
        </Group>
      }
      position="right"
      size="lg"
    >
      {isLoading && (
        <Group>
          <Loader size="sm" />
          <Text>Loading extension details...</Text>
        </Group>
      )}

      {error && (
        <Alert color="red" icon={<IconAlertCircle size={16} />}>
          Failed to load extension: {error instanceof Error ? error.message : "Unknown error"}
        </Alert>
      )}

      {extension && (
        <Stack gap="lg">
          {/* Basic Info */}
          <div>
            <Text size="sm" c="dimmed" mb={4}>
              Name
            </Text>
            <Title order={4}>{extension.name}</Title>
          </div>

          <Group>
            <div>
              <Text size="sm" c="dimmed" mb={4}>
                Version
              </Text>
              <Badge size="lg" variant="light">
                v{extension.version}
              </Badge>
            </div>

            <div>
              <Text size="sm" c="dimmed" mb={4}>
                Status
              </Text>
              <Badge
                size="lg"
                color={extension.enabled ? "green" : "gray"}
                variant={extension.enabled ? "filled" : "light"}
              >
                {extension.enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </Group>

          {/* Metadata */}
          <div>
            <Text size="sm" c="dimmed" mb={4}>
              Extension ID
            </Text>
            <Code block>{extension.id}</Code>
          </div>

          <div>
            <Text size="sm" c="dimmed" mb={4}>
              Slug
            </Text>
            <Text>{extension.slug}</Text>
          </div>

          <div>
            <Text size="sm" c="dimmed" mb={4}>
              Repository Source
            </Text>
            <Text size="sm">{extension.repoSource}</Text>
          </div>

          <div>
            <Text size="sm" c="dimmed" mb={4}>
              Install Path
            </Text>
            <Code block>{extension.installPath}</Code>
          </div>

          <div>
            <Text size="sm" c="dimmed" mb={4}>
              Installed At
            </Text>
            <Text>{new Date(extension.installedAt).toLocaleString()}</Text>
          </div>

          {/* Manifest */}
          <div>
            <Text size="sm" c="dimmed" mb={4}>
              Manifest
            </Text>
            <Code block className="max-h-96 overflow-auto">
              {JSON.stringify(extension.manifest, null, 2)}
            </Code>
          </div>

          {/* Languages */}
          {extension.manifest.languages && extension.manifest.languages.length > 0 && (
            <div>
              <Text size="sm" c="dimmed" mb={8}>
                Supported Languages
              </Text>
              <Group gap="xs">
                {extension.manifest.languages.map((lang) => (
                  <Badge key={lang} variant="outline">
                    {lang}
                  </Badge>
                ))}
              </Group>
            </div>
          )}
        </Stack>
      )}
    </Drawer>
  );
};
