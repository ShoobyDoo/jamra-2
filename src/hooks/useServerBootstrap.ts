import { useEffect, useMemo, useState } from "react";

import { apiClient } from "../api/client";
import { API_PATHS } from "../constants/api";

type BootStatus = "checking" | "ready" | "timeout";

interface UseServerBootstrapOptions {
  maxAttempts?: number;
  retryDelayMs?: number;
}

interface ServerBootstrapResult {
  status: BootStatus;
  attempts: number;
  maxAttempts: number;
  lastError: string | null;
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const useServerBootstrap = (
  options?: UseServerBootstrapOptions,
): ServerBootstrapResult => {
  const maxAttempts = options?.maxAttempts ?? 15;
  const retryDelayMs = options?.retryDelayMs ?? 700;

  const [status, setStatus] = useState<BootStatus>("checking");
  const [attempts, setAttempts] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    let didCancel = false;

    const waitForHealth = async () => {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (didCancel) return;

        setAttempts(attempt);
        try {
          const response = await apiClient.get<{ status?: string }>(
            API_PATHS.health,
            { expectJson: true },
          );

          if (didCancel) {
            return;
          }

          if (response?.status === "ok") {
            setStatus("ready");
            setLastError(null);
            return;
          }

          throw new Error("Backend still starting");
        } catch (error) {
          if (didCancel) {
            return;
          }

          const message =
            error instanceof Error ? error.message : "Unable to reach backend";
          setLastError(message);

          if (attempt === maxAttempts) {
            setStatus("timeout");
            return;
          }

          await sleep(retryDelayMs);
        }
      }
    };

    waitForHealth();

    return () => {
      didCancel = true;
    };
  }, [maxAttempts, retryDelayMs]);

  return useMemo(
    () => ({ status, attempts, maxAttempts, lastError }),
    [attempts, lastError, maxAttempts, status],
  );
};
