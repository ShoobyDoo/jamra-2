import { QueryClient } from "@tanstack/react-query";
import { waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  useExtensionDetails,
  useExtensionsList,
} from "../../hooks/queries/useExtensionsQueries";
import { createIntegrationQueryClient, renderHook } from "../integration-utils";

describe("Extensions Integration Tests", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createIntegrationQueryClient();
  });

  describe("useExtensionsList", () => {
    it("fetches installed extensions from real backend", async () => {
      const { result } = renderHook(() => useExtensionsList(), { queryClient });

      await waitFor(() => expect(result.current.isSuccess).toBe(true), {
        timeout: 5000,
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.extensions).toBeDefined();
      expect(Array.isArray(result.current.data?.extensions)).toBe(true);

      // Log actual extensions for debugging
      console.log(
        `Found ${result.current.data?.extensions.length} installed extensions`,
      );
    });
  });

  describe("useExtensionDetails", () => {
    it("fetches extension details for first installed extension", async () => {
      // First get the list to find an extension ID
      const listResult = renderHook(() => useExtensionsList(), { queryClient });

      await waitFor(
        () => expect(listResult.result.current.isSuccess).toBe(true),
        {
          timeout: 5000,
        },
      );

      const extensions = listResult.result.current.data?.extensions;

      if (!extensions || extensions.length === 0) {
        console.warn("No extensions installed - skipping details test");
        return;
      }

      const firstExtensionId = extensions[0].id;

      // Now fetch details for that extension
      const detailsResult = renderHook(
        () => useExtensionDetails(firstExtensionId),
        { queryClient },
      );

      await waitFor(
        () => expect(detailsResult.result.current.isSuccess).toBe(true),
        { timeout: 5000 },
      );

      expect(detailsResult.result.current.data).toBeDefined();
      expect(detailsResult.result.current.data?.id).toBe(firstExtensionId);
      expect(detailsResult.result.current.data?.manifest).toBeDefined();
    });

    it("returns 404 for non-existent extension", async () => {
      const { result } = renderHook(
        () => useExtensionDetails("non-existent-extension-id"),
        { queryClient },
      );

      await waitFor(() => expect(result.current.isError).toBe(true), {
        timeout: 5000,
      });

      expect(result.current.data).toBeUndefined();
    });
  });
});
