import { QueryClient } from "@tanstack/react-query";
import { waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  useExtensionChapters,
  useExtensionDetails,
  useExtensionMangaDetails,
  useExtensionSearch,
  useExtensionsList,
} from "../../hooks/queries/useExtensionsQueries";
import { createTestQueryClient, renderHook } from "../utils";

describe("Extensions Query Hooks", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  describe("useExtensionsList", () => {
    it("fetches extensions list successfully", async () => {
      const { result } = renderHook(() => useExtensionsList(), { queryClient });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.extensions).toHaveLength(2);
      expect(result.current.data?.extensions[0].id).toBe("batoto");
      expect(result.current.data?.extensions[0].name).toBe("Batoto");
    });
  });

  describe("useExtensionDetails", () => {
    it("fetches single extension successfully", async () => {
      const { result } = renderHook(() => useExtensionDetails("batoto"), {
        queryClient,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.id).toBe("batoto");
      expect(result.current.data?.name).toBe("Batoto");
      expect(result.current.data?.enabled).toBe(true);
    });

    it("handles non-existent extension", async () => {
      const { result } = renderHook(() => useExtensionDetails("non-existent"), {
        queryClient,
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.data).toBeUndefined();
    });
  });

  describe("useExtensionSearch", () => {
    it("searches extension successfully", async () => {
      const { result } = renderHook(
        () => useExtensionSearch("batoto", { query: "one piece" }),
        { queryClient },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.results).toHaveLength(1);
      expect(result.current.data?.results[0].title).toBe("One Piece");
    });

    it("filters search results by query", async () => {
      const { result } = renderHook(
        () => useExtensionSearch("batoto", { query: "naruto" }),
        { queryClient },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.results).toHaveLength(1);
      expect(result.current.data?.results[0].title).toBe("Naruto");
    });

    it("returns empty results for no matches", async () => {
      const { result } = renderHook(
        () => useExtensionSearch("batoto", { query: "nonexistent" }),
        { queryClient },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.results).toHaveLength(0);
    });
  });

  describe("useExtensionMangaDetails", () => {
    it("fetches manga details successfully", async () => {
      const { result } = renderHook(
        () => useExtensionMangaDetails("batoto", "manga-1"),
        { queryClient },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.id).toBe("manga-1");
      expect(result.current.data?.title).toBe("One Piece");
      expect(result.current.data?.authors).toContain("Eiichiro Oda");
      expect(result.current.data?.chapters).toHaveLength(2);
    });

    it("handles non-existent manga", async () => {
      const { result } = renderHook(
        () => useExtensionMangaDetails("batoto", "non-existent"),
        { queryClient },
      );

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.data).toBeUndefined();
    });
  });

  describe("useExtensionChapters", () => {
    it("fetches chapters successfully", async () => {
      const { result } = renderHook(
        () => useExtensionChapters("batoto", "manga-1"),
        { queryClient },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.chapters).toHaveLength(2);
      expect(result.current.data?.chapters[0].id).toBe("ch-100");
      expect(result.current.data?.chapters[0].number).toBe("100");
    });
  });
});
