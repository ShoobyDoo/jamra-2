import { QueryClient } from "@tanstack/react-query";
import { waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  useDownloadQueue,
  useDownloadStats,
} from "../../hooks/queries/useDownloadQueries";
import { createIntegrationQueryClient, renderHook } from "../integration-utils";

describe("Downloads Integration Tests", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createIntegrationQueryClient();
  });

  describe("useDownloadQueue", () => {
    it("fetches download queue from real backend", async () => {
      const { result } = renderHook(() => useDownloadQueue(), { queryClient });

      await waitFor(() => expect(result.current.isSuccess).toBe(true), {
        timeout: 5000,
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.downloads).toBeDefined();
      expect(Array.isArray(result.current.data?.downloads)).toBe(true);

      console.log(
        `Found ${result.current.data?.downloads.length} downloads in queue`,
      );
    });

    it("filters downloads by status", async () => {
      const { result } = renderHook(
        () => useDownloadQueue({ status: "completed" }),
        { queryClient },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true), {
        timeout: 5000,
      });

      // All downloads should have status 'completed'
      result.current.data?.downloads.forEach((download) => {
        expect(download.status).toBe("completed");
      });
    });
  });

  describe("useDownloadStats", () => {
    it("fetches download statistics from real backend", async () => {
      const { result } = renderHook(() => useDownloadStats(), { queryClient });

      await waitFor(() => expect(result.current.isSuccess).toBe(true), {
        timeout: 5000,
      });

      expect(result.current.data).toBeDefined();
      expect(typeof result.current.data?.downloadCount).toBe("number");
      expect(typeof result.current.data?.totalSize).toBe("number");

      console.log(
        `Download stats: ${result.current.data?.downloadCount} downloads, ${result.current.data?.totalSize} bytes`,
      );
    });
  });
});
