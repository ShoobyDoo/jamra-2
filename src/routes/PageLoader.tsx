import { Center, Loader } from "@mantine/core";
import React from "react";

// Loading fallback component
export const PageLoader: React.FC = () => (
  <Center className="min-h-[60vh]">
    <Loader size="lg" color="dark" />
  </Center>
);
