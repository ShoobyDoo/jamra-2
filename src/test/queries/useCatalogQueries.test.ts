import { QueryClient } from "@tanstack/react-query";
import { waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  useCatalogList,
  useCatalogSync,
} from "../../hooks/queries/useCatalogQueries";
import { createTestQueryClient, renderHook } from "../utils";

describe("Catalog Query Hooks", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  describe("useCatalogList", () => {
    it("fetches catalog list successfully", async () => {
      const { result } = renderHook(() => useCatalogList(), { queryClient });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.catalog).toHaveLength(2);
      expect(result.current.data?.catalog[0].id).toBe("batoto");
      expect(result.current.data?.catalog[0].name).toBe("Batoto");
    });

    it("fetches catalog list with repo filter", async () => {
      const { result } = renderHook(() => useCatalogList({ repo: "batoto" }), {
        queryClient,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.catalog).toHaveLength(1);
      expect(result.current.data?.catalog[0].slug).toBe("batoto");
    });
  });

  describe("useCatalogSync", () => {
    it("syncs catalog successfully", async () => {
      const { result } = renderHook(() => useCatalogSync(), { queryClient });

      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.synced).toBe(2);
      expect(result.current.data?.catalog).toHaveLength(2);
    });
  });
});
