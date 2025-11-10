import type { Request, Response } from "express";
import { NotImplementedError } from "../../shared/errors.js";
import type { InstallerService } from "./installer.service.js";

export class InstallerController {
  constructor(private readonly installer: InstallerService) {}

  queue = async (req: Request, res: Response): Promise<void> => {
    try {
      const job = await this.installer.queueInstall(req.body);
      res.status(202).json(job);
    } catch (error) {
      if (error instanceof NotImplementedError) {
        res
          .status(501)
          .json({ message: "Installer queue not implemented yet." });
        return;
      }
      res.status(500).json({ message: "Failed to queue install job." });
    }
  };
}
