import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../api/client";
import { API_PATHS } from "../../constants/api";
import type { InstallJob } from "../../types";
import { extensionKeys } from "./useExtensionsQueries";

interface InstallExtensionParams {
  repositoryUrl: string;
  extensionIds?: string[];
  branch?: string;
}

interface InstallJobResponse {
  jobId: string;
  jobs: InstallJob[];
}

export const installerKeys = {
  all: ["installer"] as const,
  job: (jobId: string) => ["installer", "job", jobId] as const,
};

export const useInstallExtension = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: InstallExtensionParams) =>
      apiClient.post<InstallJobResponse>(API_PATHS.installer, params),
    onSuccess: () => {
      // Invalidate extensions list to show newly installed extensions
      queryClient.invalidateQueries({ queryKey: extensionKeys.list });
    },
  });
};

export const useInstallerJob = (jobId?: string, options?: { refetchInterval?: number }) => {
  return useQuery({
    queryKey: jobId ? installerKeys.job(jobId) : ["installer", "job"],
    queryFn: () =>
      apiClient.get<InstallJob>(API_PATHS.installerJob(jobId!)),
    enabled: Boolean(jobId),
    refetchInterval: (query) => {
      const data = query.state.data;
      // Poll every 1 second if job is in progress, otherwise stop
      if (data && (data.status === "pending" || data.status === "downloading" || data.status === "compiling" || data.status === "installing")) {
        return options?.refetchInterval ?? 1000;
      }
      return false;
    },
  });
};
