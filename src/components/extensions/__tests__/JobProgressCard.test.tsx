import { notifications } from "@mantine/notifications";
import { render, waitFor } from "../../../test/utils";
import type { InstallJob } from "../../../types";
import { JobProgressCard } from "../InstallerForm";
import { useInstallerJob } from "../../../hooks/queries/useInstallerQueries";
import { describe, expect, it, beforeEach, vi } from "vitest";

vi.mock("@mantine/notifications", () => ({
  Notifications: () => null,
  notifications: {
    show: vi.fn(),
  },
}));

vi.mock("../../../hooks/queries/useInstallerQueries", () => ({
  useInstallerJob: vi.fn(),
}));

const mockUseInstallerJob = useInstallerJob as unknown as vi.MockedFunction<
  typeof useInstallerJob
>;
const notifySpy = notifications.show as unknown as vi.Mock;

const baseJob: InstallJob = {
  jobId: "job-1",
  extensionId: "sample-extension",
  status: "completed",
  repositoryUrl: "https://example.com/repo.git",
  requestedAt: Date.now(),
  completedAt: Date.now(),
};

describe("JobProgressCard", () => {
  beforeEach(() => {
    mockUseInstallerJob.mockReset();
    notifySpy.mockReset();
  });

  it("notifies completion exactly once for finished jobs", async () => {
    const onComplete = vi.fn();
    const completedJob: InstallJob = { ...baseJob, completedAt: Date.now() };

    mockUseInstallerJob.mockReturnValue({
      data: completedJob,
      isLoading: false,
    });

    const { rerender } = render(
      <JobProgressCard jobId={completedJob.jobId} onComplete={onComplete} />,
    );

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
    expect(notifySpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Installation Complete" }),
    );

    mockUseInstallerJob.mockReturnValue({
      data: { ...completedJob },
      isLoading: false,
    });

    rerender(
      <JobProgressCard jobId={completedJob.jobId} onComplete={onComplete} />,
    );

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
    expect(notifySpy).toHaveBeenCalledTimes(1);
  });

  it("reports failures with error notifications", async () => {
    const onComplete = vi.fn();
    const failedJob: InstallJob = {
      ...baseJob,
      jobId: "job-2",
      status: "failed",
      error: "Validation failed",
    };

    mockUseInstallerJob.mockReturnValue({
      data: failedJob,
      isLoading: false,
    });

    render(<JobProgressCard jobId={failedJob.jobId} onComplete={onComplete} />);

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith(failedJob);
    });

    expect(notifySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Installation Failed",
        message: expect.stringContaining("Validation failed"),
      }),
    );
  });
});
