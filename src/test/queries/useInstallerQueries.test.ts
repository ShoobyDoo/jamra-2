import { QueryClient } from "@tanstack/react-query";
import { waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  useInstallExtension,
  useInstallerJob,
} from "../../hooks/queries/useInstallerQueries";
import { createTestQueryClient, renderHook } from "../utils";

describe("Installer Query Hooks", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  describe("useInstallExtension", () => {
    it("starts installation successfully", async () => {
      const { result } = renderHook(() => useInstallExtension(), {
        queryClient,
      });

      result.current.mutate({
        repositoryUrl: "https://github.com/example/extensions",
        branch: "main",
        extensionIds: ["batoto"],
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.jobId).toBe("job-123");
      expect(result.current.data?.jobs).toBeDefined();
      expect(result.current.data?.jobs).toHaveLength(1);
    });
  });

  describe("useInstallerJob", () => {
    it("fetches installer job successfully", async () => {
      const { result } = renderHook(() => useInstallerJob("job-123"), {
        queryClient,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.jobId).toBe("job-123");
      expect(result.current.data?.status).toBe("completed");
      expect(result.current.data?.extensionId).toBe("batoto");
    });

    it("handles non-existent job", async () => {
      const { result } = renderHook(() => useInstallerJob("non-existent"), {
        queryClient,
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.data).toBeUndefined();
    });
  });
});
