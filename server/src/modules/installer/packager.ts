import { NotImplementedError } from "../../shared/errors.js";
import type { ExtensionPackager } from "./installer.types.js";

export class ArchiveExtensionPackager implements ExtensionPackager {
  async unpack(): Promise<string[]> {
    throw new NotImplementedError("Installer packager unpack");
  }
}

export const createExtensionPackager = (): ExtensionPackager => {
  return new ArchiveExtensionPackager();
};
