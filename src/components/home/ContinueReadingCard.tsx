import { Card, Progress, Text } from "@mantine/core";
import React from "react";

interface ContinueReadingCardProps {
  title: string;
  coverUrl?: string;
  lastChapter: number;
  progress: number;
  updatedAt: string;
}

export const ContinueReadingCard: React.FC<ContinueReadingCardProps> = ({
  title,
  coverUrl,
  lastChapter,
  progress,
  updatedAt,
}) => {
  const handleClick = () => {
    // TODO: Navigate to reader
    console.log("Continue reading:", title);
  };

  return (
    <Card
      shadow="sm"
      padding="0"
      radius="md"
      className="w-[280px] cursor-pointer transition-transform hover:scale-[1.02]"
      onClick={handleClick}
    >
      {/* Cover Image Placeholder */}
      <div
        className="h-[380px] w-full bg-gradient-to-br from-gray-200 to-gray-300"
        style={{
          backgroundImage: coverUrl ? `url(${coverUrl})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Card Content */}
      <div className="p-4">
        <Text fw={600} lineClamp={2} className="mb-2">
          {title}
        </Text>
        <Text size="sm" c="dimmed" className="mb-3">
          Chapter {lastChapter} • {updatedAt}
        </Text>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Text size="xs" c="dimmed">
              Progress
            </Text>
            <Text size="xs" fw={600} className="text-blue-600">
              {progress}%
            </Text>
          </div>
          <Progress value={progress} size="sm" radius="xl" color="blue" />
        </div>
      </div>
    </Card>
  );
};
