import { lazy } from "react";
import { createBrowserRouter, type RouteObject } from "react-router";
import { AppLayout } from "../components/AppLayout";
import { LazyPage } from "./LazyPage";
import { ROUTES } from "./routes.config";

// Lazy load pages for code splitting
const LibraryPage = lazy(() => import("../pages/LibraryPage").then(module => ({ default: module.LibraryPage })));
const MangaDetailsPage = lazy(() => import("../pages/MangaDetailsPage").then(module => ({ default: module.MangaDetailsPage })));
const ReaderPage = lazy(() => import("../pages/ReaderPage").then(module => ({ default: module.ReaderPage })));
const DownloadsPage = lazy(() => import("../pages/DownloadsPage").then(module => ({ default: module.DownloadsPage })));
const SettingsPage = lazy(() => import("../pages/SettingsPage").then(module => ({ default: module.SettingsPage })));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage").then(module => ({ default: module.NotFoundPage })));
const ErrorPage = lazy(() => import("../pages/ErrorPage").then(module => ({ default: module.ErrorPage })));

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
      // Home redirects to library
      {
        index: true,
        element: (
          <LazyPage>
            <LibraryPage />
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

      // Downloads page
      {
        path: ROUTES.DOWNLOADS,
        element: (
          <LazyPage>
            <DownloadsPage />
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
 * Create and export the router instance
 */
export const router = createBrowserRouter(routeConfig);
