import React from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { Breadcrumbs as MantineBreadcrumbs, Skeleton } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import { useManga } from '../../hooks/queries/useMangaQueries';
import { useChapter } from '../../hooks/queries/useChapterQueries';
import { ROUTE_LABELS, SEGMENT_FALLBACKS } from '../../constants/routes';

interface BreadcrumbSegment {
  label: string;
  path: string | null; // null means not clickable (current page or loading)
  isLoading?: boolean;
}

/**
 * Smart breadcrumbs component that shows the current navigation path
 * Handles dynamic routes and provides contextual fallbacks for non-navigable segments
 */
export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const params = useParams();
  const [segments, setSegments] = React.useState<BreadcrumbSegment[]>([]);

  // Fetch chapter data first if on reader page (to get mangaId)
  const { data: chapter, isLoading: isChapterLoading } = useChapter(params.chapterId || '');

  // Fetch manga data if on manga or reader page
  const mangaId = params.id || chapter?.mangaId;
  const { data: manga, isLoading: isMangaLoading } = useManga(mangaId || '');

  React.useEffect(() => {
    const buildBreadcrumbs = () => {
      const pathSegments = location.pathname.split('/').filter(Boolean);
      const breadcrumbSegments: BreadcrumbSegment[] = [];

      // Always start with Home
      if (location.pathname !== '/') {
        breadcrumbSegments.push({
          label: 'Home',
          path: '/',
        });
      }

      // Build path progressively
      let currentPath = '';

      for (let i = 0; i < pathSegments.length; i++) {
        const segment = pathSegments[i];
        currentPath += `/${segment}`;

        // Check if this is a dynamic route segment
        if (segment === 'manga' && params.id) {
          // Add "Discover" before manga details
          breadcrumbSegments.push({
            label: 'Discover',
            path: '/discover',
          });

          // Add manga title or loading
          if (isMangaLoading) {
            breadcrumbSegments.push({
              label: 'Loading...',
              path: null,
              isLoading: true,
            });
          } else if (manga) {
            // Current page if it's the last segment, otherwise clickable
            const isCurrentPage = i === pathSegments.length - 1;
            breadcrumbSegments.push({
              label: manga.title,
              path: isCurrentPage ? null : `/manga/${params.id}`,
            });
          } else {
            breadcrumbSegments.push({
              label: 'Manga Details',
              path: null,
            });
          }
        } else if (segment === 'reader' && params.chapterId) {
          // If we haven't added manga yet, add Discover first
          const hasMangaSegment = breadcrumbSegments.some(s => s.path?.includes('/manga/'));
          if (!hasMangaSegment && manga) {
            breadcrumbSegments.push({
              label: 'Discover',
              path: '/discover',
            });
            breadcrumbSegments.push({
              label: manga.title,
              path: `/manga/${manga.id}`,
            });
          }

          // Add chapter info
          if (isChapterLoading) {
            breadcrumbSegments.push({
              label: 'Loading...',
              path: null,
              isLoading: true,
            });
          } else if (chapter) {
            breadcrumbSegments.push({
              label: `Chapter ${chapter.chapterNumber}${chapter.title ? `: ${chapter.title}` : ''}`,
              path: null, // Current page, not clickable
            });
          } else {
            breadcrumbSegments.push({
              label: 'Reader',
              path: null,
            });
          }
        } else {
          // Static route
          const routePath = currentPath;
          const label = ROUTE_LABELS[routePath] || segment.charAt(0).toUpperCase() + segment.slice(1);

          // Current page is not clickable
          const isCurrentPage = i === pathSegments.length - 1;

          breadcrumbSegments.push({
            label,
            path: isCurrentPage ? null : routePath,
          });
        }
      }

      // If we're on home page, show just "Home"
      if (breadcrumbSegments.length === 0) {
        breadcrumbSegments.push({
          label: 'Home',
          path: null,
        });
      }

      setSegments(breadcrumbSegments);
    };

    buildBreadcrumbs();
  }, [location.pathname, params, manga, chapter, isMangaLoading, isChapterLoading]);

  return (
    <MantineBreadcrumbs
      separator={<IconChevronRight size={14} stroke={1.5} className="text-gray-400" />}
      classNames={{
        root: 'text-gray-700',
        separator: 'mx-1',
        breadcrumb: 'text-sm pb-0.5',
      }}
    >
      {segments.map((segment, index) => {
        if (segment.isLoading) {
          return (
            <Skeleton key={index} height={20} width={80} className="bg-gray-200" />
          );
        }

        if (segment.path) {
          // Clickable breadcrumb
          return (
            <Link
              key={index}
              to={segment.path}
              className="text-gray-600 hover:text-blue-600 transition-colors no-underline hover:underline max-w-[200px] truncate inline-block"
            >
              {segment.label}
            </Link>
          );
        }

        // Current page (not clickable)
        return (
          <span
            key={index}
            className="text-gray-900 font-semibold max-w-[200px] truncate inline-block"
          >
            {segment.label}
          </span>
        );
      })}
    </MantineBreadcrumbs>
  );
};
