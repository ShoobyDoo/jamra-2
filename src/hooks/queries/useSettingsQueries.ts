/**
 * Settings Query Hooks
 * TanStack Query hooks for backend settings CRUD operations.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { apiClient } from "../../api/client";
import { API_PATHS } from "../../constants/api";
import type { Setting, SettingScope } from "../../types";

/**
 * Query keys for settings
 */
export const settingsKeys = {
  all: ["settings"] as const,
  lists: () => [...settingsKeys.all, "list"] as const,
  list: (scope?: SettingScope) =>
    [...settingsKeys.lists(), scope] as const,
  details: () => [...settingsKeys.all, "detail"] as const,
  detail: (key: string) => [...settingsKeys.details(), key] as const,
};

/**
 * Backend response shape for settings list
 */
interface SettingsListResponse {
  settings: Setting[];
}

/**
 * Backend response shape for single setting
 */
interface SettingResponse {
  setting: Setting;
}

/**
 * Fetch all settings with optional scope filter
 */
export const useSettingsList = (
  scope?: SettingScope,
  options?: Omit<
    UseQueryOptions<SettingsListResponse, Error, Setting[]>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: settingsKeys.list(scope),
    queryFn: async (): Promise<SettingsListResponse> => {
      const url = scope
        ? `${API_PATHS.settings}?scope=${scope}`
        : API_PATHS.settings;
      return apiClient.get<SettingsListResponse>(url);
    },
    select: (data) => data.settings,
    ...options,
  });
};

/**
 * Fetch a single setting by key
 */
export const useSetting = <T = unknown>(
  key: string,
  options?: Omit<
    UseQueryOptions<SettingResponse, Error, Setting<T>>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: settingsKeys.detail(key),
    queryFn: async (): Promise<SettingResponse> => {
      return apiClient.get<SettingResponse>(API_PATHS.setting(key));
    },
    select: (data) => data.setting as Setting<T>,
    enabled: Boolean(key),
    ...options,
  });
};

/**
 * Payload for updating a setting
 */
interface UpdateSettingPayload {
  key: string;
  value: unknown;
  scope?: SettingScope;
}

/**
 * Mutation to update (upsert) a setting
 * Returns 204 No Content on success
 */
export const useUpdateSetting = (
  options?: UseMutationOptions<void, Error, UpdateSettingPayload>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateSettingPayload): Promise<void> => {
      await apiClient.put(API_PATHS.settings, payload);
    },
    onSuccess: (_, variables) => {
      // Invalidate all settings lists and the specific setting detail
      queryClient.invalidateQueries({ queryKey: settingsKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: settingsKeys.detail(variables.key),
      });
    },
    ...options,
  });
};

/**
 * Mutation to delete a setting
 * Returns 204 No Content on success
 */
export const useDeleteSetting = (
  options?: UseMutationOptions<void, Error, string>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (key: string): Promise<void> => {
      await apiClient.delete(API_PATHS.setting(key));
    },
    onSuccess: (_, key) => {
      // Invalidate all settings lists and remove the specific setting detail
      queryClient.invalidateQueries({ queryKey: settingsKeys.lists() });
      queryClient.removeQueries({ queryKey: settingsKeys.detail(key) });
    },
    ...options,
  });
};

/**
 * Convenience hook that provides all settings mutations
 */
export const useSettingsMutations = () => {
  const updateSetting = useUpdateSetting();
  const deleteSetting = useDeleteSetting();

  return {
    updateSetting,
    deleteSetting,
  };
};
