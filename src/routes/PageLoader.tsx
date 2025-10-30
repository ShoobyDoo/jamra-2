import React from 'react';
import { Center, Loader } from "@mantine/core";

// Loading fallback component
export const PageLoader: React.FC = () => (
  <Center className="min-h-[60vh]">
    <Loader size="lg" color="dark" />
  </Center>
);
