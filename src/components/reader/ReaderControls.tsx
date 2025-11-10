import { ActionIcon, Group } from "@mantine/core";
import React from "react";

interface ReaderControlsProps {
  onPrevPage: () => void;
  onNextPage: () => void;
  onToggleFullscreen: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
}

export const ReaderControls: React.FC<ReaderControlsProps> = ({
  onPrevPage,
  onNextPage,
  onToggleFullscreen,
  canGoPrev,
  canGoNext,
}) => {
  return (
    <Group gap="md" className="p-4">
      <ActionIcon
        variant="filled"
        size="lg"
        onClick={onPrevPage}
        disabled={!canGoPrev}
        aria-label="Previous page"
      >
        ←
      </ActionIcon>
      <ActionIcon
        variant="filled"
        size="lg"
        onClick={onNextPage}
        disabled={!canGoNext}
        aria-label="Next page"
      >
        →
      </ActionIcon>
      <ActionIcon
        variant="outline"
        size="lg"
        onClick={onToggleFullscreen}
        aria-label="Toggle fullscreen"
      >
        ⛶
      </ActionIcon>
    </Group>
  );
};
