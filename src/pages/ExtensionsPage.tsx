import { Divider, Stack, Title } from "@mantine/core";
import React, { useState } from "react";
import { CatalogSection } from "../components/extensions/CatalogSection";
import { ExtensionDetailDrawer } from "../components/extensions/ExtensionDetailDrawer";
import { InstalledExtensionsList } from "../components/extensions/InstalledExtensionsList";
import { InstallerForm } from "../components/extensions/InstallerForm";

export const ExtensionsPage: React.FC = () => {
  const [selectedExtensionId, setSelectedExtensionId] = useState<string | null>(null);
  const [drawerOpened, setDrawerOpened] = useState(false);

  const handleViewDetails = (extensionId: string) => {
    setSelectedExtensionId(extensionId);
    setDrawerOpened(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpened(false);
    setSelectedExtensionId(null);
  };

  return (
    <div className="mx-auto max-w-7xl">
      <Title order={1} className="mb-6">
        Extensions
      </Title>

      <Stack gap="xl">
        {/* Install Extension Section */}
        <InstallerForm />

        <Divider />

        {/* Installed Extensions List */}
        <InstalledExtensionsList onViewDetails={handleViewDetails} />

        <Divider />

        {/* Catalog Section */}
        <CatalogSection />
      </Stack>

      {/* Extension Detail Drawer */}
      <ExtensionDetailDrawer
        extensionId={selectedExtensionId}
        opened={drawerOpened}
        onClose={handleCloseDrawer}
      />
    </div>
  );
};
