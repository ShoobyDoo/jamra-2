import { Text, Title } from "@mantine/core";
import React from "react";

export const ExtensionsPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-6xl">
      <Title order={1} className="mb-6">
        Extensions
      </Title>
      <Text className="text-gray-600">
        TODO: Show list of extensions, installation options, extension details,
        and source list information
      </Text>
    </div>
  );
};
