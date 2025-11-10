import { NotImplementedError } from "../../shared/errors.js";
import type { Logger } from "../../shared/logger.js";
import type {
  ExtensionPackager,
  InstallRequest,
  InstallResult,
  PackageValidator,
} from "./installer.types.js";

export class InstallerService {
  constructor(
    private readonly packager: ExtensionPackager,
    private readonly validator: PackageValidator,
    private readonly logger: Logger,
  ) {}

  async queueInstall(_request: InstallRequest): Promise<InstallResult> {
    throw new NotImplementedError("Installer queueInstall");
  }

  async processQueue(): Promise<void> {
    throw new NotImplementedError("Installer processQueue");
  }
}

export interface InstallerServiceArgs {
  packager: ExtensionPackager;
  validator: PackageValidator;
  logger: Logger;
}

export const createInstallerService = (
  args: InstallerServiceArgs,
): InstallerService => {
  return new InstallerService(args.packager, args.validator, args.logger);
};
