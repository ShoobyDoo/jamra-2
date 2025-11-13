import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../api/client";
import { API_PATHS } from "../../constants/api";
import type { CatalogListResponse, CatalogSyncResponse } from "../../types";

export const catalogKeys = {
  all: ["catalog"] as const,
  list: (repo?: string) =>
    repo ? (["catalog", "list", repo] as const) : (["catalog", "list"] as const),
};

interface CatalogListOptions {
  repo?: string;
}

export const useCatalogList = (options?: CatalogListOptions) => {
  const repo = options?.repo;
  return useQuery({
    queryKey: catalogKeys.list(repo),
    queryFn: () =>
      apiClient.get<CatalogListResponse>(API_PATHS.catalog, {
        params: repo ? { repo } : undefined,
      }),
  });
};

export const useCatalogSync = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (repoId?: string) =>
      apiClient.post<CatalogSyncResponse>(API_PATHS.catalogSync, {
        repoId,
      }),
    onSuccess: () => {
      // Invalidate all catalog queries to refresh the list
      queryClient.invalidateQueries({ queryKey: catalogKeys.all });
    },
  });
};
