import { QueryClient } from "@tanstack/react-query";
import { waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  useCancelDownload,
  useDownloadDetails,
  useDownloadQueue,
  useDownloadStats,
  useStartDownload,
} from "../../hooks/queries/useDownloadQueries";
import { createTestQueryClient, renderHook } from "../utils";

describe("Download Query Hooks", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  describe("useDownloadQueue", () => {
    it("fetches download queue successfully", async () => {
      const { result } = renderHook(() => useDownloadQueue(), { queryClient });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.downloads).toHaveLength(2);
      expect(result.current.data?.downloads[0].id).toBe("dl-1");
      expect(result.current.data?.downloads[0].status).toBe("completed");
    });

    it("fetches download queue with status filter", async () => {
      const { result } = renderHook(
        () => useDownloadQueue({ status: "downloading" }),
        { queryClient },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.downloads).toHaveLength(1);
      expect(result.current.data?.downloads[0].status).toBe("downloading");
    });
  });

  describe("useDownloadDetails", () => {
    it("fetches single download successfully", async () => {
      const { result } = renderHook(() => useDownloadDetails("dl-1"), {
        queryClient,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.id).toBe("dl-1");
      expect(result.current.data?.chapterNumber).toBe("100");
      expect(result.current.data?.progress).toBe(100);
    });

    it("handles non-existent download", async () => {
      const { result } = renderHook(() => useDownloadDetails("non-existent"), {
        queryClient,
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.data).toBeUndefined();
    });
  });

  describe("useDownloadStats", () => {
    it("fetches download stats successfully", async () => {
      const { result } = renderHook(() => useDownloadStats(), { queryClient });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.totalDownloads).toBe(150);
      expect(result.current.data?.completedDownloads).toBe(140);
      expect(result.current.data?.failedDownloads).toBe(5);
      expect(result.current.data?.diskUsageFormatted).toBe("5.0 GB");
    });
  });

  describe("useStartDownload", () => {
    it("starts download successfully", async () => {
      const { result } = renderHook(() => useStartDownload(), { queryClient });

      result.current.mutate({
        libraryId: "lib-1",
        extensionId: "batoto",
        chapterIds: ["ch-100", "ch-101"],
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.queued).toBe(2);
      expect(result.current.data?.downloads).toHaveLength(2);
    });
  });

  describe("useCancelDownload", () => {
    it("cancels download successfully", async () => {
      const { result } = renderHook(() => useCancelDownload(), {
        queryClient,
      });

      result.current.mutate("dl-2");

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });
});
