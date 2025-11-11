import { ActionIcon, Card, Progress, Text, Tooltip } from "@mantine/core";
import { IconBook } from "@tabler/icons-react";
import React from "react";

interface ContinueReadingCardProps {
  id: string;
  title: string;
  coverUrl?: string;
  lastChapter: number;
  progress: number;
  updatedAt: string;
  onContinue?: (id: string) => void;
  onOpenDetails?: (id: string) => void;
}

export const ContinueReadingCard: React.FC<ContinueReadingCardProps> = ({
  id,
  title,
  coverUrl,
  lastChapter,
  progress,
  updatedAt,
  onContinue,
  onOpenDetails,
}) => {
  const handleContinue = () => {
    onContinue?.(id);
  };

  const handleDetailsClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onOpenDetails?.(id);
  };

  return (
    <Card
      padding={0}
      radius="lg"
      withBorder={false}
      style={{ aspectRatio: "2 / 3" }}
      className="group relative mx-auto w-full max-w-44 cursor-pointer overflow-hidden border border-white/10 bg-gray-900/30 text-white ring-1 ring-white/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl sm:max-w-48"
      onClick={handleContinue}
    >
      <div
        className={`absolute inset-0 bg-cover bg-center contrast-95 saturate-100 transition-transform duration-500 ease-out group-hover:scale-105 group-hover:contrast-105 group-hover:saturate-125 ${
          coverUrl ? "" : "bg-linear-to-br from-gray-200 to-gray-400"
        }`}
        style={{
          backgroundImage: coverUrl ? `url(${coverUrl})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-black/20 transition-all duration-500 group-hover:bg-black/10" />
      <div className="absolute inset-x-0 top-0 z-1 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.95)_0%,rgba(0,0,0,0.8)_20%,rgba(0,0,0,0.6)_40%,rgba(0,0,0,0.35)_60%,rgba(0,0,0,0.15)_80%,transparent_100%)] p-3 text-white">
        <div className="flex items-start gap-2">
          <Text
            fw={600}
            size="sm"
            c="white"
            className="flex-1 truncate break-all"
            title={title}
          >
            {title}
          </Text>
          <Tooltip label="Manga Details" withArrow position="bottom">
            <ActionIcon
              variant="filled"
              color="blue"
              size="md"
              radius="md"
              onClick={handleDetailsClick}
              aria-label="Open manga details"
              className="shadow-sm transition-transform duration-200 hover:scale-105"
            >
              <IconBook size={16} />
            </ActionIcon>
          </Tooltip>
        </div>
        <Text size="xs" c="white" fw={500} className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          Chapter {lastChapter}
        </Text>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-1 bg-[linear-gradient(to_top,rgba(0,0,0,0.95)_0%,rgba(0,0,0,0.85)_20%,rgba(0,0,0,0.65)_40%,rgba(0,0,0,0.4)_60%,rgba(0,0,0,0.15)_80%,transparent_100%)] p-3 text-white">
        <div className="mb-2 flex items-center justify-between text-xs tracking-wide text-white uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} size="sm" radius="xl" color="blue" />
        <div className="mt-2 text-xs text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          Updated {updatedAt}
        </div>
      </div>
    </Card>
  );
};
