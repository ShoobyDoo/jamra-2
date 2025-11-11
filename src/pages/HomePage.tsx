import { Anchor, Title } from "@mantine/core";
import React from "react";
import { useNavigate } from "react-router";
import { ContinueReadingCard } from "../components/home/ContinueReadingCard";
import { buildRoute } from "../routes/routes.config";

export const HomePage: React.FC = () => {
  // Mock data for Continue Reading
  const continueReadingData = [
    {
      id: "one-piece",
      title: "One Piece",
      coverUrl:
        "https://temp.compsci88.com/cover/normal/01J76XY7E9FNDZ1DBBM6PBJPFK.webp",
      lastChapter: 1095,
      progress: 67,
      updatedAt: "2 hours ago",
    },
    {
      id: "jujutsu-kaisen",
      title: "Jujutsu Kaisen",
      coverUrl:
        "https://temp.compsci88.com/cover/normal/01J76XYCERXE60T7FKXVCCAQ0H.webp",
      lastChapter: 245,
      progress: 23,
      updatedAt: "Yesterday",
    },
    {
      id: "my-hero-academia",
      title: "My Hero Academia",
      coverUrl:
        "https://temp.compsci88.com/cover/normal/01J76XYAE4S59RVPJETN0MFRX5.webp",
      lastChapter: 412,
      progress: 89,
      updatedAt: "3 days ago",
    },
    {
      id: "attack-on-titan",
      title: "Attack on Titan",
      coverUrl:
        "https://temp.compsci88.com/cover/normal/01J76XY7KWP8KX5RFGVZY5TR95.webp",
      lastChapter: 139,
      progress: 45,
      updatedAt: "1 week ago",
    },
    {
      id: "demon-slayer",
      title: "Demon Slayer",
      coverUrl:
        "https://temp.compsci88.com/cover/normal/01J76XYBPP2A7D38XGF4PSQVPD.webp",
      lastChapter: 205,
      progress: 12,
      updatedAt: "2 weeks ago",
    },
  ];

  const navigate = useNavigate();

  const handleViewAllContinueReading = () => {
    // TODO: Navigate to continue reading page or library
    console.log("View all continue reading");
  };

  const handleContinueReading = (id: string) => {
    // TODO: Replace with reader navigation
    console.log("Continue reading:", id);
  };

  const handleOpenMangaDetails = (id: string) => {
    navigate(buildRoute.mangaDetails(id));
  };

  return (
    <div className="mx-auto w-full">
      {/* Continue Reading Section */}
      <section className="mb-10">
        <div className="mb-4 flex flex-wrap items-center justify-between">
          <Title order={2}>Continue Reading</Title>
          <Anchor
            component="button"
            onClick={handleViewAllContinueReading}
            className="text-blue-600 hover:underline"
          >
            View All
          </Anchor>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(176px,192px))] justify-items-center gap-3">
          {continueReadingData.map((item) => (
            <ContinueReadingCard
              key={item.id}
              {...item}
              onContinue={handleContinueReading}
              onOpenDetails={handleOpenMangaDetails}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
