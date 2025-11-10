import { NotImplementedError } from "../../shared/errors.js";
import type { ExtensionManifest } from "../../sdk/index.js";
import type { PackageValidator } from "./installer.types.js";

export class ExtensionPackageValidator implements PackageValidator {
  async validate(
    _files: string[],
    _manifest: ExtensionManifest,
  ): Promise<void> {
    throw new NotImplementedError("Installer validator validate");
  }
}

export const createPackageValidator = (): PackageValidator => {
  return new ExtensionPackageValidator();
};
