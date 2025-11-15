import { lazy } from "react";
import { createHashRouter, type RouteObject } from "react-router";
import { AppLayout } from "../components/AppLayout";
import { LazyPage } from "./LazyPage";
import { ROUTES } from "./routes.config";

// Main accessable routes
const HomePage = lazy(() =>
  import("../pages/HomePage").then((module) => ({
    default: module.HomePage,
  })),
);
const DiscoverPage = lazy(() =>
  import("../pages/DiscoverPage").then((module) => ({
    default: module.DiscoverPage,
  })),
);
const LibraryPage = lazy(() =>
  import("../pages/LibraryPage").then((module) => ({
    default: module.LibraryPage,
  })),
);
const DownloadsPage = lazy(() =>
  import("../pages/DownloadsPage").then((module) => ({
    default: module.DownloadsPage,
  })),
);
const HistoryPage = lazy(() =>
  import("../pages/HistoryPage").then((module) => ({
    default: module.HistoryPage,
  })),
);
const ExtensionsPage = lazy(() =>
  import("../pages/ExtensionsPage").then((module) => ({
    default: module.ExtensionsPage,
  })),
);
const SettingsPage = lazy(() =>
  import("../pages/SettingsPage").then((module) => ({
    default: module.SettingsPage,
  })),
);

// Not traditionally accesible routes (triggered by something)
const MangaDetailsPage = lazy(() =>
  import("../pages/MangaDetailsPage").then((module) => ({
    default: module.MangaDetailsPage,
  })),
);
const ReaderPage = lazy(() =>
  import("../pages/ReaderPage").then((module) => ({
    default: module.ReaderPage,
  })),
);
const NotFoundPage = lazy(() =>
  import("../pages/NotFoundPage").then((module) => ({
    default: module.NotFoundPage,
  })),
);
const ErrorPage = lazy(() =>
  import("../pages/ErrorPage").then((module) => ({
    default: module.ErrorPage,
  })),
);

/**
 * Manga Reader Route Configuration
 *
 * Features:
 * - Lazy loading for code splitting
 * - Error boundaries per route
 * - 404 handling
 * - Nested routes with layout
 * - Type-safe route structure
 */
const routeConfig: RouteObject[] = [
  {
    path: ROUTES.HOME,
    element: <AppLayout />,
    errorElement: (
      <LazyPage>
        <ErrorPage />
      </LazyPage>
    ),
    children: [
      // Home page (Root route)
      {
        index: true,
        element: (
          <LazyPage>
            <HomePage />
          </LazyPage>
        ),
      },

      // Discover page
      {
        path: ROUTES.DISCOVER,
        element: (
          <LazyPage>
            <DiscoverPage />
          </LazyPage>
        ),
      },

      // Library page
      {
        path: ROUTES.LIBRARY,
        element: (
          <LazyPage>
            <LibraryPage />
          </LazyPage>
        ),
      },

      // Downloads page
      {
        path: ROUTES.DOWNLOADS,
        element: (
          <LazyPage>
            <DownloadsPage />
          </LazyPage>
        ),
      },

      // History page
      {
        path: ROUTES.HISTORY,
        element: (
          <LazyPage>
            <HistoryPage />
          </LazyPage>
        ),
      },

      // Extensions page
      {
        path: ROUTES.EXTENSIONS,
        element: (
          <LazyPage>
            <ExtensionsPage />
          </LazyPage>
        ),
      },

      // Settings page
      {
        path: ROUTES.SETTINGS,
        element: (
          <LazyPage>
            <SettingsPage />
          </LazyPage>
        ),
      },

      // Manga details (dynamic route)
      {
        path: ROUTES.MANGA_DETAILS,
        element: (
          <LazyPage>
            <MangaDetailsPage />
          </LazyPage>
        ),
      },

      // Reader page (dynamic route)
      {
        path: ROUTES.READER,
        element: (
          <LazyPage>
            <ReaderPage />
          </LazyPage>
        ),
      },

      // 404 - catch all unmatched routes
      {
        path: ROUTES.NOT_FOUND,
        element: (
          <LazyPage>
            <NotFoundPage />
          </LazyPage>
        ),
      },
    ],
  },
];

/**
 * Create and export the router instance.
 *
 * Hash routing behaves consistently in both browser dev builds (Vite) and the
 * packaged Tauri runtime because it does not rely on an absolute base URL.
 */
export const router = createHashRouter(routeConfig);
