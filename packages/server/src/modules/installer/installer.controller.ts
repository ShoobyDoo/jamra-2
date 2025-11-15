import type { Request, Response } from "express";
import { ValidationError } from "../../shared/errors.js";
import type { InstallerService } from "./installer.service.js";

export class InstallerController {
  constructor(private readonly installer: InstallerService) {}

  /**
   * Queue extension installation(s)
   * POST /api/installer/
   * Body: { repositoryUrl: string, extensionIds?: string[], branch?: string }
   */
  queue = async (req: Request, res: Response): Promise<void> => {
    const { repositoryUrl, extensionIds, branch } = req.body as {
      repositoryUrl?: string;
      extensionIds?: string[];
      branch?: string;
    };

    // Validate required fields
    if (!repositoryUrl) {
      throw new ValidationError("Repository URL is required");
    }

    // Queue installation
    const jobIds = await this.installer.queueInstall(
      repositoryUrl,
      extensionIds,
      branch,
    );

    res.status(202).json({
      message: "Installation queued",
      jobIds,
      status: "queued",
    });
  };

  /**
   * Get installation status
   * GET /api/installer/install/:jobId
   */
  getInstallStatus = async (req: Request, res: Response): Promise<void> => {
    const { jobId } = req.params;

    if (!jobId) {
      throw new ValidationError("Job ID is required");
    }

    const job = this.installer.getInstallStatus(jobId);

    if (!job) {
      res.status(404).json({ message: "Installation job not found" });
      return;
    }

    res.json({
      jobId: job.id,
      extensionId: job.extension_id,
      status: job.status,
      repositoryUrl: job.repo_url,
      requestedAt: job.requested_at,
      completedAt: job.completed_at,
      error: job.error,
    });
  };
}
