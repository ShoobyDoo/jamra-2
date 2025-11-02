import { Carousel } from "@mantine/carousel";
import { Anchor, Title } from "@mantine/core";
import React from "react";
import { ContinueReadingCard } from "../components/home/ContinueReadingCard";

export const HomePage: React.FC = () => {
  // Mock data for Continue Reading
  const continueReadingData = [
    {
      id: "1",
      title: "One Piece",
      lastChapter: 1095,
      progress: 67,
      updatedAt: "2 hours ago",
    },
    {
      id: "2",
      title: "Jujutsu Kaisen",
      lastChapter: 245,
      progress: 23,
      updatedAt: "Yesterday",
    },
    {
      id: "3",
      title: "My Hero Academia",
      lastChapter: 412,
      progress: 89,
      updatedAt: "3 days ago",
    },
    {
      id: "4",
      title: "Attack on Titan",
      lastChapter: 139,
      progress: 45,
      updatedAt: "1 week ago",
    },
    {
      id: "5",
      title: "Demon Slayer",
      lastChapter: 205,
      progress: 12,
      updatedAt: "2 weeks ago",
    },
  ];

  const handleViewAllContinueReading = () => {
    // TODO: Navigate to continue reading page or library
    console.log("View all continue reading");
  };

  return (
    <div className="mx-auto max-w-7xl">
      {/* Continue Reading Section */}
      <div className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <Title order={1}>Continue Reading</Title>
          <Anchor
            component="button"
            onClick={handleViewAllContinueReading}
            className="text-blue-600 hover:underline"
          >
            View All
          </Anchor>
        </div>

        {/* Temp - might replace with simple grid + custom cards instead */}
        <Carousel
          slideSize="280px"
          slideGap="md"
          withControls
          withIndicators={false}
          classNames={{
            root: "w-full",
            viewport: "overflow-visible",
          }}
        >
          {continueReadingData.map((item) => (
            <Carousel.Slide key={item.id}>
              <ContinueReadingCard {...item} />
            </Carousel.Slide>
          ))}
        </Carousel>
      </div>
    </div>
  );
};
