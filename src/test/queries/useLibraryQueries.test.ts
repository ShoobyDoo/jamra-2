import { QueryClient } from "@tanstack/react-query";
import { waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  useAddToLibrary,
  useLibraryItem,
  useLibraryList,
  useLibraryStats,
  useRemoveFromLibrary,
  useToggleFavorite,
  useUpdateLibraryItem,
} from "../../hooks/queries/useLibraryQueries";
import { createTestQueryClient, renderHook } from "../utils";

describe("Library Query Hooks", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  describe("useLibraryList", () => {
    it("fetches library list successfully", async () => {
      const { result } = renderHook(() => useLibraryList(), { queryClient });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.items).toHaveLength(2);
      expect(result.current.data?.total).toBe(2);
      expect(result.current.data?.items[0].title).toBe("One Piece");
    });

    it("fetches library list with status filter", async () => {
      const { result } = renderHook(
        () => useLibraryList({ status: "reading" }),
        { queryClient },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.items).toHaveLength(1);
      expect(result.current.data?.items[0].status).toBe("reading");
    });

    it("fetches library list with favorite filter", async () => {
      const { result } = renderHook(() => useLibraryList({ favorite: true }), {
        queryClient,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.items).toHaveLength(1);
      expect(result.current.data?.items[0].favorite).toBe(true);
    });

    it("fetches library list with search query", async () => {
      const { result } = renderHook(
        () => useLibraryList({ search: "naruto" }),
        { queryClient },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.items).toHaveLength(1);
      expect(result.current.data?.items[0].title).toBe("Naruto");
    });
  });

  describe("useLibraryItem", () => {
    it("fetches single library item successfully", async () => {
      const { result } = renderHook(() => useLibraryItem("lib-1"), {
        queryClient,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.id).toBe("lib-1");
      expect(result.current.data?.title).toBe("One Piece");
    });

    it("handles non-existent library item", async () => {
      const { result } = renderHook(() => useLibraryItem("non-existent"), {
        queryClient,
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.data).toBeUndefined();
    });
  });

  describe("useLibraryStats", () => {
    it("fetches library stats successfully", async () => {
      const { result } = renderHook(() => useLibraryStats(), { queryClient });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.total).toBe(25);
      expect(result.current.data?.reading).toBe(12);
      expect(result.current.data?.completed).toBe(8);
    });
  });

  describe("useAddToLibrary", () => {
    it("adds manga to library successfully", async () => {
      const { result } = renderHook(() => useAddToLibrary(), { queryClient });

      result.current.mutate({
        extensionId: "batoto",
        mangaId: "manga-3",
        status: "reading",
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.extensionId).toBe("batoto");
      expect(result.current.data?.mangaId).toBe("manga-3");
      expect(result.current.data?.status).toBe("reading");
    });
  });

  describe("useUpdateLibraryItem", () => {
    it("updates library item status successfully", async () => {
      const { result } = renderHook(() => useUpdateLibraryItem("lib-1"), {
        queryClient,
      });

      result.current.mutate({
        status: "completed",
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.status).toBe("completed");
    });
  });

  describe("useToggleFavorite", () => {
    it("toggles favorite status successfully", async () => {
      const { result } = renderHook(() => useToggleFavorite("lib-2"), {
        queryClient,
      });

      result.current.mutate({
        favorite: true,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.favorite).toBe(true);
    });
  });

  describe("useRemoveFromLibrary", () => {
    it("removes item from library successfully", async () => {
      const { result } = renderHook(() => useRemoveFromLibrary("lib-1"), {
        queryClient,
      });

      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });
});
